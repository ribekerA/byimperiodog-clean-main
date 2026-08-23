import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/admin/blog/ai/session?id=... | ?active=1 | lista
export async function GET(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const sb = supabaseAdmin();
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const activeOnly = url.searchParams.get('active');
  if(id){
    const { data, error } = await sb.from('ai_generation_sessions').select('*').eq('id', id).maybeSingle();
    if(error) return NextResponse.json({ ok:false, error: error.message }, { status:500 });
    if(!data) return NextResponse.json({ ok:false, error:'not-found' }, { status:404 });
    return NextResponse.json({ ok:true, session: data });
  }
  let query = sb.from('ai_generation_sessions').select('*').order('created_at',{ ascending: false }).limit(50);
  if(activeOnly) query = query.neq('status','completed').neq('status','error');
  const { data, error } = await query;
  if(error) return NextResponse.json({ ok:false, error: error.message }, { status:500 });
  return NextResponse.json({ ok:true, items: data });
}

// POST cria ou atualiza sessão
// body: { id?, topic?, phase?, progress?, status?, error_message?, post_id? }
export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const ip = (req as any).ip || '0.0.0.0';
  const rl = rateLimit('session:'+ip, 20, 60_000);
  if(!rl.allowed) return NextResponse.json({ ok:false, error:'rate-limit' }, { status:429 });
  try {
    const body = await req.json();
    const sb = supabaseAdmin();
    if(body.id){
      const update: Record<string, any> = {};
      for (const k of ['topic','phase','progress','status','error_message','post_id']) if(body[k] !== undefined) update[k]=body[k];
      if(Object.keys(update).length===0) return NextResponse.json({ ok:false, error:'Nada para atualizar' }, { status:400 });
      const { data, error } = await sb.from('ai_generation_sessions').update(update).eq('id', body.id).select('*').maybeSingle();
      if(error) return NextResponse.json({ ok:false, error: error.message }, { status:500 });
      logAdminAction({ route:'/api/admin/blog/ai/session', method:'POST', action:'session_update', payload:{ id: body.id } });
      return NextResponse.json({ ok:true, session: data });
    }
    if(!body.topic) return NextResponse.json({ ok:false, error:'topic obrigatório' }, { status:400 });
    const insert = { topic: body.topic, phase: body.phase||'outline', progress: body.progress||0, status: body.status||'active', post_id: body.post_id||null };
    const { data, error } = await sb.from('ai_generation_sessions').insert([insert]).select('*').single();
    if(error) return NextResponse.json({ ok:false, error: error.message }, { status:500 });
    logAdminAction({ route:'/api/admin/blog/ai/session', method:'POST', action:'session_create', payload:{ topic: body.topic } });
    return NextResponse.json({ ok:true, session: data });
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

export const dynamic = 'force-dynamic';