export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { rateLimitRequestMemory, tooManyRequests } from '@/lib/rateLimitDurable';
import { RequestBodyError, readJsonWithLimit } from '@/lib/requestGuards';
import { supabasePublic } from '@/lib/supabasePublic';

export const runtime = 'edge';

const requestSchema = z.object({ slug: z.string().trim().min(1).max(200) }).strict();

function cacheJson(data:unknown, status=200){
  return NextResponse.json(data, { status, headers:{ 'Cache-Control':'s-maxage=120, stale-while-revalidate=300' } });
}

interface PostCandidate {
  id:string; slug:string; title:string|null; excerpt:string|null; cover_url:string|null; published_at:string|null;
  blog_post_categories?: { category_id:string }[];
  blog_authors?: { name:string|null; slug:string|null };
  _score?: number; _overlap?: number;
}

async function compute(slug:string){
  const sb = supabasePublic();
  const { data: base } = await sb.from('blog_posts').select('id,slug,(blog_post_categories(category_id))').eq('slug',slug).eq('status','published').maybeSingle();
  if(!base) return [];
  const baseCatIds = (base as any).blog_post_categories?.map((c:{category_id:string})=> c.category_id) || [];
  const { data: candidates } = await sb.from('blog_posts').select('id,slug,title,excerpt,cover_url,published_at,blog_authors(name,slug),(blog_post_categories(category_id))').eq('status','published').neq('slug', slug).limit(140);
  let scored: PostCandidate[] = (candidates||[] as any as PostCandidate[]).map((p:PostCandidate)=>{
    const catIds = p.blog_post_categories?.map(c=> c.category_id) || [];
    const overlap = catIds.filter((id)=> baseCatIds.includes(id)).length;
    const days = p.published_at? (Date.now()-new Date(p.published_at).getTime())/86400000 : 999;
    const recency = days<1? 30 : days<7? 20 : days<30? 10 : 0;
    const meta = (p.excerpt?5:0) + (p.title?5:0);
    const score = (overlap? overlap*25:0) + recency + meta;
    return { ...p, _score: score, _overlap: overlap };
  }).sort((a:PostCandidate,b:PostCandidate)=> (b._score || 0) - (a._score || 0));
  // Fallback se não há overlap (ex: sem categorias): usar posts mais recentes
  if(!scored.some((s)=> (s._overlap||0)>0)){
    scored = scored.sort((a,b)=> new Date(b.published_at||0).getTime() - new Date(a.published_at||0).getTime());
  }
  return scored.slice(0,8).map((p:PostCandidate)=> ({
    id:p.id, slug:p.slug, title:p.title, excerpt:p.excerpt, cover_url:p.cover_url, published_at:p.published_at,
    authorName: p.blog_authors?.name || null, authorSlug: p.blog_authors?.slug || null,
  }));
}

export async function POST(req:Request){
  const rate = rateLimitRequestMemory(req, { scope: 'ai-recommend', limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  try {
    const parsed = requestSchema.safeParse(await readJsonWithLimit(req, 4 * 1024));
    if(!parsed.success) return cacheJson({ ok:false, error:'slug required' },400);
    const { slug } = parsed.data;
    const related = await compute(slug);
    return cacheJson({ ok:true, related });
  } catch(e:any){
    if (e instanceof RequestBodyError) return cacheJson({ ok:false, error:e.code }, e.status);
    return cacheJson({ ok:false, error:e?.message||'erro' },500);
  }
}

export async function GET(req:Request){
  const rate = rateLimitRequestMemory(req, { scope: 'ai-recommend', limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  const { searchParams } = new URL(req.url);
  const parsed = requestSchema.safeParse({ slug: searchParams.get('slug') });
  if(!parsed.success) return cacheJson({ ok:false, error:'slug required' },400);
  const { slug } = parsed.data;
  try {
    const related = await compute(slug);
    return cacheJson({ ok:true, related });
  } catch(e:any){
    return cacheJson({ ok:false, error:e?.message||'erro' },500);
  }
}
