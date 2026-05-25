import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type EventRow = {
  id: string;
  post_id: string;
  run_at: string;
  action: string;
  executed_at: string | null;
  payload?: unknown;
  created_at?: string;
  blog_posts?: {
    id: string;
    title: string;
    slug: string;
    status: string;
    cover_url?: string | null;
    published_at?: string | null;
    scheduled_at?: string | null;
  } | null;
};

type DateRange = {
  from?: string | null;
  to?: string | null;
};

const SELECT_FIELDS = "id,post_id,run_at,action,executed_at,created_at,payload,blog_posts(id,slug,title,status,cover_url,published_at,scheduled_at)";

function buildRange(url: URL): DateRange {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from || to) return { from, to };
  const month = url.searchParams.get("month");
  if (!month) return {};
  const start = new Date(`${month}-01T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return {};
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const url = new URL(req.url);
  const range = buildRange(url);
  try {
    const sb = supabaseAdmin();
    let query = sb.from("blog_post_schedule_events").select(SELECT_FIELDS).order("run_at");
    if (range.from) query = query.gte("run_at", range.from);
    if (range.to) query = query.lt("run_at", range.to);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data as EventRow[] | null) || [];
    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  try {
    const body = await req.json().catch(() => ({}));
    const { post_id, run_at, action, payload } = body ?? {};
    if (!post_id || !run_at || !action) {
      return NextResponse.json({ ok: false, error: "post_id, run_at, action obrigatorios" }, { status: 400 });
    }
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("blog_post_schedule_events")
      .insert([{ post_id, run_at, action, payload: payload || null }])
      .select(SELECT_FIELDS)
      .single();
    if (error) throw error;
    if (action === "publish") {
      try {
        await sb.from("blog_posts").update({ scheduled_at: run_at, status: "scheduled" }).eq("id", post_id);
      } catch {
        // best effort
      }
    }
    logAdminAction({
      route: "/api/admin/blog/schedule/events",
      method: "POST",
      action: "schedule_create",
      payload: { id: data?.id, post_id, run_at, action },
    });
    const row = data as EventRow | null;
    return NextResponse.json({ ok: true, event: row });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id obrigatorio" }, { status: 400 });
    const sb = supabaseAdmin();
    const { data: before } = await sb
      .from("blog_post_schedule_events")
      .select("post_id, run_at, action")
      .eq("id", id)
      .maybeSingle();
    const { error } = await sb.from("blog_post_schedule_events").delete().eq("id", id);
    if (error) throw error;
    logAdminAction({
      route: "/api/admin/blog/schedule/events",
      method: "DELETE",
      action: "schedule_delete",
      payload: { id, before },
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
