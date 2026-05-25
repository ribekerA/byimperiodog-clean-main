import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { applySuggestion, approveSuggestion } from '@/lib/seoSuggestions';

// POST /api/admin/seo/suggestions/:id/apply  (aprova se ainda proposed e aplica patch)
export async function POST(_req: NextRequest, ctx:{ params:{ id:string } }){
  const auth = requireAdmin(_req); if(auth) return auth;
  try {
    try { await approveSuggestion(ctx.params.id); } catch (e) { /* ignore if already approved */ }
    const r = await applySuggestion(ctx.params.id);
    return NextResponse.json({ ok:true, ...r });
  } catch(e:unknown){
    return NextResponse.json({ error: e instanceof Error? e.message:'error' }, { status:500 });
  }
}
