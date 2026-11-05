export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { midiaRegistrada } from "@/domain/media-registry";
import { corpoJson, limiteDeTaxa } from "@/lib/limitePublico";
import {
  hashDoVisitante,
  novoToken,
  opcoesDoCookie,
  temSegredoConfigurado,
  VISITOR_COOKIE,
} from "@/lib/media-likes/identity";
import { alternarCurtida } from "@/lib/media-likes/repo";

/**
 * POST /api/media-likes/toggle
 *
 * Curtir e descurtir são a mesma chamada: o servidor olha se já existe linha
 * daquele visitante para aquela mídia e faz o oposto. O cliente não manda "quero
 * curtir" — ele manda "alterna" —, então dois cliques rápidos não podem virar
 * duas curtidas.
 *
 * `mediaId` é conferido contra o registro (src/domain/media-registry.ts) antes
 * de qualquer escrita, e `mediaType` tem que bater com o que o registro diz.
 * Sem isso a tabela aceitaria id inventado e o painel do admin passaria a
 * mostrar mídia que não existe.
 */

const corpo = z.object({
  mediaId: z.string().trim().min(1).max(300),
  mediaType: z.enum(["image", "video"]),
  contextType: z.enum(["puppy", "gallery"]).nullish(),
  contextId: z.string().trim().max(200).nullish(),
});

export async function POST(req: NextRequest) {
  const bloqueio = await limiteDeTaxa(req, "media-likes", 30);
  if (bloqueio) return bloqueio;

  if (!temSegredoConfigurado()) {
    // Sem MEDIA_LIKE_SECRET não há identidade possível, e curtida sem
    // identidade é contador que qualquer um empurra. Melhor indisponível.
    return NextResponse.json({ error: "indisponivel" }, { status: 503 });
  }

  const lido = await corpoJson<unknown>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const validado = corpo.safeParse(lido.dados);
  if (!validado.success) {
    return NextResponse.json({ error: "dados_invalidos" }, { status: 400 });
  }

  const registro = midiaRegistrada(validado.data.mediaId);
  if (!registro || registro.mediaType !== validado.data.mediaType) {
    return NextResponse.json({ error: "midia_desconhecida" }, { status: 404 });
  }

  const tokenAtual = req.cookies.get(VISITOR_COOKIE)?.value?.trim();
  const token = tokenAtual && tokenAtual.length >= 16 ? tokenAtual : novoToken();
  const precisaGravarCookie = token !== tokenAtual;

  const resultado = await alternarCurtida({
    mediaId: registro.mediaId,
    mediaType: registro.mediaType,
    contextType: validado.data.contextType ?? registro.contextType,
    contextId: validado.data.contextId ?? registro.contextId,
    visitorHash: hashDoVisitante(token),
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: "indisponivel" }, { status: 503 });
  }

  const resposta = NextResponse.json(
    { mediaId: registro.mediaId, liked: resultado.liked, count: resultado.count },
    { headers: { "Cache-Control": "no-store" } },
  );
  // O cookie só nasce agora, no primeiro gesto real da pessoa.
  if (precisaGravarCookie) {
    resposta.cookies.set(VISITOR_COOKIE, token, opcoesDoCookie());
  }
  return resposta;
}
