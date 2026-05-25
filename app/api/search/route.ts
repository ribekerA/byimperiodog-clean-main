import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { supabaseAnon } from "@/lib/supabaseAnon";

export const revalidate = 0;

// GET /api/search?q=termo&limit=10&offset=0&tag=slugTag
// Implementação híbrida: fallback ILIKE + filtro por tag.
export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const rawQ = (url.searchParams.get('q')||'').trim();
  if(!rawQ || rawQ.length < 2){
    return NextResponse.json({ results:[], count:0, q:'', took_ms:0 }, { headers:{ 'Cache-Control':'no-store' } });
  }
  const started = Date.now();
  const tag = (url.searchParams.get('tag')||'').trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')||'10'),1),50);
  const offset = Math.max(Number(url.searchParams.get('offset')||'0'),0);
  const q = rawQ.replace(/\s+/g,' ');
  const sb = supabaseAnon();
  const pattern = `%${q.replace(/%/g,'') }%`;
  let base = sb.from('blog_posts')
    .select('id,slug,title,excerpt,cover_url,published_at')
  .eq('status','published')
  // Supabase aceita string expression no or()
  .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);

  if(tag){
    const { data: tagsRows } = await sb.from('blog_tags').select('id,slug').eq('slug', tag).limit(1);
    const tagId = tagsRows?.[0]?.id;
    if(!tagId){
      return NextResponse.json({ results:[], count:0, q, took_ms: Date.now()-started }, { headers:{ 'Cache-Control':'no-store' } });
    }
    const { data: tagPosts } = await sb.from('blog_post_tags').select('post_id,tag_id').eq('tag_id', tagId).limit(5000);
  const allowed = ((tagPosts||[]) as { post_id:string; tag_id:string }[]).map((tp: { post_id:string; tag_id:string })=> tp.post_id);
    if(!allowed.length){
      return NextResponse.json({ results:[], count:0, q, took_ms: Date.now()-started }, { headers:{ 'Cache-Control':'no-store' } });
    }
    base = base.in('id', allowed);
  }
  const { data, error } = await base.order('published_at',{ ascending:false }).range(offset, offset+limit-1);
  if(error){
    return NextResponse.json({ error: error.message }, { status:500 });
  }
  interface Row { slug:string; title:string; excerpt?:string|null; cover_url?:string|null; published_at?:string|null }
  const results = ((data||[]) as Row[]).map((r: Row) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt || null,
    cover_url: r.cover_url || null,
    published_at: r.published_at || null
  }));
  return NextResponse.json({ results, count: results.length, q, took_ms: Date.now()-started }, { headers:{ 'Cache-Control':'no-store' } });
}
