/**
 * Regras da tela de Filhotes do admin (estoque interno).
 *
 * Arquivo puro: sem banco, sem React, sem dependencia. Serve tanto para a
 * pagina (servidor) quanto para os componentes de tela e para as rotas que
 * gravam, e por isso pode ser testado sozinho.
 *
 * Dois fatos conferidos contra o banco de producao e que mandam em tudo aqui:
 *
 * 1. A tabela `puppies` so aceita quatro status: disponivel, reservado,
 *    vendido e indisponivel. "Em breve" e "pendente" nunca existiram no banco.
 * 2. Gravar uma coluna que nao existe derruba o salvamento inteiro (PGRST204).
 *    PUPPY_COLUMNS e a lista do que existe; nada fora dela pode ser gravado.
 *
 * Esta tabela e o estoque interno. As paginas publicas de filhote saem de
 * content/puppies-static.ts e nao leem esta tabela.
 */

import { STATUS_LABEL } from "@/domain/puppy-status";

/* ------------------------------------------------------------------ */
/* Status                                                               */
/* ------------------------------------------------------------------ */

export const ADMIN_PUPPY_STATUSES = ["available", "reserved", "sold", "unavailable"] as const;
export type AdminPuppyStatus = (typeof ADMIN_PUPPY_STATUSES)[number];
export type DbPuppyStatus = "disponivel" | "reservado" | "vendido" | "indisponivel";

// Os rotulos vem de src/domain/puppy-status.ts, o unico lugar autorizado pelo
// guarda da vitrine (scripts/showcase-audit.mts) a escrever nome de status.
export const PUPPY_STATUS_LABEL: Record<AdminPuppyStatus, string> = {
  available: STATUS_LABEL.available,
  reserved: STATUS_LABEL.reserved,
  sold: STATUS_LABEL.sold,
  unavailable: STATUS_LABEL.unavailable,
};

/** Cores de status ja validadas no dashboard (daltonismo e contraste). O nome sempre acompanha a cor. */
export const PUPPY_STATUS_COLOR: Record<AdminPuppyStatus, string> = {
  available: "#1baf7a",
  reserved: "#eb6834",
  sold: "#2a78d6",
  unavailable: "#8a8a85",
};

const STATUS_TO_DB: Record<AdminPuppyStatus, DbPuppyStatus> = {
  available: "disponivel",
  reserved: "reservado",
  sold: "vendido",
  unavailable: "indisponivel",
};

const STATUS_ALIASES: Record<string, AdminPuppyStatus> = {
  available: "available",
  disponivel: "available",
  reserved: "reserved",
  reservado: "reserved",
  sold: "sold",
  vendido: "sold",
  unavailable: "unavailable",
  indisponivel: "unavailable",
  arquivado: "unavailable",
};

/** Minusculas, sem acento e sem espacos nas pontas. */
export function foldText(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Le um status vindo da tela, da URL ou de uma rota. Valor desconhecido
 * devolve null: quem chama recusa o pedido em vez de gravar "disponivel" por
 * engano, que era o que o codigo antigo fazia.
 */
export function parseAdminPuppyStatus(input: unknown): AdminPuppyStatus | null {
  if (typeof input !== "string") return null;
  return STATUS_ALIASES[foldText(input)] ?? null;
}

export function toDbPuppyStatus(input: unknown): DbPuppyStatus | null {
  const status = parseAdminPuppyStatus(input);
  return status ? STATUS_TO_DB[status] : null;
}

/** Status lido do banco. O que nao for reconhecido aparece como indisponivel, nunca como disponivel. */
export function fromDbPuppyStatus(raw: unknown): AdminPuppyStatus {
  return parseAdminPuppyStatus(raw) ?? "unavailable";
}

/* ------------------------------------------------------------------ */
/* Colunas e linha do banco                                             */
/* ------------------------------------------------------------------ */

/** Colunas que existem em `puppies` na producao. */
export const PUPPY_COLUMNS = [
  "id",
  "codigo",
  "name",
  "nome",
  "status",
  "color",
  "cor",
  "sexo",
  "gender",
  "price_cents",
  "preco",
  "created_at",
  "updated_at",
  "midia",
  "cidade",
  "estado",
  "sold_at",
  "reserved_at",
  "nascimento",
  "descricao",
  "customer_id",
  "notes",
] as const;

/** O que a lista le. `catalog_ranking` e uma tabela ligada, nao uma coluna. */
export const PUPPY_LIST_SELECT =
  "id,codigo,nome,name,status,color,cor,gender,sexo,cidade,estado,price_cents,preco,created_at,updated_at,midia,sold_at,reserved_at,nascimento,catalog_ranking(score,flag,reason)";

type RankingEmbed = { score?: number | null; flag?: string | null; reason?: string | null };

export type PuppyRow = {
  id: string;
  codigo?: string | null;
  nome?: string | null;
  name?: string | null;
  status?: string | null;
  color?: string | null;
  cor?: string | null;
  gender?: string | null;
  sexo?: string | null;
  cidade?: string | null;
  estado?: string | null;
  price_cents?: number | string | null;
  preco?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  midia?: unknown;
  sold_at?: string | null;
  reserved_at?: string | null;
  nascimento?: string | null;
  catalog_ranking?: RankingEmbed | RankingEmbed[] | null;
};

export type PuppySex = "male" | "female";

export type AdminPuppyListItem = {
  id: string;
  name: string;
  code: string | null;
  status: AdminPuppyStatus;
  /** Valor cru do banco, para diagnostico. */
  rawStatus: string;
  color: string | null;
  sex: PuppySex | null;
  city: string | null;
  state: string | null;
  /** 0 quando nao ha preco cadastrado. */
  priceCents: number;
  createdAt: string | null;
  soldAt: string | null;
  reservedAt: string | null;
  birthDate: string | null;
  imageUrl: string | null;
  photoCount: number;
  videoCount: number;
  demandScore: number | null;
  demandFlag: string | null;
  demandReason: string | null;
};

/* ------------------------------------------------------------------ */
/* Leitura de campos                                                    */
/* ------------------------------------------------------------------ */

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parsePuppySex(input: unknown): PuppySex | null {
  const key = foldText(input);
  if (!key) return null;
  if (key === "male" || key === "m" || key.startsWith("mach")) return "male";
  if (key === "female" || key === "f" || key.startsWith("fem")) return "female";
  return null;
}

export function puppySexLabel(sex: PuppySex | null | undefined): string {
  if (sex === "male") return "Macho";
  if (sex === "female") return "Fêmea";
  return "";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Preco em centavos: `price_cents` quando preenchido; senao `preco` (em reais). */
export function rowPriceCents(row: Pick<PuppyRow, "price_cents" | "preco">): number {
  const cents = toNumber(row.price_cents);
  if (cents != null && cents > 0) return Math.round(cents);
  const reais = toNumber(row.preco);
  if (reais != null && reais > 0) return Math.round(reais * 100);
  return 0;
}

export type PuppyMedia = { url: string; type: "image" | "video" };

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i;

/**
 * `midia` chega de varios jeitos conforme a epoca do cadastro: lista de
 * enderecos, lista de { url, type } ou o mesmo em texto JSON.
 */
export function parseMidia(midia: unknown): PuppyMedia[] {
  let value = midia;
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    try {
      value = JSON.parse(raw);
    } catch {
      value = [raw];
    }
  }
  if (!Array.isArray(value)) return [];

  const out: PuppyMedia[] = [];
  for (const entry of value) {
    let url: string | null = null;
    let declared: unknown;
    if (typeof entry === "string") {
      url = text(entry);
    } else if (entry && typeof entry === "object") {
      const item = entry as { url?: unknown; src?: unknown; type?: unknown };
      url = text(item.url) ?? text(item.src);
      declared = item.type;
    }
    if (!url) continue;
    const type = declared === "video" || VIDEO_EXTENSION.test(url) ? "video" : "image";
    out.push({ url, type });
  }
  return out;
}

function firstRanking(embed: PuppyRow["catalog_ranking"]): RankingEmbed | null {
  if (!embed) return null;
  if (Array.isArray(embed)) return embed[0] ?? null;
  return embed;
}

/**
 * Linha do banco -> item da lista.
 * `resolveUrl` troca um caminho de arquivo pelo endereco publico (feito no servidor).
 */
export function rowToListItem(row: PuppyRow, resolveUrl: (url: string) => string = (url) => url): AdminPuppyListItem {
  const media = parseMidia(row.midia);
  const cover = media.find((item) => item.type === "image") ?? null;
  const ranking = firstRanking(row.catalog_ranking);
  const code = text(row.codigo);

  return {
    id: row.id,
    name: text(row.nome) ?? text(row.name) ?? code ?? "Filhote sem nome",
    code,
    status: fromDbPuppyStatus(row.status),
    rawStatus: text(row.status) ?? "",
    color: text(row.color) ?? text(row.cor),
    sex: parsePuppySex(row.sexo) ?? parsePuppySex(row.gender),
    city: text(row.cidade),
    state: text(row.estado),
    priceCents: rowPriceCents(row),
    createdAt: text(row.created_at),
    soldAt: text(row.sold_at),
    reservedAt: text(row.reserved_at),
    birthDate: text(row.nascimento),
    imageUrl: cover ? resolveUrl(cover.url) : null,
    photoCount: media.filter((item) => item.type === "image").length,
    videoCount: media.filter((item) => item.type === "video").length,
    demandScore: toNumber(ranking?.score),
    demandFlag: text(ranking?.flag),
    demandReason: text(ranking?.reason),
  };
}

/* ------------------------------------------------------------------ */
/* Filtros, ordem e resumo                                              */
/* ------------------------------------------------------------------ */

export const PUPPY_SORTS = ["recent", "price-asc", "price-desc", "demand"] as const;
export type AdminPuppySort = (typeof PUPPY_SORTS)[number];

export type ParsedPuppyFilters = {
  statuses: AdminPuppyStatus[];
  colors: string[];
  sex?: PuppySex;
  /** Em reais. */
  minPrice?: number;
  /** Em reais. */
  maxPrice?: number;
  search?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function listParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const joined = Array.isArray(value) ? value.join(",") : value;
  return joined
    .split(/[,|]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/** Aceita "4500", "4.500", "4500,50" e "4.500,50". */
function moneyParam(value: string | string[] | undefined): number | undefined {
  const raw = firstParam(value)?.trim();
  if (!raw) return undefined;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/\.(?=\d{3}(?:\D|$))/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parsePuppyFilters(searchParams: SearchParams): { filters: ParsedPuppyFilters; sort: AdminPuppySort } {
  const statuses: AdminPuppyStatus[] = [];
  for (const value of listParam(searchParams.status)) {
    const status = parseAdminPuppyStatus(value);
    if (status && !statuses.includes(status)) statuses.push(status);
  }

  const sexParam = firstParam(searchParams.sex);
  const sex = sexParam === "male" || sexParam === "female" ? sexParam : undefined;
  const search = firstParam(searchParams.search)?.trim() || undefined;
  const sortParam = firstParam(searchParams.sort);
  const sort = (PUPPY_SORTS as readonly string[]).includes(sortParam ?? "") ? (sortParam as AdminPuppySort) : "recent";

  return {
    filters: {
      statuses,
      colors: listParam(searchParams.color),
      sex,
      minPrice: moneyParam(searchParams.priceMin),
      maxPrice: moneyParam(searchParams.priceMax),
      search,
    },
    sort,
  };
}

export function hasActiveFilters(filters: ParsedPuppyFilters): boolean {
  return Boolean(
    filters.statuses.length ||
      filters.colors.length ||
      filters.sex ||
      typeof filters.minPrice === "number" ||
      typeof filters.maxPrice === "number" ||
      filters.search,
  );
}

export function filterPuppies(items: AdminPuppyListItem[], filters: ParsedPuppyFilters): AdminPuppyListItem[] {
  const colorKeys = new Set(filters.colors.map(foldText).filter(Boolean));
  const needle = foldText(filters.search);
  const minCents = typeof filters.minPrice === "number" ? Math.round(filters.minPrice * 100) : null;
  const maxCents = typeof filters.maxPrice === "number" ? Math.round(filters.maxPrice * 100) : null;

  return items.filter((item) => {
    if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;
    if (colorKeys.size && !colorKeys.has(foldText(item.color))) return false;
    if (filters.sex && item.sex !== filters.sex) return false;
    // Filtro de preco so compara quem tem preco: filhote sem preco fica de fora.
    if (minCents != null && (item.priceCents <= 0 || item.priceCents < minCents)) return false;
    if (maxCents != null && (item.priceCents <= 0 || item.priceCents > maxCents)) return false;
    if (needle) {
      const haystack = [item.name, item.code, item.color, item.city, item.state].map(foldText).join(" ");
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

function time(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortPuppies(items: AdminPuppyListItem[], sort: AdminPuppySort): AdminPuppyListItem[] {
  const byRecent = (a: AdminPuppyListItem, b: AdminPuppyListItem) => time(b.createdAt) - time(a.createdAt);
  const copy = [...items];

  if (sort === "price-asc" || sort === "price-desc") {
    const direction = sort === "price-asc" ? 1 : -1;
    return copy.sort((a, b) => {
      // Sem preco vai sempre para o fim, nas duas direcoes.
      if (a.priceCents <= 0 !== b.priceCents <= 0) return a.priceCents <= 0 ? 1 : -1;
      return (a.priceCents - b.priceCents) * direction || byRecent(a, b);
    });
  }

  if (sort === "demand") {
    return copy.sort((a, b) => {
      if ((a.demandScore == null) !== (b.demandScore == null)) return a.demandScore == null ? 1 : -1;
      return (b.demandScore ?? 0) - (a.demandScore ?? 0) || byRecent(a, b);
    });
  }

  return copy.sort(byRecent);
}

export type PuppyStatusSummary = Record<AdminPuppyStatus, number>;

/** Sempre calculado sobre o estoque inteiro, nao sobre o resultado filtrado. */
export function buildStatusSummary(items: Pick<AdminPuppyListItem, "status">[]): PuppyStatusSummary {
  const summary: PuppyStatusSummary = { available: 0, reserved: 0, sold: 0, unavailable: 0 };
  for (const item of items) summary[item.status] += 1;
  return summary;
}

/** Cores que existem no estoque, uma de cada (ignorando maiusculas e acentos), em ordem alfabetica. */
export function colorOptions(items: Pick<AdminPuppyListItem, "color">[]): string[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = foldText(item.color);
    if (key && !seen.has(key)) seen.set(key, item.color!.trim());
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/* ------------------------------------------------------------------ */
/* Gravacao                                                             */
/* ------------------------------------------------------------------ */

type StatusDates = { sold_at?: string | null; reserved_at?: string | null };

export type StatusPatch = { status: DbPuppyStatus; sold_at?: string | null; reserved_at?: string | null };

/**
 * O que gravar quando o status muda.
 *
 * - Vendido: carimba `sold_at` (e o que faz a venda aparecer no dashboard) e
 *   preserva a data se o filhote ja estava marcado como vendido.
 * - Reservado: carimba `reserved_at` e limpa `sold_at`.
 * - Disponivel: limpa as duas datas — voltou para o estoque.
 * - Indisponivel: so muda o status; as datas ficam como historico.
 */
export function statusPatch(current: StatusDates | null | undefined, next: AdminPuppyStatus, nowIso: string): StatusPatch {
  switch (next) {
    case "sold":
      return { status: "vendido", sold_at: current?.sold_at || nowIso };
    case "reserved":
      return { status: "reservado", reserved_at: current?.reserved_at || nowIso, sold_at: null };
    case "available":
      return { status: "disponivel", sold_at: null, reserved_at: null };
    default:
      return { status: "indisponivel" };
  }
}

export type PuppyWriteInput = {
  name?: string | null;
  code?: string | null;
  color?: string | null;
  sex?: unknown;
  city?: string | null;
  state?: string | null;
  priceCents?: number | null;
  status?: AdminPuppyStatus;
  description?: string | null;
  notes?: string | null;
  /** AAAA-MM-DD. */
  birthDate?: string | null;
  media?: PuppyMedia[];
};

function nullableText(value: string | null): string | null {
  return text(value);
}

/**
 * Monta a gravacao so com colunas que existem. Campo que o formulario nao
 * mandou (undefined) fica de fora, para uma edicao nunca apagar o que nao foi
 * mostrado na tela.
 */
export function buildPuppyWritePayload(
  input: PuppyWriteInput,
  options: { nowIso: string; isInsert: boolean; current?: StatusDates | null },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const name = nullableText(input.name);
    payload.nome = name;
    payload.name = name;
  }
  if (input.code !== undefined) payload.codigo = nullableText(input.code);
  if (input.color !== undefined) {
    const color = nullableText(input.color);
    payload.cor = color;
    payload.color = color;
  }
  if (input.sex !== undefined) {
    const sex = parsePuppySex(input.sex);
    // Sexo que nao da para entender nao e gravado: nada de chutar "femea".
    if (sex) {
      payload.sexo = sex === "male" ? "macho" : "femea";
      payload.gender = sex;
    }
  }
  if (input.city !== undefined) payload.cidade = nullableText(input.city);
  if (input.state !== undefined) payload.estado = nullableText(input.state);
  if (input.priceCents !== undefined) {
    const cents =
      typeof input.priceCents === "number" && Number.isFinite(input.priceCents) && input.priceCents > 0
        ? Math.round(input.priceCents)
        : null;
    payload.price_cents = cents;
    payload.preco = cents == null ? null : cents / 100;
  }
  if (input.status !== undefined) Object.assign(payload, statusPatch(options.current, input.status, options.nowIso));
  if (input.description !== undefined) payload.descricao = nullableText(input.description);
  if (input.notes !== undefined) payload.notes = nullableText(input.notes);
  if (input.birthDate !== undefined) {
    const date = nullableText(input.birthDate);
    payload.nascimento = date && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : null;
  }
  if (input.media !== undefined) {
    payload.midia = input.media
      .filter((item) => text(item.url))
      .map((item) => ({ url: item.url.trim(), type: item.type === "video" ? "video" : "image" }));
  }

  payload.updated_at = options.nowIso;
  if (options.isInsert) payload.created_at = options.nowIso;
  return payload;
}

/** Colunas de `payload` que nao existem no banco. Lista vazia = pode gravar. */
export function unknownPuppyColumns(payload: Record<string, unknown>): string[] {
  const known = new Set<string>(PUPPY_COLUMNS);
  return Object.keys(payload).filter((key) => !known.has(key));
}
