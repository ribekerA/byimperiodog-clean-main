export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { sugerirLocais } from "@/lib/google-ads/launch";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";

/**
 * Traduz nome de cidade no ID de segmentacao que a API exige.
 *
 * A API nao aceita "Braganca Paulista": o criterio de local e um numero de um
 * catalogo do Google. Sem esta busca, alguem teria de procurar o ID numa
 * planilha de cem mil linhas.
 */
export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const busca = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!busca) {
    return NextResponse.json({ ok: true, locais: [] });
  }

  try {
    const locais = await sugerirLocais({
      userId: ctx.userId,
      // Virgula separa varios nomes numa busca so, para a tela resolver
      // "Braganca Paulista, Jundiai, Atibaia" de uma vez.
      nomes: busca.split(",").map((n) => n.trim()).filter(Boolean),
      paisCodigo: req.nextUrl.searchParams.get("pais"),
    });
    return NextResponse.json({ ok: true, locais });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/locais", error);
  }
}
