import { Copy, Loader2 } from "lucide-react";

import type { AdvisorMessage, LeadAdvisorSnapshot } from "@/lib/ai/leadAdvisor";

import type { LeadStatus } from "../lead-status";
import type { LeadPuppyMatch } from "../queries";

const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";
const BUTTON =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const BADGE =
  "inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-muted)]";
const BADGE_WARN =
  "inline-flex rounded-full border border-[#e5b9a3] bg-[#fdf1ea] px-2 py-0.5 text-xs font-medium text-[#8a3a12]";

const PRIORITY_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;

type LeadAiSummaryCardProps = {
  advisor: LeadAdvisorSnapshot;
  matchedPuppy?: LeadPuppyMatch | null;
};

/** Leitura feita por regras fixas sobre os dados do lead. Nao ha modelo de IA aqui. */
export function LeadAiSummaryCard({ advisor, matchedPuppy }: LeadAiSummaryCardProps) {
  const { compatibility, priority } = advisor;
  return (
    <section className={CARD} aria-labelledby="lead-leitura-titulo">
      <h2 id="lead-leitura-titulo" className="text-base font-semibold text-[var(--text)]">
        Leitura automática
      </h2>
      <p className="text-xs text-[var(--text-muted)]">Calculada por regras fixas, sem modelo de IA.</p>
      <div className="mt-3 space-y-3 text-sm text-[var(--text)]">
        <p className="font-semibold">
          {compatibility.scored ? `${compatibility.label} · nota ${compatibility.score} de 100` : compatibility.label}
        </p>
        <p className="text-[var(--text-muted)]">{compatibility.summary}</p>
        {matchedPuppy ? (
          <p className="text-[var(--text-muted)]">
            Filhote sugerido: <span className="font-semibold text-[var(--text)]">{matchedPuppy.name}</span>
          </p>
        ) : null}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <p className="font-semibold">Prioridade automática: {PRIORITY_LABEL[priority.level]}</p>
          <p className="text-xs text-[var(--text-muted)]">{priority.reason}</p>
        </div>
      </div>
    </section>
  );
}

type LeadStatusSuggestionCardProps = {
  advisor: LeadAdvisorSnapshot;
  currentStatus: LeadStatus;
  suggestedStatus: LeadStatus | null;
  mutating: boolean;
  onApply: (status: LeadStatus) => void;
};

export function LeadStatusSuggestionCard({
  advisor,
  currentStatus,
  suggestedStatus,
  mutating,
  onApply,
}: LeadStatusSuggestionCardProps) {
  const canApply = suggestedStatus !== null && suggestedStatus !== currentStatus;

  return (
    <section className={`${CARD} flex flex-col`} aria-labelledby="lead-proximo-titulo">
      <h2 id="lead-proximo-titulo" className="text-base font-semibold text-[var(--text)]">
        Próximo passo sugerido
      </h2>
      <p className="text-xs text-[var(--text-muted)]">Sugestão de uma regra fixa. Quem decide é você.</p>
      <div className="mt-3 flex-1 space-y-2 text-sm text-[var(--text)]">
        <p>
          Status indicado: <span className="font-semibold">{advisor.status.label}</span>
        </p>
        <p className="text-[var(--text-muted)]">{advisor.status.reason}</p>
      </div>
      {canApply ? (
        <button
          type="button"
          disabled={mutating}
          onClick={() => suggestedStatus && onApply(suggestedStatus)}
          className={`${BUTTON_PRIMARY} mt-4`}
        >
          {mutating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Aplicar o status sugerido
        </button>
      ) : (
        <p className="mt-4 text-xs text-[var(--text-muted)]">O lead já está no status indicado.</p>
      )}
    </section>
  );
}

type LeadLossCardProps = {
  loss: LeadAdvisorSnapshot["loss"];
  copying: boolean;
  onCopy: () => void;
};

export function LeadLossCard({ loss, copying, onCopy }: LeadLossCardProps) {
  return (
    <section className={CARD} aria-labelledby="lead-risco-titulo">
      <h2 id="lead-risco-titulo" className="text-base font-semibold text-[var(--text)]">
        Risco de perder o lead
      </h2>
      <p className="text-xs text-[var(--text-muted)]">Medido pelo tempo sem atualização.</p>
      <div className="mt-3 space-y-2 text-sm text-[var(--text)]">
        <span className={loss.isCold ? BADGE_WARN : BADGE}>{loss.isCold ? "Lead esfriando" : "Dentro do prazo"}</span>
        <p className="text-[var(--text-muted)]">{loss.summary}</p>
        <p className="text-xs text-[var(--text-muted)]">Última atualização há {loss.hoursSinceUpdate} h.</p>
      </div>
      <button type="button" onClick={onCopy} disabled={copying} className={`${BUTTON} mt-4 w-full`}>
        {copying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        Copiar mensagem de retomada
      </button>
    </section>
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
    <section className={CARD} aria-labelledby="lead-mensagens-titulo">
      <h2 id="lead-mensagens-titulo" className="text-base font-semibold text-[var(--text)]">
        Sugestões de mensagem
      </h2>
      <p className="text-xs text-[var(--text-muted)]">
        Modelos prontos, montados por regra fixa. Leia e ajuste antes de enviar: o texto não sabe o que já foi combinado
        com o cliente.
      </p>
      <ul className="mt-3 grid gap-3 md:grid-cols-3">
        {messages.map((message) => (
          <li
            key={message.id}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text)]"
          >
            <h3 className="text-sm font-semibold">{message.label}</h3>
            <p className="mt-2 flex-1 whitespace-pre-line text-[var(--text-muted)]">{message.text}</p>
            <button
              type="button"
              onClick={() => onCopy(message.text, message.label, message.id)}
              disabled={copyingStyle === message.id}
              className={`${BUTTON} mt-3`}
            >
              {copyingStyle === message.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              Copiar<span className="sr-only"> a mensagem {message.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
