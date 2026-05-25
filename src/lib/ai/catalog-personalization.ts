import type { RankedPuppy } from "@/lib/ai/catalog-ranking";

export type UserSignals = {
  filters?: { color?: string; sex?: string; priceMin?: number; priceMax?: number };
  clickedPuppyIds?: string[];
  clickedColors?: string[];
  clickedSexes?: string[];
  clickedPrices?: number[];
  dwellByPuppy?: Record<string, number>; // ms ou segundos
  detailOpenedId?: string | null;
  whatsappClickIds?: string[];
};

export type Preferences = {
  colorPreference?: string | null;
  sexPreference?: string | null;
  budgetRange?: { min: number; max: number } | null;
};

export type PersonalizedItem = RankedPuppy & {
  personalizedScore: number;
  personalizationReason: string;
};

export type PersonalizationResult = {
  preferences: Preferences;
  ranking: PersonalizedItem[];
};

function topValue(arr: (string | undefined | null)[]) {
  const counts = new Map<string, number>();
  arr.filter(Boolean).forEach((v) => counts.set(v as string, (counts.get(v as string) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function inferPreferences(signals: UserSignals): Preferences {
  const colors: (string | undefined | null)[] = [];
  const sexes: (string | undefined | null)[] = [];
  const prices: number[] = [];

  if (signals.filters?.color) colors.push(signals.filters.color);
  if (signals.filters?.sex) sexes.push(signals.filters.sex);
  colors.push(...(signals.clickedColors ?? []));
  sexes.push(...(signals.clickedSexes ?? []));
  prices.push(...(signals.clickedPrices ?? []));

  const colorPreference = topValue(colors);
  const sexPreference = topValue(sexes);

  let budgetRange: { min: number; max: number } | null = null;
  if (signals.filters?.priceMin !== undefined || signals.filters?.priceMax !== undefined) {
    budgetRange = { min: signals.filters.priceMin ?? 0, max: signals.filters.priceMax ?? Number.MAX_SAFE_INTEGER };
  } else if (prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    budgetRange = { min, max };
  }

  return { colorPreference, sexPreference, budgetRange };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function personalizeRanking(ranking: RankedPuppy[], signals: UserSignals): PersonalizationResult {
  const prefs = inferPreferences(signals);
  const dwell = signals.dwellByPuppy ?? {};
  const waClicks = new Set(signals.whatsappClickIds ?? []);
  const detailId = signals.detailOpenedId;

  const adjusted = ranking.map((p) => {
    let bonus = 0;
    const reasons: string[] = [];

    if (prefs.colorPreference && p.color && p.color.toLowerCase() === prefs.colorPreference.toLowerCase()) {
      bonus += 12;
      reasons.push("Cor preferida");
    }
    if (prefs.sexPreference && p.gender && p.gender.toLowerCase() === prefs.sexPreference.toLowerCase()) {
      bonus += 8;
      reasons.push("Sexo preferido");
    }
    if (prefs.budgetRange && p.price_cents) {
      const inRange = p.price_cents >= prefs.budgetRange.min && p.price_cents <= prefs.budgetRange.max;
      if (inRange) {
        bonus += 10;
        reasons.push("Preço no perfil");
      } else {
        bonus -= 8;
        reasons.push("Fora do perfil de preço");
      }
    }

    const dwellBoost = dwell[p.id] ? Math.min(dwell[p.id] / 1000 / 30, 5) : 0; // até +5 por dwell
    if (dwellBoost > 0) {
      bonus += dwellBoost;
      reasons.push("Interesse recente");
    }

    if (detailId && detailId === p.id) {
      bonus += 5;
      reasons.push("Abriu detalhes");
    }
    if (waClicks.has(p.id)) {
      bonus += 8;
      reasons.push("WhatsApp clicado");
    }

    const personalizedScore = clamp(p.score + bonus, 0, 100);
    return {
      ...p,
      personalizedScore,
      personalizationReason: reasons.slice(0, 3).join(" · "),
    };
  });

  adjusted.sort((a, b) => b.personalizedScore - a.personalizedScore);

  return { preferences: prefs, ranking: adjusted };
}
