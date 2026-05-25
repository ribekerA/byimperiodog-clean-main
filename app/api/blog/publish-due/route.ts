export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export async function POST() {
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
    revalidatePath("/blog");
    for (const d of due) revalidatePath(`/blog/${d.slug}`);
  } catch {}

  return NextResponse.json({ updated: due.length });
}
