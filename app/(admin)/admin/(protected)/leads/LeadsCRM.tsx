"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  Copy,
  Download,
  Filter,
  LayoutGrid,
  Loader2,
  MessageCircle,
  RotateCcw,
  Search,
  TableProperties,
  Wand2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

import type { AdminLeadsPayload, LeadListItem, LeadStatus, ParsedLeadFilters } from "./queries";
import { LEAD_STATUS_OPTIONS } from "./queries";

type Props = AdminLeadsPayload & { filters: ParsedLeadFilters };

type FilterFormState = {
  statuses: Set<LeadStatus>;
  colors: Set<string>;
  city: string;
  dateFrom: string;
  dateTo: string;
  search: string;
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  fechado: "Fechado",
  perdido: "Perdido",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: "bg-blue-100 text-blue-700",
  em_contato: "bg-yellow-100 text-yellow-700",
  fechado: "bg-[var(--brand-tint-100)] text-[var(--brand)]",
  perdido: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-yellow-100 text-yellow-700",
  média: "bg-yellow-100 text-yellow-700",
  baixa: "bg-slate-100 text-slate-500",
};

const EMPTY_VALUE = "—";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildFormState = (filters: ParsedLeadFilters): FilterFormState => ({
  statuses: new Set(filters.statuses),
  colors: new Set(filters.colors),
  city: filters.city ?? "",
  dateFrom: filters.dateFrom ?? "",
  dateTo: filters.dateTo ?? "",
  search: filters.search ?? "",
});

const formatDateTime = (value?: string | null) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

function tempBadge(createdAt: string | null | undefined) {
  if (!createdAt) return null;
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hours < 2) return { label: "🔥 Quente", cls: "bg-red-100 text-red-700" };
  if (hours < 24) return { label: "Morno", cls: "bg-orange-100 text-orange-700" };
  if (hours < 72) return { label: "Frio", cls: "bg-sky-100 text-sky-700" };
  return { label: "Gelado ❄", cls: "bg-slate-100 text-slate-400" };
}

const buildWhatsappMessage = (lead: LeadListItem) => {
  const firstName = (lead.name || "").split(" ")[0] ?? "";
  const desired = [lead.color, lead.preferredSex].filter(Boolean).join(" • ");
  const puppy = lead.matchedPuppy?.name;
  return `Oi ${firstName || ""}! Somos da By Império Dog. Recebemos seu interesse${desired ? ` (${desired})` : ""}${
    puppy ? ` e já separamos o ${puppy}` : ""
  }. Podemos falar por aqui e te mandar fotos/vídeo?`;
};

const buildWhatsAppLink = (lead: LeadListItem) => {
  if (!lead.whatsapp) return null;
  return `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(buildWhatsappMessage(lead))}`;
};

function exportCSV(items: LeadListItem[]) {
  const headers = ["Nome", "Telefone", "Cidade", "Estado", "Cor desejada", "Sexo desejado", "Status", "Mensagem", "Fonte", "GCLID / Braid", "Criado em"];
  const rows = items.map((l) => [
    l.name,
    l.phone ?? "",
    l.city ?? "",
    l.state ?? "",
    l.color ?? "",
    l.preferredSex ?? "",
    STATUS_LABELS[l.status] ?? l.status,
    l.mensagem ?? "",
    l.source ?? "",
    l.gclid ?? "",
    l.createdAt ? new Date(l.createdAt).toLocaleString("pt-BR") : "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadsCRM({ filters, items, total, page, hasNext, statusSummary, colorOptions, cityOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [formState, setFormState] = useState<FilterFormState>(() => buildFormState(filters));
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFormState(buildFormState(filters));
  }, [filters]);

  const formattedTotal = new Intl.NumberFormat("pt-BR").format(total);
  const canPrev = page > 1;
  const canNext = hasNext;

  const totalLeads = Object.values(statusSummary).reduce((s, v) => s + v, 0);
  const conversionRate = totalLeads > 0 ? Math.round((statusSummary.fechado / totalLeads) * 100) : 0;

  const applyFilters = (state: FilterFormState, nextPage = 1) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    ["status", "color", "city", "from", "to", "dateFrom", "dateTo", "page", "search"].forEach((k) => params.delete(k));

    if (state.statuses.size) params.set("status", Array.from(state.statuses).join(","));
    if (state.colors.size) params.set("color", Array.from(state.colors).join(","));
    if (state.city) params.set("city", state.city);
    if (state.dateFrom) params.set("from", state.dateFrom);
    if (state.dateTo) params.set("to", state.dateTo);
    if (state.search) params.set("search", state.search);
    if (nextPage > 1) params.set("page", String(nextPage));

    const url = params.toString();
    startTransition(() => { router.push(url ? `/admin/leads?${url}` : "/admin/leads"); });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters(formState, 1);
  };

  const handleReset = () => {
    const s = buildFormState({ statuses: [], colors: [], city: undefined, dateFrom: undefined, dateTo: undefined, search: undefined });
    setFormState(s);
    applyFilters(s, 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1) return;
    if (nextPage > page && !canNext) return;
    applyFilters(buildFormState(filters), nextPage);
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    setMutatingId(id);
    try {
      const res = await fetch("/api/admin/leads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Erro ao atualizar status");
      }
      push({ type: "success", message: `Status → ${STATUS_LABELS[status]}` });
      startTransition(() => router.refresh());
    } catch (error) {
      push({ type: "error", message: error instanceof Error ? error.message : "Erro ao atualizar status" });
    } finally {
      setMutatingId(null);
    }
  };

  const handleCopyMessage = async (lead: LeadListItem) => {
    try {
      await navigator.clipboard.writeText(buildWhatsappMessage(lead));
      push({ type: "success", message: "Mensagem copiada!" });
    } catch {
      push({ type: "error", message: "Não foi possível copiar a mensagem" });
    }
  };

  const handleOpenWhatsApp = (lead: LeadListItem) => {
    const link = buildWhatsAppLink(lead);
    if (!link) { push({ type: "error", message: "Telefone sem WhatsApp válido" }); return; }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Leads</h1>
          <p className="text-sm text-[var(--text-muted)]">CRM com filtros, IA e integração WhatsApp.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportCSV(items)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-muted)]">
            <TableProperties className="h-4 w-4" />
            {items.length} de {formattedTotal} leads
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Filter className="h-4 w-4 text-[var(--text-muted)]" />
            Filtros do funil
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={formState.search}
              onChange={(e) => setFormState((p) => ({ ...p, search: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-4 text-sm text-[var(--text)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {/* Status */}
            <fieldset className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</legend>
              <div className="flex flex-wrap gap-2">
                {LEAD_STATUS_OPTIONS.map((status) => {
                  const checked = formState.statuses.has(status);
                  return (
                    <label key={status} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-[var(--border)] cursor-pointer ${checked ? STATUS_COLORS[status] : "bg-white"}`}>
                      <input type="checkbox" className="sr-only" checked={checked}
                        onChange={(e) => {
                          const next = new Set(formState.statuses);
                          if (e.target.checked) next.add(status);
                          else next.delete(status);
                          setFormState((p) => ({ ...p, statuses: next }));
                        }}
                      />
                      {checked && <Check className="h-3 w-3" />}
                      {STATUS_LABELS[status]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Colors */}
            <fieldset className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Cor desejada</legend>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const checked = formState.colors.has(color);
                  return (
                    <label key={color} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-[var(--border)] cursor-pointer ${checked ? "bg-[var(--brand-tint-100)] text-[var(--brand)]" : "bg-white"}`}>
                      <input type="checkbox" className="sr-only" checked={checked}
                        onChange={(e) => {
                          const next = new Set(formState.colors);
                          if (e.target.checked) next.add(color);
                          else next.delete(color);
                          setFormState((p) => ({ ...p, colors: next }));
                        }}
                      />
                      {checked && <Check className="h-3 w-3" />}
                      {color}
                    </label>
                  );
                })}
                {colorOptions.length === 0 && <span className="text-xs text-[var(--text-muted)]">Sem cores ainda.</span>}
              </div>
            </fieldset>

            {/* City */}
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <label htmlFor="lead-city-filter" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Cidade</label>
              <select id="lead-city-filter" value={formState.city} onChange={(e) => setFormState((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]">
                <option value="">Todas</option>
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <CalendarRange className="h-4 w-4" /> Intervalo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={formState.dateFrom} onChange={(e) => setFormState((p) => ({ ...p, dateFrom: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--brand)] focus:outline-none" aria-label="Data inicial" />
                <input type="date" value={formState.dateTo} onChange={(e) => setFormState((p) => ({ ...p, dateTo: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--brand)] focus:outline-none" aria-label="Data final" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
              <RotateCcw className="h-4 w-4" /> Limpar filtros
            </button>
            <button type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]">
              <Filter className="h-4 w-4" /> Aplicar
            </button>
          </div>
        </form>

        {/* Status summary */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LEAD_STATUS_OPTIONS.map((status) => {
            const count = statusSummary[status] ?? 0;
            const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
            return (
              <div key={status} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{STATUS_LABELS[status]}</p>
                <p className="text-2xl font-bold text-[var(--text)]">{count}</p>
                <p className="text-xs text-[var(--text-muted)]">{pct}% do total</p>
              </div>
            );
          })}
          <div className="rounded-xl border border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Conversão</p>
            <p className="text-2xl font-bold text-[var(--brand)]">{conversionRate}%</p>
            <p className="text-xs text-[var(--brand)]">leads → fechado</p>
          </div>
        </div>

        {/* Pagination top */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5 text-sm text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text)]">Página {page}</p>
            <p>Mostrando {items.length} de {formattedTotal} leads.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm">
            <button type="button" onClick={() => handlePageChange(page - 1)} disabled={!canPrev}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Anterior
            </button>
            <span>•</span>
            <button type="button" onClick={() => handlePageChange(page + 1)} disabled={!canNext}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-40">
              Próxima <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] px-4 py-2 text-sm text-[var(--brand)]" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" /> Atualizando leads...
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[var(--text)]">Nenhum lead encontrado.</p>
            <p className="text-xs text-[var(--text-muted)]">Ajuste os filtros ou limpe a busca.</p>
          </div>
        ) : (
          <LeadsTable items={items} mutatingId={mutatingId}
            onStatusChange={handleStatusChange} onCopyMessage={handleCopyMessage} onOpenWhatsApp={handleOpenWhatsApp} />
        )}

        {/* Pagination bottom */}
        {items.length > 0 && (
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm">
              <button type="button" onClick={() => handlePageChange(page - 1)} disabled={!canPrev}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-40">
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
              <span>•</span>
              <button type="button" onClick={() => handlePageChange(page + 1)} disabled={!canNext}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-40">
                Próxima <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function LeadsTable({
  items, mutatingId, onStatusChange, onCopyMessage, onOpenWhatsApp,
}: {
  items: LeadListItem[];
  mutatingId: string | null;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onCopyMessage: (lead: LeadListItem) => void;
  onOpenWhatsApp: (lead: LeadListItem) => void;
}) {
  const [confirmCloseLead, setConfirmCloseLead] = useState<LeadListItem | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <caption className="sr-only">Tabela com {items.length} leads, mostrando contato, interesse, filhote sugerido e status</caption>
        <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th scope="col" className="px-4 py-3">Lead</th>
            <th scope="col" className="px-4 py-3">Contato</th>
            <th scope="col" className="px-4 py-3">Interesse</th>
            <th scope="col" className="px-4 py-3">Filhote / IA</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Criado</th>
            <th scope="col" className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-white">
          {items.map((lead) => {
            const temp = tempBadge(lead.createdAt);
            const priority = lead.aiAdvisor?.priority?.level;
            const score = lead.aiAdvisor?.compatibility?.score ?? lead.aiSummary?.score ?? null;
            return (
              <tr key={lead.id} className="hover:bg-[var(--surface-2)]">
                {/* Lead */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <a href={`/admin/leads/${lead.id}`} className="font-semibold text-[var(--text)] hover:underline">
                        {lead.name || "Lead"}
                      </a>
                      {temp && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${temp.cls}`}>
                          {temp.label}
                        </span>
                      )}
                    </div>
                    {lead.source && (
                      <span className="text-[10px] text-[var(--text-muted)]">📍 {lead.source}</span>
                    )}
                    {lead.gclid && (
                      <span
                        className="max-w-[220px] truncate font-mono text-[10px] text-[var(--text-muted)]"
                        title={lead.gclid}
                      >
                        GCLID: {lead.gclid}
                      </span>
                    )}
                    {lead.mensagem && (
                      <span className="line-clamp-2 text-xs text-[var(--text-muted)] italic">
                        "{lead.mensagem.slice(0, 80)}{lead.mensagem.length > 80 ? "…" : ""}"
                      </span>
                    )}
                  </div>
                </td>

                {/* Contato */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
                    <span className="text-xs">{lead.phone || EMPTY_VALUE}</span>
                    <button type="button" onClick={() => onOpenWhatsApp(lead)}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-tint-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint-100)]">
                      <MessageCircle className="h-3 w-3" /> Abrir
                    </button>
                    <button type="button" onClick={() => onCopyMessage(lead)}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                  {(lead.city || lead.state) && (
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {[lead.city, lead.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </td>

                {/* Interesse */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {lead.color && <span className="text-xs font-medium text-[var(--text)]">{lead.color}</span>}
                    {lead.preferredSex && (
                      <span className="text-xs text-[var(--text-muted)]">{lead.preferredSex}</span>
                    )}
                    {!lead.color && !lead.preferredSex && <span className="text-xs text-[var(--text-muted)]">{EMPTY_VALUE}</span>}
                  </div>
                </td>

                {/* Filhote + IA */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    {lead.matchedPuppy ? (
                      <a href={`/admin/puppies/${lead.matchedPuppy.id}`}
                        className="inline-flex flex-col rounded-xl bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] hover:underline">
                        <span className="font-semibold">{lead.matchedPuppy.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{lead.matchedPuppy.color || EMPTY_VALUE}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Sem filhote</span>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {score !== null && (
                        <span className="rounded-full bg-[var(--brand-tint-50)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand)]">
                          IA {score}
                        </span>
                      )}
                      {priority && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[priority] ?? "bg-slate-100 text-slate-500"}`}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                    disabled={mutatingId === lead.id}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] ${STATUS_COLORS[lead.status]}`}
                    aria-label={`Status de ${lead.name}`}
                  >
                    {LEAD_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>

                {/* Data */}
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                  {formatDateTime(lead.createdAt)}
                </td>

                {/* Ações */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a href={`/admin/leads/${lead.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
                      <LayoutGrid className="h-3 w-3" /> Detalhes
                    </a>
                    {lead.status === "novo" && (
                      <button type="button" onClick={() => onStatusChange(lead.id, "em_contato")}
                        disabled={mutatingId === lead.id}
                        className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700 hover:bg-yellow-100 disabled:opacity-50">
                        <MessageCircle className="h-3 w-3" /> Contatar
                      </button>
                    )}
                    {lead.status !== "fechado" && lead.status !== "perdido" && (
                      <button type="button" onClick={() => setConfirmCloseLead(lead)}
                        disabled={mutatingId === lead.id}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--brand-tint-50)] disabled:opacity-50">
                        <Wand2 className="h-3 w-3" /> Fechar
                      </button>
                    )}
                    {mutatingId === lead.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-muted)]" />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmDialog
        open={confirmCloseLead !== null}
        onOpenChange={(open) => { if (!open) setConfirmCloseLead(null); }}
        title="Marcar lead como fechado?"
        description={`Isso muda o status de "${confirmCloseLead?.name || "Lead"}" para Fechado.`}
        confirmLabel="Sim, fechar"
        onConfirm={() => {
          if (confirmCloseLead) onStatusChange(confirmCloseLead.id, "fechado");
        }}
      />
    </div>
  );
}
