import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({
    uptime: 0,
    responseTimeMs: 0,
    errorRate: 0,
    activeUsers: 0,
    webVitals: { lcp: 0, inp: 0, cls: 0 },
    recentErrors: [],
  });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await sb
    .from("analytics_events")
    .select("name,value,created_at,details")
    .gte("created_at", since);

  type AnalyticEvent = {
    name: string;
    value: number | string | null;
    created_at: string;
    details?: unknown;
  };

  const byName = new Map<string, Array<AnalyticEvent>>();
  for (const e of (events as AnalyticEvent[] | null) || []) {
    const arr = byName.get(e.name) || [];
    arr.push(e);
    byName.set(e.name, arr);
  }

  const avg = (list: Array<AnalyticEvent>) => {
    if (!list?.length) return 0;
    const s = list.reduce((acc, it) => acc + (typeof it.value === "number" ? it.value : Number(it.value || 0)), 0);
    return s / list.length;
  };

  const lcp = avg(byName.get("web_vitals_lcp") || []);
  const inp = avg(byName.get("web_vitals_inp") || []);
  const cls = avg(byName.get("web_vitals_cls") || []);

  const errors = (byName.get("error") || []).slice(-10).reverse();
  const errorRate = (() => {
    const total = events?.length || 0;
    const err = byName.get("error")?.length || 0;
    return total ? (err / total) * 100 : 0;
  })();

  // Placeholders: if you have an uptime heartbeat table, replace below
  const uptime = 24 * 60 * 60; // seconds in 24h window as a placeholder
  const responseTimeMs = avg(byName.get("response_time_ms") || []);
  const activeUsers = byName.get("active_user")?.length || 0;

  return NextResponse.json({
    uptime,
    responseTimeMs,
    errorRate,
    activeUsers,
    webVitals: { lcp, inp, cls },
    recentErrors: errors.map((e: AnalyticEvent) => ({
      message: typeof e.value === "string" ? e.value : "",
      created_at: e.created_at,
    })),
  });
}
