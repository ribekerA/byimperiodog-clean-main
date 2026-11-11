"use client";

/**
 * /admin/reviews — moderação das avaliações de filhotes.
 *
 * O banco guarda só "aprovada ou não": recusar é excluir, e a tela diz isso.
 */

import { Check, Loader2, RefreshCcw, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { AdminReview, ReviewCounts, ReviewFilter } from "@/lib/admin/reviewsAdmin";
import { adminFetch } from "@/lib/adminFetch";

const TABS: Array<{ key: ReviewFilter; label: string }> = [
  { key: "pending", label: "Aguardando" },
  { key: "approved", label: "Aprovadas" },
];

const BUTTON =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-50";

function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null || !Number.isFinite(rating)) {
    return <span className="text-sm text-[var(--text-muted)]">Sem nota</span>;
  }
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="text-base tracking-wide text-amber-600">
        {"★".repeat(value)}
        <span className="text-[var(--border)]">{"★".repeat(5 - value)}</span>
      </span>
      <span className="text-sm font-semibold text-[var(--text)]">
        {value}<span className="sr-only"> de 5 estrelas</span><span aria-hidden="true">/5</span>
      </span>
    </span>
  );
}

export default function ReviewsAdminPage() {
  const { push } = useToast();
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [items, setItems] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState<ReviewCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminReview | null>(null);

  const load = useCallback(async (which: ReviewFilter) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/reviews?filter=${which}`);
      const json = await res.json().catch(() => null);
      // Falha de leitura nao pode virar "nenhuma avaliacao".
      if (!res.ok || !json?.ok) {
        setLoadError(true);
        return;
      }
      setItems(Array.isArray(json.items) ? json.items : []);
      setCounts(json.counts ?? null);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(filter); }, [load, filter]);

  async function setApproved(review: AdminReview, approved: boolean) {
    setBusy(review.id);
    try {
      const res = await adminFetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Não foi possível atualizar a avaliação");
      push({ type: "success", message: approved ? "Avaliação aprovada." : "Aprovação retirada." });
      void load(filter);
    } catch (e) {
      push({ type: "error", message: e instanceof Error ? e.message : "Não foi possível atualizar a avaliação" });
    } finally {
      setBusy(null);
    }
  }

  async function remove(review: AdminReview) {
    setBusy(review.id);
    try {
      const res = await adminFetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Não foi possível excluir a avaliação");
      push({ type: "success", message: "Avaliação excluída." });
      void load(filter);
    } catch (e) {
      push({ type: "error", message: e instanceof Error ? e.message : "Não foi possível excluir a avaliação" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Avaliações</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Avaliações de filhotes gravadas no banco. Aprovar marca a avaliação como aprovada; recusar é excluir, porque o banco não guarda avaliação recusada.
          </p>
        </div>
        <button type="button" onClick={() => void load(filter)} disabled={loading}
          className={`${BUTTON} border-[var(--border)] bg-white text-[var(--text)] shadow-sm hover:bg-[var(--surface)]`}>
          <RefreshCcw aria-hidden="true" className="h-4 w-4" /> Atualizar
        </button>
      </div>

      <div role="group" aria-label="Filtrar avaliações" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button key={tab.key} type="button" aria-pressed={active} onClick={() => setFilter(tab.key)}
              className={`${BUTTON} ${active
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface)]"}`}>
              {tab.label}
              {counts && <span className="tabular-nums">({counts[tab.key]})</span>}
            </button>
          );
        })}
      </div>

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-semibold">Não foi possível ler as avaliações agora</p>
          <p className="mt-1">Isto é uma falha de leitura, não quer dizer que não existam avaliações. Tente de novo em instantes.</p>
          <button type="button" onClick={() => void load(filter)}
            className={`${BUTTON} mt-3 border-red-300 bg-white text-red-900 hover:bg-red-100`}>
            <RefreshCcw aria-hidden="true" className="h-4 w-4" /> Tentar de novo
          </button>
        </div>
      ) : loading ? (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-8">
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-[var(--brand)] motion-reduce:animate-none" />
          <p className="text-sm text-[var(--text-muted)]">Carregando avaliações...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
          <p className="text-sm font-semibold text-[var(--text)]">
            {filter === "pending" ? "Nenhuma avaliação aguardando." : "Nenhuma avaliação aprovada."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((review) => {
            const author = review.author_name?.trim() || "Sem nome";
            const isBusy = busy === review.id;
            return (
              <li key={review.id} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text)]">{author}</h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {review.puppy_label ? `Filhote: ${review.puppy_label}` : "Sem filhote vinculado"} · {fmtDate(review.created_at)}
                    </p>
                  </div>
                  <Stars rating={review.rating} />
                </div>

                <p className="mt-3 whitespace-pre-line break-words text-sm text-[var(--text)]">
                  {review.comment?.trim() || <span className="text-[var(--text-muted)]">Sem comentário.</span>}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {review.approved ? (
                    <button type="button" disabled={isBusy} onClick={() => void setApproved(review, false)}
                      aria-label={`Tirar a aprovação da avaliação de ${author}`}
                      className={`${BUTTON} border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]`}>
                      <Undo2 aria-hidden="true" className="h-4 w-4" /> Tirar aprovação
                    </button>
                  ) : (
                    <button type="button" disabled={isBusy} onClick={() => void setApproved(review, true)}
                      aria-label={`Aprovar a avaliação de ${author}`}
                      className={`${BUTTON} border-[var(--brand)] bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]`}>
                      <Check aria-hidden="true" className="h-4 w-4" /> Aprovar
                    </button>
                  )}
                  <button type="button" disabled={isBusy} onClick={() => setPendingDelete(review)}
                    aria-label={`Excluir a avaliação de ${author}`}
                    className={`${BUTTON} border-red-300 text-red-800 hover:bg-red-50`}>
                    <Trash2 aria-hidden="true" className="h-4 w-4" /> Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Excluir esta avaliação?"
        description={`A avaliação de ${pendingDelete?.author_name?.trim() || "sem nome"} será apagada do banco. Não dá para desfazer.`}
        confirmLabel="Sim, excluir"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
      />
    </div>
  );
}
