export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { listarTermosDeBusca } from "@/lib/google-ads/recommendations";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";

/**
 * O que as pessoas digitaram no Google antes de clicar.
 *
 * E a tela que mostra para onde o dinheiro foi: um canil paga por "spitz alemao
 * preco" e tambem por "cachorro para doacao" enquanto nao houver negativa. Os
 * termos marcados como desperdicio custaram e nao converteram.
 */
export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const params = req.nextUrl.searchParams;
  const minimo = Number(params.get("minimoCliques") ?? "0");

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const resultado = await listarTermosDeBusca({
      userId: ctx.userId,
      customerId,
      periodo: params.get("periodo"),
      campanhaId: params.get("campanhaId"),
      minimoCliques: Number.isFinite(minimo) && minimo > 0 ? Math.floor(minimo) : 0,
    });

    const desperdicio = resultado.termos.filter((t) => t.desperdicio);
    return NextResponse.json({
      ok: true,
      ...resultado,
      resumo: {
        termos: resultado.termos.length,
        termosSemConversao: desperdicio.length,
        custoSemConversao: desperdicio.reduce((soma, t) => soma + t.custo, 0),
      },
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/termos", error);
  }
}
