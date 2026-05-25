import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { approveSuggestion } from '@/lib/seoSuggestions';

// POST /api/admin/seo/suggestions/:id/approve
export async function POST(_req: NextRequest, ctx:{ params:{ id:string } }){
  const auth = requireAdmin(_req); if(auth) return auth;
  try {
    await approveSuggestion(ctx.params.id);
    return NextResponse.json({ ok:true });
  } catch(e:unknown){
    return NextResponse.json({ error: e instanceof Error? e.message:'error' }, { status:500 });
  }
}
