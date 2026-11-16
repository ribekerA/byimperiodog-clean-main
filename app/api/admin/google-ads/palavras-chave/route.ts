export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import { adicionarNegativas, adicionarPalavrasChave } from "@/lib/google-ads/ads";
import { listarDesempenhoDePalavrasChave } from "@/lib/google-ads/recommendations";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";
import { corpoJson } from "@/lib/limitePublico";

/** Desempenho das palavras-chave no periodo, da que mais custou para a que menos. */
export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const resultado = await listarDesempenhoDePalavrasChave({
      userId: ctx.userId,
      customerId,
      periodo: req.nextUrl.searchParams.get("periodo"),
      campanhaId: req.nextUrl.searchParams.get("campanhaId"),
    });
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/palavras-chave", error);
  }
}

const adicionarSchema = z
  .object({
    grupoResourceName: z.string().trim().min(1).max(300).optional(),
    palavras: z
      .array(
        z.object({
          texto: z.string().trim().min(1).max(80),
          correspondencia: z.string().trim().max(20).nullish(),
        }),
      )
      .max(200)
      .optional(),
    campanhaResourceName: z.string().trim().min(1).max(300).optional(),
    negativas: z.array(z.string().trim().min(1).max(80)).max(200).optional(),
    somenteValidar: z.boolean().optional(),
  })
  .strict();

/**
 * Adiciona palavras-chave num grupo ou negativas numa campanha.
 *
 * As negativas sao o caminho de volta do relatorio de termos de busca: o termo
 * que custou e nao converteu entra aqui com um clique, e para de custar.
 */
export async function POST(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 32 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = adicionarSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const customerId = await contaObrigatoria(ctx.userId);

    if (body.grupoResourceName && body.palavras && body.palavras.length > 0) {
      await adicionarPalavrasChave({
        userId: ctx.userId,
        customerId,
        grupoResourceName: body.grupoResourceName,
        palavras: body.palavras.map((p) => ({
          texto: p.texto,
          correspondencia: p.correspondencia ?? undefined,
        })),
        somenteValidar: body.somenteValidar,
      });
      await logAdminAction({
        route: "api/admin/google-ads/palavras-chave",
        method: "POST",
        action: "adicionar_palavras_ads",
        payload: { customerId, grupo: body.grupoResourceName, quantidade: body.palavras.length },
        actor: ctx.userId,
      });
      return NextResponse.json({ ok: true, adicionadas: body.palavras.length });
    }

    if (body.campanhaResourceName && body.negativas && body.negativas.length > 0) {
      await adicionarNegativas({
        userId: ctx.userId,
        customerId,
        campanhaResourceName: body.campanhaResourceName,
        palavras: body.negativas,
        somenteValidar: body.somenteValidar,
      });
      await logAdminAction({
        route: "api/admin/google-ads/palavras-chave",
        method: "POST",
        action: "adicionar_negativas_ads",
        payload: { customerId, campanha: body.campanhaResourceName, quantidade: body.negativas.length },
        actor: ctx.userId,
      });
      return NextResponse.json({ ok: true, negativas: body.negativas.length });
    }

    return NextResponse.json({ ok: false, error: "nada_para_adicionar" }, { status: 400 });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/palavras-chave", error);
  }
}
