import { NextResponse } from 'next/server';

import { isPublishableSupabasePost } from '@/lib/blog/publishable';
import { generatedPosts } from '@/lib/_generated-posts';
import { supabasePublic } from '@/lib/supabasePublic';

export const revalidate = 300;

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://byimperiodog.com.br').replace(/\/$/, '');

type Entry = { loc: string; lastmod: string; changefreq: string; priority: string; img?: string };

function entryFor(slug: string, published: string, updated?: string | null, img?: string | null): Entry {
  const lastmod = updated || published || new Date().toISOString();
  const ageDays = (Date.now() - Date.parse(published || lastmod)) / 86400000;
  return {
    loc: `${site}/blog/${slug}`,
    lastmod,
    changefreq: ageDays < 7 ? 'daily' : 'weekly',
    priority: ageDays < 7 ? '0.8' : '0.7',
    img: img || undefined,
  };
}

export async function GET() {
  // /blog/[slug] serve o MDX de content/posts e recorre ao Supabase para os
  // slugs que só existem no banco. Este sitemap só consultava o Supabase, então
  // os posts que só existem em MDX nunca eram declarados. As duas fontes entram
  // agora, na mesma precedência da rota: o arquivo manda onde existe arquivo, e
  // o Supabase entra apenas quando o post passa em isPublishableSupabasePost —
  // sem esse filtro o sitemap declarava 6 URLs que respondiam 404.
  const bySlug = new Map<string, Entry>();

  for (const p of generatedPosts) {
    bySlug.set(p.slug, entryFor(p.slug, p.date, p.updated, p.cover));
  }

  try {
    const sb = supabasePublic();
    const { data } = await sb
      .from('blog_posts')
      .select('slug,updated_at,published_at,status,cover_url,content_mdx')
      .eq('status', 'published')
      .limit(5000);

    for (const p of (data || []) as any[]) {
      if (bySlug.has(p.slug)) continue; // já coberto pelo MDX, que é quem a rota serve
      if (!isPublishableSupabasePost(p)) continue;
      bySlug.set(p.slug, entryFor(p.slug, p.published_at, p.updated_at, p.cover_url));
    }
  } catch {
    // Supabase indisponível — os posts MDX já garantem a cobertura.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[...bySlug.values()]
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${
          u.img ? `<image:image><image:loc>${u.img.startsWith('http') ? u.img : site + u.img}</image:loc></image:image>` : ''
        }</url>`
    )
    .join('\n')}\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
