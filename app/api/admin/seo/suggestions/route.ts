import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listSuggestions } from '@/lib/seoSuggestions';

// GET /api/admin/seo/suggestions?status=proposed
export async function GET(req: NextRequest){
  const auth = await requireAdmin(req, { permission: "blog:read" }); if(auth) return auth;
  const url = new URL(req.url);
  const status = url.searchParams.get('status')||'proposed';
  try {
    const list = await listSuggestions(status);
    return NextResponse.json({ suggestions: list });
  } catch(e:unknown){
    return NextResponse.json({ error: e instanceof Error? e.message:'error' }, { status:500 });
  }
}
