export const dynamic = "force-dynamic";

/**
 * GET /api/cron/publish-scheduled
 * Chamado pela funcao agendada da Netlify (netlify/functions/cron-due.mjs).
 * Executa publicações agendadas cujo run_at já passou.
 * Autenticado via CRON_SECRET (ver src/lib/cron/auth.ts).
 */

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { erroPublico } from "@/lib/apiErro";
import { revalidarListagemBlog } from "@/lib/blog/revalidate";
import { autorizarCron } from "@/lib/cron/auth";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const negado = autorizarCron(req);
  if (negado) return negado;

  // Sem a chave de servico supabaseAdmin() estoura e o Next devolve um 500 sem
  // corpo — no log da funcao agendada isso aparece como falha generica. Melhor
  // dizer o que falta.
  if (!hasServiceRoleKey()) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY ausente" }, { status: 500 });
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
    return erroPublico("api/cron/publish-scheduled", error);
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
      } catch {
        // Falha de revalidacao nao desfaz a publicacao: o post ja esta publicado no
        // banco e a listagem tem revalidate de 300s, entao o cache se corrige
        // sozinho no proximo ciclo.
      }

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
