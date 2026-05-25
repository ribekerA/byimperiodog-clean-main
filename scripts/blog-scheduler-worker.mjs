#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !key){
  console.error('[scheduler] Missing SUPABASE env');
  process.exit(1);
}
const sb = createClient(url, key, { auth:{ persistSession:false } });

async function fetchDue(){
  const nowIso = new Date().toISOString();
  const { data, error } = await sb.from('blog_post_schedule_events')
    .select('id,post_id,action,run_at')
    .is('executed_at', null)
    .lte('run_at', nowIso)
    .order('run_at',{ ascending:true })
    .limit(10);
  if(error) throw error; return data||[];
}

async function processOne(ev){
  if(ev.action === 'publish'){
    const { data: postRow } = await sb.from('blog_posts').select('id,status,slug').eq('id', ev.post_id).maybeSingle();
    if(postRow && postRow.status !== 'published'){
      await sb.from('blog_posts').update({ status:'published', published_at: new Date().toISOString(), scheduled_at: null }).eq('id', ev.post_id);
      console.log('[scheduler] Published post', ev.post_id);
    } else {
      console.log('[scheduler] Skip publish (already published)', ev.post_id);
    }
  } else {
    console.log('[scheduler] Unknown action', ev.action);
  }
  await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
}

async function runOnce(){
  const due = await fetchDue();
  if(!due.length){
    console.log('[scheduler] No due events');
    return;
  }
  for(const ev of due){
    try { await processOne(ev); } catch(e){ console.error('[scheduler] Error processing', ev.id, e); }
  }
}

async function main(){
  const loop = process.argv.includes('--loop');
  if(loop){
    console.log('[scheduler] Loop mode');
    // eslint-disable-next-line no-constant-condition
    while(true){
      await runOnce();
      await new Promise(r=> setTimeout(r, 5000));
    }
  } else {
    await runOnce();
  }
}

main();
