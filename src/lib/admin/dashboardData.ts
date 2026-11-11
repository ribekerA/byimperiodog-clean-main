import "server-only";

import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  LEADS_WINDOW_DAYS,
  ROW_LIMIT,
  buildDashboard,
  type DashboardData,
  type DashboardLeadRow,
  type DashboardPuppyRow,
} from "./dashboardMetrics";

/**
 * Leitura do banco para o dashboard do admin.
 *
 * Duas consultas, cada uma falhando sozinha: se os leads nao puderem ser lidos,
 * o estoque continua na tela, e o contrario. Nada e gravado ao abrir a pagina.
 *
 * As colunas abaixo foram conferidas contra o banco de producao. Coluna que nao
 * existe la derruba a consulta inteira (erro 42703) e foi isso que zerou o
 * painel antigo — antes de acrescentar uma, confira no banco.
 */

export type DashboardBlockError = {
  /** Codigo do banco (42703, PGRST205...) ou "erro" quando nao ha codigo. */
  code: string;
};

export type DashboardLoad = {
  data: DashboardData;
  /** false quando o ambiente nao tem as credenciais do banco. */
  configured: boolean;
  errors: { leads: DashboardBlockError | null; puppies: DashboardBlockError | null };
};

type QueryResult<T> = { rows: T[] | null; error: DashboardBlockError | null };

function toBlockError(scope: string, error: unknown): DashboardBlockError {
  const info = (error ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof info.code === "string" && info.code ? info.code : "erro";
  // So codigo e mensagem do banco vao para o log: nenhum dado de lead.
  console.error(`[admin/dashboard] falha ao ler ${scope}`, {
    code,
    message: typeof info.message === "string" ? info.message : String(error),
  });
  return { code };
}

async function readLeads(now: Date): Promise<QueryResult<DashboardLeadRow>> {
  const since = new Date(now.getTime() - LEADS_WINDOW_DAYS * 24 * 3_600_000).toISOString();
  try {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select(
        "id,created_at,nome,first_name,cidade,estado,cor_preferida,sexo_preferido,status,source,utm_source,first_responded_at,lead_ai_insights(matched_puppy_id)",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT);
    if (error) return { rows: null, error: toBlockError("leads", error) };
    return { rows: (data ?? []) as DashboardLeadRow[], error: null };
  } catch (error) {
    return { rows: null, error: toBlockError("leads", error) };
  }
}

async function readPuppies(): Promise<QueryResult<DashboardPuppyRow>> {
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

export async function loadDashboard(now: Date = new Date()): Promise<DashboardLoad> {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasServiceRoleKey();

  // Sem credenciais o cliente devolve listas vazias sem avisar. Mostrar zeros
  // nesse caso seria mentir: a tela diz que o banco nao esta ligado.
  if (!configured) {
    return {
      data: buildDashboard({ leads: null, puppies: null, now }),
      configured: false,
      errors: { leads: null, puppies: null },
    };
  }

  const [leads, puppies] = await Promise.all([readLeads(now), readPuppies()]);

  return {
    data: buildDashboard({ leads: leads.rows, puppies: puppies.rows, now }),
    configured: true,
    errors: { leads: leads.error, puppies: puppies.error },
  };
}
