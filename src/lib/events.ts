/**
 * Eventos de tracking para conversão e engagement
 * Respeita preferências de consentimento LGPD
 */

import { getCurrentConsent } from './consent';

/**
 * Tracking de clique em WhatsApp
 */
export function trackWhatsAppClick(source: string, label?: string): void {
  if (typeof window === 'undefined') return;
  
  const consent = getCurrentConsent();
  if (!consent.analytics && !consent.marketing) return;
  
  // GA4
  if (consent.analytics) {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        event_category: 'conversion',
        event_label: label || source,
        source,
      });
    }
  }
  
  // Facebook Pixel
  if (consent.marketing) {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Contact', { source, label });
    }
  }
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
