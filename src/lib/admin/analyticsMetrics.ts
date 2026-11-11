/**
 * Numeros da tela de Analytics do admin.
 *
 * Funcoes puras: recebem as linhas ja lidas do banco, o periodo escolhido e um
 * "agora". Nao leem banco e nao gravam nada.
 *
 * Regras do arquivo:
 *  - Nada e estimado nem previsto. Toda linha da tela e uma contagem do que
 *    esta gravado; onde falta dado, o campo vem null ou a contagem de "nao
 *    informado" aparece ao lado.
 *  - Os dias seguem o horario de Sao Paulo (mesma regra do dashboard).
 *  - O status e o de hoje: um lead que chegou no periodo e foi convertido
 *    depois conta como convertido.
 */

import { LEAD_STATUS, LEAD_STATUS_LABEL, normalizeLeadStatus, type LeadStatus } from "@/domain/lead-status";
import { normalizePuppyStatus } from "@/domain/puppy-status";

import {
  buildStock,
  dayKey,
  leadSource,
  puppyPriceCents,
  shiftDayKey,
  sourceLabel,
  type DashboardPuppyRow,
  type DashboardStock,
  type PipelineStep,
} from "./dashboardMetrics";

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];
export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = 30;

/** Teto de leads lidos por abertura da tela (em paginas de 1000). */
export const ANALYTICS_ROW_CAP = 5000;
/** Meses mostrados em "Vendas por mes". */
export const SALES_MONTHS = 6;

const HOUR_MS = 3_600_000;

/* ------------------------------------------------------------------ */
/* Entrada                                                              */
/* ------------------------------------------------------------------ */

export type AnalyticsLeadRow = {
  id: string;
  created_at: string;
  status?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  page?: string | null;
  page_slug?: string | null;
  first_responded_at?: string | null;
};

/* ------------------------------------------------------------------ */
/* Saida                                                                */
/* ------------------------------------------------------------------ */

export type SeriesPoint = {
  key: string;
  /** DD/MM do dia, ou do primeiro dia da semana. */
  label: string;
  /** "05/11 (qua)" ou "30/10 a 05/11". */
  detail: string;
  value: number;
  /** Aparece escrito embaixo da barra? (nem toda barra cabe) */
  tick: boolean;
};

export type BreakdownRow = {
  key: string;
  label: string;
  count: number;
  pct: number;
  converted: number;
};

export type Breakdown = {
  rows: BreakdownRow[];
  /** Leads em grupos que nao couberam na lista. */
  rest: number;
  /** Leads do periodo sem esse dado preenchido. */
  missing: number;
};

export type ColorRow = BreakdownRow & {
  /** Filhotes disponiveis hoje nessa cor; null quando o estoque nao foi lido. */
  stock: number | null;
};

export type ResponseTimes = {
  /** Leads do periodo com a data do primeiro contato gravada. */
  sample: number;
  medianHours: number | null;
  avgHours: number | null;
  within1h: number;
  within24h: number;
  over24h: number;
  /** Leads que ja sairam de Novo mas nao tem a data do primeiro contato. */
  notRecorded: number;
};

export type AnalyticsLeads = {
  total: number;
  prevTotal: number;
  /** null quando o periodo anterior esta vazio ou nao foi lido inteiro. */
  deltaPct: number | null;
  perDayAvg: number;
  truncated: boolean;
  granularity: "dia" | "semana";
  series: SeriesPoint[];
  pipeline: PipelineStep[];
  converted: number;
  conversionPct: number | null;
  response: ResponseTimes;
  sources: Breakdown;
  campaigns: Breakdown;
  cities: Breakdown;
  pages: Breakdown;
  sexes: Breakdown;
  colors: { rows: ColorRow[]; rest: number; missing: number };
  weekdays: { key: string; label: string; count: number; pct: number }[];
};

export type MonthSales = {
  /** AAAA-MM */
  key: string;
  /** "nov/26" */
  label: string;
  count: number;
  cents: number;
};

export type AnalyticsData = {
  generatedAt: string;
  period: AnalyticsPeriod;
  range: { startKey: string; endKey: string; startLabel: string; endLabel: string };
  leads: AnalyticsLeads | null;
  stock: DashboardStock | null;
  sales: MonthSales[] | null;
};

/* ------------------------------------------------------------------ */
/* Ajudantes                                                            */
/* ------------------------------------------------------------------ */

export function parseAnalyticsPeriod(value: unknown): AnalyticsPeriod {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  return (ANALYTICS_PERIODS as readonly number[]).includes(parsed)
    ? (parsed as AnalyticsPeriod)
    : DEFAULT_ANALYTICS_PERIOD;
}

function clean(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

/** Chave de agrupamento: sem acento, sem maiuscula. "São Paulo" e "sao paulo" caem juntos. */
function fold(value?: string | null): string {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function pctOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function dayLabel(key: string): string {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}`;
}

const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEKDAY_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
/** Ordem de leitura: segunda primeiro. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function weekdayIndex(key: string): number {
  return new Date(`${key}T12:00:00Z`).getUTCDay();
}

function sexLabel(value: string): string {
  const key = fold(value);
  if (key === "femea" || key === "f") return "Fêmea";
  if (key === "macho" || key === "m") return "Macho";
  return capitalize(value);
}

/** Caminho da pagina, sem dominio e sem o que vem depois de "?" ou "#". */
export function pagePath(row: Pick<AnalyticsLeadRow, "page" | "page_slug">): string {
  let raw = clean(row.page_slug) || clean(row.page);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) {
    try {
      raw = new URL(raw).pathname;
    } catch {
      /* fica como veio */
    }
  }
  raw = raw.split(/[?#]/)[0];
  if (raw.length > 1) raw = raw.replace(/\/+$/, "");
  return raw;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

type Bucket = { label: string; count: number; converted: number };

function tally(map: Map<string, Bucket>, key: string, label: string, converted: boolean) {
  const bucket = map.get(key) ?? { label, count: 0, converted: 0 };
  bucket.count += 1;
  if (converted) bucket.converted += 1;
  map.set(key, bucket);
}

function toBreakdown(map: Map<string, Bucket>, total: number, limit: number, missing: number): Breakdown {
  const all = Array.from(map.entries())
    .map(([key, bucket]) => ({
      key,
      label: bucket.label,
      count: bucket.count,
      pct: pctOf(bucket.count, total),
      converted: bucket.converted,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  const rows = all.slice(0, limit);
  const rest = all.slice(limit).reduce((sum, row) => sum + row.count, 0);
  return { rows, rest, missing };
}

/* ------------------------------------------------------------------ */
/* Leads                                                                */
/* ------------------------------------------------------------------ */

function buildSeries(
  perDay: Map<string, number>,
  startKey: string,
  endKey: string,
  period: AnalyticsPeriod,
): { granularity: "dia" | "semana"; series: SeriesPoint[] } {
  const points: Omit<SeriesPoint, "tick">[] = [];
  const weekly = period > 30;

  if (!weekly) {
    for (let offset = period - 1; offset >= 0; offset -= 1) {
      const key = shiftDayKey(endKey, -offset);
      points.push({
        key,
        label: dayLabel(key),
        detail: `${dayLabel(key)} (${WEEKDAY_SHORT[weekdayIndex(key)]})`,
        value: perDay.get(key) ?? 0,
      });
    }
  } else {
    // Semanas de 7 dias contadas de hoje para tras; a mais antiga pode ser menor.
    let end = endKey;
    while (end >= startKey) {
      const candidate = shiftDayKey(end, -6);
      const start = candidate < startKey ? startKey : candidate;
      let value = 0;
      for (let key = start; key <= end; key = shiftDayKey(key, 1)) value += perDay.get(key) ?? 0;
      points.unshift({
        key: start,
        label: dayLabel(start),
        detail: start === end ? dayLabel(start) : `${dayLabel(start)} a ${dayLabel(end)}`,
        value,
      });
      end = shiftDayKey(start, -1);
    }
  }

  const step = points.length <= 7 ? 1 : points.length <= 14 ? 2 : 5;
  const last = points.length - 1;
  return {
    granularity: weekly ? "semana" : "dia",
    series: points.map((point, index) => ({ ...point, tick: (last - index) % step === 0 })),
  };
}

function availableByColor(rows: DashboardPuppyRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (normalizePuppyStatus(row.status) !== "available") continue;
    const key = fold(row.color) || fold(row.cor);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function buildLeadAnalytics(
  rows: AnalyticsLeadRow[],
  puppies: DashboardPuppyRow[] | null,
  now: Date,
  period: AnalyticsPeriod,
  truncated = false,
): AnalyticsLeads {
  const endKey = dayKey(now) ?? "";
  const startKey = shiftDayKey(endKey, -(period - 1));
  const prevStartKey = shiftDayKey(startKey, -period);

  const perDay = new Map<string, number>();
  const statusCount = new Map<LeadStatus, number>(LEAD_STATUS.map((status) => [status, 0]));
  const weekdayCount = new Array<number>(7).fill(0);

  const sources = new Map<string, Bucket>();
  const campaigns = new Map<string, Bucket>();
  const cities = new Map<string, Bucket>();
  const pages = new Map<string, Bucket>();
  const sexes = new Map<string, Bucket>();
  const colors = new Map<string, Bucket>();
  const missing = { campaign: 0, city: 0, page: 0, sex: 0, color: 0 };

  const durations: number[] = [];
  let within1h = 0;
  let within24h = 0;
  let over24h = 0;
  let notRecorded = 0;

  let total = 0;
  let prevTotal = 0;

  for (const row of rows) {
    const key = dayKey(row.created_at);
    // sem data valida, ou com relogio adiantado na origem: fora das contas
    if (!key || key > endKey) continue;
    if (key < startKey) {
      if (key >= prevStartKey) prevTotal += 1;
      continue;
    }

    total += 1;
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    weekdayCount[weekdayIndex(key)] += 1;

    const status = normalizeLeadStatus(row.status);
    const converted = status === "convertido";
    statusCount.set(status, (statusCount.get(status) ?? 0) + 1);

    const source = leadSource(row);
    tally(sources, source, sourceLabel(source), converted);

    const campaign = clean(row.utm_campaign);
    if (campaign) tally(campaigns, campaign.toLowerCase(), campaign, converted);
    else missing.campaign += 1;

    const city = clean(row.cidade);
    if (city) {
      const state = clean(row.estado).toUpperCase();
      const cityKey = fold(city);
      tally(cities, cityKey, state ? `${city} · ${state}` : city, converted);
      // a primeira grafia vinha sem estado e esta traz: fica a mais completa
      const bucket = cities.get(cityKey);
      if (bucket && state && !bucket.label.includes(" · ")) bucket.label = `${bucket.label} · ${state}`;
    } else {
      missing.city += 1;
    }

    const path = pagePath(row);
    if (path) tally(pages, path.toLowerCase(), path, converted);
    else missing.page += 1;

    const sex = clean(row.sexo_preferido);
    if (sex) tally(sexes, fold(sex), sexLabel(sex), converted);
    else missing.sex += 1;

    const color = clean(row.cor_preferida);
    if (color) tally(colors, fold(color), capitalize(color.toLowerCase()), converted);
    else missing.color += 1;

    const createdAt = new Date(row.created_at).getTime();
    const respondedAt = row.first_responded_at ? new Date(row.first_responded_at).getTime() : Number.NaN;
    if (Number.isFinite(respondedAt) && respondedAt >= createdAt) {
      const hours = (respondedAt - createdAt) / HOUR_MS;
      durations.push(hours);
      if (hours <= 1) within1h += 1;
      else if (hours <= 24) within24h += 1;
      else over24h += 1;
    } else if (status !== "novo") {
      notRecorded += 1;
    }
  }

  const converted = statusCount.get("convertido") ?? 0;
  const stockByColor = puppies ? availableByColor(puppies) : null;
  const colorBreakdown = toBreakdown(colors, total, 8, missing.color);
  const med = median(durations);

  return {
    total,
    prevTotal,
    deltaPct: !truncated && prevTotal > 0 ? round1(((total - prevTotal) / prevTotal) * 100) : null,
    perDayAvg: round1(total / period),
    truncated,
    ...buildSeries(perDay, startKey, endKey, period),
    pipeline: LEAD_STATUS.map((status) => {
      const count = statusCount.get(status) ?? 0;
      return { status, label: LEAD_STATUS_LABEL[status], count, pct: pctOf(count, total) };
    }),
    converted,
    conversionPct: total > 0 ? round1((converted / total) * 100) : null,
    response: {
      sample: durations.length,
      medianHours: med === null ? null : round1(med),
      avgHours: durations.length ? round1(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null,
      within1h,
      within24h,
      over24h,
      notRecorded,
    },
    sources: toBreakdown(sources, total, 8, 0),
    campaigns: toBreakdown(campaigns, total, 8, missing.campaign),
    cities: toBreakdown(cities, total, 8, missing.city),
    pages: toBreakdown(pages, total, 8, missing.page),
    sexes: toBreakdown(sexes, total, 4, missing.sex),
    colors: {
      ...colorBreakdown,
      rows: colorBreakdown.rows.map((row) => ({
        ...row,
        stock: stockByColor ? stockByColor.get(row.key) ?? 0 : null,
      })),
    },
    weekdays: WEEKDAY_ORDER.map((index) => ({
      key: WEEKDAY_SHORT[index],
      label: WEEKDAY_LONG[index],
      count: weekdayCount[index],
      pct: pctOf(weekdayCount[index], total),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Vendas por mes (filhotes com status Vendido e data de venda)         */
/* ------------------------------------------------------------------ */

export function buildMonthSales(rows: DashboardPuppyRow[], now: Date): MonthSales[] {
  const todayKey = dayKey(now) ?? "";
  let year = Number(todayKey.slice(0, 4));
  let month = Number(todayKey.slice(5, 7));

  const months: MonthSales[] = [];
  for (let index = 0; index < SALES_MONTHS; index += 1) {
    months.unshift({
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: `${MONTH_SHORT[month - 1]}/${String(year).slice(2)}`,
      count: 0,
      cents: 0,
    });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  const byKey = new Map(months.map((item) => [item.key, item]));
  for (const row of rows) {
    if (normalizePuppyStatus(row.status) !== "sold") continue;
    const soldKey = dayKey(row.sold_at);
    const bucket = soldKey ? byKey.get(soldKey.slice(0, 7)) : undefined;
    if (!bucket) continue;
    bucket.count += 1;
    bucket.cents += puppyPriceCents(row);
  }
  return months;
}

/* ------------------------------------------------------------------ */
/* Montagem                                                             */
/* ------------------------------------------------------------------ */

export function buildAnalytics(input: {
  /** null = a leitura de leads falhou. */
  leads: AnalyticsLeadRow[] | null;
  /** null = a leitura de filhotes falhou. */
  puppies: DashboardPuppyRow[] | null;
  now: Date;
  period: AnalyticsPeriod;
  /** true quando a leitura de leads parou no teto de linhas. */
  leadsTruncated?: boolean;
}): AnalyticsData {
  const endKey = dayKey(input.now) ?? "";
  const startKey = shiftDayKey(endKey, -(input.period - 1));
  return {
    generatedAt: input.now.toISOString(),
    period: input.period,
    range: { startKey, endKey, startLabel: dayLabel(startKey), endLabel: dayLabel(endKey) },
    leads: input.leads
      ? buildLeadAnalytics(input.leads, input.puppies, input.now, input.period, Boolean(input.leadsTruncated))
      : null,
    stock: input.puppies ? buildStock(input.puppies, input.now) : null,
    sales: input.puppies ? buildMonthSales(input.puppies, input.now) : null,
  };
}
