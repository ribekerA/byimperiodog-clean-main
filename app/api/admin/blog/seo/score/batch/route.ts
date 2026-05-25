export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

const ENTIDADES = ['spitz','pomerânia','filhote','adulto','treinamento','socialização','alimentação','saúde','grooming','vacina'];

function compute(mdx:string, meta:{seo_title?:string|null;seo_description?:string|null;excerpt?:string|null}){
  const words = (mdx.match(/\b\w+\b/g)||[]).length;
  const headings = mdx.match(/^##\s.+$/gm)||[];
  const images = (mdx.match(/!\[[^\]]*\]\([^)]*\)/g)||[]);
  const altWithText = images.filter((i:string)=> /!\[[^\]]+\]/.test(i)).length;
  const densidadeEntidades = ENTIDADES.reduce((acc,e)=>{ const r=new RegExp(`\\b${e}\\b`,'gi'); const c=(mdx.match(r)||[]).length; acc[e]=c; return acc; },{} as Record<string,number>);
  const totalEntidades = Object.values(densidadeEntidades).reduce((a,b)=>a+b,0);
  let score = 0;
  if(words>=800) score+=20; if(words>=1200) score+=5; if(words>=1800) score+=5;
  if(headings.length>=8) score+=15; if(headings.length>=12) score+=5;
  if(images.length>=2) score+=10; if(images.length>=4) score+=5;
  if(altWithText>=images.length) score+=10; else if(altWithText>=Math.max(1,Math.round(images.length*0.7))) score+=5;
  if(totalEntidades>=10) score+=15; if(totalEntidades>=20) score+=5;
  if(meta.seo_title) score+=5; if(meta.seo_description) score+=5; if(meta.excerpt) score+=5;
  const coverageAlt = images.length? Math.round((altWithText/images.length)*100):100;
  return { score, coverageAlt, words, headings: headings.length, images: images.length };
}

type BlogPostRow = { id: string; content_mdx: string | null; seo_title?: string | null; seo_description?: string | null; excerpt?: string | null };

export async function POST(req:Request){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const body = await req.json() as { ids?: string[] };
    const ids:string[] = body?.ids||[];
    if(!Array.isArray(ids) || !ids.length) return NextResponse.json({ ok:false, error:'ids vazio' },{ status:400 });
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('blog_posts').select('id,content_mdx,seo_title,seo_description,excerpt').in('id', ids).limit(100);
    if(error) throw error;
    const rows = (data||[]) as BlogPostRow[];
    const results = rows.map((p)=> ({ id:p.id, ...compute(p.content_mdx||'', {seo_title:p.seo_title,seo_description:p.seo_description,excerpt:p.excerpt}) }));
    return NextResponse.json({ ok:true, items: results });
  } catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message||'erro' },{ status:500 });
  }
}
