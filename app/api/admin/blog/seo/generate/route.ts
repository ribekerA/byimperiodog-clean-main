export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Calls the existing AI suggestion endpoint (if API key configured) and persists a suggestion
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, slug, title, excerpt, content_mdx } = body as { id?: string; slug?: string; title?: string; excerpt?: string; content_mdx?: string };
    if (!id && !slug) return NextResponse.json({ error: "id ou slug obrigatórios" }, { status: 400 });

    let payload = { title, excerpt, content_mdx, slug };

    const resp = await fetch(new URL("../../seo-suggestions", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`SEO suggestions failed: ${txt}`);
    }
    const j = await resp.json();
    const suggestions = j.suggestions || {};

    const sb = supabaseAdmin();
    let postId = id as string | undefined;
    if (!postId && slug) {
      const { data: p, error } = await sb.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
      if (error) throw error;
      postId = p?.id;
    }
    if (!postId) return NextResponse.json({ error: "post não encontrado" }, { status: 404 });

    const { error: ins } = await sb.from("seo_suggestions").insert([{ entity_type: "post", entity_id: postId, data_json: suggestions }]);
    if (ins) throw ins;
    return NextResponse.json({ ok: true, suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
