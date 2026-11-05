import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LeadForm from '@/components/LeadForm';
import NotifyMeButton from '@/components/NotifyMeButton';
import { trackLeadAdsConversion } from '@/lib/conversions';
import { trackLeadFormSubmit } from '@/lib/events';

(globalThis as unknown as { React: typeof React }).React = React;
vi.mock('@/lib/events', () => ({ trackLeadFormSubmit: vi.fn() }));
vi.mock('@/lib/conversions', () => ({ trackLeadAdsConversion: vi.fn(), rememberLeadConversion: vi.fn() }));
vi.mock('@/lib/gclid', () => ({ getClickId: () => null }));
vi.mock('@/lib/track', () => ({ sendGA4: vi.fn() }));

beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window, 'open').mockImplementation(() => null); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function submitContact(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  render(<LeadForm />);
  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: 'Pessoa Teste' } });
  fireEvent.change(screen.getByLabelText(/^WhatsApp/), { target: { value: '11999999999' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Quero conhecer as opções atuais' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
}

describe('formulários sem falsas confirmações', () => {
  it.each([{ ok: false }, { ok: true, id: null }, { id: 'unconfirmed' }])('não converte resposta incompleta %j', async (body) => {
    await submitContact(body);
    await screen.findByText(/Ops, não conseguimos enviar/);
    expect(trackLeadFormSubmit).not.toHaveBeenCalled();
    expect(trackLeadAdsConversion).not.toHaveBeenCalled();
  });
  it('não converte erro HTTP', async () => {
    await submitContact({ error: 'Indisponível' }, 503);
    await screen.findByText(/Ops, não conseguimos enviar/);
    expect(trackLeadAdsConversion).not.toHaveBeenCalled();
  });
  it('converte uma vez após confirmação; preferências não obrigatórias podem ficar vazias', async () => {
    await submitContact({ ok: true, id: 'test-lead-123' });
    await screen.findByText(/Tudo certo!/);
    expect(trackLeadFormSubmit).toHaveBeenCalledExactlyOnceWith('lead-form-main', 'test-lead-123');
    expect(trackLeadAdsConversion).toHaveBeenCalledExactlyOnceWith({ transactionId: 'test-lead-123' });
  });
  it('preferência não diz que foi anotada quando o servidor falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Unavailable' }, { status: 503 })));
    render(<NotifyMeButton />);
    fireEvent.click(screen.getByRole('button', { name: /Conte o que você procura/ }));
    fireEvent.change(screen.getByLabelText('Seu WhatsApp com DDD'), { target: { value: '11999999999' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByRole('alert');
    expect(screen.queryByText(/Anotado/)).toBeNull();
  });
});
