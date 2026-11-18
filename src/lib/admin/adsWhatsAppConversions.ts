import "server-only";

import { ErroGoogleAds, requisitarComToken } from "@/lib/google-ads/client";
import { soDigitos } from "@/lib/google-ads/config";
import { getIntegrationForUser } from "@/lib/tracking/integrations";
import { getProvider } from "@/lib/tracking/providers/registry";

import { buildAdsConversoes, dayKey, shiftDayKey, type AdsConversoesLoad } from "./dashboardMetrics";

/**
 * Conversões de WhatsApp contadas pelo Google Ads, para o dashboard.
 *
 * Só leitura, nos dois lados: a consulta é GAQL (search), que não altera nada
 * na conta, e o token vencido é renovado em memória e descartado. Não usa
 * tokenDeAcesso() do cliente do Ads de propósito, porque ele grava o token
 * novo no banco, e abrir o dashboard não grava nada.
 *
 * A ação de conversão é achada pelo nome (contém "WhatsApp") entre as ações
 * ativas. Se houver zero ou mais de uma, o bloco diz isso em vez de escolher.
 */

const DIA = /^\d{4}-\d{2}-\d{2}$/;

type Linha = Record<string, any>;

async function buscar(token: string, conta: string, query: string): Promise<Linha[]> {
  const resposta = await requisitarComToken<{ results?: Linha[] }>({
    accessToken: token,
    caminho: `/customers/${conta}/googleAds:search`,
    metodo: "POST",
    corpo: { query },
  });
  return resposta.results ?? [];
}

async function tokenEmMemoria(integ: { access_token: string; refresh_token: string | null; expires_at: string | null }) {
  const expira = integ.expires_at ? Date.parse(integ.expires_at) : NaN;
  if (integ.access_token && Number.isFinite(expira) && expira - Date.now() > 60_000) return integ.access_token;
  const adapter = getProvider("google_ads");
  if (!integ.refresh_token || !adapter?.refreshTokens) {
    throw new ErroGoogleAds("A conexão com o Google Ads venceu e precisa ser refeita.", { status: 401, codigo: "reconexao" });
  }
  return (await adapter.refreshTokens(integ.refresh_token)).accessToken;
}

export async function loadAdsWhatsAppConversions(
  userId: string | null | undefined,
  now: Date = new Date(),
): Promise<AdsConversoesLoad> {
  try {
    if (!userId) return { status: "erro", motivo: "A sessão do painel não trouxe o usuário." };
    const integ = await getIntegrationForUser("google_ads", userId);
    if (!integ) return { status: "nao_conectado" };
    const bruto = (integ.metadata as Record<string, unknown> | null)?.customerId;
    const conta = soDigitos(typeof bruto === "string" ? bruto : null);
    if (!conta) return { status: "erro", motivo: "Nenhuma conta do Google Ads foi escolhida no painel de anúncios." };

    const token = await tokenEmMemoria(integ);
    const acoes = (
      await buscar(
        token,
        conta,
        "SELECT conversion_action.resource_name, conversion_action.name FROM conversion_action WHERE conversion_action.status = 'ENABLED'",
      )
    ).filter((linha) => /whats\s*app/i.test(String(linha.conversionAction?.name ?? "")));
    if (acoes.length !== 1) {
      return {
        status: "erro",
        motivo:
          acoes.length === 0
            ? "Nenhuma ação de conversão ativa com WhatsApp no nome foi achada na conta."
            : "Há mais de uma ação de conversão ativa com WhatsApp no nome, então o painel não escolheu nenhuma.",
      };
    }
    const acao = acoes[0].conversionAction as { resourceName: string; name: string };

    const hoje = dayKey(now) as string;
    const linhas = await buscar(
      token,
      conta,
      `SELECT segments.date, segments.conversion_action, metrics.all_conversions_by_conversion_date FROM customer ` +
        `WHERE segments.date BETWEEN '${shiftDayKey(hoje, -13)}' AND '${hoje}' ` +
        `AND segments.conversion_action = '${acao.resourceName.replace(/[^A-Za-z0-9/]/g, "")}'`,
    );
    const counts: Record<string, number> = {};
    for (const linha of linhas) {
      const dia = String(linha.segments?.date ?? "");
      const valor = Number(linha.metrics?.allConversionsByConversionDate ?? 0);
      if (!DIA.test(dia) || !Number.isFinite(valor)) continue;
      counts[dia] = (counts[dia] ?? 0) + valor;
    }
    return buildAdsConversoes(acao.name, counts, now);
  } catch (error) {
    const motivo =
      error instanceof ErroGoogleAds
        ? error.status === 401
          ? "A conexão com o Google Ads venceu e precisa ser refeita."
          : "O Google Ads recusou a leitura agora."
        : "Não foi possível ler o Google Ads agora.";
    // Sem token nem dado de pessoa no log: só o motivo.
    console.error("[admin/dashboard] conversões do Ads", { motivo, erro: error instanceof Error ? error.message : String(error) });
    return { status: "erro", motivo };
  }
}
