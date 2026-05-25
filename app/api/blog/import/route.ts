export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ImportBody = {
  title: string;
  slug: string;
  excerpt?: string;
  content_mdx?: string;
  cover_url?: string;
  cover_alt?: string;
  tags?: string[];
  category?: string;
  publish?: boolean;
  published_at?: string; // ISO date
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("x-admin-token") || "";
    const required = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN || "";
    if (!required || token !== required) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as ImportBody;
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: "Campos obrigatórios: title, slug" }, { status: 400 });
    }

    const supabase = getSupabase();
    // Evitar slugs duplicados
    const { data: existing } = await supabase.from("blog_posts").select("id,slug").eq("slug", body.slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Slug já existente" }, { status: 409 });
    }

    const payload = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || null,
      content_mdx: body.content_mdx || null,
      cover_url: body.cover_url || null,
      cover_alt: body.cover_alt || null,
      tags: body.tags || null,
      category: body.category || null,
      status: body.publish ? "published" : "draft",
      published_at: body.publish ? body.published_at || new Date().toISOString() : null,
    };

    const { data, error } = await supabase.from("blog_posts").insert(payload).select().single();
    if (error) throw error;

    console.log("blog_post_imported", { id: data.id, slug: data.slug, status: data.status });
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug, status: data.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro" }, { status: 500 });
  }
}
