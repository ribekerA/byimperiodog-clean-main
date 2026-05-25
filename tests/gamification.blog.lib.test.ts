import { describe, it, expect, vi, beforeEach } from 'vitest';

// Usar caminho relativo para evitar problemas de path mapping no ambiente de lint/tests
import { getOrCreateGamUser, awardXp, listRecentGamEvents, ensureBadges, evaluateAndAwardBadges } from '../src/lib/gamification.blog';

// In-memory mock store
interface GamUser { [k:string]: unknown; id:string; anon_id:string; xp:number; level:number; streak_days:number; last_event_at?:string|null }
interface Event { [k:string]: unknown; id:string; gam_user_id:string; type:string; created_at:string; xp_awarded:number; meta?:Record<string,unknown> }
interface Badge { [k:string]: unknown; id:string; code:string; name:string; description?:string }
interface UserBadge { [k:string]: unknown; gam_user_id:string; badge_id:string }

let store:{ users:GamUser[]; events:Event[]; badges:Badge[]; userBadges:UserBadge[] };

function reset(){
  store = { users:[], events:[], badges:[], userBadges:[] };
}

// Minimal query builder fabric
type Builder<T extends Record<string, unknown>> = {
  select: (cols?:string) => Builder<T>;
  eq: (col: keyof T & string, val: unknown) => Builder<T>;
  gte: (col: keyof T & string, val: string) => Builder<T>;
  order: (col:string, opts?:{ ascending?: boolean }) => Builder<T>;
  limit: (n:number) => { data:T[]; error:null };
  maybeSingle: () => Promise<{ data:T|null; error:null }>;
};

function rows<T extends Record<string, unknown>>(arr:T[]): Builder<T> {
  return {
    select: () => rows(arr),
    eq: (col, val) => rows(arr.filter((r)=> r[col] === val)),
    gte: (col, val) => rows(arr.filter((r)=> {
      const v = r[col];
      return typeof v === 'string' && v >= val;
    })),
    order: () => rows(arr),
    limit: (n:number) => ({ data: arr.slice(0,n), error:null }),
    maybeSingle: () => Promise.resolve({ data: arr[0]||null, error:null })
  };
}

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (table:string) => {
      if(table==='blog_gam_users') return {
        select: () => rows(store.users as GamUser[] as Record<string,unknown>[]),
        insert: (val: { anon_id:string }) => { const id = `u${store.users.length+1}`; const rec:GamUser = { id, anon_id: val.anon_id, xp:0, level:1, streak_days:0, last_event_at:null }; store.users.push(rec); return { select: () => ({ maybeSingle: () => Promise.resolve({ data: rec, error:null }) }) }; },
        update: (patch: Partial<GamUser>) => ({ eq: (_c:string,id:string) => { store.users = store.users.map(u=> u.id===id ? { ...u, ...patch } : u); return { }; } })
      };
      if(table==='blog_gam_events') return {
        select: () => rows(store.events as Event[] as Record<string,unknown>[]),
        insert: (val: Omit<Event,'id'|'created_at'>) => { const ev:Event = { id:`e${store.events.length+1}`, gam_user_id: val.gam_user_id as string, type: val.type as string, xp_awarded: val.xp_awarded as number, meta: val.meta as Record<string,unknown>|undefined, created_at: new Date().toISOString() }; store.events.push(ev); return { select: () => ({ maybeSingle: () => ({ data: ev, error:null }) }) }; },
      };
      if(table==='blog_gam_badges') return {
        select: () => rows(store.badges as Badge[] as Record<string,unknown>[]),
        insert: (val: Omit<Badge,'id'>) => { const code = val.code as string; if(!store.badges.find(b=> b.code===code)){ const b:Badge = { id:`b${store.badges.length+1}`, code, name: val.name as string, description: val.description as string|undefined }; store.badges.push(b); } return { select: () => ({}) }; }
      };
      if(table==='blog_gam_user_badges') return {
        select: () => rows(store.userBadges as UserBadge[] as Record<string,unknown>[]),
        insert: (val: UserBadge) => { store.userBadges.push(val); return { }; }
      };
      return { select: () => rows([]) };
    }
  })
}));

beforeEach(()=>{ reset(); });

describe('gamification.blog lib', () => {
  it('getOrCreateGamUser cria quando inexistente', async () => {
    const user = await getOrCreateGamUser('anon123');
    expect(user.xp).toBe(0);
    const again = await getOrCreateGamUser('anon123');
    expect(again.id).toBe(user.id);
  });

  it('awardXp aplica XP, streak e level e rate limit bloqueia repetição <30s', async () => {
    const u = await getOrCreateGamUser('anon1');
    const r1 = await awardXp(u.id,'read_post',50);
    expect(r1.xp).toBe(50);
    const rSkip = await awardXp(u.id,'read_post',50); // repetido dentro da janela
    expect(rSkip.skipped).toBe(true);
    // Simular evento antigo ajustando timestamp para forçar streak incremento
    store.users[0].last_event_at = new Date(Date.now()-1000*60*60*21).toISOString();
    const r2 = await awardXp(u.id,'comment',60);
    expect(r2.streak_days).toBeGreaterThanOrEqual(2);
    expect(r2.level).toBeGreaterThanOrEqual(1);
  });

  it('ensureBadges insere badges padrão sem duplicar', async () => {
    await ensureBadges();
    const count = store.badges.length;
    await ensureBadges();
    expect(store.badges.length).toBe(count);
  });

  it('awardBadgeIfNeeded evita duplicar e evaluateAndAwardBadges concede baseado em eventos e streak', async () => {
    await ensureBadges();
    const u = await getOrCreateGamUser('anonA');
    // inserir eventos para simular
    store.events.push({ id:'e1', gam_user_id:u.id, type:'gam_qa_question', created_at:new Date().toISOString(), xp_awarded:5 });
    store.events.push({ id:'e2', gam_user_id:u.id, type:'gam_share', created_at:new Date().toISOString(), xp_awarded:5 });
    store.users[0].streak_days = 8; // força badges de streak
  const awarded = await evaluateAndAwardBadges(u.id);
  const codes = awarded.map((a: { code:string })=>a.code).sort();
    expect(codes).toEqual(['first_qa','first_share','streak_3','streak_7']);
    // segunda chamada não deve duplicar
    const none = await evaluateAndAwardBadges(u.id);
    expect(none.length).toBe(0);
  });

  it('listRecentGamEvents retorna eventos limitados', async () => {
    const u = await getOrCreateGamUser('anonE');
    for(let i=0;i<5;i++){
      await awardXp(u.id,`evt_${i}`,5);
    }
    const recent = await listRecentGamEvents(u.id,3);
    expect(recent.length).toBeLessThanOrEqual(3);
  });
});
