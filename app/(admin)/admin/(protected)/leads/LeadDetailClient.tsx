"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BadgeCheck, Copy, Flame, Gauge, Loader2, MessageCircle, Sparkles } from "lucide-react";

import { useToast } from "@/components/ui/toast";

import type { LeadAdvisorSnapshot, AdvisorMessageStyle } from "@/lib/ai/leadAdvisor";

import type { LeadPuppyMatch, LeadStatus } from "./queries";
import { LeadAiSummaryCard, LeadLossCard, LeadMessageStyles, LeadStatusSuggestionCard } from "./ui/LeadAdvisorCards";
import { LeadCrossMatchCard } from "./ui/LeadCrossMatchCard";
import { LeadFraudBadge } from "./ui/LeadFraudBadge";
import { LeadIntelCard } from "./ui/LeadIntelCard";
import { LeadPuppyRecommenderCard } from "./ui/LeadPuppyRecommenderCard";

export type LeadDetailData = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  preferredColor?: string | null;
  preferredSex?: string | null;
  status: LeadStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  page?: string | null;
  origin?: string | null;
  message?: string | null;
  notes?: string | null;
};

export type LeadHistoryEntry = {
  id: string;
  createdAt: string;
  status?: string | null;
  type?: string | null;
  preview?: string | null;
  channel?: string | null;
  ctaLink?: string | null;
};

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const PRIORITY_LABELS = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
} as const;

const PRIORITY_BADGES = {
  alta: "bg-rose-100 text-rose-700",
  media: "bg-amber-100 text-amber-700",
  baixa: "bg-slate-100 text-slate-600",
} as const;

const STATUS_SUGGESTION_TO_STATUS: Record<string, LeadStatus | null> = {
  novo: "novo",
  em_conversa: "em_contato",
  followup: "em_contato",
  quase_fechado: "em_contato",
  fechado: "fechado",
  perdido: "perdido",
};

const EMPTY_VALUE = "—";

const formatDateTime = (value?: string | null) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
};

const valueOrDash = (value?: string | null) => {
  if (!value) return EMPTY_VALUE;
  const trimmed = value.toString().trim();
  return trimmed.length ? trimmed : EMPTY_VALUE;
};

const buildFallbackMessage = (lead: LeadDetailData, puppy?: LeadPuppyMatch | null) => {
  const firstName = (lead.name || "").split(" ")[0] ?? "";
  const desired = [lead.preferredColor, lead.preferredSex].filter(Boolean).join(" • ");
  return `Olá ${firstName || ""}! Somos da By Império Dog. Vimos seu interesse${desired ? ` (${desired})` : ""}${
    puppy ? ` e o ${puppy.name} combina muito com o que você procura` : ""
  }. Podemos te enviar fotos e detalhes agora?`;
};

const selectMessageText = (
  advisor: LeadAdvisorSnapshot,
  lead: LeadDetailData,
  style?: AdvisorMessageStyle,
  puppy?: LeadPuppyMatch | null,
) => {
  const selected = advisor.messages.find((message) => (style ? message.id === style : true));
  return selected?.text ?? buildFallbackMessage(lead, puppy);
};

const buildWhatsAppLink = (lead: LeadDetailData, advisor: LeadAdvisorSnapshot, style?: AdvisorMessageStyle, puppy?: LeadPuppyMatch | null) => {
  if (!lead.whatsapp) return null;
  const text = selectMessageText(advisor, lead, style, puppy);
  return `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(text)}`;
};

export function LeadDetailClient({
  lead,
  history,
  matchedPuppy,
  insight,
  advisor,
}: {
  lead: LeadDetailData;
  history: LeadHistoryEntry[];
  matchedPuppy?: LeadPuppyMatch | null;
  insight?: Record<string, unknown> | null;
  advisor: LeadAdvisorSnapshot;
}) {
  const { push } = useToast();
  const [mutating, setMutating] = useState<LeadStatus | null>(null);
  const [copyingStyle, setCopyingStyle] = useState<string | null>(null);
  const suggestedStatus = STATUS_SUGGESTION_TO_STATUS[advisor.status.suggestion] ?? null;

  const primaryStyle = advisor.messages[0]?.id;
  const message = useMemo(() => selectMessageText(advisor, lead, primaryStyle, matchedPuppy), [advisor, lead, matchedPuppy, primaryStyle]);
  const whatsappLink = useMemo(
    () => buildWhatsAppLink(lead, advisor, primaryStyle, matchedPuppy),
    [lead, advisor, matchedPuppy, primaryStyle],
  );

  const handleStatusChange = async (status: LeadStatus) => {
    setMutating(status);
    try {
      const res = await fetch("/api/admin/leads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Erro ao atualizar status");
      }
      push({ type: "success", message: "Status atualizado" });
    } catch (error) {
      push({ type: "error", message: error instanceof Error ? error.message : "Erro ao atualizar status" });
    } finally {
      setMutating(null);
    }
  };

  const handleCopyMessage = async (text: string, label: string, styleId?: string) => {
    try {
      setCopyingStyle(styleId ?? "default");
      await navigator.clipboard.writeText(text);
      push({ type: "success", message: `Mensagem ${label.toLowerCase()} copiada` });
    } catch {
      push({ type: "error", message: "Não foi possível copiar" });
    } finally {
      setCopyingStyle(null);
    }
  };

  const openWhatsApp = () => {
    if (!whatsappLink) {
      push({ type: "error", message: "Telefone sem WhatsApp válido" });
      return;
    }
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{lead.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">Lead #{lead.id}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${PRIORITY_BADGES[advisor.priority.level]}`}
            >
              <Flame className="h-3.5 w-3.5" aria-hidden /> Prioridade {PRIORITY_LABELS[advisor.priority.level]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <Gauge className="h-3.5 w-3.5" aria-hidden /> Compatibilidade {advisor.compatibility.score}%
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyMessage(message, advisor.messages[0]?.label ?? "IA", primaryStyle)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
          >
            {copyingStyle && copyingStyle === (primaryStyle ?? "default") ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            Copiar mensagem
          </button>
          <button
            type="button"
            onClick={openWhatsApp}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Abrir conversa
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Telefone" value={valueOrDash(lead.phone)} />
            <Info label="Cidade" value={valueOrDash([lead.city, lead.state].filter(Boolean).join(", "))} />
            <Info label="Cor desejada" value={valueOrDash(lead.preferredColor)} />
            <Info label="Sexo" value={valueOrDash(lead.preferredSex)} />
            <Info label="Origem" value={valueOrDash(lead.origin)} />
            <Info label="Página" value={valueOrDash(lead.page)} />
            <Info label="Criado em" value={formatDateTime(lead.createdAt)} />
            <Info label="Atualizado em" value={formatDateTime(lead.updatedAt)} />
          </div>
          {(lead.message || lead.notes) && (
            <div className="rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--text)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Mensagem do lead</p>
              <p className="mt-2 whitespace-pre-line">{lead.message || lead.notes}</p>
            </div>
          )}
          {!lead.message && !lead.notes && (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
              Nenhuma mensagem registrada para este lead.
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Status rápido</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  disabled={mutating === option.value}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-[var(--border)] ${
                    lead.status === option.value ? "bg-emerald-100 text-emerald-800" : "bg-white text-[var(--text)]"
                  }`}
                >
                  {mutating === option.value ? "..." : option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-[var(--border)]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Mensagem sugerida</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <LeadAiSummaryCard advisor={advisor} matchedPuppy={matchedPuppy} />
        <LeadStatusSuggestionCard
          advisor={advisor}
          currentStatus={lead.status}
          suggestedStatus={suggestedStatus}
          onApply={handleStatusChange}
          mutating={mutating}
        />
        <LeadLossCard
          loss={advisor.loss}
          copying={copyingStyle === "reactivation"}
          onCopy={() => handleCopyMessage(advisor.loss.reactivationMessage, "reativação", "reactivation")}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <LeadIntelCard leadId={lead.id} initial={insight as any} />
        {matchedPuppy ? (
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Filhote associado</p>
                <p className="text-xs text-[var(--text-muted)]">Match do funil</p>
              </div>
              <BadgeCheck className="h-5 w-5 text-emerald-600" aria-hidden />
            </div>
            <div className="rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
              <p className="text-base font-semibold">{matchedPuppy.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{matchedPuppy.color || EMPTY_VALUE}</p>
              <a href={`/admin/puppies/${matchedPuppy.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
                Abrir ficha
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            Nenhum filhote associado. Use o card de recomendação para sugerir matches.
          </div>
        )}
        <LeadPuppyRecommenderCard leadId={lead.id} />
      </section>

      <LeadMessageStyles messages={advisor.messages} onCopy={handleCopyMessage} copyingStyle={copyingStyle} />

      <LeadCrossMatchCard leadId={lead.id} />
      <LeadFraudBadge leadId={lead.id} />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Histórico de interações</p>
            <p className="text-xs text-[var(--text-muted)]">Mensagens automáticas e registros manuais</p>
          </div>
          <Sparkles className="h-5 w-5 text-[var(--text-muted)]" aria-hidden />
        </header>
        <ul className="mt-4 space-y-3">
          {history.length === 0 && <li className="text-sm text-[var(--text-muted)]">Nenhum log registrado ainda.</li>}
          {history.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{formatDateTime(entry.createdAt)}</span>
                <span>{entry.type || EMPTY_VALUE}</span>
              </div>
              <p className="mt-1 font-semibold">{entry.status || "Evento"}</p>
              <p className="text-sm text-[var(--text-muted)]">{entry.preview || "(sem conteúdo)"}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}
