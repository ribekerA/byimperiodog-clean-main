"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export function PuppyEditLauncher() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = value.trim();
    if (!target) {
      setError("Informe um ID ou slug para continuar.");
      return;
    }
    setError(null);
    startTransition(() => {
      router.push(`/admin/puppies/edit/${encodeURIComponent(target)}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-semibold text-[var(--text)]">
        ID ou slug do filhote
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ex.: 613bb0ae-7be7-4dc5..."
          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
          }`}
        />
      </label>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />} Ir para edição
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("");
            setError(null);
          }}
          className="rounded-full border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]"
        >
          Limpar
        </button>
      </div>
    </form>
  );
}
