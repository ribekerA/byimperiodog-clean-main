import { google } from "googleapis";

export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscPageRow = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscData = {
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  dateRange: { start: string; end: string };
};

function getAuth() {
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY não configurado");

  let key: { client_email: string; private_key: string };
  try {
    key = JSON.parse(keyRaw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY não é um JSON válido");
  }

  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function fetchGscData(days = 28): Promise<GscData> {
  const siteUrl =
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.byimperiodog.com.br";

  const auth = getAuth();
  const sc = google.searchconsole({ version: "v1", auth });

  const startDate = daysAgo(days);
  const endDate = daysAgo(3); // GSC tem delay de ~3 dias

  const baseReq = {
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      rowLimit: 25,
    },
  };

  const [queriesRes, pagesRes] = await Promise.all([
    sc.searchanalytics.query({
      ...baseReq,
      requestBody: { ...baseReq.requestBody, dimensions: ["query"] },
    }),
    sc.searchanalytics.query({
      ...baseReq,
      requestBody: { ...baseReq.requestBody, dimensions: ["page"] },
    }),
  ]);

  const topQueries: GscQueryRow[] = (queriesRes.data.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: Math.round((r.ctr ?? 0) * 1000) / 10,
    position: Math.round((r.position ?? 0) * 10) / 10,
  }));

  const topPages: GscPageRow[] = (pagesRes.data.rows ?? []).map((r) => ({
    page: (r.keys?.[0] ?? "").replace(siteUrl.replace(/\/$/, ""), ""),
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: Math.round((r.ctr ?? 0) * 1000) / 10,
    position: Math.round((r.position ?? 0) * 10) / 10,
  }));

  const totals = topQueries.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
      ctr: 0,
      position: 0,
    }),
    { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  );
  totals.ctr =
    totals.impressions > 0
      ? Math.round((totals.clicks / totals.impressions) * 1000) / 10
      : 0;
  totals.position =
    topQueries.length > 0
      ? Math.round((topQueries.reduce((s, r) => s + r.position, 0) / topQueries.length) * 10) / 10
      : 0;

  return { topQueries, topPages, totals, dateRange: { start: startDate, end: endDate } };
}

export function isGscConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}
