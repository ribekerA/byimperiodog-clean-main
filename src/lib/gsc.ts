import { google } from "googleapis";

export type GscQueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscPageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscQueryPageRow = GscQueryRow & { page: string };
export type GscCannibalization = { query: string; clicks: number; impressions: number; pages: { page: string; clicks: number; impressions: number; position: number }[] };
export type GscData = {
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
  opportunities: GscQueryPageRow[];
  cannibalization: GscCannibalization[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  dateRange: { start: string; end: string };
};

const FOCUS_PATHS = ["/spitz-alemao", "/lulu-da-pomerania", "/pomeranian", "/filhote-de-spitz-alemao", "/comprar-spitz-anao"];
const round1 = (value: number) => Math.round(value * 10) / 10;

function getAuth() {
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY não configurado");
  let key: { client_email: string; private_key: string };
  try { key = JSON.parse(keyRaw); } catch { throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY não é um JSON válido"); }
  return new google.auth.JWT({ email: key.client_email, key: key.private_key, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function cleanPage(value: string, siteUrl: string) {
  try { return new URL(value).pathname || "/"; } catch { return value.replace(siteUrl.replace(/\/$/, ""), "") || "/"; }
}

export async function fetchGscData(days = 28): Promise<GscData> {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br";
  const sc = google.searchconsole({ version: "v1", auth: getAuth() });
  const startDate = daysAgo(days + 3);
  const endDate = daysAgo(3);
  const request = (dimensions?: string[], rowLimit = 250) => sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions, rowLimit, dataState: "final" } });
  const [totalsRes, queriesRes, pagesRes, queryPagesRes] = await Promise.all([
    request(undefined, 1), request(["query"]), request(["page"]), request(["query", "page"], 1000),
  ]);

  const topQueries: GscQueryRow[] = (queriesRes.data.rows ?? []).map((r) => ({ query: r.keys?.[0] ?? "", clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: round1((r.ctr ?? 0) * 100), position: round1(r.position ?? 0) }));
  const topPages: GscPageRow[] = (pagesRes.data.rows ?? []).map((r) => ({ page: cleanPage(r.keys?.[0] ?? "", siteUrl), clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: round1((r.ctr ?? 0) * 100), position: round1(r.position ?? 0) }));
  const queryPages: GscQueryPageRow[] = (queryPagesRes.data.rows ?? []).map((r) => ({ query: r.keys?.[0] ?? "", page: cleanPage(r.keys?.[1] ?? "", siteUrl), clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: round1((r.ctr ?? 0) * 100), position: round1(r.position ?? 0) }));

  // Oportunidades reais: já aparecem na primeira/segunda página e têm demanda mínima.
  const opportunities = queryPages.filter((r) => r.impressions >= 10 && r.position >= 4 && r.position <= 15).sort((a, b) => b.impressions - a.impressions).slice(0, 50);
  const byQuery = new Map<string, GscQueryPageRow[]>();
  for (const row of queryPages) byQuery.set(row.query, [...(byQuery.get(row.query) ?? []), row]);
  const cannibalization = [...byQuery.entries()].map(([query, rows]) => {
    const focus = rows.filter((r) => FOCUS_PATHS.some((path) => r.page === path || r.page.startsWith(`${path}/`)));
    const unique = [...new Map(focus.map((r) => [r.page, r])).values()];
    return { query, clicks: unique.reduce((n, r) => n + r.clicks, 0), impressions: unique.reduce((n, r) => n + r.impressions, 0), pages: unique.map((r) => ({ page: r.page, clicks: r.clicks, impressions: r.impressions, position: r.position })).sort((a, b) => b.impressions - a.impressions) };
  }).filter((row) => row.pages.length > 1).sort((a, b) => b.impressions - a.impressions).slice(0, 50);

  const rawTotal = totalsRes.data.rows?.[0];
  const totals = { clicks: rawTotal?.clicks ?? 0, impressions: rawTotal?.impressions ?? 0, ctr: round1((rawTotal?.ctr ?? 0) * 100), position: round1(rawTotal?.position ?? 0) };
  return { topQueries, topPages, opportunities, cannibalization, totals, dateRange: { start: startDate, end: endDate } };
}

export function isGscConfigured() { return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY); }
