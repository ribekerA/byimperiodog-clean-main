import "server-only";

import {
  PUPPY_LIST_SELECT,
  buildStatusSummary,
  colorOptions,
  filterPuppies,
  rowToListItem,
  sortPuppies,
  type AdminPuppyListItem,
  type AdminPuppySort,
  type ParsedPuppyFilters,
  type PuppyRow,
  type PuppyStatusSummary,
} from "@/lib/admin/puppyAdmin";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

export { parsePuppyFilters } from "@/lib/admin/puppyAdmin";
export type {
  AdminPuppyListItem,
  AdminPuppySort,
  AdminPuppyStatus,
  ParsedPuppyFilters,
} from "@/lib/admin/puppyAdmin";

/**
 * Leitura do estoque para a tela de Filhotes.
 *
 * Uma consulta so, com colunas conferidas contra o banco de producao
 * (PUPPY_LIST_SELECT). Filtro, ordem, resumo por status e lista de cores sao
 * calculados aqui em cima do que voltou: o estoque e pequeno, e assim nao ha
 * consulta de agregacao que o banco aceita calado e responde errado, como
 * acontecia antes.
 */

const ROW_LIMIT = 2000;

export type AdminPuppiesPayload = {
  /** Resultado ja filtrado e ordenado. */
  items: AdminPuppyListItem[];
  /** Quantos filhotes existem no estoque, sem filtro. */
  total: number;
  /** true quando o estoque passou do limite de leitura e a lista esta incompleta. */
  truncated: boolean;
  colorOptions: string[];
  statusSummary: PuppyStatusSummary;
  /** Ha pelo menos um filhote com nota de procura (habilita a ordem "mais procurados"). */
  hasDemand: boolean;
  /** false quando o ambiente nao tem as credenciais do banco. */
  configured: boolean;
  /** Codigo do erro do banco, quando a leitura falhou. */
  error: { code: string } | null;
};

function toError(error: unknown): { code: string } {
  const info = (error ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof info.code === "string" && info.code ? info.code : "erro";
  console.error("[admin/puppies] falha ao ler o estoque", {
    code,
    message: typeof info.message === "string" ? info.message : String(error),
  });
  return { code };
}

/** Caminho de arquivo do Storage -> endereco publico. Endereco completo passa como veio. */
function resolveMediaUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/") || raw.startsWith("data:")) return raw;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return raw;
  const path = raw.replace(/^storage\/v1\/object\/public\//, "").replace(/^public\//, "");
  return `${base}/storage/v1/object/public/${path}`;
}

function emptyPayload(overrides: Partial<AdminPuppiesPayload>): AdminPuppiesPayload {
  return {
    items: [],
    total: 0,
    truncated: false,
    colorOptions: [],
    statusSummary: buildStatusSummary([]),
    hasDemand: false,
    configured: true,
    error: null,
    ...overrides,
  };
}

export async function fetchAdminPuppies({
  filters,
  sort,
}: {
  filters: ParsedPuppyFilters;
  sort: AdminPuppySort;
}): Promise<AdminPuppiesPayload> {
  // Sem credenciais o cliente devolve lista vazia sem avisar. Mostrar "nenhum
  // filhote" nesse caso seria mentir: a tela diz que o banco nao esta ligado.
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasServiceRoleKey();
  if (!configured) return emptyPayload({ configured: false });

  let rows: PuppyRow[];
  try {
    const { data, error } = await supabaseAdmin()
      .from("puppies")
      .select(PUPPY_LIST_SELECT)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT);
    if (error) return emptyPayload({ error: toError(error) });
    rows = (data ?? []) as unknown as PuppyRow[];
  } catch (error) {
    return emptyPayload({ error: toError(error) });
  }

  const all = rows.map((row) => rowToListItem(row, resolveMediaUrl));

  return {
    items: sortPuppies(filterPuppies(all, filters), sort),
    total: all.length,
    truncated: rows.length >= ROW_LIMIT,
    colorOptions: colorOptions(all),
    statusSummary: buildStatusSummary(all),
    hasDemand: all.some((item) => item.demandScore != null),
    configured: true,
    error: null,
  };
}
