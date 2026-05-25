import { NextResponse } from 'next/server';
import { ensureBadges } from '@/lib/gamification.blog';
import { internalGuard } from '@/lib/internalAuth';

export const runtime = 'edge';

export async function POST(req: Request){
  if(!internalGuard(req)) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  await ensureBadges();
  return NextResponse.json({ ok:true, seeded:true });
}
