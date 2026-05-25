"use client";

import { ComponentProps, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import PuppyForm from "../../_components/PuppyForm";
import { adminFetch } from "@/lib/adminFetch";
import type { RawPuppy } from "@/types/puppy";

export default function EditPuppyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<ComponentProps<typeof PuppyForm>["record"]>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idParam) return;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const response = await adminFetch(`/api/admin/puppies?id=${idParam}`);
        const json = await response.json();
        if (!mounted) return;
        if (!response.ok) throw new Error(json?.error || "Falha ao carregar filhote");
        const found = json?.puppy as RawPuppy | undefined;
        if (!found) setError("Filhote nao encontrado.");
        else {
          // Normaliza slug para string vazia quando vier nulo/undefined, evitando erro de tipo
          const normalized: RawPuppy = { ...found, slug: found.slug ?? "" };
          setRecord(normalized as ComponentProps<typeof PuppyForm>["record"]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [idParam]);

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <Link
          href="/admin/puppies"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para listagem
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-[var(--text)]">Editar filhote</h1>
        <p className="max-w-3xl text-sm text-[var(--text-muted)]">
          Atualize informacoes, preco, status e midias deste filhote.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
          <span className="mt-2 block">Carregando dados...</span>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-6 text-sm text-red-600" role="alert">
            {error}
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/puppies")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            Voltar para lista
          </button>
        </div>
      ) : record ? (
        <PuppyForm
          mode="edit"
          record={record}
          onCompleted={() => {
            router.push("/admin/puppies");
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
