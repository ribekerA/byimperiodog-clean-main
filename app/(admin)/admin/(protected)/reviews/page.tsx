"use client";

/**
 * /admin/reviews — Moderação de avaliações de filhotes
 *
 * Features:
 *  • Lista de avaliações pendentes / aprovadas / rejeitadas
 *  • Aprovar / Rejeitar com um clique
 *  • Preview de foto quando presente
 *  • Feedback visual imediato
 */

import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";
import { StarRating } from "@/components/reviews/StarRating";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Review {
  id:            string;
  puppy_slug:    string;
  reviewer_name: string;
  reviewer_city: string | null;
  rating:        number;
  comment:       string;
  photo_url:     string | null;
  status:        "pending" | "approved" | "rejected";
  created_at:    string;
}

type FilterStatus = "pending" | "approved" | "rejected";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day:    "2-digit",
      month:  "2-digit",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STATUS_BADGE: Record<FilterStatus, string> = {
  pending:  "bg-amber-100 text-amber-800",
  approved: "bg-[var(--brand-tint-100)] text-[var(--brand)]",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<FilterStatus, string> = {
  pending:  "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ReviewsModerationPage() {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<FilterStatus>("pending");
  const [acting,     setActing]     = useState<string | null>(null); // id em ação

  const fetchReviews = useCallback(async (status: FilterStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/reviews?status=${status}&limit=2000`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar");
      setReviews(json.reviews ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(filter); }, [filter, fetchReviews]);

  async function act(id: string, status: "approved" | "rejected") {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Falha");
      }
      // Remove da lista atual
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setActing(null);
    }
  }

  const pendingCount = reviews.length;

  const columns = useMemo<ColumnDef<Review, unknown>[]>(
    () => [
      {
        id: "filhote",
        header: "Filhote",
        cell: ({ row }) => (
          <a
            href={`/filhotes/${row.original.puppy_slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--brand)] hover:underline text-xs font-medium"
          >
            {row.original.puppy_slug}
          </a>
        ),
      },
      {
        id: "reviewer",
        header: "Reviewer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-zinc-900">{row.original.reviewer_name}</p>
            {row.original.reviewer_city && <p className="text-xs text-zinc-400">{row.original.reviewer_city}</p>}
          </div>
        ),
      },
      {
        id: "nota",
        header: "Nota",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <StarRating value={row.original.rating} size="sm" />
            <span className="text-xs font-bold text-zinc-600">{row.original.rating}</span>
          </div>
        ),
      },
      {
        id: "comentario",
        header: "Comentário",
        cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="max-w-xs">
              <p className="line-clamp-3 text-zinc-700">{review.comment}</p>
              {review.photo_url && (
                <a
                  href={review.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-blue-500 hover:underline"
                >
                  📷 Ver foto
                </a>
              )}
              <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[review.status]}`}>
                {STATUS_LABEL[review.status]}
              </span>
            </div>
          );
        },
      },
      {
        id: "data",
        header: "Data",
        cell: ({ row }) => <span className="whitespace-nowrap text-xs text-zinc-400">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              {review.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => act(review.id, "approved")}
                  disabled={acting === review.id}
                  className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
                >
                  ✓ Aprovar
                </button>
              )}
              {review.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => act(review.id, "rejected")}
                  disabled={acting === review.id}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                >
                  ✗ Rejeitar
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [acting],
  );

  return (
    <div className="space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Avaliações de Filhotes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Modere os depoimentos das famílias antes da publicação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchReviews(filter)}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 border-b border-zinc-200 pb-4">
        {(["pending", "approved", "rejected"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              filter === s
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando...
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
          {error}
          {error.includes("Supabase") && (
            <p className="mt-1 text-xs text-red-500">
              Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel.
            </p>
          )}
        </div>
      )}

      {/* Lista vazia */}
      {!loading && !error && reviews.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center">
          <p className="text-2xl" aria-hidden="true">✓</p>
          <p className="mt-2 font-medium text-zinc-700">
            Nenhuma avaliação {STATUS_LABEL[filter].toLowerCase()}
          </p>
        </div>
      )}

      {/* Tabela */}
      {!loading && !error && reviews.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <VirtualizedDataTable
            columns={columns}
            data={reviews}
            height={560}
            enableSelection={false}
            role="table"
            aria-label="Avaliações de filhotes para moderação"
          />
          <div className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400">
            {pendingCount} {filter === "pending" ? "aguardando moderação" : "registros"}
          </div>
        </div>
      )}

      {/* Info de setup */}
      <div className="rounded-xl bg-zinc-50 p-4 text-xs text-zinc-500 ring-1 ring-zinc-200">
        <p className="font-semibold text-zinc-700">Configuração necessária:</p>
        <ol className="mt-2 list-decimal list-inside space-y-1">
          <li>Execute <code className="rounded bg-zinc-200 px-1 py-0.5">scripts/puppy_reviews_migration.sql</code> no Supabase Dashboard → SQL Editor</li>
          <li>Certifique-se que <code className="rounded bg-zinc-200 px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> está configurado no Vercel</li>
        </ol>
      </div>
    </div>
  );
}
