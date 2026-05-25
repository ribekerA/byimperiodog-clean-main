"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { AdminErrorState } from "@/components/admin/ui/AdminErrorState";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] erro capturado pelo boundary", error);
  }, [error]);

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-800">
        <TriangleAlert className="h-4 w-4" aria-hidden />
        Algo deu errado no painel.
      </div>
      <AdminErrorState
        title="Erro no painel admin"
        message={error?.message || "Tente novamente ou contate o suporte."}
        actionHref="#"
        actionLabel="Recarregar"
      />
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        Tentar de novo
      </button>
    </div>
  );
}
