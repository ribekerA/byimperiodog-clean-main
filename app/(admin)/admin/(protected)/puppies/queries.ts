import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

const STATUS_TO_DB = {
  available: "disponivel",
  reserved: "reservado",
  sold: "vendido",
  coming_soon: "em_breve",
  unavailable: "indisponivel",
} as const;

const DB_TO_STATUS = new Map<string, AdminPuppyStatus>([
  ["disponivel", "available"],
  ["available", "available"],
  ["reservado", "reserved"],
  ["reserved", "reserved"],
  ["vendido", "sold"],
  ["sold", "sold"],
  ["em_breve", "coming_soon"],
  ["embreve", "coming_soon"],
  ["em-breve", "coming_soon"],
  ["pendente", "coming_soon"],
  ["pending", "coming_soon"],
  ["indisponivel", "unavailable"],
  ["indisponível", "unavailable"],
  ["unavailable", "unavailable"],
  ["arquivado", "unavailable"],
]);

const SORT_OPTIONS = ["recent", "price-asc", "price-desc", "demand"] as const;

export type AdminPuppyStatus = keyof typeof STATUS_TO_DB;
export type AdminPuppySort = (typeof SORT_OPTIONS)[number];

export type ParsedPuppyFilters = {
  statuses: AdminPuppyStatus[];
  colors: string[];
  sex?: "male" | "female";
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type AdminPuppyListItem = {
  id: string;
  name: string;
  slug?: string | null;
  status: AdminPuppyStatus;
  rawStatus: string;
  color?: string | null;
  sex?: "male" | "female" | null;
  city?: string | null;
  state?: string | null;
  priceCents: number;
  createdAt: string;
  imageUrl?: string | null;
  demandScore?: number | null;
  demandFlag?: string | null;
  demandReason?: string | null;
};

export type AdminPuppiesPayload = {
  items: AdminPuppyListItem[];
  total: number;
  hasMore: boolean;
  leadCounts: Record<string, number>;
  colorOptions: string[];
  statusSummary: Record<AdminPuppyStatus, number>;
};

type PuppyRow = Database["public"]["Tables"]["puppies"]["Row"] & {
  catalog_ranking?: { score?: number | null; flag?: string | null; reason?: string | null } | null;
};

type StatusAggRow = { status: string | null; count: number };

type ColorRow = { color: string | null };

type LeadAggRow = { page_slug: string | null; count: number };

const DEFAULT_LIMIT = 200;
const NUMBER_REGEX = /^\d+(?:[\.,]\d+)?$/;

const normalizeSearch = (value?: string) => value?.normalize("NFD").replace(/[`´~^]/g, "").trim();

function parseList(param?: string | string[] | null): string[] {
  if (!param) return [];
  const value = Array.isArray(param) ? param.join(",") : param;
  return value
    .split(/[,|]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function parseNumber(param?: string | string[] | null): number | undefined {
  if (!param) return undefined;
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) return undefined;
  const normalized = raw.replace(/\./g, "").replace(/,/g, ".");
  if (!NUMBER_REGEX.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStatus(value?: string | null): AdminPuppyStatus {
  if (!value) return "available";
  const slug = value.toLowerCase().replace(/\s+/g, "_");
  return DB_TO_STATUS.get(slug) ?? DB_TO_STATUS.get(value.toLowerCase()) ?? "available";
}

function normalizeSex(row: PuppyRow): "male" | "female" | null {
  const sex = row.gender ?? row.sexo;
  if (!sex) return null;
  const value = String(sex).toLowerCase();
  if (value === "male" || value.startsWith("mach")) return "male";
  return "female";
}

function normalizePrice(row: PuppyRow): number {
  if (typeof row.price_cents === "number") return row.price_cents;
  const camelPrice = (row as { priceCents?: number | null }).priceCents;
  if (typeof camelPrice === "number") return camelPrice;
  if (typeof row.preco === "number") return Math.round(row.preco * 100);
  if (typeof row.preco === "string" && row.preco) {
    const precoStr = String(row.preco).trim();
    if (precoStr) {
      const normalized = precoStr.replace(/\./g, "").replace(/,/g, ".");
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return Math.round(parsed * 100);
    }
  }
  return 0;
}

function selectCover(row: PuppyRow): string | null {
  if (typeof row.image_url === "string" && row.image_url.length) return row.image_url;

  const images = Array.isArray(row.images) ? (row.images as unknown[]) : [];
  for (const entry of images) {
    if (typeof entry === "string" && entry.length) return entry;
    if (entry && typeof entry === "object") {
      const url = (entry as { url?: unknown }).url;
      if (typeof url === "string" && url.length) return url;
    }
  }

  const media = Array.isArray(row.midia) ? (row.midia as unknown[]) : [];
  for (const item of media) {
    if (!item || typeof item !== "object") continue;
    const mediaItem = item as { url?: unknown; type?: unknown };
    if (mediaItem.type === "image" && typeof mediaItem.url === "string" && mediaItem.url.length) {
      return mediaItem.url;
    }
  }
  for (const item of media) {
    if (!item || typeof item !== "object") continue;
    const mediaItem = item as { url?: unknown };
    if (typeof mediaItem.url === "string" && mediaItem.url.length) {
      return mediaItem.url;
    }
  }
  return null;
}

export function parsePuppyFilters(searchParams: Record<string, string | string[] | undefined>) {
  const statuses = parseList(searchParams.status)
    .map((value) => value.replace(/-/g, "_"))
    .filter((value): value is AdminPuppyStatus => value in STATUS_TO_DB);

  const colors = parseList(searchParams.color);
  const sexParam = Array.isArray(searchParams.sex) ? searchParams.sex[0] : searchParams.sex;
  const sex = sexParam === "male" || sexParam === "female" ? sexParam : undefined;
  const minPrice = parseNumber(searchParams.priceMin);
  const maxPrice = parseNumber(searchParams.priceMax);
  const search = normalizeSearch(Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search) || undefined;
  const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const sort: AdminPuppySort = SORT_OPTIONS.includes(sortParam as AdminPuppySort) ? (sortParam as AdminPuppySort) : "recent";

  const filters: ParsedPuppyFilters = { statuses, colors, sex, minPrice, maxPrice, search };
  return { filters, sort };
}

export async function fetchAdminPuppies({
  filters,
  sort,
  limit = DEFAULT_LIMIT,
}: {
  filters: ParsedPuppyFilters;
  sort: AdminPuppySort;
  limit?: number;
}): Promise<AdminPuppiesPayload> {
  const supabase = supabaseAdmin();
  let query = supabase
    .from("puppies")
    .select(
      "id,slug,nome,name,status,color,cor,gender,sex,sexo,city,cidade,state,estado,price_cents,priceCents,preco,created_at,image_url,images,midia,catalog_ranking(score,flag,reason)",
      { count: "exact" },
    )
    .limit(limit);

  if (filters.statuses.length) {
    const dbStatuses = filters.statuses.map((status) => STATUS_TO_DB[status]);
    query = query.in("status", dbStatuses);
  }

  if (filters.colors.length) {
    query = query.in("color", filters.colors);
  }

  if (filters.sex) {
    const dbSex = filters.sex === "male" ? "macho" : "femea";
    query = query.or(`gender.eq.${filters.sex},sexo.eq.${dbSex}`);
  }

  if (typeof filters.minPrice === "number") {
    query = query.gte("price_cents", Math.round(filters.minPrice * 100));
  }
  if (typeof filters.maxPrice === "number") {
    query = query.lte("price_cents", Math.round(filters.maxPrice * 100));
  }

  if (filters.search) {
    const like = `%${filters.search.replace(/%/g, "\%")}%`;
    query = query.or(
      ["nome", "name", "slug", "color", "cidade", "city"].map((column) => `${column}.ilike.${like}`).join(","),
    );
  }

  switch (sort) {
    case "price-asc":
      query = query.order("price_cents", { ascending: true, nullsLast: true }).order("created_at", { ascending: false });
      break;
    case "price-desc":
      query = query.order("price_cents", { ascending: false, nullsLast: false }).order("created_at", { ascending: false });
      break;
    case "demand":
      query = query
        .order("score", { referencedTable: "catalog_ranking", ascending: false, nullsLast: true })
        .order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const [listRes, statusAggRes, colorRes] = await Promise.all([
    query,
    supabase.from("puppies").select("status, count:id", { group: "status" }),
    supabase
      .from("puppies")
      .select("color")
      .not("color", "is", null),
  ]);

  if (listRes.error) throw new Error(listRes.error.message);
  if (statusAggRes.error) throw new Error(statusAggRes.error.message);
  if (colorRes.error) throw new Error(colorRes.error.message);

  const rows = (listRes.data ?? []) as PuppyRow[];
  const items: AdminPuppyListItem[] = rows.map((row) => ({
    id: row.id!,
    name: row.nome ?? row.name ?? "Sem nome",
    slug: row.slug ?? null,
    status: normalizeStatus(row.status),
    rawStatus: row.status ?? "",
    color: (row.color ?? row.cor ?? null) as string | null,
    sex: normalizeSex(row),
    city: (row.city ?? row.cidade ?? null) as string | null,
    state: (row.state ?? row.estado ?? null) as string | null,
    priceCents: normalizePrice(row),
    createdAt: row.created_at ?? new Date().toISOString(),
    imageUrl: selectCover(row),
    demandScore: row.catalog_ranking?.score ?? null,
    demandFlag: row.catalog_ranking?.flag ?? null,
    demandReason: row.catalog_ranking?.reason ?? null,
  }));

  const slugSet = new Set<string>();
  items.forEach((item) => {
    if (item.slug) {
      slugSet.add(item.slug);
      slugSet.add(`filhotes/${item.slug}`);
    }
  });

  const leadCounts: Record<string, number> = {};
  if (slugSet.size) {
    const slugList = Array.from(slugSet);
    const { data: leadRows, error } = await supabase
      .from("leads")
      .select("page_slug, count:page_slug", { group: "page_slug" })
      .in("page_slug", slugList);
    if (error) throw new Error(error.message);
    (leadRows as LeadAggRow[]).forEach((row) => {
      if (!row.page_slug) return;
      const normalized = row.page_slug.replace(/^filhotes\//, "");
      leadCounts[normalized] = Number(row.count) || 0;
    });
  }

  const colorOptions = Array.from(
    new Set((colorRes.data as ColorRow[]).map((row) => row.color).filter((value): value is string => Boolean(value))),
  ).sort();

  const initialSummary: Record<AdminPuppyStatus, number> = {
    available: 0,
    reserved: 0,
    sold: 0,
    coming_soon: 0,
    unavailable: 0,
  };
  (statusAggRes.data as StatusAggRow[]).forEach((row) => {
    const status = normalizeStatus(row.status);
    initialSummary[status] += row.count ?? 0;
  });

  const total = listRes.count ?? items.length;

  return {
    items,
    total,
    hasMore: total > items.length,
    leadCounts,
    colorOptions,
    statusSummary: initialSummary,
  };
}
