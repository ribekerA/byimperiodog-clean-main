export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET: lista tags; aceita ?q= para filtro básico por nome/slug.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const postIdsStr = url.searchParams.get("postIds") || ""; // comma-separated
    const sb = supabaseAdmin();

    // Batch lookup: tags por lista de posts
    if (postIdsStr) {
      const ids = postIdsStr.split(",").map((s) => s.trim()).filter(Boolean);
      if (!ids.length) return NextResponse.json({});
      const { data: links, error: e1 } = await sb
        .from("blog_post_tags")
        .select("post_id,tag_id")
        .in("post_id", ids)
        .limit(5000);
      if (e1) throw e1;
      const tagIds = Array.from(new Set((links || []).map((l: any) => l.tag_id)));
      const { data: tags, error: e2 } = await sb
        .from("blog_tags")
        .select("id,name,slug")
        .in("id", tagIds);
      if (e2) throw e2;
      type Tag = { id:string; name:string; slug:string };
      const tagMap: Map<string, { name: string; slug: string }> = new Map(
        (tags || []).map((t: Tag) => [t.id, { name: t.name, slug: t.slug }])
      );
      const result: Record<string, { name: string; slug: string }[]> = {};
      (links || []).forEach((l: { post_id:string; tag_id:string }) => {
        const t = tagMap.get(l.tag_id);
        if (t) {
          if (!result[l.post_id]) result[l.post_id] = [];
          result[l.post_id].push(t);
        }
      });
      return NextResponse.json(result);
    }

    // Listagem simples de tags
    let query = sb.from("blog_tags").select("id,name,slug").order("name", { ascending: true }).limit(500);
    const { data, error } = await query;
    if (error) throw error;
  const items = (data || []).filter((t: { name?:string|null; slug?:string|null }) => !q || t.name?.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q));
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// POST: upsert simples de uma lista de nomes de tags; retorna tags normalizadas.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { tags?: string[] };
    const incoming = (body?.tags || []).map((s) => String(s || "").trim()).filter(Boolean);
    if (!incoming.length) return NextResponse.json({ ok: true, tags: [] });

    const slugify = (v: string) =>
      v
        .toLowerCase()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const sb = supabaseAdmin();
    const payload = incoming.map((name) => ({ name, slug: slugify(name) }));
    // upsert por slug
    const { data, error } = await sb.from("blog_tags").upsert(payload, { onConflict: "slug" }).select("id,name,slug");
    if (error) throw error;
    return NextResponse.json({ ok: true, tags: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
