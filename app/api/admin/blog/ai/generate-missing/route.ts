import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { computeCoverage, TOPIC_CLUSTERS } from '@/lib/topicClusters';
import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';
import { logAdminAction } from '@/lib/adminAuth';

/* Batch gera posts para clusters faltantes (limite opcional ?limit=5)
   Estratégia simples sequencial (pode ser otimizada com fila/background)
*/
export async function POST(req: Request){
  const auth = requireAdmin(req); if(auth) return auth;
  const ip = (req as any).ip || '0.0.0.0';
  const rl = rateLimit('gen-missing:'+ip, 3, 60_000); // 3/min
  if(!rl.allowed) return NextResponse.json({ ok:false, error:'rate-limit', retry_at: rl.reset }, { status:429 });
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit')||'0',10)||0; // 0 = tudo
  const sb = supabaseAdmin();
  try {
    const { data: posts, error } = await sb.from('blog_posts').select('id, slug, title, status');
    if(error) throw error;
    const coverage = computeCoverage(posts||[]);
    let targets = coverage.missing; // array de titles
    if(limit>0) targets = targets.slice(0, limit);
    const results: any[] = [];
    for (const title of targets){
      // cria sessão
      let sessionId: string | null = null;
      try { const { data: s } = await sb.from('ai_generation_sessions').insert([{ topic: title, phase:'outline', progress:5 }]).select('id').single(); sessionId = s?.id||null; } catch {}
      // chama internamente geração (sincrono)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/admin/blog/ai/generate-post`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ topic:title, scope:'guia-completo', status:'draft', generateImage:false }) });
        const j = await res.json();
        if(res.ok && j?.ok){ results.push({ title, ok:true, post_id: j.post_id, session_id: j.session_id || sessionId }); }
        else { results.push({ title, ok:false, error: j?.error || 'erro' }); if(sessionId) await sb.from('ai_generation_sessions').update({ status:'error', error_message: j?.error||'erro'}).eq('id', sessionId); }
      } catch(e:any){ results.push({ title, ok:false, error: e.message }); if(sessionId) await sb.from('ai_generation_sessions').update({ status:'error', error_message: e.message}).eq('id', sessionId); }
    }
    return NextResponse.json({ ok:true, results, total_requested: targets.length });
  } catch(e:any){
    logAdminAction({ route:'/api/admin/blog/ai/generate-missing', method:'POST', action:'generate_missing_error', payload:{ error: e.message } });
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

export const dynamic = 'force-dynamic';
