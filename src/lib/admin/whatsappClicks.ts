import "server-only";

import { getPixelsSettings, resolveActiveEnvironment } from "@/lib/pixels";
import { getIntegrationForUser } from "@/lib/tracking/integrations";

import {
  buildWhatsAppClicks,
  dayKey,
  shiftDayKey,
  type WhatsAppClicksLoad,
  type WhatsAppOrigemBruta,
} from "./dashboardMetrics";

/**
 * Leitura dos cliques no WhatsApp no GA4, para o dashboard.
 *
 * So leitura, inclusive do lado do banco: quando o token de acesso venceu, ele
 * e renovado em memoria e descartado, sem gravar nada. Abrir a tela continua
 * sem escrever no banco.
 *
 * A propriedade do GA4 e achada pelo ID de medicao configurado no admin
 * (pixels_settings), e nao fica fixa no codigo.
 */

const TIMEOUT_MS = 8_000;
const EVENTO = "whatsapp_click";

type Propriedade = { property: string; nome: string };
let propriedadeEmCache: { chave: string; valor: Propriedade } | null = null;

class LeituraGa4 extends Error {}

async function getJson(url: string, token: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new LeituraGa4(`O Google respondeu ${res.status} ao ler o GA4.`);
  return (await res.json()) as Record<string, unknown>;
}

async function tokenDeAcesso(integ: { access_token: string; refresh_token: string | null; expires_at: string | null }) {
  const expira = integ.expires_at ? Date.parse(integ.expires_at) : NaN;
  if (integ.access_token && Number.isFinite(expira) && expira - Date.now() > 60_000) return integ.access_token;
  if (!integ.refresh_token) throw new LeituraGa4("A conexão com o GA4 venceu e precisa ser refeita.");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new LeituraGa4("Faltam as credenciais do Google no servidor.");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integ.refresh_token,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new LeituraGa4(`O Google recusou renovar o acesso ao GA4 (${res.status}). Pode ser preciso reconectar.`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new LeituraGa4("O Google não devolveu um acesso ao GA4.");
  return json.access_token;
}

/**
 * Com o ID de medicao no admin, usa a propriedade que tem esse fluxo. Sem ele
 * (o GA4 deste site entra pelo GTM, entao o campo costuma ficar vazio), so
 * segue se a conta conectada enxergar exatamente uma propriedade com fluxo web:
 * com duas ou mais, escolher uma seria chute.
 */
async function acharPropriedade(token: string, measurementId: string | null): Promise<Propriedade> {
  const chave = measurementId ?? "(unica)";
  if (propriedadeEmCache?.chave === chave) return propriedadeEmCache.valor;
  const resumo = await getJson("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", token);
  const contas = (resumo.accountSummaries ?? []) as Array<{
    propertySummaries?: Array<{ property?: string; displayName?: string }>;
  }>;
  const comFluxoWeb: Propriedade[] = [];
  for (const conta of contas) {
    for (const prop of conta.propertySummaries ?? []) {
      if (!prop.property) continue;
      const fluxos = await getJson(`https://analyticsadmin.googleapis.com/v1beta/${prop.property}/dataStreams`, token);
      const ids = ((fluxos.dataStreams ?? []) as Array<{ webStreamData?: { measurementId?: string } }>)
        .map((fluxo) => fluxo.webStreamData?.measurementId)
        .filter((id): id is string => Boolean(id));
      const encontrada = { property: prop.property, nome: prop.displayName || prop.property };
      if (measurementId && ids.includes(measurementId)) {
        propriedadeEmCache = { chave, valor: encontrada };
        return encontrada;
      }
      if (ids.length) comFluxoWeb.push(encontrada);
    }
  }
  if (measurementId) throw new LeituraGa4(`A conta conectada não tem acesso à propriedade do GA4 ${measurementId}.`);
  if (comFluxoWeb.length === 1) {
    propriedadeEmCache = { chave, valor: comFluxoWeb[0] };
    return comFluxoWeb[0];
  }
  throw new LeituraGa4(
    comFluxoWeb.length === 0
      ? "A conta conectada não enxerga nenhuma propriedade do GA4 com site."
      : "A conta conectada enxerga mais de uma propriedade do GA4. Preencha o ID do GA4 nas configurações de pixels para escolher a certa.",
  );
}

export async function loadWhatsAppClicks(userId: string | null | undefined, now: Date = new Date()): Promise<WhatsAppClicksLoad> {
  try {
    if (!userId) return { status: "erro", motivo: "A sessão do painel não trouxe o usuário." };
    const integ = await getIntegrationForUser("google_analytics", userId);
    if (!integ) return { status: "nao_conectado" };

    const { config } = resolveActiveEnvironment(await getPixelsSettings());
    const token = await tokenDeAcesso(integ);
    const { property, nome } = await acharPropriedade(token, config.ga4Id);

    const todayKey = dayKey(now) as string;
    const relatorio = await getJson(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, token, {
      method: "POST",
      body: JSON.stringify({
        dateRanges: [{ startDate: shiftDayKey(todayKey, -13), endDate: todayKey }],
        // Um relatorio so: o total do dia sai da soma das origens daquele dia.
        dimensions: [{ name: "date" }, { name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: EVENTO } } },
        limit: 10000,
      }),
    });

    const counts: Record<string, number> = {};
    const porOrigem: WhatsAppOrigemBruta[] = [];
    for (const linha of (relatorio.rows ?? []) as Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>) {
      const dia = linha.dimensionValues?.[0]?.value ?? "";
      if (!/^\d{8}$/.test(dia)) continue;
      const chave = `${dia.slice(0, 4)}-${dia.slice(4, 6)}-${dia.slice(6, 8)}`;
      const n = Number(linha.metricValues?.[0]?.value ?? 0);
      if (!Number.isFinite(n) || n <= 0) continue;
      counts[chave] = (counts[chave] ?? 0) + n;
      porOrigem.push({
        day: chave,
        source: linha.dimensionValues?.[1]?.value ?? "",
        medium: linha.dimensionValues?.[2]?.value ?? "",
        count: n,
      });
    }
    return { status: "ok", data: buildWhatsAppClicks(counts, now, porOrigem), propriedade: nome };
  } catch (error) {
    const motivo =
      error instanceof LeituraGa4
        ? error.message
        : error instanceof Error && error.name === "TimeoutError"
          ? "O GA4 demorou demais para responder."
          : "Não foi possível ler o GA4 agora.";
    // Sem token nem dado de pessoa no log: so o motivo.
    console.error("[admin/dashboard] cliques no WhatsApp", { motivo, erro: error instanceof Error ? error.message : String(error) });
    return { status: "erro", motivo };
  }
}
