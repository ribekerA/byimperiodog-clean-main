export const dynamic = "force-dynamic";

/**
 * POST /api/blog/publish-due
 *
 * Publica o que estava agendado em blog_posts.scheduled_at. Chamado pela funcao
 * agendada da Netlify (netlify/functions/cron-due.mjs) — antes dependia de
 * alguem lembrar de bater nela na mao.
 *
 * Nao confundir com /api/cron/publish-scheduled: aquela le a tabela de eventos
 * blog_post_schedule_events. Sao dois caminhos de agendamento que convivem no
 * banco, e o cron chama os dois.
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { revalidarListagemBlog } from "@/lib/blog/revalidate";
import { autorizarCron } from "@/lib/cron/auth";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  // Esta rota publica post agendado e limpa cache. Estava aberta para qualquer
  // um na internet. O portao so aperta quando CRON_SECRET existe, entao nada
  // quebra enquanto a variavel nao for criada na Netlify.
  const negado = autorizarCron(req);
  if (negado) return negado;

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ message: "Configuração ausente" }, { status: 500 });
  }
  const sb = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: due } = await sb
    .from("blog_posts")
    .select("id,slug")
    .lte("scheduled_at", now)
    .eq("status", "scheduled");

  if (!due || due.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const ids = due.map((d: { id: string }) => d.id);
  const { error } = await sb
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    return NextResponse.json({ message: "Falha ao publicar", error: String(error.message) }, { status: 500 });
  }

  // Revalidate listing and each post
  try {
    revalidarListagemBlog();
    revalidatePath("/blog");
    for (const d of due) revalidatePath(`/blog/${d.slug}`);
  } catch {
    // Falha de revalidacao nao desfaz a publicacao: o post ja esta publicado no
    // banco e a listagem tem revalidate de 300s, entao o cache se corrige
    // sozinho no proximo ciclo.
  }

  return NextResponse.json({ updated: due.length });
}
