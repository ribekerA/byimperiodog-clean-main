export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Publica em lote posts em rascunho/review (opcional: limitar quantidade)
export async function POST(req: Request) {
  try {
    const { limit = 20, ids }: { limit?: number; ids?: string[] } = await req.json().catch(()=>({}));
    const sb = supabaseAdmin();

    if (ids && ids.length) {
      const { data, error } = await sb
        .from('blog_posts')
        .update({ status: 'published', published_at: new Date().toISOString(), scheduled_at: null })
        .in('id', ids)
        .select('slug');
      if (error) throw error;
      try {
        revalidatePath('/blog');
        for (const p of data || []) revalidatePath(`/blog/${p.slug}`);
      } catch {}
      return NextResponse.json({ ok: true, updated: data?.length || 0 });
    }

    const { data, error } = await sb
      .from('blog_posts')
      .select('id,slug')
      .in('status', ['draft','review','scheduled'])
      .order('created_at', { ascending: true })
      .limit(Math.min(100, limit));
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ ok: true, updated: 0 });
  const idsToPub = data.map((p:{id:string})=>p.id);
    const { error: upErr } = await sb
      .from('blog_posts')
      .update({ status: 'published', published_at: new Date().toISOString(), scheduled_at: null })
      .in('id', idsToPub);
    if (upErr) throw upErr;
    try {
      revalidatePath('/blog');
      for (const p of data) revalidatePath(`/blog/${p.slug}`);
    } catch {}
    return NextResponse.json({ ok: true, updated: data.length });
  } catch (err:any) {
    return NextResponse.json({ ok:false, error: err?.message || String(err) }, { status: 500 });
  }
}
