export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface ScheduleBody { post_id:string; run_at:string; action?:'publish'; overwrite?:boolean }

// POST /api/admin/blog/schedule  -> agenda publicação futura
// Body: { post_id, run_at (ISO), action?="publish", overwrite? } 
export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  let body: unknown = {};
  try { body = await req.json(); } catch { body = {}; }
  const { post_id, run_at, action='publish', overwrite=false } = (body as ScheduleBody);
  if(!post_id || !run_at) return NextResponse.json({ error:'post_id-and-run_at-required' }, { status:400 });
  const when = new Date(run_at);
  if(isNaN(when.getTime())) return NextResponse.json({ error:'invalid-run_at' }, { status:400 });
  const sb = supabaseAdmin();
  try {
    if(overwrite){
      await sb.from('blog_post_schedule_events').delete().eq('post_id', post_id).is('executed_at', null);
    }
    const { error } = await sb.from('blog_post_schedule_events').insert({ post_id, run_at: when.toISOString(), action, payload: { reason:'manual-schedule' } });
    if(error) return NextResponse.json({ error: error.message }, { status:500 });
    return NextResponse.json({ ok:true });
  } catch(e:unknown){
    const msg = e instanceof Error? e.message : 'error';
    return NextResponse.json({ error: msg }, { status:500 });
  }
}

// GET /api/admin/blog/schedule?post_id=... -> lista eventos futuros pendentes
export async function GET(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const postId = url.searchParams.get('post_id');
  const sb = supabaseAdmin();
  const q = sb.from('blog_post_schedule_events').select('id,post_id,run_at,action,executed_at,created_at').is('executed_at', null).order('run_at',{ ascending:true });
  const { data, error } = postId ? await q.eq('post_id', postId) : await q;
  if(error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ events: data||[] });
}
