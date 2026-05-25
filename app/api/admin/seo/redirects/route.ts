import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RedirectRow = {
  from_path: string;
  to_url: string;
  type: "permanent" | "temporary";
  active: boolean | null;
  created_at?: string;
};

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ items: [] });
  const { data, error } = await sb.from("redirects").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Mapear para shape consistente { from_path, to_url, code }
  const items = (data || []).map((r: RedirectRow) => ({
    from_path: r.from_path,
    to_url: r.to_url,
    code: r.type === "permanent" ? 301 : 302,
    active: r.active !== false,
    created_at: r.created_at,
  }));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const payload = await req.json();
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase-not-configured" }, { status: 500 });
  const { from_path, to_url, code = 301, enabled = true } = payload || {};
  if (!from_path || !to_url) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }
  const type = Number(code) === 302 ? "temporary" : "permanent";
  const active = !!enabled;
  const { data, error } = await sb
    .from("redirects")
    .upsert({ from_path, to_url, type, active })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: { from_path: data.from_path, to_url: data.to_url, code, active: data.active } });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  if (!from) return NextResponse.json({ error: "missing-from" }, { status: 400 });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase-not-configured" }, { status: 500 });
  const { error } = await sb.from("redirects").delete().eq("from_path", from);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
