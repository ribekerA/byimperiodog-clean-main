/**
 * Eventos de tracking para conversão e engagement
 * Respeita preferências de consentimento LGPD
 */

import { getAttributionParams } from './attribution';
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
 * Tracking de abertura de modal de filhote.
 *
 * O evento chamava-se `view_item` — nome padrão de e-commerce do GA4, que
 * pressupõe um item de catálogo com preço fechado e disponibilidade. Nenhuma
 * das duas coisas descreve estas páginas: são fotos permanentes de uma
 * combinação de cor e sexo, e o preço publicado é ponto de partida. Com o nome
 * de e-commerce, o evento aparecia no GA4 ao lado de add_to_cart e purchase e
 * convidava qualquer pessoa a marcá-lo como conversão — que é exatamente o
 * defeito que este arquivo inteiro existe para impedir.
 *
 * `view_puppy_reference` diz o que de fato aconteceu: alguém olhou uma
 * referência visual. O custo dessa troca é real e vale registrar: relatórios
 * do GA4 montados sobre `view_item` param de receber dados novos a partir do
 * deploy, e a série histórica não se converte sozinha.
 */
export function trackPuppyModalOpen(puppyId: string, puppyName: string): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics) return;

  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'view_puppy_reference', {
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

/* ------------------------------------------------------------------------- *
 * VISUALIZAÇÃO NÃO É LEAD
 *
 * A página do filhote disparava `lead_filhote` e a de contato `lead_contato`,
 * ambos no mount do componente — ou seja, no simples carregamento da página.
 * Quem abrisse a URL e fechasse no segundo seguinte entrava no relatório como
 * lead. Se um desses eventos fosse marcado como conversão no GA4 ou importado
 * para o Google Ads, o Lances Inteligentes passaria a enxergar praticamente
 * 100% dos cliques como convertidos e perderia todo critério para separar
 * clique bom de clique ruim — o mesmo defeito que já foi corrigido em
 * PixelsByConsent e que está documentado lá.
 *
 * Lead nesta operação é o clique em WhatsApp (`whatsapp_click`) e o envio de
 * formulário (`generate_lead`). Visualizar é `view_puppy_reference` /
 * que descrevem interesse, não contato.
 *
 * O segundo defeito era de entrega. O gtag.js é carregado com `lazyOnload`;
 * no instante do mount `window.gtag` quase nunca existe ainda, então a chamada
 * caía num `if (typeof gtag === 'function')` falso e o evento sumia sem erro.
 * Por isso a view espera o script aparecer, com teto de tempo, em vez de
 * disparar uma vez no vazio.
 * ------------------------------------------------------------------------- */

/** Teto da espera pelo gtag: além disso o script foi bloqueado, não atrasado. */
const ESPERA_MAXIMA_GTAG_MS = 10_000;
const INTERVALO_ESPERA_GTAG_MS = 300;

/**
 * Executa `acao` assim que o gtag existir, ou desiste em silêncio.
 *
 * Nada aqui segura a navegação: é um timer, não um await no caminho do
 * visitante. Se o navegador bloqueou o script de analytics, o site funciona
 * igual e o evento simplesmente não é medido.
 */
function comGtag(acao: (gtag: (...args: unknown[]) => void) => void): void {
  if (typeof window === 'undefined') return;

  const agora = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof agora === 'function') {
    acao(agora);
    return;
  }

  const inicio = Date.now();
  const timer = window.setInterval(() => {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      window.clearInterval(timer);
      acao(gtag);
      return;
    }
    if (Date.now() - inicio >= ESPERA_MAXIMA_GTAG_MS) window.clearInterval(timer);
  }, INTERVALO_ESPERA_GTAG_MS);
}

/**
 * Publica a view nas duas rotas possíveis de medição.
 *
 * PixelsByConsent carrega GTM **ou** o gtag do GA4, nunca os dois (o bloco do
 * GA4 é condicionado a `!useGTM`). Por isso publicar nos dois formatos não
 * duplica nada: o `dataLayer.push({ event })` só é lido pelo container do GTM,
 * e o `gtag('event')` só é lido pelo gtag.js. Cada configuração enxerga
 * exatamente um evento.
 */
function publicarView(nome: string, payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const consent = getCurrentConsent();
  if (!consent.analytics) return;

  // Atribuição de origem (first/last touch) já vinha junto no tracker antigo e
  // continua: são utm_source/medium/campaign, que descrevem a CAMPANHA e nunca
  // a pessoa. É o que liga a view à origem paga no relatório.
  const completo = { ...getAttributionParams(), ...payload };

  try {
    const w = window as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: nome, ...completo });
  } catch {
    // Pixel bloqueado pelo navegador não pode quebrar a página.
  }

  comGtag((gtag) => gtag('event', nome, completo));
}

/**
 * Visualização da página de um filhote.
 *
 * `view_puppy_reference` é o mesmo evento que trackPuppyModalOpen usa no modal.
 * Aqui entra com `placement: 'puppy_page'`, então os dois pontos ficam no mesmo
 * relatório e separáveis pelo parâmetro.
 *
 * O nome anterior era `view_item`, padrão de e-commerce do GA4. Ele descrevia a
 * página como ficha de produto e ficava a um clique de ser marcado como
 * conversão. Abrir a página não é pedir contato: lead nesta operação continua
 * sendo `whatsapp_click` e `generate_lead`, e só eles.
 *
 * Nenhum dado pessoal: slug, cor e sexo descrevem o ANIMAL, não o visitante.
 */
export function trackPuppyPageView(params: {
  puppySlug: string;
  puppyColor?: string | null;
  puppySex?: string | null;
}): void {
  if (typeof window === 'undefined') return;

  const payload: Record<string, unknown> = {
    placement: 'puppy_page',
    item_id: params.puppySlug,
    puppy_slug: params.puppySlug,
    page_path: window.location.pathname,
  };
  if (params.puppyColor) payload.puppy_color = params.puppyColor;
  if (params.puppySex) payload.puppy_sex = params.puppySex;

  publicarView('view_puppy_reference', payload);
}

/** Visualização da página de contato. Abrir a página não é pedir contato. */
export function trackContactPageView(): void {
  if (typeof window === 'undefined') return;

  publicarView('view_contact_page', { page_path: window.location.pathname });
}
