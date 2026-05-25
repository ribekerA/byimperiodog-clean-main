"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Shuffle } from "lucide-react";

type Suggestion = {
  suggestion_type: "match" | "upsell" | "fallback";
  puppyId: string | null;
  puppyName?: string | null;
  reasoning: string;
  probability_of_acceptance: number;
  alternatives: { id: string; name: string | null; score: number }[];
};

const badgeColor: Record<Suggestion["suggestion_type"], string> = {
  match: "bg-emerald-100 text-emerald-800",
  upsell: "bg-amber-100 text-amber-800",
  fallback: "bg-slate-100 text-slate-700",
};

export function LeadCrossMatchCard({ leadId }: { leadId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Suggestion | null>(null);

  const run = () => {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/admin/leads/crossmatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao cruzar preferências");
        setData(json.suggestion);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-emerald-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">CrossMatch AI</p>
            <p className="text-xs text-[var(--text-muted)]">Cruza preferências do lead com estoque real.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Rodar
        </button>
      </header>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {!data && !pending && <p className="text-sm text-[var(--text-muted)]">Clique em “Rodar” para gerar sugestão.</p>}

      {data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor[data.suggestion_type]}`}>
              {data.suggestion_type === "match" && "Match"}
              {data.suggestion_type === "upsell" && "Upsell"}
              {data.suggestion_type === "fallback" && "Fallback"}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{data.probability_of_acceptance}% aceitação</span>
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">
            {data.puppyName || data.puppyId || "Melhor opção disponível"}
          </p>
          <p className="text-sm text-[var(--text-muted)]">{data.reasoning}</p>
          {data.alternatives.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text)] mb-1">Alternativas</p>
              <ul className="space-y-1">
                {data.alternatives.map((alt) => (
                  <li key={alt.id} className="flex items-center justify-between text-sm text-[var(--text)]">
                    <span className="line-clamp-1">{alt.name || alt.id}</span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      {alt.score}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
