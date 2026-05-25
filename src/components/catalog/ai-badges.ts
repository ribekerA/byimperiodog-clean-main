import { Eye, Flame, Sparkles, Zap, type LucideIcon } from "lucide-react";

export type AiBadgeId = "hot" | "trending" | "last_units" | "opportunity";

export type AiBadgeConfig = {
  label: string;
  ariaLabel: string;
  icon: LucideIcon;
  className: string;
};

export const AI_BADGE_MAP: Record<AiBadgeId, AiBadgeConfig> = {
  hot: {
    label: "Muito procurado",
    ariaLabel: "Filhote muito procurado segundo a IA",
    icon: Flame,
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  trending: {
    label: "Tendência",
    ariaLabel: "Filhote em tendência de buscas",
    icon: Sparkles,
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  last_units: {
    label: "Últimas unidades",
    ariaLabel: "Poucas unidades disponíveis",
    icon: Zap,
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  opportunity: {
    label: "Oportunidade",
    ariaLabel: "Oportunidade de negociação",
    icon: Eye,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};
