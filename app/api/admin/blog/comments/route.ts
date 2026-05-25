export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("blog_comments")
      .select("id,post_id,author_name,author_email,body,approved,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, approved } = body as { id?: string; approved?: boolean };
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
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
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const sb = supabaseAdmin();
    const { data: comment } = await sb.from("blog_comments").select("post_id").eq("id", id).maybeSingle();
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
