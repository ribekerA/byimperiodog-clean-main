import { buildLeadAdvisor, summarizePriorities, type LeadAdvisorSnapshot, type LeadPrioritySummary } from "@/lib/ai/leadAdvisor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

const DEFAULT_PAGE_SIZE = 40;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const LEAD_STATUS_OPTIONS = ["novo", "em_contato", "fechado", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUS_OPTIONS)[number];

const STATUS_ALIAS: Record<string, LeadStatus> = {
  novo: "novo",
  "em_contato": "em_contato",
  "em-contato": "em_contato",
  emcontato: "em_contato",
  contatado: "em_contato",
  contato: "em_contato",
  qualificado: "em_contato",
  fechado: "fechado",
  convertido: "fechado",
  ganho: "fechado",
  perdido: "perdido",
};

export type ParsedLeadFilters = {
  statuses: LeadStatus[];
  colors: string[];
  city?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type LeadAiSummary = {
  risk?: string | null;
  score?: number | null;
  intent?: string | null;
};

export type LeadPuppyMatch = {
  id: string;
  name: string;
  slug?: string | null;
  color?: string | null;
  sex?: string | null;
  priceCents?: number | null;
  status?: string | null;
  imageUrl?: string | null;
};

export type LeadListItem = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  color?: string | null;
  status: LeadStatus;
  createdAt?: string | null;
  page?: string | null;
  preferredSex?: string | null;
  source?: string | null;
  aiSummary?: LeadAiSummary | null;
  matchedPuppy?: LeadPuppyMatch | null;
  aiAdvisor: LeadAdvisorSnapshot;
};

export type AdminLeadsPayload = {
  items: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  statusSummary: Record<LeadStatus, number>;
  colorOptions: string[];
  cityOptions: string[];
  prioritySummary: LeadPrioritySummary;
};

type LeadRow = (Database["public"]["Tables"]["leads"]["Row"] & {
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
  puppy_id?: string | null;
  lead_ai_insights?: {
    matched_puppy_id?: string | null;
    risk?: string | null;
    score?: number | null;
    intent?: string | null;
    urgency?: string | null;
    desired_color?: string | null;
    desired_city?: string | null;
    desired_sex?: string | null;
    suggested_puppies?: { puppy_id: string; name?: string | null; reason?: string | null; color?: string | null; sex?: string | null }[] | null;
  } | null;
}) & Record<string, unknown>;

type PuppyRow = Database["public"]["Tables"]["puppies"]["Row"] & {
  nome?: string | null;
  name?: string | null;
  slug?: string | null;
  color?: string | null;
  cor?: string | null;
  image_url?: string | null;
  images?: unknown;
  midia?: unknown;
  sexo?: string | null;
  sex?: string | null;
  gender?: string | null;
};

type StatusAggRow = { status: string | null; count: number };

type DistinctRow = { cor_preferida?: string | null; cidade?: string | null };

const PHONE_REGEX = /^\+?\d{11,15}$/;

const normalizePhone = (phone?: string | null) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!PHONE_REGEX.test(digits)) return digits.length ? digits : null;
  return digits;
};

const selectCover = (row: PuppyRow): string | null => {
  if (typeof row.image_url === "string" && row.image_url.length) return row.image_url;

  if (Array.isArray(row.images)) {
    for (const entry of row.images) {
      if (typeof entry === "string" && entry.length) return entry;
      if (entry && typeof entry === "object") {
        const url = (entry as { url?: unknown }).url;
        if (typeof url === "string" && url.length) return url;
      }
    }
  }

  if (Array.isArray(row.midia)) {
    for (const media of row.midia) {
      if (!media || typeof media !== "object") continue;
      const value = media as { url?: unknown; type?: unknown };
      if (value.type === "image" && typeof value.url === "string" && value.url.length) {
        return value.url;
      }
    }
    for (const media of row.midia) {
      if (!media || typeof media !== "object") continue;
      const value = media as { url?: unknown };
      if (typeof value.url === "string" && value.url.length) {
        return value.url;
      }
    }
  }

  return null;
};

function parseList(param?: string | string[] | null) {
  if (!param) return [];
  const raw = Array.isArray(param) ? param.join(",") : param;
  return raw
    .split(/[,|]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function sanitizeDate(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

const firstParam = (val?: string | string[] | null) => {
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
};

export function normalizeLeadStatus(value?: string | null): LeadStatus {
  if (!value) return "novo";
  const key = value.toLowerCase().replace(/\s+/g, "_").replace(/-+/g, "_");
  return STATUS_ALIAS[key] ?? "novo";
}

export function parseLeadFilters(searchParams: Record<string, string | string[] | undefined>) {
  const statuses = parseList(searchParams.status)
    .map((value) => value.replace(/-+/g, "_").toLowerCase())
    .filter((value): value is LeadStatus => LEAD_STATUS_OPTIONS.includes(value as LeadStatus));

  const colors = parseList(searchParams.color);
  const city = firstParam(searchParams.city)?.trim() || undefined;
  const dateFrom = sanitizeDate(firstParam(searchParams.from) ?? firstParam(searchParams.dateFrom));
  const dateTo = sanitizeDate(firstParam(searchParams.to) ?? firstParam(searchParams.dateTo));
  const pageParam = Number(firstParam(searchParams.page));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const filters: ParsedLeadFilters = { statuses, colors, city, dateFrom, dateTo };
  return { filters, page };
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
  const supabase = supabaseAdmin();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select("*, lead_ai_insights!left(risk,score,intent,matched_puppy_id,desired_color,desired_city,desired_sex)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.statuses.length) {
    query = query.in("status", filters.statuses);
  }
  if (filters.colors.length) {
    query = query.in("cor_preferida", filters.colors);
  }
  if (filters.city) {
    query = query.eq("cidade", filters.city);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00Z`);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59Z`);
  }

  const [listRes, statusAggRes, colorRes, cityRes] = await Promise.all([
    query,
    supabase.from("leads").select("status, count:id", { group: "status" }),
    supabase
      .from("leads")
      .select("cor_preferida")
      .not("cor_preferida", "is", null),
    supabase
      .from("leads")
      .select("cidade")
      .not("cidade", "is", null),
  ]);

  if (listRes.error) throw new Error(listRes.error.message);
  if (statusAggRes.error) throw new Error(statusAggRes.error.message);
  if (colorRes.error) throw new Error(colorRes.error.message);
  if (cityRes.error) throw new Error(cityRes.error.message);

  const rows = (listRes.data ?? []) as LeadRow[];
  const matchedIds = new Set<string>();
  rows.forEach((row) => {
    const ai = row.lead_ai_insights;
    if (ai?.matched_puppy_id) matchedIds.add(ai.matched_puppy_id);
    if (typeof row.puppy_id === "string" && row.puppy_id) matchedIds.add(row.puppy_id);
  });

  const puppyMap = new Map<string, LeadPuppyMatch>();
  if (matchedIds.size) {
    const { data: puppyRows, error } = await supabase
      .from("puppies")
      .select("id,nome,name,slug,status,color,cor,sex,sexo,gender,price_cents,image_url,images,midia")
      .in("id", Array.from(matchedIds));
    if (error) throw new Error(error.message);
    (puppyRows as PuppyRow[]).forEach((row) => {
      puppyMap.set(row.id, {
        id: row.id,
        name: row.nome ?? row.name ?? "Filhote",
        slug: row.slug ?? null,
        color: (row.color ?? row.cor ?? null) as string | null,
        sex: (row.sex ?? row.sexo ?? row.gender ?? null) as string | null,
        priceCents: typeof row.price_cents === "number" ? row.price_cents : null,
        status: row.status,
        imageUrl: selectCover(row),
      });
    });
  }

  const items: LeadListItem[] = rows.map((row) => {
    const phone = row.telefone ?? (row as any).phone ?? null;
    const whatsapp = normalizePhone(phone);
    const ai = row.lead_ai_insights;
    const matchedId = ai?.matched_puppy_id ?? (row.puppy_id as string | null) ?? null;
    const matchedPuppy = matchedId ? puppyMap.get(matchedId) ?? null : null;
    const advisor = buildLeadAdvisor({
      id: row.id,
      name: (row as any).nome || (row as any).first_name || "Lead",
      status: row.status as string,
      city: (row.cidade ?? (row as any).city ?? null) as string | null,
      state: (row.estado ?? (row as any).state ?? null) as string | null,
      preferredColor: (row.cor_preferida ?? (row as any).color ?? null) as string | null,
      preferredSex: (row.sexo_preferido ?? (row as any).sexo ?? null) as string | null,
      createdAt: row.created_at,
      updatedAt: (row as any).updated_at ?? row.created_at,
      message: (row as any).mensagem ?? (row as any).notes ?? null,
      aiScore: ai?.score ?? null,
      aiIntent: ai?.intent ?? null,
      aiUrgency: ai?.urgency ?? null,
      matchedPuppy,
      suggestedPuppies: (ai?.suggested_puppies ?? []).map((suggestion) => ({
        id: suggestion.puppy_id ?? "",
        name: suggestion.name ?? "Filhote",
        reason: suggestion.reason ?? null,
        color: suggestion.color ?? null,
        sex: suggestion.sex ?? null,
      })),
    });
    return {
      id: row.id,
      name: (row as any).nome || (row as any).first_name || "Lead",
      phone,
      whatsapp,
      city: (row.cidade ?? (row as any).city ?? null) as string | null,
      state: (row.estado ?? (row as any).state ?? null) as string | null,
      color: (row.cor_preferida ?? (row as any).color ?? null) as string | null,
      status: normalizeLeadStatus(row.status as string),
      createdAt: row.created_at,
      page: (row.page_slug ?? row.page ?? null) as string | null,
      preferredSex: (row.sexo_preferido ?? (row as any).sexo ?? null) as string | null,
      source: (row.utm_campaign ?? row.utm_source ?? row.utm_medium ?? row.source ?? row.referer ?? null) as string | null,
      aiSummary: ai
        ? {
            risk: ai.risk,
            score: typeof ai.score === "number" ? ai.score : null,
            intent: ai.intent,
          }
        : null,
      matchedPuppy,
      aiAdvisor: advisor,
    };
  });

  const prioritySummary = summarizePriorities(items.map((lead) => ({ id: lead.id, name: lead.name, advisor: lead.aiAdvisor })));

  const statusSummary: Record<LeadStatus, number> = {
    novo: 0,
    em_contato: 0,
    fechado: 0,
    perdido: 0,
  };
  (statusAggRes.data as StatusAggRow[]).forEach((row) => {
    const status = normalizeLeadStatus(row.status as string);
    statusSummary[status] += row.count ?? 0;
  });

  const dedupeSorted = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((value): value is string => Boolean(value))))
      .map((value) => value.trim())
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

  const colorOptions = dedupeSorted((colorRes.data as DistinctRow[]).map((row) => row.cor_preferida));
  const cityOptions = dedupeSorted((cityRes.data as DistinctRow[]).map((row) => row.cidade));

  const total = listRes.count ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    hasNext: page * pageSize < total,
    statusSummary,
    colorOptions,
    cityOptions,
    prioritySummary,
  };
}

export const LEADS_PAGE_SIZE = DEFAULT_PAGE_SIZE;
