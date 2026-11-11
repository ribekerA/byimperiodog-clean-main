/**
 * Moderacao de avaliacoes no admin.
 *
 * A tabela `puppy_reviews` de producao tem: id, puppy_id, author_name, rating,
 * comment, approved, created_at, updated_at. Nao tem status, cidade, foto nem
 * slug: a avaliacao esta aguardando (approved = false) ou aprovada
 * (approved = true), e recusar e excluir.
 *
 * Sem `server-only` de proposito: o cliente do banco entra por parametro e a
 * tela usa os tipos.
 */

import { puppyDisplayName } from "./dashboardMetrics";

export const REVIEW_COLUMNS = "id,puppy_id,author_name,rating,comment,approved,created_at";
export const REVIEW_LIST_LIMIT = 500;

export type ReviewFilter = "pending" | "approved";

export type AdminReview = {
  id: string;
  puppy_id: string | null;
  /** Nome do filhote no estoque interno; null quando nao ha vinculo ou o filhote saiu do cadastro. */
  puppy_label: string | null;
  author_name: string | null;
  rating: number | null;
  comment: string | null;
  approved: boolean;
  created_at: string;
};

export type ReviewCounts = Record<ReviewFilter, number>;

type QueryError = { code?: string; message?: string };
type QueryResult = { data: unknown[] | null; error: QueryError | null; count?: number | null };
type Query = PromiseLike<QueryResult> & {
  eq(column: string, value: unknown): Query;
  in(column: string, values: unknown[]): Query;
  order(column: string, options?: { ascending?: boolean }): Query;
  limit(count: number): Query;
};
export type ReviewsClient = {
  from(table: string): { select(columns: string, options?: { count?: "exact"; head?: boolean }): Query };
};

export function parseReviewFilter(value: string | null | undefined): ReviewFilter {
  return value === "approved" ? "approved" : "pending";
}

async function countReviews(sb: ReviewsClient, approved: boolean): Promise<number> {
  const result = await sb.from("puppy_reviews").select("id", { count: "exact", head: true }).eq("approved", approved);
  if (result.error) throw result.error;
  return result.count ?? 0;
}

export async function listReviews(
  sb: ReviewsClient,
  filter: ReviewFilter,
): Promise<{ items: AdminReview[]; counts: ReviewCounts }> {
  const [list, pending, approved] = await Promise.all([
    sb
      .from("puppy_reviews")
      .select(REVIEW_COLUMNS)
      .eq("approved", filter === "approved")
      .order("created_at", { ascending: false })
      .limit(REVIEW_LIST_LIMIT),
    countReviews(sb, false),
    countReviews(sb, true),
  ]);
  if (list.error) throw list.error;

  const rows = (list.data ?? []) as Array<Omit<AdminReview, "puppy_label">>;
  const puppyIds = [...new Set(rows.map((row) => row.puppy_id).filter((id): id is string => Boolean(id)))];

  const labels = new Map<string, string>();
  if (puppyIds.length > 0) {
    const puppies = await sb.from("puppies").select("id,codigo,name,nome").in("id", puppyIds);
    // O nome do filhote e apoio: se essa leitura falhar, as avaliacoes continuam na tela.
    if (!puppies.error) {
      for (const puppy of (puppies.data ?? []) as Array<{ id: string; codigo: string | null; name: string | null; nome: string | null }>) {
        labels.set(puppy.id, puppyDisplayName(puppy));
      }
    }
  }

  return {
    items: rows.map((row) => ({
      ...row,
      approved: row.approved === true,
      puppy_label: row.puppy_id ? labels.get(row.puppy_id) ?? null : null,
    })),
    counts: { pending, approved },
  };
}
