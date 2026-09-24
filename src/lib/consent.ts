/**
 * Tipos e helpers para gerenciamento de consentimento (LGPD)
 * Integrado com Google Consent Mode v2 e pixels (GA4, FB, TikTok, etc.)
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'functional';

export interface ConsentPreferences {
  necessary: boolean; // Sempre true (cookies essenciais)
  analytics: boolean; // GA4, Hotjar, Clarity
  marketing: boolean; // Facebook Pixel, TikTok, Pinterest, LinkedIn
  functional: boolean; // Recursos como chat, preferências de UI
}

export interface ConsentState extends ConsentPreferences {
  timestamp: number;
  version: string; // Versão da política de privacidade
}

const CONSENT_STORAGE_KEY = 'byimperiodog_consent_v1';
const CURRENT_POLICY_VERSION = '1.0';

/**
 * Evento que reabre o painel de preferências de cookies.
 * Disparado pelo link "Preferências de cookies" no rodapé e ouvido pelo
 * ConsentBanner — é o que garante a revogação prometida na política.
 */
export const OPEN_CONSENT_EVENT = 'byimperiodog:open-consent';

/** Reabre o painel de preferências de cookies. */
export function openConsentPreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

/**
 * Preferências padrão antes do consentimento explícito
 */
export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: true,
};

/**
 * Carrega as preferências de consentimento do localStorage
 */
export function loadConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as ConsentState;

    // Valida versão da política
    if (parsed.version !== CURRENT_POLICY_VERSION ||
        !['necessary', 'analytics', 'marketing', 'functional'].every((key) => typeof parsed[key as keyof ConsentPreferences] === 'boolean')) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Salva as preferências de consentimento
 */
export function saveConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  const previous = getCurrentConsent();

  const state: ConsentState = {
    ...preferences,
    necessary: true, // Sempre true
    timestamp: Date.now(),
    version: CURRENT_POLICY_VERSION,
  };

  try {
    clearRevokedStorage(previous, preferences);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));

    // Atualiza Google Consent Mode
    updateGoogleConsent(preferences);

    // Dispara evento customizado para atualizar pixels
    window.dispatchEvent(new CustomEvent('consentUpdated', { detail: preferences }));
  } catch {
    // Ignora erros de localStorage
  }
}

/** Loaded third-party libraries cannot be unloaded by unmounting a script tag. */
export function requiresConsentReload(previous: ConsentPreferences, next: ConsentPreferences): boolean {
  return (previous.analytics || previous.marketing) &&
    (previous.analytics !== next.analytics || previous.marketing !== next.marketing);
}

function clearRevokedStorage(previous: ConsentPreferences, next: ConsentPreferences): void {
  if (!next.analytics) {
    for (const key of ['bid_first_touch', 'bid_last_touch']) localStorage.removeItem(key);
  }
  if (previous.marketing && !next.marketing) {
    for (const key of ['bid_click_id', 'bid_click_id_sessao', 'bid_click_ids_v2']) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
  const patterns = [
    ...(previous.analytics && !next.analytics ? [/^_ga(?:_|$)/, /^_gid$/, /^_gat/] : []),
    ...(previous.marketing && !next.marketing ? [/^_gcl_/, /^_fbp$/, /^_fbc$/, /^_pin_/, /^_pinterest_/, /^_ttp$/] : []),
  ];
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (!patterns.some((pattern) => pattern.test(name))) continue;
    const hostname = window.location.hostname;
    const domains = ['', hostname, ...(hostname.endsWith('.byimperiodog.com.br') ? ['byimperiodog.com.br'] : [])];
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

/**
 * Limpa as preferências de consentimento (logout/reset)
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Ignora erros
  }
}

/**
 * Atualiza o Google Consent Mode v2
 */
function updateGoogleConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;

  // Verifica se gtag está disponível
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;

  gtag('consent', 'update', {
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    functionality_storage: preferences.functional ? 'granted' : 'denied',
    personalization_storage: preferences.functional ? 'granted' : 'denied',
    security_storage: 'granted', // Sempre permitido (necessary)
  });
}

/**
 * Configura o consentimento padrão (antes da escolha do usuário)
 * Deve ser chamado o mais cedo possível no carregamento da página
 */
export function setDefaultConsent(): void {
  if (typeof window === 'undefined') return;

  // Verifica se já existe consentimento salvo
  const existing = loadConsent();
  if (existing) {
    updateGoogleConsent(existing);
    return;
  }

  // Configura modo padrão (denied) até usuário consentir
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted', // Funcional permitido por padrão
      personalization_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500, // Aguarda 500ms para banner
    });
  }
}

/**
 * Verifica se o usuário já deu consentimento
 */
export function hasConsent(): boolean {
  return loadConsent() !== null;
}

/**
 * Obtém as preferências atuais ou padrão
 */
export function getCurrentConsent(): ConsentPreferences {
  const state = loadConsent();
  return state || DEFAULT_CONSENT;
}

/**
 * Aceita todos os cookies
 */
export function acceptAllConsent(): void {
  saveConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    functional: true,
  });
}

/**
 * Rejeita cookies opcionais (mantém apenas necessários)
 */
export function rejectAllConsent(): void {
  saveConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
}
