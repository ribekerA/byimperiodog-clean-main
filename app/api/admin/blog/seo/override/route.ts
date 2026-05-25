export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Upsert SEO overrides for a post by id or slug
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, slug, data } = body as { id?: string; slug?: string; data: Record<string, any> };
    if (!id && !slug) return NextResponse.json({ error: "id ou slug obrigatórios" }, { status: 400 });
    if (!data) return NextResponse.json({ error: "data obrigatório" }, { status: 400 });

    const sb = supabaseAdmin();
    let postId = id as string | undefined;
    if (!postId && slug) {
      const { data: p, error } = await sb.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!p?.id) return NextResponse.json({ error: "post não encontrado" }, { status: 404 });
      postId = p.id;
    }

    const payload = { entity_type: "post", entity_id: postId, data_json: data };
    const { data: upserted, error: upErr } = await sb
      .from("seo_overrides")
      .upsert(payload, { onConflict: "entity_type,entity_id,entity_ref" })
      .select("entity_type,entity_id").maybeSingle();
    if (upErr) throw upErr;
    return NextResponse.json({ ok: true, entity: upserted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
