import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSession, listSessionTasks, recomputeSessionProgress } from '@/lib/aiPipeline';

export async function GET(_req: NextRequest, ctx: { params:{ id:string } }){
  const auth = requireAdmin(_req); if(auth) return auth;
  const session = await getSession(ctx.params.id);
  if(!session) return NextResponse.json({ error:'not-found' }, { status:404 });
  await recomputeSessionProgress(session.id); // atualiza on-demand
  const tasks = await listSessionTasks(session.id);
  return NextResponse.json({ session, tasks });
}
