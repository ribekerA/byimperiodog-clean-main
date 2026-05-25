export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';

/**
 * POST /api/admin/blog/unpublish
 * Body JSON: { id?: string; slug?: string; toStatus?: 'draft' | 'review' | 'archived'; keepPublishedAt?: boolean }
 * Auth: header x-admin-token must equal process.env.ADMIN_TOKEN (or FALLBACK process.env.DEBUG_TOKEN)
 * Effect: Set status to provided (default 'draft'); optionally nullify published_at.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-token');
  const adminToken = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN;
  if (!adminToken || authHeader !== adminToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ error: 'missing-service-role-key' }, { status: 500 });
  }

  interface UnpublishBody { id?: string; slug?: string; toStatus?: 'draft' | 'review' | 'archived'; keepPublishedAt?: boolean }
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const { id, slug, toStatus = 'draft', keepPublishedAt = false } = (parsed as UnpublishBody) || {};
  if (!id && !slug) {
    return NextResponse.json({ error: 'missing-id-or-slug' }, { status: 400 });
  }
  const allowed = ['draft', 'review', 'archived'];
  if (!allowed.includes(toStatus)) {
    return NextResponse.json({ error: 'invalid-toStatus' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  try {
    const patch: { status: string; published_at?: string | null } = { status: toStatus };
    if (!keepPublishedAt) patch.published_at = null;
    let q = sb.from('blog_posts').update(patch);
    q = id ? q.eq('id', id) : q.eq('slug', slug!);
    const { data, error } = await q.select('id, slug, status, published_at, updated_at, title').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    return NextResponse.json({ ok: true, post: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unexpected-error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
