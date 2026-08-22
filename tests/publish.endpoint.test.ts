// @vitest-environment node
import { afterEach, describe, it, expect } from 'vitest';

import { POST as publishPost } from '../app/api/admin/blog/publish/route';

import { makeNextRequestStub } from './helpers/nextRequestStub';

// A rota autenticava por `x-admin-token`, comparado com ADMIN_TOKEN e, na falta
// dele, com DEBUG_TOKEN — um token de depuracao que dava escrita no blog. Agora
// ela usa o portao central: sessao assinada ou segredo de maquina.
const SEGREDO = 'chave-de-maquina-longa-o-suficiente-2026';

function makeReq(body: unknown, headers: Record<string,string> = {}){
  return makeNextRequestStub('http://localhost/api/admin/blog/publish', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
}

afterEach(() => {
  delete process.env.ADMIN_PASS;
});

describe('publish endpoint', () => {
  it('retorna 401 sem credencial nenhuma', async () => {
    const res = await publishPost(makeReq({ id: 'uuid-x' }));
    expect(res.status).toBe(401);
  });

  it('retorna 401 com o header x-admin-token que valia antes', async () => {
    process.env.ADMIN_TOKEN = 'secret';
    process.env.DEBUG_TOKEN = 'secret';
    try {
      const res = await publishPost(makeReq({ id: 'uuid-x' }, { 'x-admin-token': 'secret' }));
      expect(res.status).toBe(401);
    } finally {
      delete process.env.ADMIN_TOKEN;
      delete process.env.DEBUG_TOKEN;
    }
  });

  it('retorna 500 missing service role quando autenticado mas sem chave', async () => {
    process.env.ADMIN_PASS = SEGREDO;
    const res = await publishPost(makeReq({ id: 'uuid-x' }, { 'x-admin-pass': SEGREDO }));
    expect([500,202]).toContain(res.status); // 202 caso stub retorne modo offline
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('retorna 400 se body inválido (sem id/slug)', async () => {
    process.env.ADMIN_PASS = SEGREDO;
    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub'; // garante passar pelo hasServiceRoleKey()
    try {
      const res = await publishPost(makeReq({}, { 'x-admin-pass': SEGREDO }));
      expect(res.status).toBe(400);
      const j = await res.json();
      expect(j.error).toBe('missing-id-or-slug');
    } finally {
      if(prev === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = prev;
    }
  });
});
