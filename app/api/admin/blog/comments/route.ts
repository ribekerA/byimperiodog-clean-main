export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = requireAdminApi(req);
  if (auth) return auth;

  try {
    const sb = supabaseAdmin();
    const requestedLimit = Number(new URL(req.url).searchParams.get("limit"));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 200)
      : 50;
    const { data, error } = await sb
      .from("blog_comments")
      .select("id,post_id,author_name,author_email,body,approved,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = requireAdminApi(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { id, approved } = body as { id?: string; approved?: boolean };
    if (!id || typeof approved !== "boolean") {
      return NextResponse.json({ error: "id e approved booleano são obrigatórios" }, { status: 400 });
    }
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("blog_comments")
      .update({ approved })
      .eq("id", id)
      .select("id,post_id,approved")
      .maybeSingle();
    if (error) throw error;
    try {
      revalidatePath("/blog");
      if (data?.post_id) {
        const { data: post } = await sb.from("blog_posts").select("slug").eq("id", data.post_id).maybeSingle();
        if (post?.slug) revalidatePath(`/blog/${post.slug}`);
      }
    } catch {}
    if (!data) return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdminApi(req);
  if (auth) return auth;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const sb = supabaseAdmin();
    const { data: comment, error: commentError } = await sb.from("blog_comments").select("post_id").eq("id", id).maybeSingle();
    if (commentError) throw commentError;
    if (!comment) return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    const { error } = await sb.from("blog_comments").delete().eq("id", id);
    if (error) throw error;
    try {
      revalidatePath("/blog");
      if (comment?.post_id) {
        const { data: post } = await sb.from("blog_posts").select("slug").eq("id", comment.post_id).maybeSingle();
        if (post?.slug) revalidatePath(`/blog/${post.slug}`);
      }
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
