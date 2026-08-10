export const dynamic = "force-dynamic";

/**
 * GET /api/cron/publish-scheduled
 * Chamado pelo Vercel Cron a cada hora.
 * Executa publicações agendadas cujo run_at já passou.
 * Autenticado via CRON_SECRET (Vercel injeta Authorization: Bearer <secret>).
 */

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { revalidarListagemBlog } from "@/lib/blog/revalidate";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const sb  = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: events, error } = await sb
    .from("blog_post_schedule_events")
    .select("*")
    .is("executed_at", null)
    .lte("run_at", now)
    .order("run_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; slug?: string; error?: string }[] = [];

  for (const ev of events ?? []) {
    if (ev.action !== "publish" || !ev.post_id) {
      await sb
        .from("blog_post_schedule_events")
        .update({ executed_at: now, payload: { error: "unsupported action" } })
        .eq("id", ev.id);
      results.push({ id: ev.id, ok: false, error: "unsupported action" });
      continue;
    }

    const { data: post, error: pubErr } = await sb
      .from("blog_posts")
      .update({ status: "published", published_at: now, scheduled_at: null })
      .eq("id", ev.post_id)
      .select("slug")
      .maybeSingle();

    if (pubErr) {
      await sb
        .from("blog_post_schedule_events")
        .update({ executed_at: now, payload: { error: pubErr.message } })
        .eq("id", ev.id);
      results.push({ id: ev.id, ok: false, error: pubErr.message });
    } else {
      await sb
        .from("blog_post_schedule_events")
        .update({ executed_at: now })
        .eq("id", ev.id);

      try {
        revalidarListagemBlog();
        revalidatePath("/blog");
        if (post?.slug) revalidatePath(`/blog/${post.slug}`);
      } catch {}

      results.push({ id: ev.id, ok: true, slug: post?.slug });
    }
  }

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    published: results.filter((r) => r.ok).length,
    failed:    results.filter((r) => !r.ok).length,
    results,
  });
}
