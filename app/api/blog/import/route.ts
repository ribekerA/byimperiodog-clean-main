export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { erroPublico } from "@/lib/apiErro";
import { createLogger } from "@/lib/logger";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:blog:import");

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

export async function POST(req: Request) {
  try {
    const guard = requireAdminApi(req, { permission: "blog:write" });
    if (guard) return guard;
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > 1024 * 1024) {
      return NextResponse.json({ error: "Payload grande demais" }, { status: 413 });
    }
    if (!hasServiceRoleKey()) return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });

    const body = (await req.json()) as ImportBody;
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: "Campos obrigatórios: title, slug" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
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

    logger.info("blog_post_imported", { id: data.id, slug: data.slug, status: data.status });
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug, status: data.status });
  } catch (err: any) {
    return erroPublico("api/blog/import", err);
  }
}
