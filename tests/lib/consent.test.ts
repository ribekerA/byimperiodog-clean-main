import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  DEFAULT_CONSENT,
  loadConsent,
  saveConsent,
  acceptAllConsent,
  rejectAllConsent,
  hasConsent,
  getCurrentConsent,
  type ConsentPreferences,
  type ConsentState,
} from '@/lib/consent';

const CONSENT_STORAGE_KEY = 'byimperiodog_consent_v1';

// Helper para tipagem de window com gtag
interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
}

describe('Consent Management', () => {
  beforeEach(() => {
    // Limpa localStorage e mocks antes de cada teste
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock window.gtag se necessário
    const win = window as WindowWithGtag;
    if (typeof win.gtag === 'undefined') {
      win.gtag = vi.fn();
    }
  });

  describe('DEFAULT_CONSENT', () => {
    it('deve ter necessary e functional como true por padrão', () => {
      expect(DEFAULT_CONSENT.necessary).toBe(true);
      expect(DEFAULT_CONSENT.functional).toBe(true);
    });

    it('deve ter analytics e marketing como false por padrão', () => {
      expect(DEFAULT_CONSENT.analytics).toBe(false);
      expect(DEFAULT_CONSENT.marketing).toBe(false);
    });
  });

  describe('loadConsent', () => {
    it('deve retornar null quando não há consentimento salvo', () => {
      const result = loadConsent();
      expect(result).toBeNull();
    });

    it('deve retornar null quando a versão da política é diferente', () => {
      const oldVersion: ConsentState = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: Date.now(),
        version: '0.9', // versão antiga
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(oldVersion));
      
      const result = loadConsent();
      expect(result).toBeNull();
    });

    it('deve retornar o consentimento salvo quando válido', () => {
      const validConsent: ConsentState = {
        necessary: true,
        analytics: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0',
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(validConsent));
      
      const result = loadConsent();
      expect(result).not.toBeNull();
      expect(result?.analytics).toBe(true);
      expect(result?.marketing).toBe(false);
    });

    it('deve retornar null se o JSON estiver corrompido', () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'invalid-json{');
      
      const result = loadConsent();
      expect(result).toBeNull();
    });
  });

  describe('saveConsent', () => {
    it('deve salvar as preferências no localStorage', () => {
      const preferences: ConsentPreferences = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      };
      
      saveConsent(preferences);
      
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!) as ConsentState;
      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(true);
      expect(parsed.version).toBe('1.0');
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('deve sempre forçar necessary como true', () => {
      const preferences: ConsentPreferences = {
        necessary: false, // tentando desabilitar
        analytics: false,
        marketing: false,
        functional: false,
      };
      
      saveConsent(preferences);
      
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      const parsed = JSON.parse(stored!) as ConsentState;
      expect(parsed.necessary).toBe(true); // forçado
    });

    it('deve disparar evento consentUpdated', () => {
      const eventSpy = vi.fn();
      window.addEventListener('consentUpdated', eventSpy);
      
      const preferences: ConsentPreferences = {
        necessary: true,
        analytics: true,
        marketing: false,
        functional: true,
      };
      
      saveConsent(preferences);
      
      expect(eventSpy).toHaveBeenCalledTimes(1);
      window.removeEventListener('consentUpdated', eventSpy);
    });

    it('deve chamar gtag com consent update se disponível', () => {
      const gtagMock = vi.fn();
      const win = window as WindowWithGtag;
      win.gtag = gtagMock;
      
      const preferences: ConsentPreferences = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      };
      
      saveConsent(preferences);
      
      expect(gtagMock).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({
        analytics_storage: 'granted',
        ad_storage: 'granted',
      }));
    });
  });

  describe('acceptAllConsent', () => {
    it('deve aceitar todas as categorias', () => {
      acceptAllConsent();
      
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      const parsed = JSON.parse(stored!) as ConsentState;
      
      expect(parsed.necessary).toBe(true);
      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(true);
      expect(parsed.functional).toBe(true);
    });
  });

  describe('rejectAllConsent', () => {
    it('deve rejeitar analytics e marketing', () => {
      rejectAllConsent();
      
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      const parsed = JSON.parse(stored!) as ConsentState;
      
      expect(parsed.necessary).toBe(true); // sempre true
      expect(parsed.analytics).toBe(false);
      expect(parsed.marketing).toBe(false);
      expect(parsed.functional).toBe(false);
    });
  });

  describe('hasConsent', () => {
    it('deve retornar false quando não há consentimento', () => {
      expect(hasConsent()).toBe(false);
    });

    it('deve retornar true quando há consentimento válido', () => {
      acceptAllConsent();
      expect(hasConsent()).toBe(true);
    });

    it('deve retornar false quando versão é inválida', () => {
      const oldVersion: ConsentState = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: Date.now(),
        version: '0.5',
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(oldVersion));
      
      expect(hasConsent()).toBe(false);
    });
  });

  describe('getCurrentConsent', () => {
    it('deve retornar DEFAULT_CONSENT quando não há consentimento salvo', () => {
      const current = getCurrentConsent();
      
      expect(current).toEqual(DEFAULT_CONSENT);
    });

    it('deve retornar o consentimento salvo quando disponível', () => {
      const preferences: ConsentPreferences = {
        necessary: true,
        analytics: true,
        marketing: false,
        functional: true,
      };
      
      saveConsent(preferences);
      
      const current = getCurrentConsent();
      expect(current.analytics).toBe(true);
      expect(current.marketing).toBe(false);
    });
  });

  describe('Fluxo completo', () => {
    it('deve permitir mudança de preferências', () => {
      // Usuário rejeita tudo
      rejectAllConsent();
      expect(getCurrentConsent().analytics).toBe(false);
      expect(getCurrentConsent().marketing).toBe(false);
      
      // Usuário muda de ideia e aceita tudo
      acceptAllConsent();
      expect(getCurrentConsent().analytics).toBe(true);
      expect(getCurrentConsent().marketing).toBe(true);
    });

    it('deve manter consentimento através de recargas (localStorage)', () => {
      acceptAllConsent();
      
      // Simula nova sessão
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      const loaded = loadConsent();
      expect(loaded?.analytics).toBe(true);
      expect(loaded?.marketing).toBe(true);
    });
  });

  describe('Integração com Google Consent Mode v2', () => {
    it('deve enviar denied quando analytics é false', () => {
      const gtagMock = vi.fn();
      const win = window as WindowWithGtag;
      win.gtag = gtagMock;
      
      rejectAllConsent();
      
      expect(gtagMock).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({
        analytics_storage: 'denied',
        ad_storage: 'denied',
      }));
    });

    it('deve enviar granted quando marketing é true', () => {
      const gtagMock = vi.fn();
      const win = window as WindowWithGtag;
      win.gtag = gtagMock;
      
      acceptAllConsent();
      
      expect(gtagMock).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      }));
    });

    it('não deve falhar se gtag não estiver disponível', () => {
      const win = window as WindowWithGtag;
      delete win.gtag;
      
      expect(() => {
        acceptAllConsent();
      }).not.toThrow();
    });
  });
});
