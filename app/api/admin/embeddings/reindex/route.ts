export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

// Minimal reindex endpoint: re-embeds latest N published posts using OpenAI if available
export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  try{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if(!url||!key) return NextResponse.json({ ok:false, error:'Supabase env missing' },{ status:500 });
    const openaiKey = process.env.OPENAI_API_KEY;
    const supa = createClient(url, key, { auth:{ persistSession:false }});
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')||'50')||50));

    const { data: posts, error } = await supa.from('blog_posts').select('id,slug,title,excerpt,content_mdx,updated_at').eq('status','published').order('updated_at',{ ascending:false }).limit(limit);
    if(error) throw error;
    if(!posts || posts.length===0) return NextResponse.json({ ok:true, updated:0 });

    function toPlain(md: string){ return md.replace(/```[\s\S]*?```/g,' ').replace(/[#>*_`]/g,' ').replace(/\s+/g,' ').trim(); }

    // Embed
    const inputs = posts.map(p=> `${p.title}\n${p.excerpt||''}\n${p.content_mdx||''}` ).map(toPlain).map(t=> t.slice(0,8000));
    let vectors: number[][] = [];
    if(openaiKey){
      const res = await fetch('https://api.openai.com/v1/embeddings', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}` }, body: JSON.stringify({ model:'text-embedding-3-small', input: inputs }) });
      if(!res.ok){ const tx = await res.text(); throw new Error('Embeddings API: '+tx); }
      const j = await res.json(); vectors = j.data.map((d:any)=> d.embedding as number[]);
    } else {
      // fallback
      vectors = inputs.map(fakeVector);
    }

    const payload = posts.map((p, i)=> ({ post_id: p.id, source:'db', embedding: vectors[i] }));
    const { error: upErr } = await supa.from('blog_post_embeddings').upsert(payload, { onConflict:'post_id,source' });
    if(upErr) throw upErr;

    await logAdminAction({ route:'/api/admin/embeddings/reindex', method:'POST', action:'reindex', payload:{ count: posts.length } });
    return NextResponse.json({ ok:true, updated: posts.length });
  }catch(e:any){
    await logAdminAction({ route:'/api/admin/embeddings/reindex', method:'POST', action:'reindex_error', payload:{ error: e?.message } });
    return NextResponse.json({ ok:false, error: e?.message||String(e) },{ status:500 });
  }
}

function fakeVector(s: string): number[]{
  const arr = new Array(10).fill(0);
  let h=0; for(const ch of s){ h=(h*31 + ch.charCodeAt(0))>>>0; }
  for(let i=0;i<arr.length;i++){ arr[i] = ( (h >> (i*3)) & 255 ) / 255; }
  return arr;
}
