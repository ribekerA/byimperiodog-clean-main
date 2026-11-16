export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import { alterarLanceDoGrupo, listarGruposDeAnuncios } from "@/lib/google-ads/ads";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";
import { TETO_LANCE_CPC } from "@/lib/google-ads/travas";
import { corpoJson } from "@/lib/limitePublico";

export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const grupos = await listarGruposDeAnuncios({
      userId: ctx.userId,
      customerId,
      campanhaId: req.nextUrl.searchParams.get("campanhaId"),
    });
    return NextResponse.json({ ok: true, grupos });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/grupos", error);
  }
}

const lanceSchema = z
  .object({
    grupoResourceName: z.string().trim().min(1).max(300),
    lanceCpc: z.number().positive().max(TETO_LANCE_CPC, `O painel aceita lance de no maximo R$ ${TETO_LANCE_CPC} por clique.`),
    somenteValidar: z.boolean().optional(),
  })
  .strict();

/** Troca o lance maximo por clique do grupo. */
export async function PATCH(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 2 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = lanceSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    await alterarLanceDoGrupo({
      userId: ctx.userId,
      customerId,
      grupoResourceName: parsed.data.grupoResourceName,
      lanceCpc: parsed.data.lanceCpc,
      somenteValidar: parsed.data.somenteValidar,
    });
    await logAdminAction({
      route: "api/admin/google-ads/grupos",
      method: "PATCH",
      action: "lance_grupo_ads",
      payload: { customerId, grupo: parsed.data.grupoResourceName, lanceCpc: parsed.data.lanceCpc },
      actor: ctx.userId,
    });
    return NextResponse.json({ ok: true, lanceCpc: parsed.data.lanceCpc });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/grupos", error);
  }
}
