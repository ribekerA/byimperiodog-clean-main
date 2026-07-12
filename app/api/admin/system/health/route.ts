import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function rangeMs(range: string): number {
  if (range === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return 30 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

type EvRow = { name: string; value: unknown; created_at: string; path?: string | null; meta?: unknown };

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const url = new URL(req.url);
  const range = (url.searchParams.get("range") || "24h") as string;
  const since = new Date(Date.now() - rangeMs(range)).toISOString();
  const generatedAt = new Date().toISOString();

  const sb = supabaseAdmin();

  // ── DB health ────────────────────────────────────────────────────────────────
  let dbStatus: "ok" | "degraded" | "down" = "down";
  let dbLatencyMs = 0;
  try {
    const t0 = Date.now();
    const { error } = await sb.from("tracking_settings").select("id").limit(1).maybeSingle();
    dbLatencyMs = Date.now() - t0;
    dbStatus = error ? "degraded" : dbLatencyMs > 2000 ? "degraded" : "ok";
  } catch { /* down */ }

  // ── Table stats ──────────────────────────────────────────────────────────────
  const tableStats = { blog_posts: 0, puppies: 0, leads: 0 };
  try {
    const [p, q, l] = await Promise.allSettled([
      sb.from("blog_posts").select("id", { count: "exact", head: true }),
      sb.from("puppies").select("id", { count: "exact", head: true }),
      sb.from("leads").select("id", { count: "exact", head: true }),
    ]);
    if (p.status === "fulfilled") tableStats.blog_posts = p.value.count ?? 0;
    if (q.status === "fulfilled") tableStats.puppies = q.value.count ?? 0;
    if (l.status === "fulfilled") tableStats.leads = l.value.count ?? 0;
  } catch { /* ignore */ }

  // ── Analytics events ─────────────────────────────────────────────────────────
  const { data: raw } = await sb
    .from("analytics_events")
    .select("name,value,created_at,path,meta")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000)
    .catch(() => ({ data: [] as EvRow[] }));

  const evts = (raw || []) as EvRow[];
  const byName = new Map<string, EvRow[]>();
  for (const e of evts) {
    const arr = byName.get(e.name) || [];
    arr.push(e);
    byName.set(e.name, arr);
  }

  const num = (e: EvRow) => (typeof e.value === "number" ? e.value : Number(e.value || 0));
  const avg = (list: EvRow[]) => (list.length ? list.reduce((s, e) => s + num(e), 0) / list.length : 0);

  // Web vitals
  const lcpList = byName.get("web_vitals_lcp") || [];
  const inpList = byName.get("web_vitals_inp") || [];
  const clsList = byName.get("web_vitals_cls") || [];

  // Response time P50/P95
  const rtSorted = (byName.get("response_time_ms") || []).map(num).sort((a, b) => a - b);

  // Error breakdown
  const errorEvts = byName.get("error") || [];
  const errorByPath: Record<string, number> = {};
  for (const e of errorEvts) {
    const p = e.path || "unknown";
    errorByPath[p] = (errorByPath[p] || 0) + 1;
  }

  // Active users (unique sessions or hourly buckets)
  const sessionSet = new Set<string>();
  for (const e of byName.get("active_user") || []) {
    sessionSet.add(
      (e.meta as Record<string, string> | null)?.session_id || e.created_at.slice(0, 13),
    );
  }

  const totalEvents = evts.length;
  const errorRate = totalEvents ? (errorEvts.length / totalEvents) * 100 : 0;
  const responseTimeP50 = Math.round(pct(rtSorted, 50));
  const responseTimeP95 = Math.round(pct(rtSorted, 95));

  // ── Services ─────────────────────────────────────────────────────────────────
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAI = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  const hasWA = Boolean(process.env.NEXT_PUBLIC_WA_PHONE);

  const services = {
    database: { status: dbStatus, latencyMs: dbLatencyMs },
    analytics: {
      status: (totalEvents > 0 ? "ok" : "no_data") as "ok" | "no_data",
      eventsInRange: totalEvents,
    },
    storage: {
      status: (hasSupabase ? "ok" : "not_configured") as "ok" | "not_configured",
    },
    ai: { status: (hasAI ? "configured" : "not_configured") as "configured" | "not_configured" },
    whatsapp: { status: (hasWA ? "configured" : "not_configured") as "configured" | "not_configured" },
  };

  const overallStatus =
    dbStatus === "down"
      ? "critical"
      : dbStatus === "degraded" || responseTimeP95 > 3000 || errorRate > 5
        ? "degraded"
        : "healthy";

  return NextResponse.json({
    generatedAt,
    range,
    overallStatus,
    services,
    metrics: {
      responseTimeP50,
      responseTimeP95,
      errorRate: Math.round(errorRate * 100) / 100,
      activeUsers: sessionSet.size,
      totalEvents,
    },
    webVitals: {
      lcp: Math.round(avg(lcpList) * 10) / 10,
      inp: Math.round(avg(inpList) * 10) / 10,
      cls: Math.round(avg(clsList) * 1000) / 1000,
      samples: lcpList.length,
    },
    tableStats,
    recentErrors: errorEvts.slice(0, 25).map((e) => ({
      message: typeof e.value === "string" ? e.value : String(e.value || ""),
      path: e.path || "/",
      created_at: e.created_at,
    })),
    errorByPath,
  });
}
