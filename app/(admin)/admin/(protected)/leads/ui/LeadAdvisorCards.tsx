import { AlertTriangle, Brain, Copy, Loader2, PawPrint, Sparkles } from "lucide-react";

import type { LeadAdvisorSnapshot, AdvisorMessage } from "@/lib/ai/leadAdvisor";

import type { LeadPuppyMatch, LeadStatus } from "../queries";

type LeadAiSummaryCardProps = {
  advisor: LeadAdvisorSnapshot;
  matchedPuppy?: LeadPuppyMatch | null;
};

export function LeadAiSummaryCard({ advisor, matchedPuppy }: LeadAiSummaryCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Leitura da IA</p>
          <p className="text-xs text-[var(--text-muted)]">Compatibilidade e prioridade</p>
        </div>
        <Brain className="h-5 w-5 text-indigo-500" aria-hidden />
      </header>
      <div className="mt-4 space-y-3 text-sm text-[var(--text)]">
        <p className="text-base font-semibold">
          {advisor.compatibility.label} · {advisor.compatibility.score}%
        </p>
        <p className="text-[var(--text-muted)]">{advisor.compatibility.summary}</p>
        {matchedPuppy && (
          <div className="rounded-xl bg-[var(--surface)] px-3 py-2 text-xs">
            <p className="font-semibold">Match sugerido</p>
            <p className="text-[var(--text-muted)]">{matchedPuppy.name}</p>
          </div>
        )}
        <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-xs">
          <p className="font-semibold text-[var(--text)]">Prioridade {advisor.priority.level.toUpperCase()}</p>
          <p className="text-[var(--text-muted)]">{advisor.priority.reason}</p>
        </div>
      </div>
    </article>
  );
}

type LeadStatusSuggestionCardProps = {
  advisor: LeadAdvisorSnapshot;
  currentStatus: LeadStatus;
  suggestedStatus: LeadStatus | null;
  mutating: LeadStatus | null;
  onApply: (status: LeadStatus) => void | Promise<void>;
};

export function LeadStatusSuggestionCard({ advisor, currentStatus, suggestedStatus, mutating, onApply }: LeadStatusSuggestionCardProps) {
  const canApply = suggestedStatus && suggestedStatus !== currentStatus;

  return (
    <article className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Próximo passo</p>
          <p className="text-xs text-[var(--text-muted)]">Sugestão automática</p>
        </div>
        <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
      </header>
      <div className="mt-4 flex-1 space-y-3 text-sm text-[var(--text)]">
        <div className="rounded-xl bg-[var(--surface)] px-3 py-2">
          <p className="text-xs text-[var(--text-muted)]">Status indicado</p>
          <p className="text-base font-semibold">{advisor.status.label}</p>
        </div>
        <p className="text-[var(--text-muted)]">{advisor.status.reason}</p>
      </div>
      <button
        type="button"
        disabled={!canApply || mutating === suggestedStatus}
        onClick={() => suggestedStatus && onApply(suggestedStatus)}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {mutating === suggestedStatus ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Aplicar status"}
      </button>
    </article>
  );
}

type LeadLossCardProps = {
  loss: LeadAdvisorSnapshot["loss"];
  copying: boolean;
  onCopy: () => void;
};

export function LeadLossCard({ loss, copying, onCopy }: LeadLossCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Risco de perda</p>
          <p className="text-xs text-[var(--text-muted)]">Monitoramento automático</p>
        </div>
        <AlertTriangle className={`h-5 w-5 ${loss.isCold ? "text-rose-500" : "text-slate-400"}`} aria-hidden />
      </header>
      <div className="mt-4 space-y-2 text-sm text-[var(--text)]">
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${loss.isCold ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
          {loss.isCold ? "Lead frio" : "Dentro da janela"}
        </div>
        <p className="text-[var(--text-muted)]">{loss.summary}</p>
        <p className="text-xs text-[var(--text-muted)]">Última atualização há {loss.hoursSinceUpdate}h</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
      >
        {copying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Copiar reativação
      </button>
    </article>
  );
}

type LeadMessageStylesProps = {
  messages: AdvisorMessage[];
  copyingStyle: string | null;
  onCopy: (text: string, label: string, styleId?: string) => void;
};

export function LeadMessageStyles({ messages, onCopy, copyingStyle }: LeadMessageStylesProps) {
  if (!messages.length) return null;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Estilos de mensagem</p>
          <p className="text-xs text-[var(--text-muted)]">IA sugere 3 variações</p>
        </div>
        <PawPrint className="h-5 w-5 text-emerald-500" aria-hidden />
      </header>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {messages.map((message) => (
          <article key={message.id} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{message.label}</p>
            <p className="mt-2 flex-1 text-[var(--text-muted)]">{message.text}</p>
            <button
              type="button"
              onClick={() => onCopy(message.text, message.label, message.id)}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold"
            >
              {copyingStyle === message.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Copiar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
