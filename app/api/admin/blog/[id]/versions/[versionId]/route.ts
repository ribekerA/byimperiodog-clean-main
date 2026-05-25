export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface FieldDiff { field:string; old: unknown; current: unknown }
function diffSnapshots(a: Record<string, unknown>, b: Record<string, unknown>): FieldDiff[] {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  const diffs: FieldDiff[] = [];
  for (const k of keys) {
    if (k === 'updated_at' || k === 'updated_by') continue;
    const av = a[k]; const bv = b[k];
    if (JSON.stringify(av) !== JSON.stringify(bv)) diffs.push({ field: k, old: av, current: bv });
  }
  return diffs;
}

// GET /api/admin/blog/:id/versions/:versionId?diff=1
export async function GET(req: NextRequest, ctx: { params:{ id:string; versionId:string } }){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const wantDiff = url.searchParams.get('diff') === '1';
  const sb = supabaseAdmin();
  const { data: ver, error } = await sb.from('blog_post_versions').select('id,post_id,snapshot,reason,created_at').eq('id', ctx.params.versionId).eq('post_id', ctx.params.id).maybeSingle();
  if(error) return NextResponse.json({ error: error.message }, { status:500 });
  if(!ver) return NextResponse.json({ error:'not-found' }, { status:404 });
  if(!wantDiff) return NextResponse.json({ version: ver });
  const { data: current, error: curErr } = await sb.from('blog_posts').select('*').eq('id', ctx.params.id).maybeSingle();
  if(curErr) return NextResponse.json({ error: curErr.message }, { status:500 });
  const diffs = diffSnapshots(ver.snapshot||{}, current||{});
  return NextResponse.json({ version: ver, diff: diffs });
}
