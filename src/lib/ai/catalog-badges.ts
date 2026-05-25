type BadgeKey = "hot" | "trend" | "opportunity" | "last_units";

export type CatalogBadge = {
  key: BadgeKey;
  label: string;
  priority: number;
};

export function getBadgesForPuppy(input: {
  score: number;
  flag: "hot" | "normal" | "slow";
  leadCount: number;
  recentGrowth?: number; // % ou boolean-like > 0
  ageDays?: number;
  similarAvailable?: number;
  status?: string | null;
}): CatalogBadge[] {
  const status = input.status ?? "available";
  if (status !== "available") return [];

  const badges: CatalogBadge[] = [];
  const age = input.ageDays ?? 0;
  const similar = input.similarAvailable ?? 99;
  const growthPositive = (input.recentGrowth ?? 0) > 0;

  // 🔥 Muito procurado
  if (input.score >= 85 && input.leadCount >= 10) {
    badges.push({ key: "hot", label: "🔥 Muito procurado", priority: 100 });
  }

  // ⭐ Tendência da semana
  if (input.score >= 70 && input.score <= 84) {
    const trending = growthPositive || (age < 30 && input.leadCount > 0);
    if (trending) {
      badges.push({ key: "trend", label: "⭐ Tendência da semana", priority: 80 });
    }
  }

  // 👀 Oportunidade especial
  if ((input.score < 55 || input.flag === "slow") && input.leadCount <= 2 && age > 30) {
    badges.push({ key: "opportunity", label: "👀 Oportunidade especial", priority: 60 });
  }

  // ⚡ Últimas unidades nessa cor
  if (similar <= 2 && input.leadCount >= 3) {
    badges.push({ key: "last_units", label: "⚡ Últimas unidades nessa cor", priority: 70 });
  }

  return badges.sort((a, b) => b.priority - a.priority);
}
