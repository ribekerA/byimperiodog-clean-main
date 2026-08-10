import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const VALID_METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"];
const THRESHOLDS: Record<string, [number, number]> = {
  LCP:  [2500, 4000],
  INP:  [200,  500],
  CLS:  [0.1,  0.25],
  FCP:  [1800, 3000],
  TTFB: [800,  1800],
};

function rating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const [good, poor] = THRESHOLDS[name] ?? [Infinity, Infinity];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, value, id, page } = body;

    if (!VALID_METRICS.includes(name) || typeof value !== "number") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await supabaseAdmin()
      .from("rum_vitals")
      .insert({
        metric: name,
        value: Math.round(name === "CLS" ? value * 1000 : value),
        rating: rating(name, value),
        metric_id: id ?? null,
        page: page ?? null,
        created_at: new Date().toISOString(),
      });
  } catch {
    // silently fail — never block the user
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  // Apenas ADMIN_PASS: NEXT_PUBLIC_* vai para o bundle do browser.
  const expectedPass = process.env.ADMIN_PASS;
  const authedByHeader = !!expectedPass && req.headers.get("x-admin-pass") === expectedPass;
  const session = await verifyAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!authedByHeader && !session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const days = Math.min(Number(req.nextUrl.searchParams.get("days") ?? "7"), 90);

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin()
      .from("rum_vitals")
      .select("metric,value,rating,page,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) throw error;

    type RumRow = { metric: string; value: number; rating: string; page: string | null; created_at: string };
    const rows = (data ?? []) as RumRow[];

    // ── Resumo por métrica ────────────────────────────────────────────
    const summary: Record<string, { good: number; needs: number; poor: number; p75: number | null; p50: number | null; samples: number }> = {};
    VALID_METRICS.forEach((m) => {
      const mRows = rows.filter((r: RumRow) => r.metric === m);
      const vals  = mRows.map((r: RumRow) => r.value).sort((a: number, b: number) => a - b);
      summary[m] = {
        good:    mRows.filter((r: RumRow) => r.rating === "good").length,
        needs:   mRows.filter((r: RumRow) => r.rating === "needs-improvement").length,
        poor:    mRows.filter((r: RumRow) => r.rating === "poor").length,
        p75:     vals.length ? (vals[Math.floor(vals.length * 0.75)] ?? null) : null,
        p50:     vals.length ? (vals[Math.floor(vals.length * 0.5)]  ?? null) : null,
        samples: vals.length,
      };
    });

    // ── Tendência diária (últimos N dias) ──────────────────────────────
    const dailyMap = new Map<string, Record<string, number[]>>();
    rows.forEach((r: RumRow) => {
      const day = r.created_at.slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, {});
      const d = dailyMap.get(day)!;
      if (!d[r.metric]) d[r.metric] = [];
      d[r.metric].push(r.value);
    });
    const trend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => {
        const entry: Record<string, unknown> = { date };
        VALID_METRICS.forEach((m) => {
          const vals = (metrics[m] ?? []).sort((a: number, b: number) => a - b);
          entry[m] = vals.length ? (vals[Math.floor(vals.length * 0.75)] ?? null) : null;
        });
        return entry;
      });

    // ── Top páginas lentas por métrica ────────────────────────────────
    const pageMetricMap = new Map<string, Record<string, number[]>>();
    rows.filter((r: RumRow) => r.page).forEach((r: RumRow) => {
      const key = r.page!;
      if (!pageMetricMap.has(key)) pageMetricMap.set(key, {});
      const d = pageMetricMap.get(key)!;
      if (!d[r.metric]) d[r.metric] = [];
      d[r.metric].push(r.value);
    });
    const slowPages = Array.from(pageMetricMap.entries())
      .map(([page, metrics]) => {
        const lcpVals = (metrics["LCP"] ?? []).sort((a, b) => a - b);
        const p75Lcp  = lcpVals.length ? (lcpVals[Math.floor(lcpVals.length * 0.75)] ?? null) : null;
        return { page, lcpP75: p75Lcp, samples: lcpVals.length };
      })
      .filter((p) => p.lcpP75 !== null && p.samples >= 3)
      .sort((a, b) => (b.lcpP75 ?? 0) - (a.lcpP75 ?? 0))
      .slice(0, 10);

    return NextResponse.json({ ok: true, summary, trend, slowPages, totalSamples: rows.length, days });
  } catch {
    return NextResponse.json({ ok: true, summary: {}, trend: [], slowPages: [], totalSamples: 0, error: "no_table", days });
  }
}
