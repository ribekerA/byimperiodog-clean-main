import { NextResponse } from 'next/server';

import { getOrCreateGamUser, awardXp, evaluateAndAwardBadges } from '@/lib/gamification.blog';
import { corpoJson, limiteDeTaxa } from '@/lib/limitePublico';

export const runtime = 'nodejs';

// POST /api/gamification/claim { anonId, type }
export async function POST(req: Request){
  // Cada claim cria/atualiza usuário e credita XP no banco. Sem teto, um
  // laço de POST inflava o placar e a tabela junto.
  const bloqueio = limiteDeTaxa(req, 'gam-claim', 30);
  if (bloqueio) return bloqueio;

  const lido = await corpoJson<{ anonId?: unknown; type?: unknown }>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const body = lido.dados;
  const anonId = String(body.anonId||'').slice(0,100);
  const type = String(body.type||'').slice(0,60) || 'gam_view_post';
  if(!anonId) return NextResponse.json({ ok:false, error:'anonId vazio' }, { status:400 });
  const user = await getOrCreateGamUser(anonId);
  const res = await awardXp(user.id, type, 10, { ua: req.headers.get('user-agent')||'' });
  const newBadges = res.skipped ? [] : await evaluateAndAwardBadges(user.id);
  return NextResponse.json({ ok:true, user: { id:user.id, ...res }, badges: newBadges });
}
