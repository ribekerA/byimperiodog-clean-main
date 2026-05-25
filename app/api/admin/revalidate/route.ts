import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { rateLimit } from '@/lib/limiter';
import { safeAction } from '@/lib/safeAction';

/**
 * POST /api/admin/revalidate
 * Body: { path?: string; slug?: string }
 * Header: x-admin-token = ADMIN_TOKEN (ou DEBUG_TOKEN)
 * Se slug fornecido, revalida /blog/[slug] e /blog; se path fornecido revalida path literal.
 */
const schema = z.object({
  slug: z.string().min(1, 'slug vazio').optional(),
  path: z.string().min(1, 'path vazio').optional(),
}).refine(v => !!(v.slug || v.path), { message: 'missing-path-or-slug' });

const execute = safeAction({
  schema,
  handler: async (input) => {
    const { slug, path } = input;
    if (slug) {
      revalidatePath('/blog');
      revalidatePath(`/blog/${slug}`);
      return NextResponse.json({ ok: true, revalidated: ['/blog', `/blog/${slug}`] });
    }
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ ok: true, revalidated: [path] });
    }
    return NextResponse.json({ error: 'missing-path-or-slug' }, { status: 400 });
  },
});

export async function POST(req: NextRequest) {
  // Simple abuse control: 10/min per IP
  try { await rateLimit(req as unknown as Request, { identifier: 'admin-revalidate', limit: 10, windowMs: 60_000 }); } catch {
    return NextResponse.json({ error: 'rate-limit' }, { status: 429 });
  }
  const token = req.headers.get('x-admin-token');
  const adminToken = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN;
  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return execute(req as unknown as Request);
}
