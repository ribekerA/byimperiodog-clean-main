"use client";

/**
 * Conversão do Google Ads — disparo EXPLÍCITO, nunca automático.
 *
 * Antes o evento de conversão morava dentro do <Script> de inicialização do
 * Ads, em src/components/PixelsByConsent.tsx. Aquele componente é renderizado
 * pelo layout público, ou seja, em TODAS as páginas: bastava a responsável
 * preencher o label no admin para o site registrar uma conversão a cada
 * pageview. O Lances Inteligentes leria "100% dos cliques convertem", pararia
 * de distinguir clique bom de clique ruim e a campanha viraria ruído caro.
 *
 * A regra que este arquivo existe para sustentar: conversão só acontece quando
 * alguém CHAMA uma função daqui, num ponto do código em que a ação de fato
 * aconteceu (formulário enviado com sucesso, por exemplo).
 */

import { getCurrentConsent } from "@/lib/consent";
import { safePushToDataLayer } from "@/lib/tracking";

type GtagFn = (...args: unknown[]) => void;

export const GOOGLE_ADS_READY_EVENT = "byimperiodog:google-ads-ready";

/**
 * O ID da conta e o label vivem no servidor (pixels_settings, editável no
 * admin). O padrão do projeto é o servidor passar esses valores como prop para
 * um componente client — e o <PixelsByConsent> já recebe os dois. Ele registra
 * aqui no mount para que qualquer clique posterior (envio de formulário, por
 * exemplo) consiga disparar sem que cada página precise repassar as configurações.
 *
 * Para disparo NO MOUNT (a página /obrigado), não dependa deste registro: a
 * ordem entre efeitos de componentes irmãos não é garantida. Lá o componente
 * recebe os valores por prop e chama registerAdsAccount antes de disparar.
 */
let adsId: string | null = null;
let leadLabel: string | null = null;

function limpar(valor: string | null | undefined): string | null {
  const texto = (valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

export function registerAdsAccount(config: {
  adsId?: string | null;
  leadLabel?: string | null;
}): void {
  if (config.adsId !== undefined) adsId = limpar(config.adsId);
  if (config.leadLabel !== undefined) leadLabel = limpar(config.leadLabel);
}

export function getAdsAccountId(): string | null {
  return adsId;
}

export function getAdsLeadLabel(): string | null {
  return leadLabel;
}

/**
 * Dispara uma conversão do Google Ads.
 *
 * Devolve `true` somente quando o evento saiu de fato — assim quem chama
 * consegue registrar em log/teste se a conversão foi perdida por falta de
 * consentimento, de gtag ou de configuração.
 */
export function trackAdsConversion(
  label: string,
  value?: number,
  transactionId?: string
): boolean {
  if (typeof window === "undefined") return false;

  const alvo = limpar(label);
  if (!alvo || !adsId) return false;

  // Consentimento de marketing é condição, não detalhe: sem ele o gtag do Ads
  // nem chega a ser carregado, e disparar assim mesmo só geraria erro no
  // console. Reaproveita a mesma leitura que o banner de cookies grava.
  let permitido = false;
  try {
    permitido = getCurrentConsent().marketing === true;
  } catch {
    permitido = false;
  }
  if (!permitido) return false;

  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return false;

  const payload: Record<string, unknown> = { send_to: `${adsId}/${alvo}` };
  // `value` sem `currency` faz o Ads assumir a moeda da conta; sendo um canil
  // brasileiro, deixar implícito é pedir para o número ser lido errado.
  if (typeof value === "number" && Number.isFinite(value)) {
    payload.value = value;
    payload.currency = "BRL";
  }
  // O transaction_id é o que permite ao Ads descartar a conversão repetida
  // quando o mesmo lead passa por dois caminhos (por exemplo formulário e,
  // depois, uma página de obrigado).
  const transacao = limpar(transactionId);
  if (transacao) payload.transaction_id = transacao;

  try {
    gtag("event", "conversion", payload);
  } catch {
    return false;
  }

  // O espelho no dataLayer permite que o mesmo disparo seja auditado no GTM e
  // mantém todos os destinos no helper central de tracking do projeto.
  safePushToDataLayer("conversion", payload);
  return true;
}

/**
 * Publica o evento de lead para GA4/GTM sem depender de uma conta do Ads.
 * O label pode legitimamente ainda não estar configurado; isso não deve tornar
 * invisível para a análise um formulário que foi concluído de verdade.
 */
export function trackGenerateLead(options?: {
  value?: number;
  transactionId?: string;
  contexto?: Record<string, unknown>;
}): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (!getCurrentConsent().marketing) return false;
  } catch {
    return false;
  }

  safePushToDataLayer("generate_lead", {
    ...(options?.contexto ?? {}),
    ...(options?.value !== undefined ? { value: options.value, currency: "BRL" } : {}),
    ...(options?.transactionId ? { transaction_id: options.transactionId } : {}),
  });
  return true;
}

/**
 * Conversão de "lead de formulário" usando o label configurado no admin
 * (pixels_settings.googleAdsConversionLabel).
 *
 * Dispara SÓ o Ads de propósito: nos formulários o evento de GA4/Meta já sai
 * por trackLeadFormSubmit (src/lib/events.ts). Publicar `generate_lead` aqui
 * também faria o mesmo envio ser contado duas vezes na análise.
 */
export function trackLeadAdsConversion(options?: {
  label?: string;
  value?: number;
  transactionId?: string;
}): boolean {
  const label = limpar(options?.label) ?? leadLabel;
  if (!label) return false;
  return trackAdsConversion(label, options?.value, options?.transactionId);
}

/**
 * Marca "esta pessoa acabou de enviar o formulário".
 *
 * Existe porque /obrigado não é alcançada por nenhum link do site: se a página
 * disparasse conversão só por ser aberta, um acesso direto ou um favorito
 * viraria lead falso — exatamente o problema que acabamos de tirar do
 * PixelsByConsent. Com a marca, /obrigado converte apenas quem realmente
 * enviou, e o mesmo id vai como transaction_id nos dois disparos para o Ads
 * descartar a repetição.
 *
 * sessionStorage (e não localStorage): a marca vale para esta visita apenas.
 */
const PENDING_LEAD_KEY = "bid_pending_lead";
const PENDING_LEAD_TTL_MS = 30 * 60 * 1000;

export function rememberLeadConversion(transactionId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      PENDING_LEAD_KEY,
      JSON.stringify({ id: limpar(transactionId), timestamp: Date.now() })
    );
  } catch {
    // Navegação privada pode bloquear o storage; perder a marca só significa
    // que /obrigado não vai disparar — nunca que o envio falhou.
  }
}

export function readPendingLeadConversion(): { id: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_LEAD_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as { id?: unknown; timestamp?: unknown };
    const timestamp = typeof stored.timestamp === "number" ? stored.timestamp : Number.NaN;
    const idade = Date.now() - timestamp;
    if (!Number.isFinite(timestamp) || idade < 0 || idade > PENDING_LEAD_TTL_MS) {
      clearPendingLeadConversion();
      return null;
    }

    return { id: typeof stored.id === "string" ? limpar(stored.id) : null };
  } catch {
    return null;
  }
}

export function clearPendingLeadConversion(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_LEAD_KEY);
  } catch {
    // idem
  }
}
