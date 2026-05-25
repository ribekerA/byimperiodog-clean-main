/**
 * CatalogPersonalizationAI
 * Personalização leve por sessão: ajusta score do ranking com base em sinais de navegação.
 */

export type UserProfile = {
  colorPreference?: string | null;
  sexPreference?: string | null;
  priceRangePreference?: { min: number; max: number } | null;
  cityPreference?: string | null;
  activityScore?: number; // indicador geral (0-1 ou 0-100 conforme uso)
};

export type RankedItem = {
  id: string;
  score: number;
  color?: string | null;
  gender?: string | null;
  price_cents?: number | null;
  city?: string | null;
};

export type PersonalizedItem = RankedItem & {
  personalizedScore: number;
  personalizationReason: string;
};

export type PersonalizationResult = {
  userProfile: UserProfile;
  ranking: PersonalizedItem[];
};

function matchColor(itemColor?: string | null, pref?: string | null) {
  if (!pref || !itemColor) return 0;
  return itemColor.toLowerCase() === pref.toLowerCase() ? 10 : 0;
}

function matchSex(itemGender?: string | null, pref?: string | null) {
  if (!pref || !itemGender) return 0;
  const norm = (v: string) => v.toLowerCase();
  return norm(itemGender) === norm(pref) ? 10 : 0;
}

function matchPrice(priceCents?: number | null, range?: { min: number; max: number } | null) {
  if (!priceCents || !range) return 0;
  if (priceCents >= range.min && priceCents <= range.max) return 10;
  // mismatch leve
  if (priceCents < range.min * 0.9 || priceCents > range.max * 1.1) return -5;
  return 5; // parcial
}

function matchCity(itemCity?: string | null, pref?: string | null) {
  if (!pref || !itemCity) return 0;
  return itemCity.toLowerCase() === pref.toLowerCase() ? 10 : 0;
}

/**
 * Ajusta ranking conforme perfil; aplica +/- pontos de forma leve.
 * +10 match perfeito, +5 parcial, -5 mismatch (aplicado em price).
 */
export function personalizeRanking(
  ranking: RankedItem[],
  userProfile: UserProfile,
): PersonalizationResult {
  const adjusted = ranking.map((item) => {
    let bonus = 0;
    const reasons: string[] = [];

    const colorMatch = matchColor(item.color, userProfile.colorPreference);
    if (colorMatch === 10) reasons.push("Cor preferida");
    bonus += colorMatch;

    const sexMatch = matchSex(item.gender, userProfile.sexPreference);
    if (sexMatch === 10) reasons.push("Sexo preferido");
    bonus += sexMatch;

    const priceMatch = matchPrice(item.price_cents ?? null, userProfile.priceRangePreference ?? null);
    if (priceMatch > 0) reasons.push("Preço no perfil");
    if (priceMatch < 0) reasons.push("Fora do perfil de preço");
    bonus += priceMatch;

    const cityMatch = matchCity(item.city, userProfile.cityPreference);
    if (cityMatch === 10) reasons.push("Próximo da sua região");
    bonus += cityMatch;

    // Ajuste leve por atividade (se fornecido)
    if (typeof userProfile.activityScore === "number") {
      const activityBoost = Math.min(Math.max(userProfile.activityScore, 0), 1) * 5; // até +5
      bonus += activityBoost;
    }

    const personalizedScore = Math.max(0, Math.min(100, item.score + bonus));

    return {
      ...item,
      personalizedScore,
      personalizationReason: reasons.join(" · "),
    };
  });

  adjusted.sort((a, b) => b.personalizedScore - a.personalizedScore);

  return {
    userProfile,
    ranking: adjusted,
  };
}
