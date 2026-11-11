/**
 * Regras da tela de Leads do painel — sem banco, sem React.
 *
 * Tudo aqui foi conferido contra o banco de producao:
 *   - `leads.status` e um tipo enumerado com cinco valores (ver
 *     `@/domain/lead-status`). Filtrar ou gravar outro valor devolve 22P02.
 *   - `leads` nao tem `puppy_id`, `email`, `priority` nem `last_contact_at`.
 *   - `first_responded_at` existe e ninguem gravava: e preenchido aqui na
 *     primeira vez que o lead sai de "novo" para um status de atendimento.
 */

import {
  LEAD_STATUS,
  LEAD_STATUS_LABEL,
  normalizeLeadStatus,
  toDbLeadStatus,
  type LeadStatus,
} from "@/domain/lead-status";

export { LEAD_STATUS, LEAD_STATUS_LABEL, normalizeLeadStatus, toDbLeadStatus, type LeadStatus };

/* ------------------------------------------------------------------ */
/* Leitura                                                              */
/* ------------------------------------------------------------------ */

/** Colunas conferidas em producao. Nao acrescentar coluna sem conferir antes. */
export const LEAD_LIST_SELECT =
  "id,created_at,updated_at,nome,first_name,telefone,phone,cidade,estado,cor_preferida,sexo_preferido," +
  "mensagem,notes,status,source,page,page_slug,referer,utm_source,utm_medium,utm_campaign,gclid,first_responded_at," +
  "lead_ai_insights!left(risk,score,intent,urgency,matched_puppy_id,desired_color,desired_city,desired_sex,suggested_puppies)";

/** Colunas de filhote usadas para mostrar o filhote sugerido. */
export const LEAD_PUPPY_SELECT = "id,nome,name,status,color,cor,sexo,gender,price_cents,midia";

export type LeadInsightRow = {
  risk?: string | null;
  score?: number | null;
  intent?: string | null;
  urgency?: string | null;
  matched_puppy_id?: string | null;
  desired_color?: string | null;
  desired_city?: string | null;
  desired_sex?: string | null;
  suggested_puppies?: unknown;
};

export type LeadRow = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  nome?: string | null;
  first_name?: string | null;
  telefone?: string | null;
  phone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  mensagem?: string | null;
  notes?: string | null;
  status?: string | null;
  source?: string | null;
  page?: string | null;
  page_slug?: string | null;
  referer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  first_responded_at?: string | null;
  /** O banco devolve objeto ou lista, conforme a relacao; os dois sao aceitos. */
  lead_ai_insights?: LeadInsightRow | LeadInsightRow[] | null;
};

export type LeadFields = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  color: string | null;
  preferredSex: string | null;
  status: LeadStatus;
  createdAt: string | null;
  updatedAt: string | null;
  firstRespondedAt: string | null;
  page: string | null;
  source: string | null;
  gclid: string | null;
  message: string | null;
};

const text = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function leadInsight(row: Pick<LeadRow, "lead_ai_insights">): LeadInsightRow | null {
  const raw = row.lead_ai_insights;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

/**
 * Telefone -> numero que o wa.me aceita (com o 55 do Brasil).
 * Numero que nao parece telefone brasileiro nem internacional completo volta null:
 * melhor nao mostrar o botao do que abrir conversa com numero errado.
 */
export function normalizeWhatsapp(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  if (phone.trim().startsWith("+") && digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

/** De onde o lead veio, na ordem do mais especifico para o mais generico. */
export function leadSource(row: LeadRow): string | null {
  return (
    text(row.utm_campaign) ?? text(row.utm_source) ?? text(row.utm_medium) ?? text(row.source) ?? text(row.referer)
  );
}

export function rowToLeadFields(row: LeadRow): LeadFields {
  const phone = text(row.telefone) ?? text(row.phone);
  return {
    id: row.id,
    name: text(row.nome) ?? text(row.first_name) ?? "Sem nome",
    phone,
    whatsapp: normalizeWhatsapp(phone),
    city: text(row.cidade),
    state: text(row.estado),
    color: text(row.cor_preferida),
    preferredSex: text(row.sexo_preferido),
    status: normalizeLeadStatus(row.status),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    firstRespondedAt: row.first_responded_at ?? null,
    page: text(row.page_slug) ?? text(row.page),
    source: leadSource(row),
    gclid: text(row.gclid),
    message: text(row.mensagem) ?? text(row.notes),
  };
}

export type LeadSuggestedPuppy = { id: string; name: string; reason: string | null; color: string | null; sex: string | null };

/** `suggested_puppies` e json livre: so entra o que tem o formato esperado. */
export function parseSuggestedPuppies(raw: unknown): LeadSuggestedPuppy[] {
  if (!Array.isArray(raw)) return [];
  const out: LeadSuggestedPuppy[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const id = text(item.puppy_id) ?? text(item.id);
    if (!id) continue;
    out.push({
      id,
      name: text(item.name) ?? "Filhote",
      reason: text(item.reason),
      color: text(item.color),
      sex: text(item.sex),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Filtros                                                              */
/* ------------------------------------------------------------------ */

export type ParsedLeadFilters = {
  statuses: LeadStatus[];
  colors: string[];
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function listParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(/[,|]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function dateParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !DATE_PATTERN.test(trimmed)) return undefined;
  return Number.isNaN(Date.parse(`${trimmed}T00:00:00Z`)) ? undefined : trimmed;
}

/**
 * Tira da busca o que tem significado dentro do filtro `or=(...)` do banco
 * (virgula, parenteses, aspas, curingas). Sem isso, um nome com virgula quebra
 * a consulta inteira.
 */
export function sanitizeLeadSearch(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(/[,()"'\\%*:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || undefined;
}

/** Filtro `or` da busca: nome ou telefone (nas duas colunas em que o telefone pode estar). */
export function leadSearchOrFilter(search: string): string {
  // O banco aceita * como curinga no endereco; foi a forma conferida em producao.
  const pattern = `*${search}*`;
  return `nome.ilike.${pattern},telefone.ilike.${pattern},phone.ilike.${pattern}`;
}

export function parseLeadFilters(searchParams: SearchParams): { filters: ParsedLeadFilters; page: number } {
  const statuses: LeadStatus[] = [];
  for (const raw of listParam(searchParams.status)) {
    // Links antigos traziam "em_contato" e "fechado": viram o status real.
    const status = toDbLeadStatus(raw.replace(/-+/g, "_"));
    if (status && !statuses.includes(status)) statuses.push(status);
  }

  const colors = Array.from(new Set(listParam(searchParams.color))).slice(0, 20);
  const city = firstParam(searchParams.city)?.trim().slice(0, 80) || undefined;
  let dateFrom = dateParam(firstParam(searchParams.from) ?? firstParam(searchParams.dateFrom));
  let dateTo = dateParam(firstParam(searchParams.to) ?? firstParam(searchParams.dateTo));
  if (dateFrom && dateTo && dateFrom > dateTo) [dateFrom, dateTo] = [dateTo, dateFrom];

  const pageParam = Number(firstParam(searchParams.page));
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const search = sanitizeLeadSearch(firstParam(searchParams.search));

  return { filters: { statuses, colors, city, dateFrom, dateTo, search }, page };
}

export function hasActiveLeadFilters(filters: ParsedLeadFilters): boolean {
  return Boolean(
    filters.statuses.length || filters.colors.length || filters.city || filters.dateFrom || filters.dateTo || filters.search,
  );
}

/**
 * O atendimento acontece no horario de Sao Paulo (UTC-3, sem horario de verao
 * desde 2019). "Dia 10" no filtro e o dia 10 de la, nao o dia 10 em UTC.
 */
export function saoPauloDayStart(day: string): string {
  return `${day}T00:00:00-03:00`;
}

export function saoPauloDayEnd(day: string): string {
  return `${day}T23:59:59.999-03:00`;
}

/** Endereco da lista com os filtros dados. Pagina 1 e filtro vazio ficam de fora. */
export function buildLeadsHref(filters: ParsedLeadFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.statuses.length) params.set("status", filters.statuses.join(","));
  if (filters.colors.length) params.set("color", filters.colors.join(","));
  if (filters.city) params.set("city", filters.city);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}

export type LeadStatusSummary = Record<LeadStatus, number>;

export function emptyLeadStatusSummary(): LeadStatusSummary {
  return { novo: 0, contatado: 0, qualificado: 0, convertido: 0, perdido: 0 };
}

export function dedupeSorted(values: unknown[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const item = text(value);
    if (!item) continue;
    const key = item.toLocaleLowerCase("pt-BR");
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/* ------------------------------------------------------------------ */
/* Gravacao de status                                                   */
/* ------------------------------------------------------------------ */

export type LeadStatusPatch = { status: LeadStatus; updated_at: string; first_responded_at?: string };

/** Status que significam "alguem do canil ja falou com este lead". */
const RESPONDED: readonly LeadStatus[] = ["contatado", "qualificado", "convertido"];

/**
 * O que gravar quando o status muda. A primeira resposta e registrada uma vez
 * so: marcar "perdido" direto de "novo" nao conta como resposta.
 */
export function leadStatusPatch(
  next: LeadStatus,
  current: { first_responded_at?: string | null } | null | undefined,
  nowIso: string,
): LeadStatusPatch {
  const patch: LeadStatusPatch = { status: next, updated_at: nowIso };
  if (RESPONDED.includes(next) && !current?.first_responded_at) patch.first_responded_at = nowIso;
  return patch;
}

/** Trocas que pedem confirmacao: encerram o atendimento do lead. */
export function leadStatusNeedsConfirm(next: LeadStatus): boolean {
  return next === "convertido" || next === "perdido";
}

/**
 * A regra de sugestao fala em etapas de conversa que o banco nao tem.
 * Aqui cada etapa vira um dos cinco status reais.
 */
export function advisorSuggestionToStatus(suggestion: string | null | undefined): LeadStatus | null {
  switch (suggestion) {
    case "novo":
      return "novo";
    case "em_conversa":
    case "followup":
      return "contatado";
    case "quase_fechado":
      return "qualificado";
    case "fechado":
      return "convertido";
    case "perdido":
      return "perdido";
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Mensagem e exportacao                                                */
/* ------------------------------------------------------------------ */

/** Primeira mensagem de WhatsApp: so o que e verdade para qualquer lead, sem promessa. */
export function leadGreeting(lead: Pick<LeadFields, "name" | "color" | "preferredSex">): string {
  const firstName = lead.name === "Sem nome" ? "" : (lead.name.split(/\s+/)[0] ?? "");
  const desired = [lead.color, lead.preferredSex].filter(Boolean).join(" • ");
  const hello = firstName ? `Oi ${firstName}!` : "Oi!";
  return `${hello} Somos da By Império Dog. Recebemos seu interesse${
    desired ? ` (${desired})` : ""
  }. Podemos falar por aqui e te mandar fotos e vídeo?`;
}

export function leadWhatsappLink(lead: Pick<LeadFields, "name" | "color" | "preferredSex" | "whatsapp">): string | null {
  if (!lead.whatsapp) return null;
  return `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(leadGreeting(lead))}`;
}

/**
 * Celula de CSV. Texto que comeca com = + - @ e lido como formula pela
 * planilha; como a mensagem vem de um formulario publico, ganha um apostrofo
 * na frente para ser lida como texto.
 */
export function csvCell(value: unknown): string {
  let cell = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
}

export function leadsToCsv(
  items: Pick<
    LeadFields,
    "name" | "phone" | "city" | "state" | "color" | "preferredSex" | "status" | "message" | "source" | "gclid" | "createdAt"
  >[],
  formatDate: (value: string | null) => string,
): string {
  const header = [
    "Nome",
    "Telefone",
    "Cidade",
    "Estado",
    "Cor desejada",
    "Sexo desejado",
    "Status",
    "Mensagem",
    "Origem",
    "GCLID",
    "Chegou em",
  ];
  const rows = items.map((lead) => [
    lead.name,
    lead.phone,
    lead.city,
    lead.state,
    lead.color,
    lead.preferredSex,
    LEAD_STATUS_LABEL[lead.status],
    lead.message,
    lead.source,
    lead.gclid,
    formatDate(lead.createdAt),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
