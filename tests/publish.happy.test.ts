import { describe, it, expect, vi } from 'vitest';

import { POST as publishPost } from '../app/api/admin/blog/publish/route';

import { makeNextRequestStub } from './helpers/nextRequestStub';

// Mock leve de supabaseAdmin para simular update retornando post publicado
vi.mock('@/lib/supabaseAdmin', () => ({
  hasServiceRoleKey: () => true,
  supabaseAdmin: () => ({
    from: (table: string) => {
      expect(table).toBe('blog_posts');
      const builder = {
  update: () => builder,
  eq: () => builder,
        select: () => builder,
        maybeSingle: () => Promise.resolve({ data: { id: 'p1', slug: 'post-1', status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString(), title: 'Hello' }, error: null })
      };
      return builder;
    }
  })
}));

describe('publish endpoint happy path', () => {
  it('publica por id', async () => {
    process.env.ADMIN_TOKEN = 'secret';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
  const req = makeNextRequestStub('http://localhost/api/admin/blog/publish', { method: 'POST', headers: { 'x-admin-token': 'secret', 'content-type': 'application/json' }, body: { id: 'p1' } });
  // req já possui shape mínimo de NextRequest via helper
  const res = await publishPost(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.post.status).toBe('published');
  });
});
