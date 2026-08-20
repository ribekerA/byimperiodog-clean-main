const CLICK_ID_STORAGE_KEY = "bid_click_id";
const CLICK_ID_TTL_MS = 90 * 24 * 60 * 60 * 1000;

type StoredClickId = {
  id: string;
  timestamp: number;
};

/**
 * Guarda o identificador mais específico disponível no clique atual. A ordem
 * preserva o gclid quando o Google também acrescenta identificadores auxiliares.
 */
export function captureClickId(): void {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    const clickId = ["gclid", "wbraid", "gbraid"]
      .map((key) => params.get(key)?.trim())
      .find((value): value is string => Boolean(value));

    if (!clickId) return;

    const stored: StoredClickId = {
      id: clickId,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(CLICK_ID_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Navegação privada e políticas corporativas podem bloquear o storage; a
    // atribuição não pode impedir o restante da página de funcionar.
  }
}

export function getClickId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CLICK_ID_STORAGE_KEY);
    if (!raw) return null;

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
      return null;
    }

    return id;
  } catch {
    return null;
  }
}
