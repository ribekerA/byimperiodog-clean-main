import { getCurrentConsent } from '@/lib/consent';

const KEY = 'bid_click_ids_v2';
const TTL = 90 * 24 * 60 * 60 * 1000;
const TYPES = ['gclid', 'wbraid', 'gbraid'] as const;
export type ClickAttribution = Partial<Record<(typeof TYPES)[number], string>>;
type Stored = { ids: ClickAttribution; timestamp: number };

function marketingAllowed(): boolean {
  return typeof window !== 'undefined' && getCurrentConsent().marketing === true;
}
function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 2048 && /^[a-zA-Z0-9_.~-]+$/.test(value);
}
function read(storage: Storage): ClickAttribution | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Stored;
    const age = Date.now() - saved.timestamp;
    if (typeof saved.timestamp !== 'number' || !Number.isFinite(age) || age < 0 || age > TTL || !saved.ids) {
      storage.removeItem(KEY);
      return null;
    }
    const ids = Object.fromEntries(TYPES.filter((type) => validId(saved.ids[type])).map((type) => [type, saved.ids[type]]));
    return Object.keys(ids).length ? ids : null;
  } catch { return null; }
}

/** Advertising identifiers are stored only after marketing consent, with their original types. */
export function captureClickId(): void {
  if (typeof window === 'undefined') return;
  try {
    // Legacy values lost their type: never reinterpret an old braid as a GCLID.
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try { storage.removeItem('bid_click_id'); storage.removeItem('bid_click_id_sessao'); } catch { /* Best effort. */ }
    }
    if (!marketingAllowed()) return;
    const params = new URLSearchParams(window.location.search);
    const ids: ClickAttribution = {};
    for (const type of TYPES) {
      const value = params.get(type)?.trim();
      if (validId(value)) ids[type] = value;
    }
    if (!Object.keys(ids).length) return;
    const value = JSON.stringify({ ids, timestamp: Date.now() } satisfies Stored);
    for (const storage of [window.sessionStorage, window.localStorage]) {
      try { storage.setItem(KEY, value); } catch { /* Best effort. */ }
    }
  } catch { /* Storage restrictions must not break navigation. */ }
}

export function getClickAttribution(): ClickAttribution {
  if (!marketingAllowed()) return {};
  try { return read(window.sessionStorage) ?? read(window.localStorage) ?? {}; }
  catch { return {}; }
}

/** Compatibility for the existing CRM column: ONLY a real GCLID may enter it. */
export function getClickId(): string | null {
  return getClickAttribution().gclid ?? null;
}
