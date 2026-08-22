export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';
import { requireAdminApi } from '@/lib/adminAuth';

interface PublishBody { id?: string; slug?: string }

/**
 * POST /api/admin/blog/publish
 * Body: { id?: string; slug?: string }
 * Auth: sessao admin assinada com permissao blog:write, ou ADMIN_PASS em x-admin-pass
 * Ação: status -> published (trigger preenche published_at se null)
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminApi(req, { permission: 'blog:write' });
  if (guard) return guard;
  if (!hasServiceRoleKey()) {
    return NextResponse.json({ error: 'missing-service-role-key' }, { status: 500 });
  }
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const { id, slug } = (parsed as PublishBody) || {};
  if (!id && !slug) {
    return NextResponse.json({ error: 'missing-id-or-slug' }, { status: 400 });
  }
  const sb = supabaseAdmin();
  try {
    let q = sb.from('blog_posts').update({ status: 'published' });
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
