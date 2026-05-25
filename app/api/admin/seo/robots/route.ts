export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RuleRow = {
  id: string;
  scope: string;
  scope_ref: string | null;
  rules_json: { robotsTxt?: string };
  active: boolean;
};

function defaultRobots(origin?: string) {
  const base = origin || "";
  const sitemap = base ? `${base.replace(/\/$/, "")}/sitemap.xml` : "/sitemap.xml";
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}`;
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ robotsTxt: defaultRobots(new URL(req.url).origin) });
  const { data, error } = await sb
    .from("seo_rules")
    .select("id, scope, scope_ref, rules_json, active")
    .eq("scope", "global")
    .eq("scope_ref", "robots")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (error && error.message && !(`${error.message}`.toLowerCase().includes("not found"))) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const robotsTxt = (data as RuleRow | null)?.rules_json?.robotsTxt || defaultRobots(new URL(req.url).origin);
  return NextResponse.json({ robotsTxt });
}

export async function PUT(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { robotsTxt } = (await req.json()) as { robotsTxt?: string };
  if (!robotsTxt) return NextResponse.json({ error: "missing-robotsTxt" }, { status: 400 });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, stored: false });
  const { data: existing } = await sb
    .from("seo_rules")
    .select("id")
    .eq("scope", "global")
    .eq("scope_ref", "robots")
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await sb
      .from("seo_rules")
      .update({ rules_json: { robotsTxt }, active: true })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb
      .from("seo_rules")
      .insert({ scope: "global", scope_ref: "robots", rules_json: { robotsTxt }, active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
