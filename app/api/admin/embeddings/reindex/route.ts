export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { chaveIA } from '@/lib/ai/require-key';


// Minimal reindex endpoint: re-embeds latest N published posts using OpenAI if available
export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  try{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if(!url||!key) return NextResponse.json({ ok:false, error:'Supabase env missing' },{ status:500 });
    const openaiKey = chaveIA();
    const supa = createClient(url, key, { auth:{ persistSession:false }});
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')||'50')||50));

    const { data: posts, error } = await supa.from('blog_posts').select('id,slug,title,excerpt,content_mdx,updated_at').eq('status','published').order('updated_at',{ ascending:false }).limit(limit);
    if(error) throw error;
    if(!posts || posts.length===0) return NextResponse.json({ ok:true, updated:0 });
    if (!openaiKey) {
      return NextResponse.json(
        { ok: false, error: 'OPENAI_API_KEY ausente; nenhum embedding foi alterado.' },
        { status: 503 }
      );
    }

    function toPlain(md: string){ return md.replace(/```[\s\S]*?```/g,' ').replace(/[#>*_`]/g,' ').replace(/\s+/g,' ').trim(); }

    // Embed
    const inputs = posts.map(p=> `${p.title}\n${p.excerpt||''}\n${p.content_mdx||''}` ).map(toPlain).map(t=> t.slice(0,8000));
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}` },
      body: JSON.stringify({ model:'text-embedding-3-small', input: inputs }),
    });
    if(!res.ok) throw new Error(`Embeddings API respondeu HTTP ${res.status}`);
    const j = await res.json();
    const vectors = Array.isArray(j.data)
      ? j.data
          .slice()
          .sort((a: { index?: number }, b: { index?: number }) => (a.index ?? 0) - (b.index ?? 0))
          .map((item: { embedding?: unknown }) => item.embedding)
      : [];
    if (
      vectors.length !== inputs.length ||
      vectors.some((vector: unknown) => !Array.isArray(vector) || vector.some((value) => typeof value !== 'number' || !Number.isFinite(value)))
    ) {
      throw new Error('Embeddings API retornou vetores incompletos ou inválidos');
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
