"use client";

import { Download, MessageCircle, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type FormEvent } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  LEAD_STATUS_LABEL,
  buildLeadsHref,
  hasActiveLeadFilters,
  leadStatusNeedsConfirm,
  leadWhatsappLink,
  leadsToCsv,
  sanitizeLeadSearch,
  type LeadStatusSummary,
  type ParsedLeadFilters,
} from "@/lib/admin/leadAdmin";

import { LEAD_STATUS_OPTIONS } from "./lead-status";
import type { LeadStatus } from "./lead-status";
import type { LeadListItem } from "./queries";

const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";
const INPUT =
  "min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]";
const LABEL = "mb-1 block text-sm font-medium text-[var(--text)]";
const BUTTON =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const BADGE =
  "rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-muted)]";
const BADGE_WARN = "rounded-full border border-[#e5b9a3] bg-[#fdf1ea] px-2 py-0.5 text-xs font-medium text-[#8a3a12]";
const ALERT = "rounded-2xl border border-[#e5b9a3] bg-[#fdf1ea] p-4 text-sm text-[#8a3a12] sm:p-5";

const PRIORITY_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** Data e hora de Sao Paulo, onde o atendimento acontece. */
export function formatLeadDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_TIME.format(date).replace(",", "");
}

export type LeadsCRMProps = {
  items: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  statusSummary: LeadStatusSummary;
  colorOptions: string[];
  cityOptions: string[];
  configured: boolean;
  error: { code: string } | null;
  filters: ParsedLeadFilters;
};

type FormState = {
  statuses: LeadStatus[];
  color: string;
  city: string;
  dateFrom: string;
  dateTo: string;
  search: string;
};

function toFormState(filters: ParsedLeadFilters): FormState {
  return {
    statuses: filters.statuses,
    color: filters.colors[0] ?? "",
    city: filters.city ?? "",
    dateFrom: filters.dateFrom ?? "",
    dateTo: filters.dateTo ?? "",
    search: filters.search ?? "",
  };
}

function toFilters(form: FormState): ParsedLeadFilters {
  return {
    statuses: form.statuses,
    colors: form.color ? [form.color] : [],
    city: form.city || undefined,
    dateFrom: form.dateFrom || undefined,
    dateTo: form.dateTo || undefined,
    search: sanitizeLeadSearch(form.search),
  };
}

function plural(count: number): string {
  return `${count} ${count === 1 ? "lead" : "leads"}`;
}

type Pending = { lead: LeadListItem; next: LeadStatus };

export default function LeadsCRM({
  items,
  total,
  page,
  pageSize,
  hasNext,
  statusSummary,
  colorOptions,
  cityOptions,
  configured,
  error,
  filters,
}: LeadsCRMProps) {
  const router = useRouter();
  const { push } = useToast();
  const filtersId = useId();
  const [refreshing, startRefresh] = useTransition();

  const [form, setForm] = useState<FormState>(() => toFormState(filters));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [overrides, setOverrides] = useState<Record<string, LeadStatus>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // O endereco e a fonte da verdade dos filtros: quando ele muda, o formulario acompanha.
  useEffect(() => {
    setForm(toFormState(filters));
  }, [filters]);

  // Lista nova vinda do servidor: o que estava marcado "de cabeca" ja esta gravado.
  useEffect(() => {
    setOverrides({});
  }, [items]);

  const active = hasActiveLeadFilters(filters);
  const totalAll = LEAD_STATUS_OPTIONS.reduce((sum, status) => sum + (statusSummary[status] ?? 0), 0);
  const statusOf = (lead: LeadListItem): LeadStatus => overrides[lead.id] ?? lead.status;
  const refresh = () => startRefresh(() => router.refresh());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.push(buildLeadsHref(toFilters(form)));
  };

  const applyStatus = async (lead: LeadListItem, next: LeadStatus) => {
    setBusyIds((current) => new Set(current).add(lead.id));
    try {
      const res = await fetch("/api/admin/leads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status: next }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Não foi possível gravar o status.");
      }
      setOverrides((current) => ({ ...current, [lead.id]: next }));
      const message = `${lead.name} agora está como ${LEAD_STATUS_LABEL[next]}.`;
      setAnnouncement(message);
      push({ type: "success", message });
      refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível gravar o status.";
      setAnnouncement(`O status de ${lead.name} não mudou. ${message}`);
      push({ type: "error", message });
    } finally {
      setBusyIds((current) => {
        const copy = new Set(current);
        copy.delete(lead.id);
        return copy;
      });
    }
  };

  const requestStatus = (lead: LeadListItem, next: LeadStatus) => {
    if (next === statusOf(lead)) return;
    if (leadStatusNeedsConfirm(next)) setPending({ lead, next });
    else void applyStatus(lead, next);
  };

  const exportCsv = () => {
    const csv = leadsToCsv(
      items.map((lead) => ({ ...lead, status: statusOf(lead) })),
      (value) => formatLeadDateTime(value),
    );
    // O sinal no comeco faz a planilha ler os acentos certo.
    const blob = new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setAnnouncement(`${plural(items.length)} desta página exportados.`);
  };

  if (!configured || error) {
    return (
      <div role="alert" className={ALERT}>
        <h2 className="text-base font-semibold">
          {configured ? "Não foi possível ler os leads" : "O painel não está ligado ao banco de dados"}
        </h2>
        <p className="mt-1">
          {configured
            ? `O banco recusou a consulta (código ${error?.code}). Nenhum lead foi alterado ou perdido; a lista só não pôde ser lida agora.`
            : "Faltam as credenciais do banco neste ambiente. A lista fica vazia aqui, mas isso não quer dizer que não existam leads."}
        </p>
        {configured ? (
          <button type="button" onClick={refresh} disabled={refreshing} className={`${BUTTON} mt-3`}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            Tentar de novo
          </button>
        ) : null}
      </div>
    );
  }

  const firstShown = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = (page - 1) * pageSize + items.length;

  return (
    <div className="space-y-4">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <nav aria-label="Leads por status">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {LEAD_STATUS_OPTIONS.map((status) => {
            const current = filters.statuses.length === 1 && filters.statuses[0] === status;
            return (
              <li key={status}>
                <Link
                  href={`/admin/leads?status=${status}`}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-[64px] flex-col justify-center rounded-2xl border px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] ${
                    current
                      ? "border-[var(--brand)] bg-[var(--surface-2)]"
                      : "border-[var(--border)] bg-white hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="text-sm text-[var(--text-muted)]">{LEAD_STATUS_LABEL[status]}</span>
                  <span className="text-xl font-bold tabular-nums text-[var(--text)]">{statusSummary[status] ?? 0}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className={CARD} aria-label="Filtros">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <label htmlFor={`${filtersId}-search`} className={LABEL}>
                Buscar
              </label>
              <input
                id={`${filtersId}-search`}
                type="search"
                value={form.search}
                onChange={(event) => setForm((current) => ({ ...current, search: event.target.value }))}
                placeholder="Nome ou telefone"
                maxLength={80}
                className={INPUT}
              />
            </div>
            <button
              type="button"
              className={BUTTON}
              aria-expanded={filtersOpen}
              aria-controls={`${filtersId}-more`}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {filtersOpen ? "Menos filtros" : "Mais filtros"}
            </button>
            <button type="submit" className={BUTTON_PRIMARY}>
              Aplicar filtros
            </button>
            {active ? (
              <Link href="/admin/leads" className={BUTTON}>
                <X className="h-4 w-4" aria-hidden />
                Limpar
              </Link>
            ) : null}
          </div>

          <div id={`${filtersId}-more`} hidden={!filtersOpen} className="space-y-4">
            <fieldset>
              <legend className={LABEL}>Status</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {LEAD_STATUS_OPTIONS.map((status) => (
                  <label key={status} className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--text)]">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-[var(--border)] accent-[var(--brand)]"
                      checked={form.statuses.includes(status)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          statuses: current.statuses.includes(status)
                            ? current.statuses.filter((item) => item !== status)
                            : [...current.statuses, status],
                        }))
                      }
                    />
                    {LEAD_STATUS_LABEL[status]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor={`${filtersId}-color`} className={LABEL}>
                  Cor desejada
                </label>
                <select
                  id={`${filtersId}-color`}
                  value={form.color}
                  onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                  className={INPUT}
                >
                  <option value="">Todas</option>
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${filtersId}-city`} className={LABEL}>
                  Cidade
                </label>
                <select
                  id={`${filtersId}-city`}
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className={INPUT}
                >
                  <option value="">Todas</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${filtersId}-from`} className={LABEL}>
                  Chegou de
                </label>
                <input
                  id={`${filtersId}-from`}
                  type="date"
                  value={form.dateFrom}
                  onChange={(event) => setForm((current) => ({ ...current, dateFrom: event.target.value }))}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor={`${filtersId}-to`} className={LABEL}>
                  Chegou até
                </label>
                <input
                  id={`${filtersId}-to`}
                  type="date"
                  value={form.dateTo}
                  onChange={(event) => setForm((current) => ({ ...current, dateTo: event.target.value }))}
                  className={INPUT}
                />
              </div>
            </div>
          </div>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-[var(--text-muted)]">
          {total === 0
            ? active
              ? `Nenhum lead com esses filtros (de ${plural(totalAll)} no total).`
              : "Nenhum lead recebido ainda."
            : active
              ? `Mostrando ${firstShown} a ${lastShown} de ${plural(total)} com esses filtros (${totalAll} no total).`
              : `Mostrando ${firstShown} a ${lastShown} de ${plural(total)}.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} disabled={refreshing} className={BUTTON}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            Atualizar
          </button>
          <button type="button" onClick={exportCsv} disabled={items.length === 0} className={BUTTON}>
            <Download className="h-4 w-4" aria-hidden />
            Exportar esta página (CSV)
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={`${CARD} text-center`}>
          <h2 className="text-base font-semibold text-[var(--text)]">
            {active ? "Nenhum lead com esses filtros" : "Nenhum lead recebido ainda"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {active
              ? "Tire algum filtro ou limpe a busca para ver mais leads."
              : "Quando alguém pedir contato pelo site, o pedido aparece aqui."}
          </p>
        </div>
      ) : (
        <ul aria-label="Leads" className="space-y-3">
          {items.map((lead) => {
            const status = statusOf(lead);
            const busy = busyIds.has(lead.id);
            const whatsapp = leadWhatsappLink(lead);
            const place = [lead.city, lead.state].filter(Boolean).join(" / ");
            const wish = [lead.color, lead.preferredSex].filter(Boolean).join(" · ");
            return (
              <li key={lead.id} className={CARD}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-base font-semibold text-[var(--text)]">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                      >
                        {lead.name}
                      </Link>
                    </h2>
                    <p className="text-sm text-[var(--text-muted)]">
                      {[lead.phone ?? "Sem telefone", place, formatLeadDateTime(lead.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                    {wish ? <p className="text-sm text-[var(--text)]">Procura: {wish}</p> : null}
                    {lead.message ? (
                      <p className="line-clamp-2 break-words text-sm text-[var(--text-muted)]">{lead.message}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {status === "novo" && !lead.firstRespondedAt ? (
                        <span className={BADGE_WARN}>Aguardando primeiro contato</span>
                      ) : null}
                      {lead.source ? <span className={BADGE}>Origem: {lead.source}</span> : null}
                      {lead.gclid ? <span className={BADGE}>Veio de anúncio do Google</span> : null}
                      {lead.page ? <span className={BADGE}>Página: {lead.page}</span> : null}
                    </div>
                    <p className="pt-1 text-xs text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text)]">
                        Prioridade automática: {PRIORITY_LABEL[lead.priority.level]}.
                      </span>{" "}
                      {lead.priority.reason}
                    </p>
                    {lead.matchedPuppy ? (
                      <p className="text-xs text-[var(--text-muted)]">
                        Filhote sugerido pelas regras:{" "}
                        <Link
                          href={`/admin/puppies/edit/${lead.matchedPuppy.id}`}
                          className="font-semibold text-[var(--brand)] underline underline-offset-2"
                        >
                          {lead.matchedPuppy.name}
                        </Link>
                      </p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-52">
                    <div>
                      <label htmlFor={`lead-status-${lead.id}`} className="sr-only">
                        Status de {lead.name}
                      </label>
                      <select
                        id={`lead-status-${lead.id}`}
                        value={status}
                        disabled={busy}
                        onChange={(event) => requestStatus(lead, event.target.value as LeadStatus)}
                        className={`${INPUT} disabled:cursor-wait disabled:opacity-60`}
                      >
                        {LEAD_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {LEAD_STATUS_LABEL[option]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {whatsapp ? (
                      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        WhatsApp
                        <span className="sr-only"> de {lead.name} (abre em nova aba)</span>
                      </a>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">Telefone sem formato de WhatsApp.</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {page > 1 || hasNext ? (
        <nav aria-label="Páginas" className="flex flex-wrap items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={buildLeadsHref(filters, page - 1)} className={BUTTON}>
              Página anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-[var(--text-muted)]">Página {page}</span>
          {hasNext ? (
            <Link href={buildLeadsHref(filters, page + 1)} className={BUTTON}>
              Próxima página
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending ? `Marcar ${pending.lead.name} como ${LEAD_STATUS_LABEL[pending.next]}?` : ""}
        description={
          pending?.next === "convertido"
            ? "Use Convertido só quando a venda estiver fechada de verdade. Esse número entra no painel como venda."
            : "Perdido encerra o atendimento deste lead. Dá para voltar atrás trocando o status depois."
        }
        confirmLabel={pending ? `Marcar como ${LEAD_STATUS_LABEL[pending.next]}` : "Confirmar"}
        variant={pending?.next === "perdido" ? "danger" : "default"}
        onConfirm={() => {
          if (pending) void applyStatus(pending.lead, pending.next);
          setPending(null);
        }}
      />
    </div>
  );
}
