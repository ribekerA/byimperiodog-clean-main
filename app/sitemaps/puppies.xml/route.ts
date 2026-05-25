import { NextResponse } from 'next/server';

import { supabasePublic } from '@/lib/supabasePublic';
export const revalidate = 300;
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
export async function GET(){
  const sb = supabasePublic();
  const { data } = await sb.from('puppies').select('id,updated_at,created_at,status').in('status',['disponivel','reservado','vendido','available','reserved','sold']).limit(5000);
  const urls = (data||[]).map((p: any)=> ({ loc: `${site}/filhote/${p.id}`, lastmod: p.updated_at || p.created_at || new Date().toISOString(), changefreq: p.status==='disponivel' || p.status==='available' ? 'daily':'weekly', priority: p.status==='disponivel' || p.status==='available' ? '0.9':'0.6' }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u: any)=>`  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
  return new NextResponse(xml, { headers:{ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, stale-while-revalidate=600' }});
}
