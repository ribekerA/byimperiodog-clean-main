"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Brain, Loader2 } from "lucide-react";

type Insight = {
  intent?: string | null;
  urgency?: string | null;
  risk?: string | null;
  score?: number | null;
  emotional_tone?: string | null;
  budget_inferred?: string | null;
  desired_color?: string | null;
  desired_sex?: string | null;
  desired_city?: string | null;
  desired_timeframe?: string | null;
  next_step?: string | null;
  alerts?: string[] | null;
  suggested_puppies?: { puppy_id: string; name: string; reason: string }[] | null;
};

export function LeadIntelCard({ leadId, initial }: { leadId: string; initial?: Insight | null }) {
  const [insight, setInsight] = useState<Insight | null | undefined>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const processIntel = (force = false) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/leads/intel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, force }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao processar IA");
        setInsight(json.insight);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-emerald-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Lead Intelligence</p>
            <p className="text-xs text-[var(--text-muted)]">Classificação automática e sugestões</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => processIntel(true)}
            disabled={pending}
            className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Processar IA"}
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </div>
      )}

      {insight ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Info label="Intenção" value={insight.intent ?? "—"} />
          <Info label="Urgência" value={insight.urgency ?? "—"} />
          <Info label="Risco de perda" value={insight.risk ?? "—"} />
          <Info label="Score" value={typeof insight.score === "number" ? `${insight.score}` : "—"} />
          <Info label="Tom emocional" value={insight.emotional_tone ?? "—"} />
          <Info label="Orçamento" value={insight.budget_inferred ?? "—"} />
          <Info label="Cor desejada" value={insight.desired_color ?? "—"} />
          <Info label="Sexo desejado" value={insight.desired_sex ?? "—"} />
          <Info label="Cidade" value={insight.desired_city ?? "—"} />
          <Info label="Prazo" value={insight.desired_timeframe ?? "—"} />

          <div className="md:col-span-2 space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Próximo passo</p>
            <p className="text-sm text-[var(--text-muted)]">{insight.next_step || "Responder rapidamente com fotos/vídeo."}</p>
          </div>

          {insight.alerts && insight.alerts.length > 0 && (
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-semibold text-[var(--text)]">Alertas</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {insight.alerts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.suggested_puppies && insight.suggested_puppies.length > 0 && (
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-semibold text-[var(--text)]">Sugestões de filhotes</p>
              <ul className="space-y-2 text-sm text-[var(--text)]">
                {insight.suggested_puppies.map((s) => (
                  <li key={s.puppy_id} className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-3 py-2">
                    <span>{s.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Nenhum insight gerado ainda. Clique em “Processar IA”.</p>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}
