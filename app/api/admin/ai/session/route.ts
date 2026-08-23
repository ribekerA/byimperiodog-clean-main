import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { createSessionWithTasks, listSessions } from '@/lib/aiPipeline';

interface PostBody { topic:string; phases?:string[]; gamAnonId?:string }

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  let body: unknown = {};
  try { body = await req.json(); } catch { body = {}; }
  const { topic, phases, gamAnonId } = (body as PostBody);
  if(!topic || !topic.trim()) return NextResponse.json({ error:'topic-required' }, { status:400 });
  try {
    const result = await createSessionWithTasks({ topic: topic.trim(), phases, anonGamId: gamAnonId });
    return NextResponse.json({ ok:true, ...result });
  } catch(e:unknown){
    const msg = e instanceof Error ? e.message : 'error';
    return NextResponse.json({ error: msg }, { status:500 });
  }
}

export async function GET(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit')||20);
  const sessions = await listSessions(Math.min(Math.max(limit,1),100));
  return NextResponse.json({ sessions });
}
