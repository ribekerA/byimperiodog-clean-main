import "server-only";

import { LEAD_STATUS, normalizeLeadStatus, type LeadStatus } from "@/domain/lead-status";
import {
  LEAD_LIST_SELECT,
  LEAD_PUPPY_SELECT,
  dedupeSorted,
  emptyLeadStatusSummary,
  leadInsight,
  leadSearchOrFilter,
  parseSuggestedPuppies,
  rowToLeadFields,
  saoPauloDayEnd,
  saoPauloDayStart,
  type LeadFields,
  type LeadInsightRow,
  type LeadRow,
  type LeadStatusSummary,
  type ParsedLeadFilters,
} from "@/lib/admin/leadAdmin";
import {
  fromDbPuppyStatus,
  parseMidia,
  parsePuppySex,
  puppySexLabel,
  rowPriceCents,
  type AdminPuppyStatus,
} from "@/lib/admin/puppyAdmin";
import { buildLeadAdvisor, type AdvisorPriority, type LeadAdvisorSnapshot } from "@/lib/ai/leadAdvisor";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

export { parseLeadFilters } from "@/lib/admin/leadAdmin";
export type { ParsedLeadFilters } from "@/lib/admin/leadAdmin";
export { normalizeLeadStatus };
export type { LeadStatus };
/** Nome antigo, mantido para quem ja importava daqui. */
export const LEAD_STATUS_OPTIONS = LEAD_STATUS;

/**
 * Leitura dos leads para o painel.
 *
 * Todas as colunas foram conferidas contra o banco de producao. Nenhuma funcao
 * daqui lanca erro: a tela recebe `configured` e `error` e diz a verdade em vez
 * de mostrar uma lista vazia.
 */

const DEFAULT_PAGE_SIZE = 40;
const OPTIONS_LIMIT = 1000;

export type LeadPuppyMatch = {
  id: string;
  name: string;
  color: string | null;
  /** Ja por extenso ("Macho" / "Fêmea"), ou null. */
  sex: string | null;
  priceCents: number | null;
  status: AdminPuppyStatus;
  imageUrl: string | null;
};

export type LeadAiSummary = {
  risk: string | null;
  score: number | null;
  intent: string | null;
  urgency: string | null;
};

export type LeadListItem = LeadFields & {
  /** null quando o lead ainda nao passou pela analise. */
  aiSummary: LeadAiSummary | null;
  matchedPuppy: LeadPuppyMatch | null;
  /** Prioridade calculada por regra fixa; `reason` traz a conta. */
  priority: AdvisorPriority;
};

export type AdminLeadsPayload = {
  items: LeadListItem[];
  /** Quantos leads batem com os filtros. */
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  /** Contagem de todos os leads por status, sem filtro. */
  statusSummary: LeadStatusSummary;
  colorOptions: string[];
  cityOptions: string[];
  configured: boolean;
  error: { code: string } | null;
};

function toError(error: unknown, where: string): { code: string } {
  const info = (error ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof info.code === "string" && info.code ? info.code : "erro";
  console.error(`[admin/leads] falha em ${where}`, {
    code,
    message: typeof info.message === "string" ? info.message : String(error),
  });
  return { code };
}

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasServiceRoleKey();
}

/** Caminho de arquivo do Storage -> endereco publico. Endereco completo passa como veio. */
function resolveMediaUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/") || raw.startsWith("data:")) return raw;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return raw;
  const path = raw.replace(/^storage\/v1\/object\/public\//, "").replace(/^public\//, "");
  return `${base}/storage/v1/object/public/${path}`;
}

type PuppyMatchRow = {
  id: string;
  nome?: string | null;
  name?: string | null;
  status?: string | null;
  color?: string | null;
  cor?: string | null;
  sexo?: string | null;
  gender?: string | null;
  price_cents?: number | null;
  midia?: unknown;
};

function rowToPuppyMatch(row: PuppyMatchRow): LeadPuppyMatch {
  const cover = parseMidia(row.midia).find((media) => media.type === "image");
  const sex = parsePuppySex(row.sexo ?? row.gender);
  const price = rowPriceCents({ price_cents: row.price_cents ?? null, preco: null });
  return {
    id: row.id,
    name: row.nome?.trim() || row.name?.trim() || "Filhote",
    color: row.color?.trim() || row.cor?.trim() || null,
    sex: sex ? puppySexLabel(sex) : null,
    priceCents: price > 0 ? price : null,
    status: fromDbPuppyStatus(row.status),
    imageUrl: cover ? resolveMediaUrl(cover.url) : null,
  };
}

function advisorFor(row: LeadRow, fields: LeadFields, matchedPuppy: LeadPuppyMatch | null): LeadAdvisorSnapshot {
  const insight = leadInsight(row);
  return buildLeadAdvisor({
    id: fields.id,
    name: fields.name === "Sem nome" ? null : fields.name,
    status: fields.status,
    city: fields.city,
    state: fields.state,
    preferredColor: fields.color,
    preferredSex: fields.preferredSex,
    createdAt: fields.createdAt,
    updatedAt: fields.updatedAt ?? fields.createdAt,
    message: fields.message,
    aiScore: typeof insight?.score === "number" ? insight.score : null,
    aiIntent: insight?.intent ?? null,
    aiUrgency: insight?.urgency ?? null,
    matchedPuppy,
    suggestedPuppies: parseSuggestedPuppies(insight?.suggested_puppies),
  });
}

function aiSummaryFor(insight: LeadInsightRow | null): LeadAiSummary | null {
  if (!insight) return null;
  return {
    risk: insight.risk ?? null,
    score: typeof insight.score === "number" ? insight.score : null,
    intent: insight.intent ?? null,
    urgency: insight.urgency ?? null,
  };
}

function emptyPayload(page: number, pageSize: number, overrides: Partial<AdminLeadsPayload>): AdminLeadsPayload {
  return {
    items: [],
    total: 0,
    page,
    pageSize,
    hasNext: false,
    statusSummary: emptyLeadStatusSummary(),
    colorOptions: [],
    cityOptions: [],
    configured: true,
    error: null,
    ...overrides,
  };
}

export async function fetchAdminLeads({
  filters,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  filters: ParsedLeadFilters;
  page: number;
  pageSize?: number;
}): Promise<AdminLeadsPayload> {
  // Sem credenciais o cliente devolve lista vazia sem avisar; "nenhum lead"
  // nesse caso seria mentira.
  if (!isConfigured()) return emptyPayload(page, pageSize, { configured: false });

  try {
    const supabase = supabaseAdmin();
    const from = (page - 1) * pageSize;

    let query = supabase
      .from("leads")
      .select(LEAD_LIST_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (filters.statuses.length) query = query.in("status", filters.statuses);
    if (filters.colors.length) query = query.in("cor_preferida", filters.colors);
    if (filters.city) query = query.eq("cidade", filters.city);
    if (filters.dateFrom) query = query.gte("created_at", saoPauloDayStart(filters.dateFrom));
    if (filters.dateTo) query = query.lte("created_at", saoPauloDayEnd(filters.dateTo));
    if (filters.search) query = query.or(leadSearchOrFilter(filters.search));

    // Uma contagem por status. O banco nao agrupa pelo cliente: a consulta
    // agrupada de antes era aceita e devolvia numero errado.
    const [listRes, colorRes, cityRes, ...countRes] = await Promise.all([
      query,
      supabase.from("leads").select("cor_preferida").not("cor_preferida", "is", null).limit(OPTIONS_LIMIT),
      supabase.from("leads").select("cidade").not("cidade", "is", null).limit(OPTIONS_LIMIT),
      ...LEAD_STATUS.map((status) =>
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", status),
      ),
    ]);

    // Pagina alem do fim (lead apagado, link antigo) nao e falha: e lista vazia.
    if (listRes.error && listRes.error.code !== "PGRST103") {
      return emptyPayload(page, pageSize, { error: toError(listRes.error, "lista") });
    }
    const failed = [colorRes, cityRes, ...countRes].find((res) => res.error);
    if (failed?.error) return emptyPayload(page, pageSize, { error: toError(failed.error, "resumo") });

    const rows = (listRes.error ? [] : (listRes.data ?? [])) as unknown as LeadRow[];

    const matchedIds = new Set<string>();
    for (const row of rows) {
      const id = leadInsight(row)?.matched_puppy_id;
      if (typeof id === "string" && id) matchedIds.add(id);
    }

    // O filhote sugerido e um enfeite da linha: se a leitura falhar, a lista
    // de leads continua valendo, so sem o filhote.
    const puppyMap = new Map<string, LeadPuppyMatch>();
    if (matchedIds.size) {
      const puppyRes = await supabase.from("puppies").select(LEAD_PUPPY_SELECT).in("id", Array.from(matchedIds));
      if (puppyRes.error) toError(puppyRes.error, "filhotes sugeridos");
      for (const row of (puppyRes.data ?? []) as unknown as PuppyMatchRow[]) puppyMap.set(row.id, rowToPuppyMatch(row));
    }

    const items: LeadListItem[] = rows.map((row) => {
      const fields = rowToLeadFields(row);
      const insight = leadInsight(row);
      const matchedPuppy = insight?.matched_puppy_id ? (puppyMap.get(insight.matched_puppy_id) ?? null) : null;
      return {
        ...fields,
        aiSummary: aiSummaryFor(insight),
        matchedPuppy,
        priority: advisorFor(row, fields, matchedPuppy).priority,
      };
    });

    const statusSummary = emptyLeadStatusSummary();
    LEAD_STATUS.forEach((status, index) => {
      statusSummary[status] = countRes[index]?.count ?? 0;
    });

    const total = listRes.count ?? items.length;

    return {
      items,
      total,
      page,
      pageSize,
      hasNext: page * pageSize < total,
      statusSummary,
      colorOptions: dedupeSorted(((colorRes.data ?? []) as { cor_preferida?: unknown }[]).map((row) => row.cor_preferida)),
      cityOptions: dedupeSorted(((cityRes.data ?? []) as { cidade?: unknown }[]).map((row) => row.cidade)),
      configured: true,
      error: null,
    };
  } catch (error) {
    return emptyPayload(page, pageSize, { error: toError(error, "lista") });
  }
}

export const LEADS_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/* ------------------------------------------------------------------ */
/* Um lead                                                              */
/* ------------------------------------------------------------------ */

const LEAD_DETAIL_SELECT = LEAD_LIST_SELECT.replace(
  "suggested_puppies)",
  "suggested_puppies,budget_inferred,processed_at,alerts,next_step,emotional_tone,desired_timeframe)",
);

export type LeadHistoryEntry = {
  id: string;
  createdAt: string;
  status: string | null;
  type: string | null;
  preview: string | null;
};

export type AdminLeadDetail = {
  lead: (LeadFields & { notes: string | null }) | null;
  insight: Record<string, unknown> | null;
  matchedPuppy: LeadPuppyMatch | null;
  advisor: LeadAdvisorSnapshot | null;
  history: LeadHistoryEntry[];
  /** false quando o historico de mensagens automaticas nao pode ser lido. */
  historyOk: boolean;
  configured: boolean;
  error: { code: string } | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function truncate(value: unknown, limit = 200): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.length <= limit ? value : `${value.slice(0, limit)}…`;
}

/** `lead: null` sem erro quer dizer que o lead nao existe. */
export async function fetchAdminLead(id: string): Promise<AdminLeadDetail> {
  const empty: AdminLeadDetail = {
    lead: null,
    insight: null,
    matchedPuppy: null,
    advisor: null,
    history: [],
    historyOk: true,
    configured: true,
    error: null,
  };
  if (!isConfigured()) return { ...empty, configured: false };
  // Endereco com id que nao e um id: o banco devolveria erro de tipo; e so "nao existe".
  if (!UUID.test(id)) return empty;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("leads").select(LEAD_DETAIL_SELECT).eq("id", id).maybeSingle();
    if (error) return { ...empty, error: toError(error, "lead") };
    if (!data) return empty;

    const row = data as unknown as LeadRow;
    const fields = rowToLeadFields(row);
    const insight = leadInsight(row);

    const [puppyRes, logsRes] = await Promise.all([
      insight?.matched_puppy_id
        ? supabase.from("puppies").select(LEAD_PUPPY_SELECT).eq("id", insight.matched_puppy_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("autosales_logs")
        .select("id,created_at,status,message_type,content")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    if (puppyRes.error) toError(puppyRes.error, "filhote sugerido");
    if (logsRes.error) toError(logsRes.error, "historico");

    const matchedPuppy = puppyRes.data ? rowToPuppyMatch(puppyRes.data as unknown as PuppyMatchRow) : null;
    const history = ((logsRes.data ?? []) as Record<string, unknown>[]).map((entry) => ({
      id: String(entry.id),
      createdAt: String(entry.created_at ?? ""),
      status: typeof entry.status === "string" ? entry.status : null,
      type: typeof entry.message_type === "string" ? entry.message_type : null,
      preview: truncate(entry.content),
    }));

    return {
      ...empty,
      lead: { ...fields, message: row.mensagem?.trim() || null, notes: row.notes?.trim() || null },
      insight: insight as Record<string, unknown> | null,
      matchedPuppy,
      advisor: advisorFor(row, fields, matchedPuppy),
      history,
      historyOk: !logsRes.error,
    };
  } catch (error) {
    return { ...empty, error: toError(error, "lead") };
  }
}
