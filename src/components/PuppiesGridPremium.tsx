"use client";

/**
 * PUPPIES GRID PREMIUM v2.0
 * 
 * Grid responsivo e otimizado para catálogo de filhotes
 * - Layout mobile-first
 * - Auto-ajuste de colunas
 * - Performance otimizada
 * - Estados de loading elegantes
 * - Filtros integrados
 * - Accessibility completa
 */

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertCircle, ChevronDown, Loader2, RefreshCw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

import type { AiBadgeId } from "@/components/catalog/ai-badges";
import PuppyCardPremium from "@/components/catalog/PuppyCardPremium";
import type { Puppy } from "@/domain/puppy";
import { getBadgesForPuppy, type CatalogBadge } from "@/lib/ai/catalog-badges";
import { personalizeRanking, type UserProfile } from "@/lib/ai/catalog-personalization-ai";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import PuppyDetailsModal from "./PuppyDetailsModal";

type RankingFlag = "hot" | "normal" | "slow";

import type { CatalogSeoOutput } from "@/lib/ai/catalog-seo";

type AiSeoCopy = CatalogSeoOutput;

type RankingSource = "catalog_ai" | "fallback";

type UserSignals = {
  clickedPuppyIds?: string[];
  clickedColors?: string[];
  clickedSexes?: string[];
  clickedPrices?: number[];
  detailOpenedId?: string | null;
  whatsappClickIds?: string[];
  filters?: { color?: string; sex?: string; priceMin?: number; priceMax?: number };
};

type CatalogPuppy = Puppy & {
  rankingFlag?: RankingFlag;
  rankingScore?: number;
  rankingReason?: string;
  rankingPosition?: number;
  rankingSource?: RankingSource;
  badges?: CatalogBadge[];
  aiBadges?: AiBadgeId[];
  aiFlags?: string[];
  aiSeo?: CatalogSeoOutput | null;
  catalogSeo?: CatalogSeoOutput | null;
};

type SortOption = "recommended" | "newest" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Mais recomendados" },
  { value: "newest", label: "Mais novos" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
];

const STATUS_PT_TO_EN: Record<string, Puppy["status"]> = {
  disponivel: "available",
  reservado: "reserved",
  vendido: "sold",
};

const parseDateValue = (value?: string | number | Date | null) => {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const coercePriceCents = (row: any) => {
  const direct = coerceNumber(row.priceCents ?? row.price_cents);
  if (typeof direct === "number") return Math.round(direct);
  const decimal = coerceNumber(row.price);
  if (typeof decimal === "number") return Math.round(decimal * 100);
  return 0;
};

const coerceStatus = (value?: string | null): Puppy["status"] => {
  const normalized = (value || "").toLowerCase();
  if (STATUS_PT_TO_EN[normalized]) return STATUS_PT_TO_EN[normalized];
  if (["available", "reserved", "sold"].includes(normalized)) {
    return normalized as Puppy["status"];
  }
  return "available";
};

const coerceSex = (value?: string | null) => {
  const normalized = (value || "").toLowerCase();
  if (normalized === "female" || normalized === "femea" || normalized === "fêmea") return "female";
  if (normalized === "male" || normalized === "macho") return "male";
  return (value as Puppy["sex"]) || "male";
};

const coerceColor = (value?: string | null) => (value && value.trim().length > 0 ? value : "Cor em avaliação");

const extractImages = (row: any): string[] => {
  if (Array.isArray(row.images) && row.images.length > 0) {
    return row.images.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (Array.isArray(row.midia)) {
    return row.midia
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item.url === "string") return item.url;
        return null;
      })
      .filter((item: any): item is string => Boolean(item));
  }
  // if (Array.isArray(row.media)) {
  //   return row.media
  //     .map((item: any) => {
  //       if (typeof item === "string") return item;
  //       if (item && typeof item.url === "string") return item.url;
  //       return null;
  //     })
  //     .filter((item: any): item is string => Boolean(item));
  // }
  return [];
};

const parseStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : null))
    .filter((entry): entry is string => Boolean(entry));
  return normalized.length > 0 ? normalized : undefined;
};

const parseAiBadges = (row: any): AiBadgeId[] | undefined => {
  const candidates = parseStringArray(row.ai_badges ?? row.aiBadges);
  if (!candidates) return undefined;
  const allowed = new Set<AiBadgeId>(["hot", "trending", "last_units", "opportunity"]);
  const filtered = candidates.filter((badge): badge is AiBadgeId => allowed.has(badge as AiBadgeId));
  return filtered.length > 0 ? filtered : undefined;
};

const parseAiFlags = (row: any): string[] | undefined => parseStringArray(row.ai_flags ?? row.aiFlags);

const parseAiSeo = (row: any): CatalogSeoOutput | null => {
  const value = row.ai_seo ?? row.aiSeo ?? row.catalogSeo ?? null;
  if (!value || typeof value !== "object") return null;
  return {
    shortTitle: value.shortTitle ?? value.short_title ?? "",
    shortDescription: value.shortDescription ?? value.short_description ?? "",
    altText: value.altText ?? value.alt_text ?? "",
    seoKeywords: Array.isArray(value.seoKeywords ?? value.seo_keywords)
      ? (value.seoKeywords ?? value.seo_keywords)
      : [],
    focusedKeywords: Array.isArray(value.focusedKeywords) ? value.focusedKeywords : [],
    structuredDataSnippets: value.structuredDataSnippets ?? {},
    warnings: value.warnings ?? [],
  };
};

const computeBadges = (input: {
  score: number;
  flag: RankingFlag;
  leadCount: number;
  createdAt: Date;
  status?: string | null;
}) => {
  const ageDays = Math.max(0, Math.floor((Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  return getBadgesForPuppy({
    score: input.score,
    flag: input.flag,
    leadCount: input.leadCount,
    ageDays,
    status: input.status,
  });
};

const toCatalogPuppy = (row: any, index: number, source: RankingSource = "catalog_ai"): CatalogPuppy => {
  const createdAt = parseDateValue(row.createdAt ?? row.created_at);
  const priceCents = coercePriceCents(row);
  const rankingScore = typeof row.rankingScore === "number" ? row.rankingScore : typeof row.score === "number" ? row.score : 0;
  const rankingFlag = (row.rankingFlag ?? row.flag ?? "normal") as RankingFlag;
  const rankingReason = row.rankingReason ?? row.reason ?? "";
  const leadCount = coerceNumber(row.leadCount ?? row.lead_count ?? row.catalog_ranking?.lead_count) ?? 0;
  const badges = row.badges ?? computeBadges({ score: rankingScore, flag: rankingFlag, leadCount, createdAt, status: row.status });
  const images = extractImages(row);
  const status = coerceStatus(row.status);
  const base: Partial<CatalogPuppy> = {
    ...row,
    images: images.length > 0 ? images : row.images,
    color: coerceColor(row.color ?? row.cor),
    sex: coerceSex(row.sex ?? row.gender ?? row.sexo),
    status,
    priceCents,
    createdAt,
    rankingScore,
    rankingFlag,
    rankingReason,
    rankingPosition:
      typeof row.rankingPosition === "number"
        ? row.rankingPosition
        : typeof row.rank_order === "number"
          ? row.rank_order
          : typeof row.catalog_ranking?.rank_order === "number"
            ? row.catalog_ranking.rank_order
            : index + 1,
    rankingSource: row.rankingSource ?? source,
    badges,
    aiBadges: row.aiBadges ?? parseAiBadges(row),
    aiFlags: row.aiFlags ?? parseAiFlags(row),
    aiSeo: row.aiSeo ?? parseAiSeo(row),
    catalogSeo: row.catalogSeo ?? row.catalog_seo ?? null,
  };

  if (!base.id) {
    base.id = row.id ?? `${index}`;
  }
  if (!base.name) {
    base.name = row.name ?? row.nome ?? "Filhote";
  }

  return base as CatalogPuppy;
};

const normalizeCatalogItems = (rows?: any[] | null, source: RankingSource = "catalog_ai") => {
  if (!Array.isArray(rows)) return [] as CatalogPuppy[];
  return rows.map((row, index) => toCatalogPuppy(row, index, source));
};

const USER_PROFILE_STORAGE_KEY = "userCatalogProfile";
const USER_PROFILE_COOKIE_KEY = "userCatalogProfile";
const USER_PROFILE_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

const clampArray = <T,>(value: T[] | undefined, limit = 24) => {
  if (!value) return value;
  return value.length > limit ? value.slice(value.length - limit) : value;
};

const appendValue = <T,>(list: T[] | undefined, entry: T | undefined | null, limit = 24) => {
  if (entry === undefined || entry === null) return list;
  const next = [...(list ?? []), entry];
  return clampArray(next, limit);
};

const appendUniqueValue = (list: string[] | undefined, entry: string | undefined | null, limit = 24) => {
  if (!entry) return list;
  const current = list ?? [];
  if (current[current.length - 1] === entry) return current;
  const filtered = current.filter((item) => item !== entry);
  filtered.push(entry);
  return clampArray(filtered, limit);
};

const sanitizeSignals = (signals: UserSignals): UserSignals => ({
  ...signals,
  clickedPuppyIds: clampArray(signals.clickedPuppyIds),
  clickedColors: clampArray(signals.clickedColors),
  clickedSexes: clampArray(signals.clickedSexes),
  clickedPrices: clampArray(signals.clickedPrices),
  whatsappClickIds: clampArray(signals.whatsappClickIds),
});

const buildUserProfileFromSignals = (signals: UserSignals): UserProfile => {
  const latest = <T,>(list?: T[]) => (list && list.length > 0 ? list[list.length - 1] ?? null : null);
  const priceMin = signals.filters?.priceMin ?? null;
  const priceMax = signals.filters?.priceMax ?? null;
  const priceRangePreference =
    priceMin !== null || priceMax !== null
      ? {
          min: priceMin ?? 0,
          max: priceMax ?? Number.MAX_SAFE_INTEGER,
        }
      : null;

  return {
    colorPreference: signals.filters?.color ?? latest(signals.clickedColors) ?? null,
    sexPreference: signals.filters?.sex ?? latest(signals.clickedSexes) ?? null,
    priceRangePreference,
    cityPreference: null,
    activityScore: Math.min(1, (signals.clickedPuppyIds?.length ?? 0) / 8),
  };
};

const hasProfilePreferences = (profile: UserProfile) => {
  return Boolean(
    profile.colorPreference ||
      profile.sexPreference ||
      profile.priceRangePreference ||
      profile.cityPreference ||
      (profile.activityScore && profile.activityScore > 0.01),
  );
};

const personalizeCollection = (collection: CatalogPuppy[], profile: UserProfile): CatalogPuppy[] => {
  if (!collection.length) return collection;
  if (!hasProfilePreferences(profile)) return collection;

  const rankedInput = collection.map((item) => ({
    id: item.id,
    score: item.rankingScore ?? 0,
    color: item.color,
    gender: (item.sex ?? (item as any).gender ?? "") as string,
    price_cents: item.priceCents ?? (item as any).price_cents ?? 0,
    city: item.city ?? null,
  }));

  const personalized = personalizeRanking(rankedInput, profile);
  const map = new Map(collection.map((item) => [item.id, item]));

  return personalized.ranking
    .map((entry, index) => {
      const base = map.get(entry.id);
      if (!base) return null;
      return {
        ...base,
        rankingScore: entry.personalizedScore,
        rankingReason: entry.personalizationReason || base.rankingReason,
        rankingPosition: index + 1,
      } as CatalogPuppy;
    })
    .filter(Boolean) as CatalogPuppy[];
};

const readProfileFromStorage = (): UserSignals | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeSignals(JSON.parse(raw));
  } catch {
    return null;
  }
};

const readProfileFromCookie = (): UserSignals | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${USER_PROFILE_COOKIE_KEY}=([^;]*)`));
  if (!match) return null;
  try {
    return sanitizeSignals(JSON.parse(decodeURIComponent(match[1])));
  } catch {
    return null;
  }
};

const readUserProfile = (): UserSignals | null => readProfileFromStorage() ?? readProfileFromCookie();

const persistUserProfile = (signals: UserSignals) => {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(sanitizeSignals(signals));
  try {
    window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, payload);
  } catch (error) {
    console.warn("[catalog] Falha ao salvar perfil no localStorage", error);
  }
  try {
    document.cookie = `${USER_PROFILE_COOKIE_KEY}=${encodeURIComponent(payload)}; path=/; max-age=${USER_PROFILE_COOKIE_MAX_AGE}; samesite=lax`;
  } catch (error) {
    console.warn("[catalog] Falha ao salvar perfil em cookie", error);
  }
};

const mergeInteractionSignals = (prev: UserSignals, puppy: CatalogPuppy): UserSignals => {
  const clickedPuppyIds = appendUniqueValue(prev.clickedPuppyIds, puppy.id, 24);
  const clickedColors = appendValue(prev.clickedColors, puppy.color, 24);
  const clickedSexes = appendValue(prev.clickedSexes, puppy.sex ?? (puppy as any).gender, 24);
  const clickedPrices = appendValue(
    prev.clickedPrices,
    typeof puppy.priceCents === "number" && puppy.priceCents > 0 ? puppy.priceCents : undefined,
    24
  );

  if (
    clickedPuppyIds === prev.clickedPuppyIds &&
    clickedColors === prev.clickedColors &&
    clickedSexes === prev.clickedSexes &&
    clickedPrices === prev.clickedPrices
  ) {
    return prev;
  }

  return {
    ...prev,
    clickedPuppyIds,
    clickedColors,
    clickedSexes,
    clickedPrices,
  };
};

// ============================================================================
// UTILITIES
// ============================================================================

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// ============================================================================
// SKELETON LOADING
// ============================================================================

function PuppyCardSkeleton() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200" />
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200" />
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ onReset }: { onReset: () => void }) {
  const waLink = buildWhatsAppLink({
    message: "Olá! Não encontrei filhotes com os filtros aplicados. Pode me ajudar a encontrar o Spitz ideal?",
    utmSource: "site",
    utmMedium: "catalog_empty",
    utmCampaign: "filhotes_premium",
    utmContent: "cta_whatsapp",
  });

  return (
    <div className="col-span-full flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <Search className="h-8 w-8 text-zinc-500" aria-label="Busca" focusable="false" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">
          Nenhum filhote encontrado
        </h3>
        <p className="text-sm text-zinc-700">
          Não encontramos filhotes com os filtros selecionados.
          <br />
          Experimente ajustar os critérios de busca.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-label="Limpar filtros" focusable="false" />
          Limpar filtros
        </button>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" role="img" aria-label="WhatsApp">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Falar com especialista
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-6 rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
        <AlertCircle className="h-8 w-8 text-rose-700" aria-label="Alerta de erro" focusable="false" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-rose-900">
          Erro ao carregar filhotes
        </h3>
        <p className="text-sm text-rose-700">
          {message || "Ocorreu um erro inesperado. Tente novamente."}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-4 w-4" aria-label="Tentar novamente" focusable="false" />
        Tentar novamente
      </button>
    </div>
  );
}

// ============================================================================
// FILTER BAR
// ============================================================================

type FilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedGender: string;
  onGenderChange: (value: string) => void;
  selectedColor: string;
  onColorChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  availableColors: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedGender,
  onGenderChange,
  selectedColor,
  onColorChange,
  selectedStatus,
  onStatusChange,
  availableColors,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Barra de busca principal */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
            aria-label="Buscar filhotes"
            focusable="false"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, cor ou características..."
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            aria-label="Buscar filhotes"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            hasActiveFilters
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal className="h-5 w-5" aria-label="Abrir filtros" focusable="false" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
              {[selectedGender, selectedColor, selectedStatus].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Painel de filtros expansível */}
      {showFilters && (
        <div
          id="filter-panel"
          className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:grid-cols-3"
        >
          {/* Filtro: Sexo */}
          <div>
            <label htmlFor="filter-gender" className="mb-2 block text-xs font-semibold text-zinc-700">
              Sexo
            </label>
            <select
              id="filter-gender"
              value={selectedGender}
              onChange={(e) => onGenderChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Todos</option>
              <option value="male">Macho</option>
              <option value="female">Fêmea</option>
            </select>
          </div>

          {/* Filtro: Cor */}
          <div>
            <label htmlFor="filter-color" className="mb-2 block text-xs font-semibold text-zinc-700">
              Cor
            </label>
            <select
              id="filter-color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Todas as cores</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Status */}
          <div>
            <label htmlFor="filter-status" className="mb-2 block text-xs font-semibold text-zinc-700">
              Disponibilidade
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
            </select>
          </div>

          {/* Botão limpar filtros */}
          {hasActiveFilters && (
            <div className="flex items-end sm:col-span-3">
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" aria-label="Limpar filtros" focusable="false" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type InitialFilters = {
  color?: string;
  gender?: string;
  status?: string;
};

type Props = {
  initialItems?: Puppy[];
  initialFilters?: InitialFilters;
};

export default function PuppiesGridPremium({ initialItems = [], initialFilters }: Props) {
  const normalizedInitialItems = useMemo(() => normalizeCatalogItems(initialItems, "catalog_ai"), [initialItems]);

  // Estado base e refs de personalização
  const userSignalsRef = useRef<UserSignals>({});
  const userProfileRef = useRef<UserProfile>(buildUserProfileFromSignals({}));
  const rawItemsRef = useRef<CatalogPuppy[]>(normalizedInitialItems);

  const [items, setItems] = useState<CatalogPuppy[]>(() => personalizeCollection(normalizedInitialItems, userProfileRef.current));
  const [loading, setLoading] = useState(normalizedInitialItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [retryMark, setRetryMark] = useState(0);
  const [isPendingFilter, startTransition] = useTransition();
  const mountedRef = useRef(true);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [rankingSource, setRankingSource] = useState<RankingSource>("catalog_ai");
  const [orderAnnouncement, setOrderAnnouncement] = useState("");
  const orderSignatureRef = useRef("");
  const skipFirstFetchRef = useRef(initialItems.length > 0);
  const initialFilterSignatureRef = useRef(
    JSON.stringify({
      color: initialFilters?.color ?? "",
      gender: initialFilters?.gender ?? "",
      status: initialFilters?.status ?? "",
    })
  );
  const lastSuccessfulRef = useRef<CatalogPuppy[]>(normalizedInitialItems);
  const [userSignals, setUserSignals] = useState<UserSignals>({});
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    rawItemsRef.current = normalizedInitialItems;
    lastSuccessfulRef.current = normalizedInitialItems;
    setItems(personalizeCollection(normalizedInitialItems, userProfileRef.current));
  }, [normalizedInitialItems]);

  useEffect(() => {
    initialFilterSignatureRef.current = JSON.stringify({
      color: initialFilters?.color ?? "",
      gender: initialFilters?.gender ?? "",
      status: initialFilters?.status ?? "",
    });
  }, [initialFilters]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState(initialFilters?.gender ?? "");
  const [selectedStatus, setSelectedStatus] = useState(initialFilters?.status ?? "");
  const [selectedColor, setSelectedColor] = useState(initialFilters?.color ?? "");

  useEffect(() => {
    if (!initialFilters) return;
    setSelectedGender(initialFilters.gender ?? "");
    setSelectedStatus(initialFilters.status ?? "");
    setSelectedColor(initialFilters.color ?? "");
  }, [initialFilters]);

  // Modal
  const [openPuppy, setOpenPuppy] = useState<CatalogPuppy | null>(null);
  const filterSnapshotRef = useRef<{ color: string; gender: string }>({ color: "", gender: "" });
  const priceFilterInitialized = useRef(false);

  const remoteFilters = useMemo(
    () => ({
      color: selectedColor || undefined,
      gender: selectedGender || undefined,
      status: selectedStatus || undefined,
    }),
    [selectedColor, selectedGender, selectedStatus]
  );

  // Fetch puppies
  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    // Static mode: initialItems provided — all filtering is client-side, no API needed.
    if (initialItems.length > 0 && retryMark === 0) {
      if (mountedRef.current) setLoading(false);
      return () => {
        mountedRef.current = false;
        controller.abort();
      };
    }

    const currentSignature = JSON.stringify(remoteFilters);

    if (skipFirstFetchRef.current && currentSignature === initialFilterSignatureRef.current && retryMark === 0) {
      skipFirstFetchRef.current = false;
      return () => {
        mountedRef.current = false;
        controller.abort();
      };
    }

    skipFirstFetchRef.current = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (remoteFilters.color) params.set("color", remoteFilters.color);
        if (remoteFilters.gender) params.set("gender", remoteFilters.gender);
        if (remoteFilters.status) params.set("status", remoteFilters.status);
        const query = params.toString();
        const url = query ? `/api/catalog/ranked?${query}` : "/api/catalog/ranked";
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          throw new Error("Falha ao carregar catálogos ranqueados");
        }
        const json = await response.json();
        const normalized = normalizeCatalogItems(json.data ?? [], "catalog_ai");
        if (!mountedRef.current) return;
        rawItemsRef.current = normalized;
        lastSuccessfulRef.current = normalized;
        setItems(personalizeCollection(normalized, userProfileRef.current));
        setRankingSource("catalog_ai");
        track.event?.("list_loaded", {
          count: normalized.length,
          version: "premium",
          source: "catalog_ai",
          filters: remoteFilters,
        });
      } catch (e) {
        const err = e as { name?: string; message?: string };
        if (err?.name === "AbortError") return;
        if (!mountedRef.current) return;
        const fallbackSource = lastSuccessfulRef.current.length > 0 ? lastSuccessfulRef.current : normalizedInitialItems;
        if (fallbackSource.length > 0) {
          const sortedFallback = [...fallbackSource]
            .sort((a, b) => {
              const dateDiff = b.createdAt.getTime() - a.createdAt.getTime();
              if (dateDiff !== 0) return dateDiff;
              return (a.priceCents ?? 0) - (b.priceCents ?? 0);
            })
            .map((item, index) => ({
              ...item,
              rankingSource: "fallback" as RankingSource,
              rankingPosition: index + 1,
            }));
          setItems(personalizeCollection(sortedFallback, userProfileRef.current));
          rawItemsRef.current = sortedFallback;
        }
        setRankingSource("fallback");
        setError(err?.message || "Erro ao carregar filhotes.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [remoteFilters, retryMark, normalizedInitialItems]);

  // Load stored user profile once (antes do primeiro paint)
  useLayoutEffect(() => {
    if (typeof window === "undefined" || profileLoaded) return;
    const storedProfile = readUserProfile();
    if (storedProfile) {
      userSignalsRef.current = storedProfile;
      userProfileRef.current = buildUserProfileFromSignals(storedProfile);
      setUserSignals(storedProfile);
      setItems(personalizeCollection(rawItemsRef.current, userProfileRef.current));
    }
    setProfileLoaded(true);
  }, [profileLoaded]);

  // Persist profile changes
  useEffect(() => {
    if (!profileLoaded) return;
    persistUserProfile(userSignals);
  }, [userSignals, profileLoaded]);

  // Recalcula ranking personalizado quando sinais mudarem
  useEffect(() => {
    userSignalsRef.current = userSignals;
    userProfileRef.current = buildUserProfileFromSignals(userSignals);
    if (!profileLoaded) return;
    setItems(personalizeCollection(rawItemsRef.current, userProfileRef.current));
  }, [userSignals, profileLoaded]);

  // Capture price filters from URL (if available)
  useEffect(() => {
    if (!profileLoaded || typeof window === "undefined" || priceFilterInitialized.current) return;
    const params = new URLSearchParams(window.location.search);
    const minParam = params.get("priceMin") ?? params.get("minPrice");
    const maxParam = params.get("priceMax") ?? params.get("maxPrice");
    priceFilterInitialized.current = true;
    if (!minParam && !maxParam) return;

    const min = minParam !== null ? Number(minParam) : undefined;
    const max = maxParam !== null ? Number(maxParam) : undefined;
    const normalizePrice = (value?: number) =>
      typeof value === "number" && Number.isFinite(value) ? value : undefined;
    const priceMin = normalizePrice(min);
    const priceMax = normalizePrice(max);

    if (priceMin === undefined && priceMax === undefined) return;

    setUserSignals((prev) => {
      const currentFilters = prev.filters ?? {};
      if (currentFilters.priceMin === priceMin && currentFilters.priceMax === priceMax) {
        return prev;
      }
      return {
        ...prev,
        filters: {
          ...currentFilters,
          priceMin,
          priceMax,
        },
      };
    });
  }, [profileLoaded]);

  // Cores disponíveis
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      if (p.color) set.add(p.color);
    }
    return Array.from(set).sort();
  }, [items]);

  // Filtrar itens
  const filtered = useMemo(() => {
    // Filhotes fixos SEMPRE aparecem no topo, ignorando qualquer filtro
    const alwaysShow = items.filter((p) => p.id && p.id.startsWith("static-"));
    let result = items.filter((p) => !p.id || !p.id.startsWith("static-"));

    // NÃO filtra os fixos por busca, sexo, cor ou status
    // Aplica filtros apenas nos demais
    if (searchQuery.trim()) {
      const q = normalize(searchQuery);
      result = result.filter((p) => {
        const text = normalize(`${p.name} ${p.color} ${p.description || ""}`);
        return text.includes(q);
      });
    }
    if (selectedGender) {
      result = result.filter((p) => p.sex === selectedGender);
    }
    if (selectedColor) {
      result = result.filter((p) => p.color === selectedColor);
    }
    if (selectedStatus) {
      const map: Record<string, string> = {
        disponivel: "available",
        reservado: "reserved",
        vendido: "sold",
      };
      const target = map[selectedStatus] || selectedStatus;
      result = result.filter((p) => p.status === target);
    }

    // Filhotes fixos SEMPRE no topo
    return [...alwaysShow, ...result];
  }, [items, searchQuery, selectedGender, selectedColor, selectedStatus]);

  const sorted = useMemo(() => {
    const data = [...filtered];

    switch (sortBy) {
      case "newest":
        return data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case "price-asc":
        return data.sort((a, b) => a.priceCents - b.priceCents);
      case "price-desc":
        return data.sort((a, b) => b.priceCents - a.priceCents);
      default:
        return data;
    }
  }, [filtered, sortBy]);

  useEffect(() => {
    if (sorted.length === 0) {
      setOrderAnnouncement("Nenhum filhote encontrado com os filtros atuais.");
      orderSignatureRef.current = "";
      return;
    }

    const signature = sorted.map((item) => item.id).join("-");
    if (signature === orderSignatureRef.current) return;
    orderSignatureRef.current = signature;
    const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? "Ordem atualizada";
    const message =
      sortBy === "recommended" && rankingSource === "catalog_ai"
        ? "IA priorizou os filhotes mais aderentes ao seu perfil"
        : sortLabel;
    setOrderAnnouncement(`Catálogo atualizado (${sorted.length}). ${message}.`);
  }, [sorted, sortBy, rankingSource]);

  // Handlers
  const retry = useCallback(() => {
    setRetryMark((m) => m + 1);
  }, []);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("");
      setSelectedGender("");
      setSelectedColor("");
      setSelectedStatus("");
      filterSnapshotRef.current = { color: "", gender: "" };
      setUserSignals({});
    });
  }, []);

  // Atualiza sinais de usuário conforme filtros
  useEffect(() => {
    if (!profileLoaded) return;
    if (
      filterSnapshotRef.current.color === selectedColor &&
      filterSnapshotRef.current.gender === selectedGender
    ) {
      return;
    }
    filterSnapshotRef.current = { color: selectedColor, gender: selectedGender };
    setUserSignals((prev) => {
      const currentFilters = prev.filters ?? {};
      const nextFilters = {
        ...currentFilters,
        color: selectedColor || undefined,
        sex: selectedGender || undefined,
      };
      if (
        currentFilters.color === nextFilters.color &&
        currentFilters.sex === nextFilters.sex
      ) {
        return prev;
      }
      return {
        ...prev,
        filters: nextFilters,
      };
    });
  }, [selectedColor, selectedGender, profileLoaded]);

  const updateSignalsWithInteraction = useCallback(
    (puppy: CatalogPuppy, extra?: (signals: UserSignals) => UserSignals) => {
      setUserSignals((prev) => {
        const base = mergeInteractionSignals(prev, puppy);
        if (!extra) return base;
        const next = extra(base);
        return next;
      });
    },
    []
  );

  const handleOpenDetails = useCallback(
    (puppy: CatalogPuppy) => {
      setOpenPuppy(puppy);
      updateSignalsWithInteraction(puppy, (signals) => {
        if (signals.detailOpenedId === puppy.id) return signals;
        return { ...signals, detailOpenedId: puppy.id };
      });
    },
    [updateSignalsWithInteraction]
  );

  const handleWhatsAppClick = useCallback(
    (puppy: CatalogPuppy) => {
      updateSignalsWithInteraction(puppy, (signals) => {
        const whatsappClickIds = appendUniqueValue(signals.whatsappClickIds, puppy.id, 24);
        if (whatsappClickIds === signals.whatsappClickIds) return signals;
        return { ...signals, whatsappClickIds };
      });
    },
    [updateSignalsWithInteraction]
  );

  const hasActiveFilters = Boolean(
    searchQuery || selectedGender || selectedColor || selectedStatus
  );

  return (
    <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8" aria-label="Catálogo de filhotes">
      {/* Cabeçalho */}
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Nossos Filhotes Disponíveis
        </h2>
        <p className="mt-3 text-lg text-zinc-700">
          Spitz Alemão Anão (Lulu da Pomerânia) de criação responsável com registro oficial
        </p>
      </header>

      {/* Barra de filtros */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        availableColors={availableColors}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Contador de resultados */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-sm text-zinc-700">
          <p>
            {isPendingFilter ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-label="Atualizando catálogo" focusable="false" />
                Atualizando...
              </span>
            ) : (
              <span>
                <strong className="font-semibold text-zinc-900">{sorted.length}</strong>{" "}
                {sorted.length === 1 ? "filhote encontrado" : "filhotes encontrados"}
              </span>
            )}
          </p>
          <div
            className="flex items-center gap-2 text-xs font-semibold text-emerald-700"
            role="status"
            aria-live="polite"
          >
            <Sparkles className="h-4 w-4" aria-label="Ordenação inteligente" focusable="false" />
            <span>
              {rankingSource === "catalog_ai"
                ? "Ordenação inteligente por IA"
                : "Ordem alternativa baseada em recência"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <label htmlFor="catalog-sort" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Ordenar por
          </label>
          <div className="relative">
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-medium text-zinc-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <ChevronDown className="h-4 w-4" aria-label="Abrir opções de ordenação" focusable="false" />
            </span>
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
        {orderAnnouncement}
      </div>

      {/* Estado de erro */}
      {error && (
        <div className="mt-8">
          <ErrorState message={error} onRetry={retry} />
        </div>
      )}

      {/* Grid principal */}
      <div
        className="mt-6 sm:mt-8 grid auto-rows-fr grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-busy={loading || isPendingFilter}
        aria-live="polite"
        aria-label="Resultados do catálogo de filhotes"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <PuppyCardSkeleton key={`skeleton-${i}`} />)
        ) : (
          <LayoutGroup>
            <AnimatePresence initial={false}>
              {sorted.map((puppy, index) => (
                <motion.div
                  key={puppy.id}
                  id={`filhote-${puppy.id}`}
                  role="listitem"
                  layout
                  layoutId={puppy.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <PuppyCardPremium
                    puppy={puppy}
                    coverImage={puppy.images?.[0]}
                    badges={puppy.badges}
                    onOpenDetails={() => handleOpenDetails(puppy)}
                    onWhatsAppClick={() => handleWhatsAppClick(puppy)}
                    priority={index < 4}
                    // rankingFlags removido: não existe em PuppyCardProps
                    // aiBadges removido: não existe em PuppyCardProps
                    // rankingPosition, rankingReason, rankingSource removidos: não existem em PuppyCardProps
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </LayoutGroup>
        )}
      </div>

      {/* Estado vazio */}
      {!loading && !error && sorted.length === 0 && (
        <div className="mt-8">
          <EmptyState onReset={clearFilters} />
        </div>
      )}

      {/* Modal de detalhes */}
      {openPuppy && <PuppyDetailsModal puppy={openPuppy} onClose={() => setOpenPuppy(null)} />}
    </section>
  );
}
