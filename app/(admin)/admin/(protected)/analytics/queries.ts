import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { LEAD_STATUS_OPTIONS, type LeadStatus, normalizeLeadStatus } from "../leads/queries";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_RANGE_DAYS = 30;

export type AnalyticsFilters = {
  dateFrom: string;
  dateTo: string;
  statuses: LeadStatus[];
  colors: string[];
};

export type LeadsAnalyticsPayload = {
  filters: AnalyticsFilters;
  totalLeads: number;
  leadsByDay: { label: string; value: number }[];
  leadsByColor: { label: string; value: number }[];
  leadsBySex: { label: string; value: number }[];
  topCities: { label: string; value: number }[];
  conversionTotals: Record<LeadStatus, number>;
  conversionRate: number;
  colorOptions: string[];
};

const toDateInput = (value: Date) => value.toISOString().slice(0, 10);

const defaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - DEFAULT_RANGE_DAYS + 1);
  return toDateInput(d);
};

const defaultTo = () => toDateInput(new Date());

const sanitizeDate = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) return undefined;
  return trimmed;
};

const parseList = (param?: string | string[] | null) => {
  if (!param) return [] as string[];
  const raw = Array.isArray(param) ? param.join(",") : param;
  return raw
    .split(/[,|]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
};

export function parseAnalyticsFilters(searchParams: Record<string, string | string[] | undefined>) {
  const dateFrom = sanitizeDate(searchParams.from as string) ?? defaultFrom();
  const dateTo = sanitizeDate(searchParams.to as string) ?? defaultTo();
  const statuses = parseList(searchParams.status)
    .map((value) => value.replace(/-+/g, "_").toLowerCase())
    .filter((value): value is LeadStatus => LEAD_STATUS_OPTIONS.includes(value as LeadStatus));
  const colors = parseList(searchParams.color);

  const normalizedRange = (() => {
    if (dateFrom > dateTo) return { dateFrom: dateTo, dateTo: dateFrom };
    return { dateFrom, dateTo };
  })();

  const filters: AnalyticsFilters = { ...normalizedRange, statuses, colors };
  return { filters };
}

type LeadsByDayRow = { day: string | null; total: number | null };
type LeadsAggRow = { label?: string | null; value?: number | null };
type StatusAggRow = { status: string | null; total: number | null };

type SupabaseClient = ReturnType<typeof supabaseAdmin>;
type LeadsQueryBuilder = ReturnType<ReturnType<typeof supabaseAdmin>["from"]>;

const applyFilters = <T extends LeadsQueryBuilder>(query: T, filters: AnalyticsFilters) => {
  let next = query as LeadsQueryBuilder;
  if (filters.dateFrom) {
    next = next.gte("created_at", `${filters.dateFrom}T00:00:00Z`);
  }
  if (filters.dateTo) {
    next = next.lte("created_at", `${filters.dateTo}T23:59:59Z`);
  }
  if (filters.statuses.length) {
    next = next.in("status", filters.statuses);
  }
  if (filters.colors.length) {
    next = next.in("cor_preferida", filters.colors);
  }
  return next as T;
};

const formatLabel = (value: string | null | undefined, fallback = "Não informado") => {
  if (!value) return fallback;
  return value.trim() || fallback;
};

const formatDayLabel = (value: string | null) => {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
};

const toChartData = (rows: LeadsAggRow[], fallbackLabel?: string) =>
  rows.map((row) => ({ label: formatLabel(row.label ?? null, fallbackLabel), value: row.value ?? 0 }));

export async function fetchLeadsAnalytics({ filters }: { filters: AnalyticsFilters }): Promise<LeadsAnalyticsPayload> {
  const supabase = supabaseAdmin();

  const leadsByDayQuery = applyFilters(
    supabase.from("leads").select("day:date_trunc('day',created_at), total:count(id)"),
    filters,
  );

  const leadsByColorQuery = applyFilters(supabase.from("leads").select("label:cor_preferida, value:count(id)"), filters);

  const leadsBySexQuery = applyFilters(supabase.from("leads").select("label:sexo_preferido, value:count(id)"), filters);

  const cityQuery = applyFilters(supabase.from("leads").select("label:cidade, value:count(id)"), filters);

  const statusQuery = applyFilters(supabase.from("leads").select("status, total:count(id)"), filters);

  const totalQuery = applyFilters(
    supabase.from("leads").select("id", { count: "exact", head: true }),
    filters,
  );

  const colorOptionsQuery = supabase
    .from("leads")
    .select("cor_preferida")
    .not("cor_preferida", "is", null)
    .order("cor_preferida", { ascending: true });

  const [leadsByDayRes, colorRes, sexRes, cityRes, statusRes, totalRes, colorOptionsRes] = await Promise.all([
    leadsByDayQuery,
    leadsByColorQuery,
    leadsBySexQuery,
    cityQuery,
    statusQuery,
    totalQuery,
    colorOptionsQuery,
  ]);

  if (leadsByDayRes.error) throw new Error(leadsByDayRes.error.message);
  if (colorRes.error) throw new Error(colorRes.error.message);
  if (sexRes.error) throw new Error(sexRes.error.message);
  if (cityRes.error) throw new Error(cityRes.error.message);
  if (statusRes.error) throw new Error(statusRes.error.message);
  if (totalRes.error) throw new Error(totalRes.error.message);
  if (colorOptionsRes.error) throw new Error(colorOptionsRes.error.message);

  const leadsByDay = (leadsByDayRes.data as LeadsByDayRow[])
    .sort((a, b) => (a.day ?? "").localeCompare(b.day ?? ""))
    .map((row) => ({
      label: formatDayLabel(row.day),
      value: row.total ?? 0,
    }));

  const leadsByColor = toChartData(colorRes.data as LeadsAggRow[])
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      label: item.label || "Não informado",
      value: item.value,
    }));

  const leadsBySex = toChartData(sexRes.data as LeadsAggRow[])
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      label: item.label || "Indiferente",
      value: item.value,
    }));

  const topCities = toChartData(cityRes.data as LeadsAggRow[], "Sem cidade")
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const statusCounts: Record<LeadStatus, number> = {
    novo: 0,
    em_contato: 0,
    fechado: 0,
    perdido: 0,
  };
  ((statusRes.data as StatusAggRow[]) ?? []).forEach((row) => {
    const status = normalizeLeadStatus(row.status ?? undefined);
    statusCounts[status] += row.total ?? 0;
  });

  const totalLeads = totalRes.count ?? 0;
  const conversionRate = totalLeads > 0 ? (statusCounts.fechado / totalLeads) * 100 : 0;

  const colorOptions = Array.from(
    new Set((colorOptionsRes.data ?? []).map((row: { cor_preferida?: string | null }) => row.cor_preferida).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    filters,
    totalLeads,
    leadsByDay,
    leadsByColor,
    leadsBySex,
    topCities,
    conversionTotals: statusCounts,
    conversionRate,
    colorOptions,
  };
}
