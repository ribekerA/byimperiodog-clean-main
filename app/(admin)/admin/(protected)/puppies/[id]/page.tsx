"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, RefreshCcw } from "lucide-react";

import PuppyForm from "@/app/admin/puppies/PuppyForm";
import type { RawPuppy } from "@/types/puppy";

type LoadedRecord = RawPuppy | null;

export default function PuppyFormPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [record, setRecord] = useState<LoadedRecord>(null);
  const [loading, setLoading] = useState(!isNew);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (isNew) return "Novo filhote";
    if (record?.nome || record?.name) return `Editar: ${record.nome ?? record.name}`;
    return "Editar filhote";
  }, [isNew, record]);

  const fetchRecord = useCallback(
    async (signal?: AbortSignal) => {
      if (isNew) return;
      try {
        setError(null);
        setLoading(true);
        const res = await fetch(`/api/admin/puppies?id=${params.id}`, {
          cache: "no-store",
          signal,
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "Não foi possível carregar o filhote");
        }
        const json = await res.json();
        setRecord(json?.puppy ?? null);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError((err as Error).message);
        setRecord(null);
      } finally {
        setLoading(false);
        setReloading(false);
      }
    },
    [isNew, params.id],
  );

  useEffect(() => {
    if (isNew) {
      setRecord(null);
      return;
    }
    const controller = new AbortController();
    fetchRecord(controller.signal);
    return () => controller.abort();
  }, [fetchRecord, isNew]);

  const handleCompleted = useCallback(() => {
    router.push("/admin/puppies");
  }, [router]);

  const handleRefresh = async () => {
    setReloading(true);
    await fetchRecord();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => router.push("/admin/puppies")}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Filhotes
            </button>
            <span aria-hidden>›</span>
            <span>{isNew ? "Novo" : "Editar"}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{title}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Utilize o formulário unificado para manter cadastro, mídia e status sincronizados.
            </p>
          </div>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={reloading || loading}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {reloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCcw className="h-4 w-4" aria-hidden />}
            Recarregar dados
          </button>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-3 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando informações do filhote…
        </div>
      ) : (
        <PuppyForm mode={isNew ? "create" : "edit"} record={record ?? undefined} onCompleted={handleCompleted} />
      )}
    </div>
  );
}
