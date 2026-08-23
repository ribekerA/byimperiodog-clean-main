"use client";

import { AlertCircle, Dog, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";

type Recommendation = {
  puppyIdIdeal: string | null;
  top3Matches: { id: string; name: string; score: number; reason: string }[];
  reasoningText: string;
  score: number;
  upsellOpportunity: boolean;
};

const storageKey = (leadId: string) => `lead-recommend-${leadId}`;

export function LeadPuppyRecommenderCard({ leadId }: { leadId: string }) {
  const { push } = useToast();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(storageKey(leadId));
    if (cached) {
      try {
        setRec(JSON.parse(cached));
      } catch {}
    }
  }, [leadId]);

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/leads/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao recomendar");
        setRec(json.recommendation);
        sessionStorage.setItem(storageKey(leadId), JSON.stringify(json.recommendation));
        push({ type: "success", message: "Recomendação de filhote gerada." });
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
          <Dog className="h-5 w-5 text-[var(--brand)]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Recomendação de Filhote</p>
            <p className="text-xs text-[var(--text-muted)]">A IA usa cor, sexo, orçamento e cidade desejados para recomendar o melhor match.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
          Gerar com IA
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </div>
      )}

      {rec ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Raciocínio</p>
            <p className="mt-1">{rec.reasoningText}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Score: <span className="font-semibold text-[var(--text)]">{rec.score}</span>
              {rec.upsellOpportunity && " • Oportunidade de upsell"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Top 3 sugestões</p>
            <ul className="space-y-2">
              {rec.top3Matches.map((m, idx) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      #{idx + 1} {m.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{m.reason}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--text-muted)]">
                    <p className="font-semibold text-[var(--text)]">{m.score} pts</p>
                    <a
                      href={`/admin/puppies/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abre em nova aba — esta sugestão de IA continua disponível aqui"
                      className="text-[var(--brand)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                    >
                      Abrir filhote
                    </a>
                  </div>
                </li>
              ))}
              {rec.top3Matches.length === 0 && <li className="text-sm text-[var(--text-muted)]">Nenhuma sugestão disponível.</li>}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Clique em “Gerar com IA” para gerar sugestões.</p>
      )}
    </section>
  );
}
