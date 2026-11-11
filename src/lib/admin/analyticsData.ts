import "server-only";

import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  ANALYTICS_ROW_CAP,
  buildAnalytics,
  type AnalyticsData,
  type AnalyticsLeadRow,
  type AnalyticsPeriod,
} from "./analyticsMetrics";
import type { DashboardBlockError } from "./dashboardData";
import { ROW_LIMIT, type DashboardPuppyRow } from "./dashboardMetrics";

/**
 * Leitura do banco para a tela de Analytics do admin.
 *
 * So le: abrir a tela nao grava nada. As colunas foram conferidas contra o
 * banco de producao; coluna que nao existe la derruba a consulta inteira
 * (erro 42703), entao confira antes de acrescentar uma.
 *
 * Da tabela de leads so vem o que a tela conta (data, status, cidade, cor,
 * sexo, origem, pagina). Nome, telefone e mensagem ficam de fora.
 */

export type AnalyticsLoad = {
  data: AnalyticsData;
  /** false quando o ambiente nao tem as credenciais do banco. */
  configured: boolean;
  errors: { leads: DashboardBlockError | null; puppies: DashboardBlockError | null };
};

const LEAD_COLUMNS =
  "id,created_at,status,cidade,estado,cor_preferida,sexo_preferido,source,utm_source,utm_campaign,page,page_slug,first_responded_at";

function toBlockError(scope: string, error: unknown): DashboardBlockError {
  const info = (error ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof info.code === "string" && info.code ? info.code : "erro";
  // So codigo e mensagem do banco vao para o log: nenhum dado de lead.
  console.error(`[admin/analytics] falha ao ler ${scope}`, {
    code,
    message: typeof info.message === "string" ? info.message : String(error),
  });
  return { code };
}

type LeadsResult = { rows: AnalyticsLeadRow[] | null; truncated: boolean; error: DashboardBlockError | null };

/** Le o periodo e o periodo anterior (para a comparacao), em paginas de 1000. */
async function readLeads(now: Date, period: AnalyticsPeriod): Promise<LeadsResult> {
  // Um dia de folga cobre a diferenca entre o dia de Sao Paulo e o do servidor.
  const since = new Date(now.getTime() - (period * 2 + 1) * 24 * 3_600_000).toISOString();
  const rows: AnalyticsLeadRow[] = [];
  try {
    for (let from = 0; from < ANALYTICS_ROW_CAP; from += ROW_LIMIT) {
      const { data, error } = await supabaseAdmin()
        .from("leads")
        .select(LEAD_COLUMNS)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + ROW_LIMIT - 1);
      if (error) {
        // Pagina pedida depois do fim da tabela: acabou, nao e falha.
        if (from > 0 && (error as { code?: string }).code === "PGRST103") break;
        return { rows: null, truncated: false, error: toBlockError("leads", error) };
      }
      const page = (data ?? []) as AnalyticsLeadRow[];
      rows.push(...page);
      if (page.length < ROW_LIMIT) return { rows, truncated: false, error: null };
    }
    return { rows, truncated: rows.length >= ANALYTICS_ROW_CAP, error: null };
  } catch (error) {
    return { rows: null, truncated: false, error: toBlockError("leads", error) };
  }
}

async function readPuppies(): Promise<{ rows: DashboardPuppyRow[] | null; error: DashboardBlockError | null }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("puppies")
      .select("id,codigo,name,nome,status,price_cents,preco,created_at,color,cor,sexo,midia,sold_at")
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT);
    if (error) return { rows: null, error: toBlockError("filhotes", error) };
    return { rows: (data ?? []) as DashboardPuppyRow[], error: null };
  } catch (error) {
    return { rows: null, error: toBlockError("filhotes", error) };
  }
}

export async function loadAnalytics(period: AnalyticsPeriod, now: Date = new Date()): Promise<AnalyticsLoad> {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasServiceRoleKey();

  // Sem credenciais o cliente devolve listas vazias sem avisar; zeros aqui seriam mentira.
  if (!configured) {
    return {
      data: buildAnalytics({ leads: null, puppies: null, now, period }),
      configured: false,
      errors: { leads: null, puppies: null },
    };
  }

  const [leads, puppies] = await Promise.all([readLeads(now, period), readPuppies()]);

  return {
    data: buildAnalytics({
      leads: leads.rows,
      puppies: puppies.rows,
      now,
      period,
      leadsTruncated: leads.truncated,
    }),
    configured: true,
    errors: { leads: leads.error, puppies: puppies.error },
  };
}
