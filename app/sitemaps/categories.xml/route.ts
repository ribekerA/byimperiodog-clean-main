import { NextResponse } from 'next/server';

import { supabasePublic } from '@/lib/supabasePublic';
export const revalidate = 600;
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
export async function GET(){
  const sb = supabasePublic();
  const { data } = await sb.from('blog_categories').select('slug,updated_at,created_at').limit(2000);
  const urls = (data||[]).map((c: any)=> ({ loc: `${site}/categorias/${c.slug}`, lastmod: c.updated_at || c.created_at || new Date().toISOString(), changefreq:'weekly', priority:'0.5' }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u: any)=>`  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
  return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=600, stale-while-revalidate=900' }});
}
