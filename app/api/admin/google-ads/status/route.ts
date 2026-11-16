export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { diagnosticoConfiguracao } from "@/lib/google-ads/config";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaSelecionada } from "@/lib/google-ads/selecao";
import { getIntegrationForUser } from "@/lib/tracking/integrations";

/**
 * Estado da conexao, para a tela saber o que pedir primeiro.
 *
 * A ordem importa: sem as variaveis de ambiente, conectar nao resolve nada --
 * o consentimento seria concedido e toda chamada seguinte responderia 401, com
 * a conta aparecendo como conectada na tela. Por isso o diagnostico da
 * configuracao vem antes de qualquer coisa.
 */
export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const config = diagnosticoConfiguracao();
    const integracao = await getIntegrationForUser("google_ads", ctx.userId);
    const customerId = integracao ? await contaSelecionada(ctx.userId) : null;
    const metadata = (integracao?.metadata as Record<string, unknown> | null) ?? {};

    return NextResponse.json({
      ok: true,
      configuracao: config,
      conectado: Boolean(integracao),
      conta: customerId
        ? {
            id: customerId,
            nome: typeof metadata.customerNome === "string" ? metadata.customerNome : null,
            moeda: typeof metadata.customerMoeda === "string" ? metadata.customerMoeda : null,
            contaDeTeste: metadata.customerContaDeTeste === true,
          }
        : null,
      // A tela usa isto para avisar em voz alta antes do botao de conectar: a
      // API do Google Ads nao tem escopo somente-leitura, logo quem conecta
      // autoriza criar campanha e mexer em orcamento.
      escopoDeEscrita: true,
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/status", error);
  }
}
