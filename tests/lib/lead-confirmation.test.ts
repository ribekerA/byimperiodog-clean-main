import { describe, expect, it } from 'vitest';

import { confirmedLeadId } from '@/lib/lead-confirmation';

describe('confirmação de cadastro', () => {
  it('exige id estável e confirmação explícita', async () => {
    await expect(confirmedLeadId(Response.json({ ok: true, id: 'lead-123' }))).resolves.toBe('lead-123');
  });
  it.each([{ ok: false, id: 'lead-123' }, { ok: true }, { ok: true, id: null }, { ok: true, id: '' }, { id: 'lead-123' }, { ok: true, id: 12 }])('recusa sucesso incompleto %j', async (body) => {
    await expect(confirmedLeadId(Response.json(body))).rejects.toThrow('confirmar');
  });
  it('recusa erro HTTP e corpo não JSON', async () => {
    await expect(confirmedLeadId(Response.json({ ok: true, id: 'lead-123' }, { status: 500 }))).rejects.toThrow();
    await expect(confirmedLeadId(new Response('unavailable'))).rejects.toThrow();
  });
});
