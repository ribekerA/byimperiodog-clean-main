export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { batchEnsureEmbeddings } from "@/lib/embeddings.store.blog";
import { internalGuard } from "@/lib/internalAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

// Gera embeddings para posts que não têm registro mdx em blog_post_embeddings
export async function POST(req: Request){
  if(!internalGuard(req)) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  const sb = supabaseAdmin();
  // Query posts published recentes
  const { data: posts } = await sb.from('blog_posts')
    .select('id,title,content_mdx,status')
    .eq('status','published')
    .order('published_at', { ascending:false })
    .limit(60);
  if(!posts) return NextResponse.json({ ok:false, error:'sem posts'}, { status:500 });
  // Filtra posts sem embedding (left join not trivial via rest; simplifica e tenta sempre)
  const result = await batchEnsureEmbeddings(posts, 40);
  return NextResponse.json({ ok:true, processed: result.length, result });
}
