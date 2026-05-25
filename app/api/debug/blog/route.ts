import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { supabaseAnon } from '@/lib/supabaseAnon';

// GET /api/debug/blog  (requer header x-debug-token = process.env.DEBUG_TOKEN)
export async function GET(req: NextRequest){
  const token = req.headers.get('x-debug-token');
  if(!process.env.DEBUG_TOKEN || token !== process.env.DEBUG_TOKEN){
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sb = supabaseAnon();
  // Agrupa por status
  const { data, error } = await sb.from('blog_posts').select('status, count:id').group('status');
  if(error){
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const counts: Record<string, number> = {};
  (data as { status: string; count: number }[] | null | undefined)?.forEach(r => {
    counts[r.status] = Number(r.count) || 0;
  });
  return NextResponse.json({ counts });
}