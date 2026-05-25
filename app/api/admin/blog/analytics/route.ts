export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  type PubRow = { id:string; slug:string; title:string; content_mdx:string|null; published_at:string|null };
  const { data: published, count: totalPublished } = await sb
      .from("blog_posts")
      .select("id,slug,title,content_mdx,published_at", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200);

  const postsLast30 = (published || []).filter((p: PubRow) => p.published_at && p.published_at >= d30).length;

    const { count: commentsLast30 } = await sb
      .from("blog_comments")
      .select("id", { count: "exact", head: true })
      .eq("approved", true)
      .gte("created_at", d30 as any);

    const { data: topByComments } = await sb
      .from("blog_comments")
      .select("post_id, posts:blog_posts!inner(slug,title)")
      .eq("approved", true)
      .order("post_id", { ascending: true })
      .limit(2000);

    const counts: Record<string, { slug: string; title: string; comments: number }> = {};
    for (const row of topByComments || []) {
      const slug = (row as any).posts?.slug as string | undefined;
      const title = (row as any).posts?.title as string | undefined;
      if (!slug) continue;
      if (!counts[slug]) counts[slug] = { slug, title: title || slug, comments: 0 };
      counts[slug].comments += 1;
    }
    const top = Object.values(counts).sort((a, b) => b.comments - a.comments).slice(0, 10);

  const recent = (published || []).slice(0, 10).map((p: PubRow) => ({ slug: p.slug, title: p.title, published_at: p.published_at }));

    // leitura média (estimativa 200 wpm)
    const times: number[] = (published || [])
      .map((p: PubRow) => {
        const wc = ((p.content_mdx || '')).split(/\s+/).filter(Boolean).length;
        return wc > 0 ? Math.max(1, Math.round(wc / 200)) : 0;
      })
      .filter((m: number) => m > 0);
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

    return NextResponse.json({
      total_published: totalPublished || 0,
      posts_last_30d: postsLast30,
      comments_last_30d: commentsLast30 || 0,
      avg_read_time_min: avg,
      top_posts_by_comments: top,
      recent_posts: recent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
