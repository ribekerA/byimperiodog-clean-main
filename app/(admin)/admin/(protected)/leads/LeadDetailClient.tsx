"use client";

import { Copy, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  LEAD_STATUS_LABEL,
  advisorSuggestionToStatus,
  leadGreeting,
  leadStatusNeedsConfirm,
  leadWhatsappLink,
  type LeadFields,
} from "@/lib/admin/leadAdmin";
import type { LeadAdvisorSnapshot } from "@/lib/ai/leadAdvisor";

import { LEAD_STATUS_OPTIONS } from "./lead-status";
import type { LeadStatus } from "./lead-status";
import type { LeadHistoryEntry, LeadPuppyMatch } from "./queries";
import { LeadAiSummaryCard, LeadLossCard, LeadMessageStyles, LeadStatusSuggestionCard } from "./ui/LeadAdvisorCards";
import { LeadCrossMatchCard } from "./ui/LeadCrossMatchCard";
import { LeadFraudBadge } from "./ui/LeadFraudBadge";
import { LeadIntelCard } from "./ui/LeadIntelCard";
import { LeadPuppyRecommenderCard } from "./ui/LeadPuppyRecommenderCard";

const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";
const BUTTON =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const INPUT =
  "min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-wait disabled:opacity-60";
const BADGE =
  "rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-muted)]";
const BADGE_WARN = "rounded-full border border-[#e5b9a3] bg-[#fdf1ea] px-2 py-0.5 text-xs font-medium text-[#8a3a12]";

const PRIORITY_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const EMPTY_VALUE = "Não informado";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : DATE_TIME.format(date).replace(",", "");
}

function valueOr(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : EMPTY_VALUE;
}

export type LeadDetailData = LeadFields & { notes: string | null };

type Pending = { next: LeadStatus; suggested: boolean };

export function LeadDetailClient({
  lead,
  history,
  historyOk,
  matchedPuppy,
  insight,
  advisor,
}: {
  lead: LeadDetailData;
  history: LeadHistoryEntry[];
  historyOk: boolean;
  matchedPuppy: LeadPuppyMatch | null;
  insight: Record<string, unknown> | null;
  advisor: LeadAdvisorSnapshot;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [, startRefresh] = useTransition();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [firstRespondedAt, setFirstRespondedAt] = useState<string | null>(lead.firstRespondedAt);
  const [mutating, setMutating] = useState(false);
  const [copyingStyle, setCopyingStyle] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Dados novos do servidor valem mais do que o que a tela guardou.
  useEffect(() => {
    setStatus(lead.status);
    setFirstRespondedAt(lead.firstRespondedAt);
  }, [lead.status, lead.firstRespondedAt]);

  const suggestedStatus = advisorSuggestionToStatus(advisor.status.suggestion);
  const greeting = leadGreeting(lead);
  const whatsappLink = leadWhatsappLink(lead);

  const applyStatus = async (next: LeadStatus) => {
    setMutating(true);
    try {
      const res = await fetch("/api/admin/leads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status: next }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; firstRespondedAt?: string | null };
      if (!res.ok) throw new Error(payload.error || "Não foi possível gravar o status.");
      setStatus(next);
      if (payload.firstRespondedAt) setFirstRespondedAt(payload.firstRespondedAt);
      const message = `${lead.name} agora está como ${LEAD_STATUS_LABEL[next]}.`;
      setAnnouncement(message);
      push({ type: "success", message });
      startRefresh(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível gravar o status.";
      setAnnouncement(`O status não mudou. ${message}`);
      push({ type: "error", message });
    } finally {
      setMutating(false);
    }
  };

  const requestStatus = (next: LeadStatus, suggested = false) => {
    if (next === status) return;
    if (suggested || leadStatusNeedsConfirm(next)) setPending({ next, suggested });
    else void applyStatus(next);
  };

  const copyMessage = async (text: string, label: string, styleId?: string) => {
    try {
      setCopyingStyle(styleId ?? "default");
      await navigator.clipboard.writeText(text);
      const message = `Mensagem copiada: ${label}.`;
      setAnnouncement(message);
      push({ type: "success", message });
    } catch {
      push({ type: "error", message: "Não foi possível copiar. Selecione o texto e copie à mão." });
    } finally {
      setCopyingStyle(null);
    }
  };

  const waiting = status === "novo" && !firstRespondedAt;

  return (
    <div className="space-y-4">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-[var(--text)]">{lead.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">Chegou em {formatDateTime(lead.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={BADGE}>Status: {LEAD_STATUS_LABEL[status]}</span>
            {waiting ? <span className={BADGE_WARN}>Aguardando primeiro contato</span> : null}
            <span className={BADGE}>Prioridade automática: {PRIORITY_LABEL[advisor.priority.level]}</span>
            {advisor.compatibility.scored ? (
              <span className={BADGE}>Compatibilidade: nota {advisor.compatibility.score} de 100</span>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => copyMessage(greeting, "saudação")}
            disabled={copyingStyle === "default"}
            className={BUTTON}
          >
            {copyingStyle === "default" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            Copiar saudação
          </button>
          {whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
              <MessageCircle className="h-4 w-4" aria-hidden />
              Abrir conversa no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            <p className="self-center text-sm text-[var(--text-muted)]">Telefone sem formato de WhatsApp.</p>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <section className={CARD} aria-labelledby="lead-dados-titulo">
          <h2 id="lead-dados-titulo" className="text-base font-semibold text-[var(--text)]">
            Dados do pedido
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Info label="Telefone" value={valueOr(lead.phone)} />
            <Info label="Cidade" value={valueOr([lead.city, lead.state].filter(Boolean).join(" / "))} />
            <Info label="Cor desejada" value={valueOr(lead.color)} />
            <Info label="Sexo desejado" value={valueOr(lead.preferredSex)} />
            <Info label="Origem" value={valueOr(lead.source)} />
            <Info label="Página" value={valueOr(lead.page)} />
            <Info
              label="Primeira resposta"
              value={firstRespondedAt ? formatDateTime(firstRespondedAt) : "Ainda não registrada"}
            />
            <Info label="Última atualização" value={formatDateTime(lead.updatedAt)} />
          </dl>
          {lead.gclid ? (
            <p className="mt-3 text-sm text-[var(--text-muted)]">Este lead chegou por um anúncio do Google.</p>
          ) : null}
          <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">Mensagem do lead</h3>
          <p className="mt-1 whitespace-pre-line break-words text-sm text-[var(--text-muted)]">
            {lead.message?.trim() ? lead.message : "O lead não escreveu mensagem."}
          </p>
          {lead.notes?.trim() ? (
            <>
              <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">Anotações internas</h3>
              <p className="mt-1 whitespace-pre-line break-words text-sm text-[var(--text-muted)]">{lead.notes}</p>
            </>
          ) : null}
        </section>

        <section className={CARD} aria-labelledby="lead-status-titulo">
          <h2 id="lead-status-titulo" className="text-base font-semibold text-[var(--text)]">
            Atendimento
          </h2>
          <label htmlFor="lead-detail-status" className="mb-1 mt-3 block text-sm font-medium text-[var(--text)]">
            Status do lead
          </label>
          <select
            id="lead-detail-status"
            value={status}
            disabled={mutating}
            onChange={(event) => requestStatus(event.target.value as LeadStatus)}
            className={INPUT}
          >
            {LEAD_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {LEAD_STATUS_LABEL[option]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Ao sair de Novo pela primeira vez, o painel registra a hora da primeira resposta.
          </p>
          <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">Saudação do WhatsApp</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{greeting}</p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LeadAiSummaryCard advisor={advisor} matchedPuppy={matchedPuppy} />
        <LeadStatusSuggestionCard
          advisor={advisor}
          currentStatus={status}
          suggestedStatus={suggestedStatus}
          onApply={(next) => requestStatus(next, true)}
          mutating={mutating}
        />
        <LeadLossCard
          loss={advisor.loss}
          copying={copyingStyle === "reactivation"}
          onCopy={() => copyMessage(advisor.loss.reactivationMessage, "retomada", "reactivation")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LeadIntelCard leadId={lead.id} initial={insight} />
        <section className={CARD} aria-labelledby="lead-filhote-titulo">
          <h2 id="lead-filhote-titulo" className="text-base font-semibold text-[var(--text)]">
            Filhote sugerido
          </h2>
          {matchedPuppy ? (
            <div className="mt-3 space-y-1 text-sm text-[var(--text)]">
              <p className="font-semibold">{matchedPuppy.name}</p>
              <p className="text-[var(--text-muted)]">
                {[matchedPuppy.color, matchedPuppy.sex].filter(Boolean).join(" · ") || "Cor e sexo não informados"}
              </p>
              <Link
                href={`/admin/puppies/edit/${matchedPuppy.id}`}
                className="inline-flex min-h-[44px] items-center font-semibold text-[var(--brand)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
              >
                Abrir a ficha de {matchedPuppy.name}
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Nenhum filhote foi ligado a este lead. Use “Recomendação de filhote” para comparar com o estoque.
            </p>
          )}
        </section>
        <LeadPuppyRecommenderCard leadId={lead.id} />
      </div>

      <LeadMessageStyles messages={advisor.messages} onCopy={copyMessage} copyingStyle={copyingStyle} />

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadCrossMatchCard leadId={lead.id} />
        <LeadFraudBadge leadId={lead.id} />
      </div>

      <section className={CARD} aria-labelledby="lead-historico-titulo">
        <h2 id="lead-historico-titulo" className="text-base font-semibold text-[var(--text)]">
          Mensagens automáticas enviadas
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Só o que o sistema enviou sozinho. Conversas feitas à mão no WhatsApp não aparecem aqui.
        </p>
        {!historyOk ? (
          <p role="alert" className="mt-3 rounded-lg border border-[#e5b9a3] bg-[#fdf1ea] px-3 py-2 text-sm text-[#8a3a12]">
            Não foi possível ler o histórico agora. Isso não quer dizer que ele esteja vazio.
          </p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">Nenhuma mensagem automática registrada para este lead.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
              >
                <p className="text-xs text-[var(--text-muted)]">
                  {[formatDateTime(entry.createdAt), entry.type, entry.status].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 break-words text-[var(--text-muted)]">{entry.preview || "Sem conteúdo registrado."}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={
          pending
            ? pending.suggested
              ? "Aplicar o status sugerido?"
              : `Marcar ${lead.name} como ${LEAD_STATUS_LABEL[pending.next]}?`
            : ""
        }
        description={
          pending
            ? `${
                pending.suggested
                  ? `A regra automática sugeriu marcar este lead como ${LEAD_STATUS_LABEL[pending.next]}. `
                  : ""
              }${
                pending.next === "convertido"
                  ? "Use Convertido só quando a venda estiver fechada de verdade. Esse número entra no painel como venda."
                  : pending.next === "perdido"
                    ? "Perdido encerra o atendimento deste lead. Dá para voltar atrás trocando o status depois."
                    : "Dá para voltar atrás trocando o status depois."
              }`
            : ""
        }
        confirmLabel={pending ? `Marcar como ${LEAD_STATUS_LABEL[pending.next]}` : "Confirmar"}
        variant={pending?.next === "perdido" ? "danger" : "default"}
        onConfirm={() => {
          if (pending) void applyStatus(pending.next);
          setPending(null);
        }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="break-words text-sm font-semibold text-[var(--text)]">{value}</dd>
    </div>
  );
}
