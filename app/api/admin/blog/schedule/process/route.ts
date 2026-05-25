export const dynamic = "force-dynamic";
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/admin/blog/schedule/process  -> executa eventos vencidos (uso manual / cron externo)
export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const sb = supabaseAdmin();
  const nowIso = new Date().toISOString();
  const { data: events, error } = await sb.from('blog_post_schedule_events')
    .select('id,post_id,action,run_at')
    .is('executed_at', null)
    .lte('run_at', nowIso)
    .order('run_at',{ ascending:true });
  if(error) return NextResponse.json({ error: error.message }, { status:500 });
  interface ProcResult { event_id:string|number; action:string; status:string }
  const results: ProcResult[] = [];
  for(const ev of events||[]){
    if(ev.action === 'publish'){
      const { data: postRow } = await sb.from('blog_posts').select('id,status,slug').eq('id', ev.post_id).maybeSingle();
      if(postRow && postRow.status !== 'published'){
        await sb.from('blog_posts').update({ status:'published', published_at: new Date().toISOString(), scheduled_at: null }).eq('id', ev.post_id);
  try { revalidatePath('/blog'); if(postRow.slug) revalidatePath(`/blog/${postRow.slug}`); } catch (e) { /* noop */ }
        results.push({ event_id: ev.id, action:'publish', status:'executed' });
      } else {
        results.push({ event_id: ev.id, action:'publish', status:'skipped-already-published' });
      }
    } else {
      results.push({ event_id: ev.id, action: ev.action, status:'skipped-unknown-action' });
    }
    await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
  }
  return NextResponse.json({ processed: results.length, results });
}
