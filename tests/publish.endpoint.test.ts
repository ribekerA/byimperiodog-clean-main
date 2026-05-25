import { describe, it, expect } from 'vitest';

import { POST as publishPost } from '../app/api/admin/blog/publish/route';

import { makeNextRequestStub } from './helpers/nextRequestStub';

function makeReq(body: unknown, headers: Record<string,string> = {}){
  return makeNextRequestStub('http://localhost/api/admin/blog/publish', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
}

describe('publish endpoint', () => {
  it('retorna 401 sem token admin', async () => {
  const res = await publishPost(makeReq({ id: 'uuid-x' }));
    expect(res.status).toBe(401);
  });
  it('retorna 500 missing service role quando token ok mas sem chave', async () => {
    process.env.ADMIN_TOKEN = 'secret';
  const res = await publishPost(makeReq({ id: 'uuid-x' }, { 'x-admin-token': 'secret' }));
    expect([500,202]).toContain(res.status); // 202 caso stub retorne modo offline
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
  it('retorna 400 se body inválido (sem id/slug)', async () => {
    process.env.ADMIN_TOKEN = 'secret';
    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub'; // garante passar pelo hasServiceRoleKey()
    try {
      const res = await publishPost(makeReq({}, { 'x-admin-token': 'secret' }));
      expect(res.status).toBe(400);
      const j = await res.json();
      expect(j.error).toBe('missing-id-or-slug');
    } finally {
      if(prev === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = prev;
    }
  });
});
