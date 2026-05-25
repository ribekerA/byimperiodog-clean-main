export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ENTIDADES = ['spitz','pomerânia','filhote','adulto','treinamento','socialização','alimentação','saúde','grooming','vacina'];

export async function GET(req:Request){
  const auth = requireAdmin(req as any); if(auth) return auth;
  const url = new URL(req.url); const id = url.searchParams.get('id');
  if(!id) return NextResponse.json({ ok:false, error:'id obrigatório' },{ status:400 });
  try {
    const sb = supabaseAdmin();
    const { data: post, error } = await sb.from('blog_posts').select('id,title,excerpt,content_mdx,seo_title,seo_description,cover_url').eq('id', id).maybeSingle();
    if(error) throw error;
    if(!post) return NextResponse.json({ ok:false, error:'not found' },{ status:404 });
    const mdx = post.content_mdx||'';
    const words = (mdx.match(/\b\w+\b/g)||[]).length;
    const headings = mdx.match(/^##\s.+$/gm)||[];
    const images = (mdx.match(/!\[[^\]]*\]\([^)]*\)/g)||[]);
  const altWithText = images.filter((i: string)=> /!\[[^\]]+\]/.test(i)).length;
    const densidadeEntidades = ENTIDADES.reduce((acc,e)=>{ const r=new RegExp(`\\b${e}\\b`,'gi'); const c=(mdx.match(r)||[]).length; acc[e]=c; return acc; },{} as Record<string,number>);
    const totalEntidades = Object.values(densidadeEntidades).reduce((a,b)=>a+b,0);
    // Score heurístico
    let score = 0;
    if(words>=800) score+=20; if(words>=1200) score+=5; if(words>=1800) score+=5;
    if(headings.length>=8) score+=15; if(headings.length>=12) score+=5;
    if(images.length>=2) score+=10; if(images.length>=4) score+=5;
    if(altWithText>=images.length) score+=10; else if(altWithText>=Math.max(1,Math.round(images.length*0.7))) score+=5;
    if(totalEntidades>=10) score+=15; if(totalEntidades>=20) score+=5;
    if(post.seo_title) score+=5; if(post.seo_description) score+=5; if(post.excerpt) score+=5;
    const coverageAlt = images.length? Math.round((altWithText/images.length)*100):100;
    return NextResponse.json({ ok:true, score, coverageAlt, words, headings: headings.length, images: images.length, entidades: densidadeEntidades });
  } catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message||'erro' },{ status:500 });
  }
}
