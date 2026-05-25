// Blog gamification utilities. No new env vars.
import { supabaseAdmin } from './supabaseAdmin';
import { supabasePublic } from './supabasePublic';

export type GamUser = { id:string; xp:number; level:number; streak_days:number; last_event_at?:string|null };

export async function getOrCreateGamUser(anonId: string){
  const sb = supabaseAdmin();
  const { data } = await sb.from('blog_gam_users').select('id,xp,level,streak_days,last_event_at').eq('anon_id', anonId).maybeSingle();
  if(data) return data as GamUser;
  const { data: inserted, error } = await sb.from('blog_gam_users').insert({ anon_id: anonId }).select('id,xp,level,streak_days,last_event_at').maybeSingle();
  if(error) throw error;
  return inserted as GamUser;
}

export async function awardXp(gamUserId: string, type: string, baseXp=10, meta: any = {}){
  const sb = supabaseAdmin();
  // naive rate limit: last 30s same type
  const since = new Date(Date.now()-30_000).toISOString();
  const { data: recent } = await sb.from('blog_gam_events').select('id').eq('gam_user_id', gamUserId).eq('type', type).gte('created_at', since).limit(1);
  if(recent?.length) return { skipped:true };
  const { data: user } = await sb.from('blog_gam_users').select('id,xp,level,streak_days,last_event_at').eq('id', gamUserId).maybeSingle();
  if(!user) return { error:'user_not_found' };
  let streak = user.streak_days||0;
  if(user.last_event_at){
    const last = new Date(user.last_event_at).getTime();
    const diff = Date.now()-last;
    if(diff > 1000*60*60*48) streak = 1; // reset if >48h
    else if(diff > 1000*60*60*20) streak += 1; // +1 se passou de 20h (janela de day rollover simplificada)
  } else streak = 1;
  const newXp = user.xp + baseXp;
  const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
  await sb.from('blog_gam_users').update({ xp:newXp, level:newLevel, streak_days:streak, last_event_at: new Date().toISOString() }).eq('id', gamUserId);
  await sb.from('blog_gam_events').insert({ gam_user_id: gamUserId, type, xp_awarded: baseXp, meta });
  return { xp:newXp, level:newLevel, streak_days: streak };
}

export async function listRecentGamEvents(gamUserId: string, limit=20){
  const sb = supabaseAdmin();
  const { data } = await sb.from('blog_gam_events').select('type,xp_awarded,created_at').eq('gam_user_id', gamUserId).order('created_at',{ ascending:false }).limit(limit);
  return data||[];
}

// --- Badges ---
export type GamBadge = { id:string; code:string; name:string; description?:string|null };

const DEFAULT_BADGES: { code:string; name:string; description:string }[] = [
  { code:'first_qa', name:'Primeira Pergunta', description:'Fez sua primeira pergunta no QA.' },
  { code:'first_share', name:'Primeiro Compartilhamento', description:'Compartilhou um artigo.' },
  { code:'streak_3', name:'Streak 3 dias', description:'Manteve atividade por 3 dias.' },
  { code:'streak_7', name:'Streak 7 dias', description:'Manteve atividade por 7 dias.' },
];

export async function ensureBadges(){
  const sb = supabaseAdmin();
  const { data } = await sb.from('blog_gam_badges').select('code');
  const existing = new Set<string>((data||[]).map((b: any)=> b.code as string));
  for(const b of DEFAULT_BADGES){
    if(!existing.has(b.code)){
      await sb.from('blog_gam_badges').insert(b).select('id');
    }
  }
}

export async function awardBadgeIfNeeded(gamUserId: string, code: string){
  const sb = supabaseAdmin();
  // check if already has
  const { data: badges } = await sb.from('blog_gam_badges').select('id,code').eq('code', code).limit(1);
  if(!badges?.length) return { skipped:true, reason:'badge_missing' };
  const badge = badges[0];
  const { data: has } = await sb.from('blog_gam_user_badges').select('badge_id').eq('gam_user_id', gamUserId).eq('badge_id', badge.id).limit(1);
  if(has?.length) return { skipped:true, reason:'already_awarded' };
  await sb.from('blog_gam_user_badges').insert({ gam_user_id: gamUserId, badge_id: badge.id });
  return { awarded:true, code };
}

export async function evaluateAndAwardBadges(gamUserId: string){
  const sb = supabaseAdmin();
  const { data: user } = await sb.from('blog_gam_users').select('id,streak_days').eq('id', gamUserId).maybeSingle();
  if(!user) return [] as any[];
  const { data: events } = await sb.from('blog_gam_events').select('type').eq('gam_user_id', gamUserId).limit(200);
  const types = new Set<string>((events||[]).map((e:any)=> e.type as string));
  const awarded: any[] = [];
  if(types.has('gam_qa_question')){
    const r = await awardBadgeIfNeeded(gamUserId,'first_qa'); if(r.awarded) awarded.push(r);
  }
  if(types.has('gam_share')){
    const r = await awardBadgeIfNeeded(gamUserId,'first_share'); if(r.awarded) awarded.push(r);
  }
  if((user.streak_days||0) >= 3){
    const r = await awardBadgeIfNeeded(gamUserId,'streak_3'); if(r.awarded) awarded.push(r);
  }
  if((user.streak_days||0) >= 7){
    const r = await awardBadgeIfNeeded(gamUserId,'streak_7'); if(r.awarded) awarded.push(r);
  }
  return awarded;
}

