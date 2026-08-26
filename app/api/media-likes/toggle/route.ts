export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { midiaRegistrada } from "@/domain/media-registry";
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

// Curtida é barata de propósito, mas não pode virar torneira. 30 por minuto
// por IP cobre alguém percorrendo a galeria inteira e corta script.
const janela = new Map<string, number[]>();
const JANELA_MS = 60_000;
const MAX_POR_JANELA = 30;

function dentroDoLimite(ip: string): boolean {
  const agora = Date.now();
  const recentes = (janela.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= MAX_POR_JANELA) return false;
  recentes.push(agora);
  janela.set(ip, recentes);
  if (Math.random() < 0.01) {
    for (const [chave, valores] of janela.entries()) {
      const vivos = valores.filter((t) => agora - t < JANELA_MS);
      if (vivos.length === 0) janela.delete(chave);
      else janela.set(chave, vivos);
    }
  }
  return true;
}

export async function POST(req: NextRequest) {
  // O IP serve ao limite de taxa nesta requisição e some com ela: não é
  // gravado, não vira hash e não acompanha a curtida até o banco.
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "desconhecido";
  if (!dentroDoLimite(ip)) {
    return NextResponse.json({ error: "muitas_requisicoes" }, { status: 429 });
  }

  if (!temSegredoConfigurado()) {
    // Sem MEDIA_LIKE_SECRET não há identidade possível, e curtida sem
    // identidade é contador que qualquer um empurra. Melhor indisponível.
    return NextResponse.json({ error: "indisponivel" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const validado = corpo.safeParse(json);
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
