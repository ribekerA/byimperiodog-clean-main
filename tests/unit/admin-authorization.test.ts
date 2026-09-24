// @vitest-environment node
import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdminApi } from '@/lib/adminAuth';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: vi.fn() }));

function request(role?: string, method = 'POST', path = '/api/admin/blog/publish', extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (role) {
    const body = Buffer.from(JSON.stringify({ role, userId: 'test-user', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
    const signature = createHmac('sha256', 'local-test-signing-key').update(body).digest('base64url');
    headers.cookie = 'admin_session=' + body + '.' + signature + '; admin_role=owner';
  }
  return new Request('https://byimperiodog.com.br' + path, { method, headers });
}
beforeEach(() => { vi.stubEnv('ADMIN_SESSION_SECRET', 'local-test-signing-key'); vi.stubEnv('ADMIN_PASS', ''); vi.stubEnv('NEXT_PUBLIC_ADMIN_OPEN', '0'); });
afterEach(() => vi.unstubAllEnvs());
describe('autorização administrativa server-side', () => {
  it('não aceita cookies legados forjados ou malformados', () => {
    expect(requireAdminApi(request(undefined, 'GET', '/api/admin/leads', { cookie: 'admin_auth=1; adm=true; admin_role=owner' }))?.status).toBe(401);
    expect(requireAdminApi(request(undefined, 'GET', '/api/admin/leads', { cookie: 'admin_session=%invalid' }))?.status).toBe(401);
  });
  it('viewer não ganha escrita via cookie de papel', () => {
    expect(requireAdminApi(request('viewer'))?.status).toBe(403);
    expect(requireAdminApi(request('viewer', 'DELETE', '/api/admin/media'))?.status).toBe(403);
  });
  it('permite leitura e edição de acordo com o papel assinado', () => {
    expect(requireAdminApi(request('viewer', 'GET', '/api/admin/leads'))).toBeNull();
    expect(requireAdminApi(request('editor'))).toBeNull();
    expect(requireAdminApi(request('owner'))).toBeNull();
    expect(requireAdminApi(request('squad'))?.status).toBe(403);
  });
  it('configuração exige permissão também para leitura', () => {
    expect(requireAdminApi(request('editor', 'GET', '/api/admin/settings'))?.status).toBe(403);
    expect(requireAdminApi(request('owner', 'GET', '/api/admin/settings'))).toBeNull();
  });
  it('recusa escrita cross-site com sessão válida', () => {
    expect(requireAdminApi(request('owner', 'POST', '/api/admin/blog/publish', { origin: 'https://untrusted.example' }))?.status).toBe(403);
    expect(requireAdminApi(request('owner', 'POST', '/api/admin/blog/publish', { origin: 'https://byimperiodog.com.br' }))).toBeNull();
  });
});
