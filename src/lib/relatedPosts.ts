import { supabasePublic } from '@/lib/supabasePublic';

export type RelatedPost = { id:string; slug:string; title:string; excerpt:string|null; published_at:string|null; authorName?:string; authorSlug?:string };

/**
 * Recupera posts relacionados combinando: categorias compartilhadas, tags (quando armazenadas via join), recência.
 * Estratégia: consulta supabase para categorias e autor do post base, depois busca candidatos e rankeia.
 */
export function scoreRelatedPost(baseCategories: string[], candidate: any){
  const pCats = (candidate.blog_post_categories||[]).map((c:any)=> c.blog_categories?.slug).filter(Boolean) as string[];
  const sharedCats = pCats.filter(x=> baseCategories.includes(x)).length;
  const days = candidate.published_at ? (Date.now() - new Date(candidate.published_at).getTime()) / 86400000 : 999;
  const recencyScore = days < 1 ? 1.0 : days < 7 ? 0.8 : days < 30 ? 0.5 : 0.25;
  return sharedCats * 2 + recencyScore;
}

export async function getRelatedPosts(slug: string, limit = 8): Promise<RelatedPost[]> {
  const sb = supabasePublic();
  // Buscar base (incluindo categorias e autor)
  const { data: base } = await sb.from('blog_posts')
    .select('id,slug,title,excerpt,published_at, blog_authors(name,slug), blog_post_categories(category_id,blog_categories(name,slug))')
    .eq('slug', slug).eq('status','published').maybeSingle();
  if(!base) return [];
  const catSlugs = (base.blog_post_categories||[]).map((c:any)=> c.blog_categories?.slug).filter(Boolean) as string[];

  // Buscar candidatos recentes (limite amplo)
  const { data: candidates } = await sb.from('blog_posts')
    .select('id,slug,title,excerpt,published_at, blog_authors(name,slug), blog_post_categories(category_id,blog_categories(slug))')
    .eq('status','published')
    .neq('slug', slug)
    .order('published_at', { ascending:false })
    .limit(120);

  const scored = (candidates||[]).map((p:any)=> ({ post: p, score: scoreRelatedPost(catSlugs, p) })).filter((x: { score:number })=> x.score > 0.3);

  scored.sort((a: { score:number }, b: { score:number })=> b.score - a.score);
  return scored.slice(0, limit).map((s: any)=> ({
    id: s.post.id,
    slug: s.post.slug,
    title: s.post.title,
    excerpt: s.post.excerpt,
    published_at: s.post.published_at,
    authorName: s.post.blog_authors?.name,
    authorSlug: s.post.blog_authors?.slug
  }));
}
