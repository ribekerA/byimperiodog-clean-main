import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';

// Executa eventos vencidos (publish) até um limite (default 20)
export async function POST(req: Request){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit')||'20',10);
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  try {
    const { data: events, error } = await sb.from('blog_post_schedule_events')
      .select('*')
      .is('executed_at', null)
      .lte('run_at', now)
      .order('run_at', { ascending:true })
      .limit(limit);
    if(error) throw error;
    const results: any[] = [];
    for (const ev of events||[]){
      if(ev.action === 'publish' && ev.post_id){
        const { error: upErr, data: upData } = await sb.from('blog_posts').update({ status:'published', published_at: new Date().toISOString(), scheduled_at: null }).eq('id', ev.post_id).select('slug').maybeSingle();
        if(upErr){
          results.push({ id: ev.id, ok:false, error: upErr.message });
          await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString(), payload: { error: upErr.message } }).eq('id', ev.id);
        } else {
          results.push({ id: ev.id, ok:true, action:'publish', post_id: ev.post_id });
          try { revalidatePath('/blog'); if(upData?.slug) revalidatePath(`/blog/${upData.slug}`); } catch {}
          await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
        }
      } else {
        // unsupported action
        results.push({ id: ev.id, ok:false, error:'unsupported action' });
        await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString(), payload: { error: 'unsupported action'} }).eq('id', ev.id);
      }
    }
    return NextResponse.json({ ok:true, processed: results.length, results });
  } catch(e:any){
    logAdminAction({ route:'/api/admin/blog/schedule/run-due', method:'POST', action:'run_due_error', payload:{ error: e.message } });
     return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

export const dynamic = 'force-dynamic';
