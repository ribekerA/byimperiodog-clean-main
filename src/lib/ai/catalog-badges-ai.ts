/**
 * CatalogBadgesAI
 * Gera badges com base em score, demanda e contexto de estoque/localização.
 */

export type BadgeKey = "hot" | "trend" | "opportunity" | "last_units";

export type Badge = {
  key: BadgeKey;
  label: string;
  icon: string;
  priority: number;
  ariaLabel: string;
  color: string;
  bgColor: string;
  textColor: string;
};

export type BadgeInput = {
  score: number;
  leadVelocity?: number; // leads por dia (opcional)
  cardCtr?: number; // CTR do card (0-1)
  ageDays?: number;
  similarAvailable?: number;
  originCity?: string;
  userCity?: string;
};

const COLOR_SCHEMES: Record<
  BadgeKey,
  { color: string; bg: string; text: string; icon: string }
> = {
  hot: { color: "#EA580C", bg: "#FFF1E6", text: "#9A3412", icon: "🔥" },
  trend: { color: "#2563EB", bg: "#E0EAFF", text: "#1D4ED8", icon: "⭐" },
  opportunity: { color: "#4F46E5", bg: "#EDE9FE", text: "#4338CA", icon: "👀" },
  last_units: { color: "#22C55E", bg: "#ECFDF3", text: "#15803D", icon: "⚡" },
};

const labelMap: Record<BadgeKey, string> = {
  hot: "Muito procurado",
  trend: "Tendência da semana",
  opportunity: "Oportunidade especial",
  last_units: "Últimas unidades",
};

const priorities: Record<BadgeKey, number> = {
  hot: 100,
  trend: 80,
  last_units: 70,
  opportunity: 60,
};

function getBadgeColorScheme(key: BadgeKey) {
  return COLOR_SCHEMES[key];
}

function formatBadgeForUI(key: BadgeKey, ariaDetails?: string): Badge {
  const scheme = getBadgeColorScheme(key);
  const label = labelMap[key];
  return {
    key,
    label,
    icon: scheme.icon,
    priority: priorities[key],
    ariaLabel: ariaDetails
      ? `${label}. ${ariaDetails}`
      : `${label}. Destaque de interesse.`,
    color: scheme.color,
    bgColor: scheme.bg,
    textColor: scheme.text,
  };
}

export function generateBadges(input: BadgeInput): Badge[] {
  const badges: Badge[] = [];
  const score = input.score;
  const ageDays = input.ageDays ?? 0;
  const similar = input.similarAvailable ?? 99;
  const ctr = input.cardCtr ?? 0;
  const leadVelocity = input.leadVelocity ?? 0;

  // 🔥 Muito procurado
  if (score >= 85) {
    badges.push(
      formatBadgeForUI("hot", `Score ${score}, demanda alta. CTR ${(ctr * 100).toFixed(1)}%.`)
    );
  }

  // ⭐ Tendência da semana
  if (score >= 70 && score <= 84) {
    const trending = leadVelocity > 0 || (ageDays < 30 && ctr > 0.02);
    if (trending) {
      badges.push(
        formatBadgeForUI(
          "trend",
          `Score ${score}, crescimento recente. Leads/dia: ${leadVelocity.toFixed(1)}.`
        )
      );
    }
  }

  // 👀 Oportunidade especial
  if (score < 40) {
    badges.push(formatBadgeForUI("opportunity", `Score ${score}, estoque pede atenção.`));
  }

  // ⚡ Últimas unidades
  if (similar <= 2) {
    badges.push(
      formatBadgeForUI(
        "last_units",
        `Poucos similares disponíveis (${similar}). Aumente a urgência.`
      )
    );
  }

  return badges.sort((a, b) => b.priority - a.priority);
}

export { getBadgeColorScheme, formatBadgeForUI };
