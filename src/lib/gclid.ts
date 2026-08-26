import { getCurrentConsent } from "@/lib/consent";

const CLICK_ID_STORAGE_KEY = "bid_click_id";
/** Cópia desta visita, guardada antes/independente do consentimento. */
const CLICK_ID_SESSION_KEY = "bid_click_id_sessao";
const CLICK_ID_TTL_MS = 90 * 24 * 60 * 60 * 1000;

type StoredClickId = {
  id: string;
  timestamp: number;
};

/**
 * Duas gavetas, de propósito.
 *
 * O gclid identifica um clique de anúncio específico — é identificador de
 * publicidade, e guardá-lo por 90 dias no localStorage de quem ainda não
 * aceitou cookies de marketing é justamente o tipo de armazenamento que a LGPD
 * e o Consent Mode esperam que dependa de escolha. Antes esta função gravava
 * direto, sem perguntar nada.
 *
 * Mas descartar o identificador também não serve: quem chegou por anúncio e
 * preenche o formulário na mesma visita precisa ser reconhecido como vindo do
 * anúncio, senão a responsável nunca sabe qual campanha trouxe o cliente.
 *
 * Então: `sessionStorage` sempre (vale só para esta visita, morre com a aba, é
 * o mínimo para completar a ação que a própria pessoa começou) e
 * `localStorage` por 90 dias SOMENTE com consentimento de marketing. Aceitar
 * depois promove o valor da sessão para a gaveta longa na próxima captura.
 */
function temConsentimentoDeMarketing(): boolean {
  try {
    return getCurrentConsent().marketing === true;
  } catch {
    return false;
  }
}

function lerDaSessao(): string | null {
  try {
    const bruto = window.sessionStorage.getItem(CLICK_ID_SESSION_KEY);
    const id = bruto?.trim();
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * Guarda o identificador mais específico disponível no clique atual. A ordem
 * preserva o gclid quando o Google também acrescenta identificadores auxiliares.
 */
export function captureClickId(): void {
  if (typeof window === "undefined") return;

  let clickId: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    clickId =
      ["gclid", "wbraid", "gbraid"]
        .map((key) => params.get(key)?.trim())
        .find((value): value is string => Boolean(value)) ?? null;
  } catch {
    return;
  }

  // Sem identificador novo na URL, ainda pode haver um da sessão esperando
  // consentimento — é o caso de quem aceitou os cookies depois de navegar.
  const paraGuardar = clickId ?? lerDaSessao();
  if (!paraGuardar) return;

  try {
    window.sessionStorage.setItem(CLICK_ID_SESSION_KEY, paraGuardar);
  } catch {
    // Navegação privada e políticas corporativas podem bloquear o storage; a
    // atribuição não pode impedir o restante da página de funcionar.
  }

  if (!temConsentimentoDeMarketing()) return;

  try {
    const stored: StoredClickId = {
      id: paraGuardar,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(CLICK_ID_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // idem
  }
}

export function getClickId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CLICK_ID_STORAGE_KEY);
    if (!raw) return lerDaSessao();

    const stored = JSON.parse(raw) as Partial<StoredClickId>;
    const id = typeof stored.id === "string" ? stored.id.trim() : "";
    const age = typeof stored.timestamp === "number"
      ? Date.now() - stored.timestamp
      : Number.NaN;
    const isValid =
      id.length > 0 &&
      typeof stored.timestamp === "number" &&
      Number.isFinite(stored.timestamp) &&
      age >= 0 &&
      age <= CLICK_ID_TTL_MS;

    if (!isValid) {
      window.localStorage.removeItem(CLICK_ID_STORAGE_KEY);
      return lerDaSessao();
    }

    return id;
  } catch {
    return lerDaSessao();
  }
}
