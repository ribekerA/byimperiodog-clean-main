/**
 * Eventos de tracking para conversão e engagement
 * Respeita preferências de consentimento LGPD
 */

import { getCurrentConsent } from './consent';
import { trackWhatsAppAdsConversion } from './conversions';

/**
 * Onde, na página, o visitante clicou para falar no WhatsApp.
 *
 * `other` não é um lugar: é o sinal de que algum CTA foi ao ar sem
 * `data-wa-placement`. Se ele aparecer no GA4, falta anotar um componente —
 * o evento continua sendo contado, mas o relatório fica cego sobre a origem.
 */
export type WhatsAppPlacement =
  | 'hero'
  | 'header'
  | 'floating_button'
  | 'puppy_card'
  | 'puppy_page'
  | 'gallery'
  | 'reels'
  | 'footer'
  | 'contact_section'
  | 'other';

export const WHATSAPP_PLACEMENTS: readonly WhatsAppPlacement[] = [
  'hero',
  'header',
  'floating_button',
  'puppy_card',
  'puppy_page',
  'gallery',
  'reels',
  'footer',
  'contact_section',
  'other',
] as const;

/**
 * De onde veio a visita, em termos de campanha — sem carregar o identificador.
 *
 * O gclid/gbraid/wbraid inteiro NUNCA entra aqui: ele identifica um clique de
 * anúncio específico, e o próprio Google proíbe mandá-lo de volta como
 * parâmetro de evento. O que interessa para a leitura é a origem, e para isso
 * `google_ads` já basta. A atribuição de verdade quem faz é o auto-tagging.
 */
function detectarContextoDeCampanha(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gclid') || params.get('gbraid') || params.get('wbraid')) {
      return 'google_ads';
    }
    const source = params.get('utm_source')?.trim();
    if (source) {
      const medium = params.get('utm_medium')?.trim();
      const rotulo = medium ? `${source}/${medium}` : source;
      // Corta em 60 para não transformar parâmetro de campanha colado à mão
      // num valor gigante dentro do GA4.
      return rotulo.slice(0, 60);
    }
  } catch {
    // URL malformada não pode impedir a medição do clique.
  }
  return 'direct';
}

/**
 * Clique em WhatsApp — o evento comercial que interessa nesta operação.
 *
 * Chamado por um ÚNICO ouvinte delegado (<WhatsAppClickTracker />), nunca por
 * onClick espalhado componente a componente: é assim que se garante que um
 * clique físico vira exatamente um evento, sem soma de listener de pai e filho.
 *
 * Nenhum parâmetro carrega dado pessoal. Nome, telefone, e-mail, CPF, o texto
 * da mensagem, hash de visitante, IP e o gclid completo estão fora por regra —
 * o que sai daqui descreve a PÁGINA e o BOTÃO, não a pessoa.
 */
export function trackWhatsAppClick(params: {
  placement: WhatsAppPlacement;
  puppySlug?: string | null;
  campaignContext?: string | null;
}): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics && !consent.marketing) return;

  const payload: Record<string, unknown> = {
    page_path: window.location.pathname,
    page_title: document.title,
    placement: params.placement,
    campaign_context: params.campaignContext ?? detectarContextoDeCampanha(),
  };
  const slug = params.puppySlug?.trim();
  if (slug) payload.puppy_slug = slug;

  // GA4
  if (consent.analytics) {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', payload);
    }
  }

  // Facebook Pixel
  if (consent.marketing) {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Contact', {
        placement: params.placement,
        page_path: payload.page_path,
      });
    }
  }

  // Google Ads — conversão "Clique WhatsApp". Sem valor monetário: clicar para
  // falar é lead, não venda. Só dispara se o label próprio estiver cadastrado.
  trackWhatsAppAdsConversion();
}

/**
 * Tracking de inscrição em newsletter
 */
export function trackNewsletterSubscribe(source: string): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics && !consent.marketing) return;

  // GA4
  if (consent.analytics) {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'newsletter_subscribe', {
        event_category: 'conversion',
        event_label: source,
        value: 1,
      });
    }
  }

  // Facebook Pixel
  if (consent.marketing) {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Subscribe', { source });
    }
  }
}

/**
 * Tracking de compartilhamento social
 */
export function trackShare(platform: string, content: string): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics) return;

  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'share', {
      method: platform,
      content_type: 'blog_post',
      item_id: content,
    });
  }
}

/**
 * Tracking de envio de formulário de lead
 */
export function trackLeadFormSubmit(formName: string): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics && !consent.marketing) return;

  // GA4
  if (consent.analytics) {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        event_category: 'conversion',
        event_label: formName,
        value: 1,
      });
    }
  }

  // Facebook Pixel
  if (consent.marketing) {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { form_name: formName });
    }
  }
}

/**
 * Tracking de abertura de modal de filhote
 */
export function trackPuppyModalOpen(puppyId: string, puppyName: string): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics) return;

  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', {
      event_category: 'engagement',
      event_label: puppyName,
      item_id: puppyId,
    });
  }
}

/**
 * Tracking de CTA genérico
 */
export function trackCTAClick(ctaName: string, location: string): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics) return;

  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'cta_click', {
      event_category: 'conversion',
      event_label: ctaName,
      location,
    });
  }
}

/**
 * Curtida em foto ou vídeo.
 *
 * O GA4 aqui é só analytics. A fonte oficial da contagem é a tabela
 * `media_likes` — se os dois divergirem, quem está certo é o banco. Este
 * evento existe para responder "onde a curtida aconteceu, em que página, em
 * que contexto", que o banco não guarda.
 *
 * Nada que identifique a pessoa sai daqui: nem `visitor_hash`, nem o cookie,
 * nem IP, nem nome, telefone, e-mail ou WhatsApp. O que vai é a descrição da
 * MÍDIA e da PÁGINA.
 *
 * Curtida não é avaliação e não vira AggregateRating em lugar nenhum.
 */
export function trackMediaLike(params: {
  mediaId: string;
  mediaType: 'image' | 'video';
  contextType?: string | null;
  contextId?: string | null;
  curtiu: boolean;
}): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics) return;

  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;

  const payload: Record<string, unknown> = {
    media_id: params.mediaId,
    media_type: params.mediaType,
    page_path: window.location.pathname,
  };
  if (params.contextType) payload.context_type = params.contextType;
  if (params.contextId) payload.context_id = params.contextId;

  gtag('event', params.curtiu ? 'media_like' : 'media_unlike', payload);
}
