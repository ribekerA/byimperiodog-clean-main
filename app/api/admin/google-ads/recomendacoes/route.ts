export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import {
  aplicarRecomendacao,
  descartarRecomendacao,
  listarRecomendacoes,
} from "@/lib/google-ads/recommendations";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";
import { corpoJson } from "@/lib/limitePublico";

export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const recomendacoes = await listarRecomendacoes({ userId: ctx.userId, customerId });
    return NextResponse.json({
      ok: true,
      recomendacoes,
      // A tela separa as duas listas. As que aumentam gasto ficam atras de uma
      // confirmacao, porque e nelas que mora "ativar rede de parceiros" -- que
      // desfaz, num clique, a configuracao com que a campanha foi criada.
      resumo: {
        total: recomendacoes.length,
        semRisco: recomendacoes.filter((r) => !r.aumentaGasto).length,
        aumentamGasto: recomendacoes.filter((r) => r.aumentaGasto).length,
      },
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/recomendacoes", error);
  }
}

const acaoSchema = z
  .object({
    resourceName: z.string().trim().min(1).max(300),
    acao: z.enum(["aplicar", "descartar"]),
    confirmarAumentoDeGasto: z.boolean().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = acaoSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const { resourceName, acao, confirmarAumentoDeGasto } = parsed.data;

  try {
    const customerId = await contaObrigatoria(ctx.userId);

    if (acao === "descartar") {
      await descartarRecomendacao({ userId: ctx.userId, customerId, resourceName });
      return NextResponse.json({ ok: true, acao });
    }

    await aplicarRecomendacao({
      userId: ctx.userId,
      customerId,
      resourceName,
      confirmarAumentoDeGasto,
    });
    await logAdminAction({
      route: "api/admin/google-ads/recomendacoes",
      method: "POST",
      action: "aplicar_recomendacao_ads",
      payload: { customerId, recomendacao: resourceName, confirmado: confirmarAumentoDeGasto === true },
      actor: ctx.userId,
    });
    return NextResponse.json({ ok: true, acao });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/recomendacoes", error);
  }
}
