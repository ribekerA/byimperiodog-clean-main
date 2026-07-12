"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowRight, Loader2, Shuffle } from "lucide-react";

import { useToast } from "@/components/ui/toast";

type Suggestion = {
  suggestion_type: "match" | "upsell" | "fallback";
  puppyId: string | null;
  puppyName?: string | null;
  reasoning: string;
  probability_of_acceptance: number;
  alternatives: { id: string; name: string | null; score: number }[];
};

const badgeColor: Record<Suggestion["suggestion_type"], string> = {
  match: "bg-[var(--brand-tint-100)] text-[var(--brand)]",
  upsell: "bg-amber-100 text-amber-800",
  fallback: "bg-slate-100 text-slate-700",
};

const storageKey = (leadId: string) => `lead-crossmatch-${leadId}`;

export function LeadCrossMatchCard({ leadId }: { leadId: string }) {
  const { push } = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Suggestion | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(storageKey(leadId));
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch {}
    }
  }, [leadId]);

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
        sessionStorage.setItem(storageKey(leadId), JSON.stringify(json.suggestion));
        push({ type: "success", message: "Sugestão de CrossMatch gerada." });
      } catch (e) {
        const message = (e as Error).message;
        setError(message);
        push({ type: "error", message });
      }
    });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-[var(--brand)]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">CrossMatch AI</p>
            <p className="text-xs text-[var(--text-muted)]">A IA cruza cor, sexo e cidade desejados pelo lead com o estoque real de filhotes.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Gerar com IA
        </button>
      </header>

      {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}

      {!data && !pending && <p className="text-sm text-[var(--text-muted)]">Clique em “Gerar com IA” para gerar sugestão.</p>}

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
