import { describe, it, expect } from 'vitest';

import { POST as analyticsPost } from '../app/api/analytics/route';

import { makeNextRequestStub } from './helpers/nextRequestStub';

function makeReq(body: unknown, headers: Record<string,string> = {}) {
  return makeNextRequestStub('http://localhost/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
}

describe('analytics ingest POST', () => {
  it('falha com 400 se name ausente', async () => {
  const res = await analyticsPost(makeReq({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('name required');
  });
  it('retorna ok stub quando service role ausente (inserção tenta mas stub)', async () => {
  const res = await analyticsPost(makeReq({ name: 'view_post', path: '/blog/x' }));
    // Pode ser 200 ok ou 202 skipped dependendo do stub; aceitaremos ambos
    expect([200,202]).toContain(res.status);
    const json = await res.json();
    expect(json.ok || json.skipped || json.stub || json.disabled).toBeTruthy();
  });
});
