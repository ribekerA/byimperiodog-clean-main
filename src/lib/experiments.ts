// Client-side helpers to assign and persist experiment variants
// Usage:
//   const variant = chooseVariant('hero-cta', [
//     { key: 'A', weight: 50 },
//     { key: 'B', weight: 50 },
//   ]);
//   experimentView('hero-cta', variant);

export type VariantInput = { key: string; weight: number };

function storageKey(expKey: string) {
  return `exp:${expKey}`;
}

export function getAssignedVariant(expKey: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(storageKey(expKey));
  } catch {
    return null;
  }
}

export function assignVariant(expKey: string, variant: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(expKey), variant);
  } catch {}
}

export function chooseVariant(expKey: string, variants: VariantInput[]): string {
  // Sticky assignment if exists
  const sticky = getAssignedVariant(expKey);
  if (sticky) return sticky;

  // Weighted random pick
  const total = variants.reduce((acc, v) => acc + Math.max(0, v.weight || 0), 0) || 0;
  let pick = Math.random() * (total > 0 ? total : variants.length);
  let selected = variants[0]?.key || 'A';
  if (total > 0) {
    for (const v of variants) {
      const w = Math.max(0, v.weight || 0);
      if (pick < w) {
        selected = v.key;
        break;
      }
      pick -= w;
    }
  } else if (variants.length > 1) {
    selected = variants[Math.floor(Math.random() * variants.length)].key;
  }

  assignVariant(expKey, selected);
  return selected;
}
