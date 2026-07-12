/**
 * UTM Attribution — First Touch & Last Touch
 *
 * First touch: salvo uma vez e nunca sobrescrito. Identifica qual canal trouxe
 * o visitante pela primeira vez ao site.
 *
 * Last touch: atualizado em toda visita com parâmetros UTM. Identifica o último
 * canal que trouxe o visitante antes de converter.
 *
 * Ambos são salvos em localStorage e enviados com eventos GA4 para atribuição
 * completa de canal no relatório de conversões.
 */

export interface TouchData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page: string;
  timestamp: string;
}

const FIRST_TOUCH_KEY = "bid_first_touch";
const LAST_TOUCH_KEY = "bid_last_touch";

function readUtmFromUrl(): TouchData | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  if (!source) return null;
  return {
    utm_source: source,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
    landing_page: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
}

export function captureAttribution(): void {
  try {
    const utmData = readUtmFromUrl();
    if (!utmData) return;
    if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(utmData));
    }
    localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(utmData));
  } catch {
    // localStorage pode estar bloqueado (modo privado, iOS restrito)
  }
}

export function getFirstTouch(): TouchData | null {
  try {
    const raw = localStorage.getItem(FIRST_TOUCH_KEY);
    return raw ? (JSON.parse(raw) as TouchData) : null;
  } catch {
    return null;
  }
}

export function getLastTouch(): TouchData | null {
  try {
    const raw = localStorage.getItem(LAST_TOUCH_KEY);
    return raw ? (JSON.parse(raw) as TouchData) : null;
  } catch {
    return null;
  }
}

/** Retorna propriedades flat para incluir em eventos GA4. */
export function getAttributionParams(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const first = getFirstTouch();
    const last = getLastTouch();
    if (first?.utm_source) result.first_utm_source = first.utm_source;
    if (first?.utm_medium) result.first_utm_medium = first.utm_medium;
    if (first?.utm_campaign) result.first_utm_campaign = first.utm_campaign;
    if (last?.utm_source) result.last_utm_source = last.utm_source;
    if (last?.utm_medium) result.last_utm_medium = last.utm_medium;
    if (last?.utm_campaign) result.last_utm_campaign = last.utm_campaign;
  } catch {
    // silencioso
  }
  return result;
}

/**
 * Retorna o nome legível da plataforma a partir do utm_source.
 * Usado nos relatórios do painel.
 */
export function platformLabel(source?: string | null): string {
  if (!source) return "Direto / Desconhecido";
  const map: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    pinterest: "Pinterest",
    tiktok: "TikTok",
    youtube: "YouTube",
    tumblr: "Tumblr",
    threads: "Threads",
    x: "X (Twitter)",
    kwai: "Kwai",
    vsco: "VSCO",
    googlebusiness: "Google Meu Negócio",
    whatsappstatus: "WhatsApp Status",
    google: "Google Orgânico",
    organic: "Google Orgânico",
  };
  return map[source.toLowerCase()] ?? source;
}
