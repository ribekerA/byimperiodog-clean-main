"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Brain, CheckCircle2, Lightbulb, ListChecks, Loader2, RefreshCcw } from "lucide-react";

import { useServerAction } from "@/hooks/useServerAction";

export type AIRiskLevel = "alto" | "medio" | "baixo";

export type AIInsightPayload = {
  summary: string;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
  riskLevel: AIRiskLevel;
  generatedAt: string;
};

type AIInsightsPanelProps = {
  action: () => Promise<AIInsightPayload>;
  initialInsight: AIInsightPayload;
  fallbackText: string;
};

const riskTone: Record<AIRiskLevel, string> = {
  alto: "bg-rose-100 text-rose-900",
  medio: "bg-amber-100 text-amber-900",
  baixo: "bg-emerald-100 text-emerald-900",
};

export function AIInsightsPanel({ action, initialInsight, fallbackText }: AIInsightsPanelProps) {
  const { data, error, isPending, execute } = useServerAction(action, initialInsight);
  const insight = data ?? initialInsight;
  const showFallback = Boolean(error && !insight);
  const isSkeleton = isPending && !data;

  return (
    <section
      aria-label="Insights operacionais da IA"
      className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-lg focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-500"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-emerald-600" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">IA • Operação em foco</h2>
            <p className="text-sm text-[var(--text-muted)]">Resumo sintético com oportunidades, riscos e próximos passos.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => execute().catch(() => undefined)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
        >
          <RefreshCcw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden />
          Atualizar
        </button>
      </header>

      <div className="mt-4 space-y-4" role="status" aria-live="polite">
        {showFallback && (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700" aria-label="Fallback offline">
            {fallbackText}
          </p>
        )}

        {!showFallback && (
          <div className="space-y-4">
            {isSkeleton ? (
              <SkeletonSummary />
            ) : (
              <div className="space-y-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${riskTone[insight.riskLevel]}`}
                  aria-label={`Indicador de risco: ${insight.riskLevel}`}
                >
                  Risco {insight.riskLevel}
                </span>
                <p className="text-base leading-relaxed text-[var(--text)]">{insight.summary}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Atualizado {isPending ? "agora" : new Date(insight.generatedAt).toLocaleString("pt-BR")}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3" aria-label="Listas de insights">
              <InsightList
                title="Oportunidades"
                icon={<Lightbulb className="h-4 w-4" aria-hidden />}
                tone="text-emerald-700"
                items={insight?.opportunities ?? []}
                loading={isSkeleton}
                emptyLabel="Nenhuma oportunidade identificada."
              />
              <InsightList
                title="Riscos"
                icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
                tone="text-rose-700"
                items={insight?.risks ?? []}
                loading={isSkeleton}
                emptyLabel="Sem riscos no momento."
              />
              <InsightList
                title="Recomendações"
                icon={<ListChecks className="h-4 w-4" aria-hidden />}
                tone="text-indigo-700"
                items={insight?.recommendations ?? []}
                loading={isSkeleton}
                emptyLabel="Sem recomendações pendentes."
              />
            </div>
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]" aria-live="assertive">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Processando dados em tempo real...
          </div>
        )}
      </div>
    </section>
  );
}

type InsightListProps = {
  title: string;
  icon: ReactNode;
  tone: string;
  items: string[];
  loading: boolean;
  emptyLabel: string;
};

function InsightList({ title, icon, tone, items, loading, emptyLabel }: InsightListProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4" aria-label={title}>
      <header className={`mb-3 flex items-center gap-2 text-sm font-semibold ${tone}`}>
        {icon}
        <span>{title}</span>
      </header>
      {loading ? (
        <SkeletonList />
      ) : items.length ? (
        <ul className="space-y-2" role="list">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">{emptyLabel}</p>
      )}
    </section>
  );
}

function SkeletonSummary() {
  return (
    <div className="space-y-3" aria-hidden>
      <span className="inline-block h-6 w-28 animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
    </div>
  );
}
