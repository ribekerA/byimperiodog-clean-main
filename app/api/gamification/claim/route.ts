import { NextResponse } from 'next/server';
import { getOrCreateGamUser, awardXp, evaluateAndAwardBadges } from '@/lib/gamification.blog';

export const runtime = 'edge';

// POST /api/gamification/claim { anonId, type }
export async function POST(req: Request){
  const body = await req.json().catch(()=>({}));
  const anonId = String(body.anonId||'').slice(0,100);
  const type = String(body.type||'').slice(0,60) || 'gam_view_post';
  if(!anonId) return NextResponse.json({ ok:false, error:'anonId vazio' }, { status:400 });
  const user = await getOrCreateGamUser(anonId);
  const res = await awardXp(user.id, type, 10, { ua: req.headers.get('user-agent')||'' });
  const newBadges = res.skipped ? [] : await evaluateAndAwardBadges(user.id);
  return NextResponse.json({ ok:true, user: { id:user.id, ...res }, badges: newBadges });
}
