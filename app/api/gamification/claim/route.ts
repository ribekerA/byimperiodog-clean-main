import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getOrCreateGamUser, awardXp, evaluateAndAwardBadges } from '@/lib/gamification.blog';
import { rateLimitRequest, tooManyRequests } from '@/lib/rateLimitDurable';
import { RequestBodyError, readJsonWithLimit } from '@/lib/requestGuards';

export const runtime = 'edge';

const requestSchema = z.object({
  anonId: z.string().trim().min(1).max(100),
  type: z.enum(['gam_visit', 'gam_view_post', 'gam_qa_question', 'gam_share']).default('gam_view_post'),
}).strict();

// POST /api/gamification/claim { anonId, type }
export async function POST(req: Request){
  const rate = await rateLimitRequest(req, { scope: 'gamification-claim', limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  let body: unknown;
  try {
    body = await readJsonWithLimit(req, 4 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ ok:false, error:'invalid_body' }, { status });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error:'dados invalidos' }, { status:400 });
  const { anonId, type } = parsed.data;
  const user = await getOrCreateGamUser(anonId);
  const res = await awardXp(user.id, type, 10, { ua: req.headers.get('user-agent')||'' });
  const newBadges = res.skipped ? [] : await evaluateAndAwardBadges(user.id);
  return NextResponse.json({ ok:true, user: { id:user.id, ...res }, badges: newBadges });
}
