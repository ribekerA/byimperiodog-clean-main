export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import { listarContasComToken, idFormatado } from "@/lib/google-ads/accounts";
import { tokenDeAcesso } from "@/lib/google-ads/client";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaSelecionada, selecionarConta } from "@/lib/google-ads/selecao";
import { corpoJson } from "@/lib/limitePublico";

/** Contas que o login alcanca, com a escolhida marcada. */
export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const accessToken = await tokenDeAcesso(ctx.userId);
    const [contas, escolhida] = await Promise.all([
      listarContasComToken(accessToken),
      contaSelecionada(ctx.userId),
    ]);

    return NextResponse.json({
      ok: true,
      escolhida,
      contas: contas.map((c) => ({
        ...c,
        idFormatado: idFormatado(c.id),
        selecionada: c.id === escolhida,
      })),
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/contas", error);
  }
}

const escolhaSchema = z
  .object({ customerId: z.string().trim().min(1).max(32) })
  .strict();

/** Grava qual conta este admin vai gerenciar. */
export async function POST(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 2 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = escolhaSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const resultado = await selecionarConta({
      userId: ctx.userId,
      customerId: parsed.data.customerId,
    });
    await logAdminAction({
      route: "api/admin/google-ads/contas",
      method: "POST",
      action: "selecionar_conta_ads",
      payload: { customerId: resultado.customerId },
      actor: ctx.userId,
    });
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/contas", error);
  }
}
