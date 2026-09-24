import { beforeEach, describe, expect, it, vi } from 'vitest';

import { acceptAllConsent, rejectAllConsent } from '@/lib/consent';
import { captureClickId, getClickAttribution, getClickId } from '@/lib/gclid';

const KEY = 'bid_click_ids_v2';
describe('atribuição tipada de mídia paga', () => {
  beforeEach(() => {
    vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    acceptAllConsent();
  });
  it.each(['gclid', 'wbraid', 'gbraid'])('preserva o tipo %s', (type) => {
    window.history.replaceState({}, '', '/?' + type + '=click-123');
    captureClickId();
    expect(getClickAttribution()).toEqual({ [type]: 'click-123' });
    expect(getClickId()).toBe(type === 'gclid' ? 'click-123' : null);
  });
  it('preserva identificadores simultâneos sem misturar tipos', () => {
    window.history.replaceState({}, '', '/?gclid=google-1&wbraid=web-1&gbraid=app-1'); captureClickId();
    expect(getClickAttribution()).toEqual({ gclid: 'google-1', wbraid: 'web-1', gbraid: 'app-1' });
  });
  it('não armazena nem lê sem consentimento de marketing', () => {
    rejectAllConsent();
    window.history.replaceState({}, '', '/?gclid=refused'); captureClickId();
    expect(getClickId()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });
  it('revogação apaga os armazenamentos e impede leitura', () => {
    window.history.replaceState({}, '', '/?gclid=accepted'); captureClickId(); rejectAllConsent();
    expect(getClickAttribution()).toEqual({});
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });
  it.each([Date.now() - 91 * 86400000, Date.now() + 600000, 'invalid'])('rejeita timestamp inválido %s', (timestamp) => {
    localStorage.setItem(KEY, JSON.stringify({ ids: { gclid: 'old' }, timestamp }));
    expect(getClickId()).toBeNull(); expect(localStorage.getItem(KEY)).toBeNull();
  });
  it('não migra o valor legado sem tipo', () => {
    localStorage.setItem('bid_click_id', JSON.stringify({ id: 'unknown', timestamp: Date.now() }));
    sessionStorage.setItem('bid_click_id_sessao', 'unknown'); captureClickId();
    expect(getClickId()).toBeNull();
    expect(localStorage.getItem('bid_click_id')).toBeNull();
    expect(sessionStorage.getItem('bid_click_id_sessao')).toBeNull();
  });
  it('não renova retenção a cada navegação', () => {
    window.history.replaceState({}, '', '/?gclid=click-1'); captureClickId();
    const previous = localStorage.getItem(KEY);
    window.history.replaceState({}, '', '/filhotes'); captureClickId();
    expect(localStorage.getItem(KEY)).toBe(previous);
  });
  it('não lança com storage bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => captureClickId()).not.toThrow(); expect(getClickId()).toBeNull();
  });
});
