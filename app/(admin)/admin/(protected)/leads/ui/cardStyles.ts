/** Classes compartilhadas pelos cartoes de analise da ficha do lead. */

export const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";

export const BUTTON =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60";

export const BADGE =
  "inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]";

export const BADGE_OK =
  "inline-flex rounded-full border border-[#b5dccb] bg-[#eaf6f0] px-2 py-0.5 text-xs font-medium text-[#1f4d3a]";

export const BADGE_WARN =
  "inline-flex rounded-full border border-[#e5b9a3] bg-[#fdf1ea] px-2 py-0.5 text-xs font-medium text-[#8a3a12]";

export const ALERT = "rounded-lg border border-[#e5b9a3] bg-[#fdf1ea] px-3 py-2 text-sm text-[#8a3a12]";

export const CARD_HEADER = "flex flex-wrap items-start justify-between gap-3";

export const CARD_TITLE = "text-base font-semibold text-[var(--text)]";

export const CARD_NOTE = "text-xs text-[var(--text-muted)]";

/** Le a resposta de uma rota do admin sem quebrar quando o corpo nao e JSON. */
export async function postJson<T>(url: string, body: unknown, fallbackError: string): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !json) {
    throw new Error(typeof json?.error === "string" && json.error ? json.error : fallbackError);
  }
  return json;
}

/** Guarda o ultimo resultado na aba, para ele continuar a vista ao voltar para a ficha. */
export function readCached<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCached(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento (aba privada, por exemplo) o cartao funciona igual.
  }
}
