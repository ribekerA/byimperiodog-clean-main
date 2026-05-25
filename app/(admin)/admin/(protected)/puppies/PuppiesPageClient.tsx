"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Filter, LayoutGrid, Loader2, RotateCcw, SlidersHorizontal, TableProperties } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/ui/toast";

import { PuppiesBoard } from "./PuppiesBoard";
import { PuppiesTable } from "./PuppiesTable";
import type { AdminPuppyListItem, AdminPuppySort, AdminPuppyStatus, ParsedPuppyFilters } from "./queries";

type Props = {
  items: AdminPuppyListItem[];
  leadCounts: Record<string, number>;
  filters: ParsedPuppyFilters;
  sort: AdminPuppySort;
  total: number;
  hasMore: boolean;
  statusSummary: Record<AdminPuppyStatus, number>;
  colorOptions: string[];
};

type FilterFormState = {
  statuses: Set<AdminPuppyStatus>;
  colors: Set<string>;
  sex?: "male" | "female";
  minPrice: string;
  maxPrice: string;
  search: string;
  sort: AdminPuppySort;
};

const STATUS_OPTIONS: { value: AdminPuppyStatus; label: string }[] = [
  { value: "available", label: "Disponível" },
  { value: "coming_soon", label: "Em breve" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
  { value: "unavailable", label: "Arquivado" },
];

const SEX_OPTIONS = [
  { value: undefined, label: "Ambos" },
  { value: "male" as const, label: "Machos" },
  { value: "female" as const, label: "Fêmeas" },
];

const SORT_LABELS: Record<AdminPuppySort, string> = {
  recent: "Mais recentes",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  demand: "Maior demanda (score)",
};

const VIEW_STORAGE_KEY = "byimperiodog:admin:puppies:view";
const EMPTY_FILTERS: ParsedPuppyFilters = { statuses: [], colors: [] };

function buildFormState(filters: ParsedPuppyFilters, sort: AdminPuppySort): FilterFormState {
  return {
    statuses: new Set(filters.statuses),
    colors: new Set(filters.colors),
    sex: filters.sex,
    minPrice: filters.minPrice ? String(filters.minPrice) : "",
    maxPrice: filters.maxPrice ? String(filters.maxPrice) : "",
    search: filters.search ?? "",
    sort,
  };
}

export function PuppiesPageClient({ items, leadCounts, filters, sort, total, hasMore, statusSummary, colorOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [view, setView] = useState<"table" | "board">("table");
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FilterFormState>(() => buildFormState(filters, sort));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFormState(buildFormState(filters, sort));
  }, [filters, sort]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "board" || stored === "table") {
      setView(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const applyFilters = (state: FilterFormState) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("status");
    params.delete("color");
    params.delete("sex");
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("search");
    params.delete("sort");

    if (state.statuses.size) params.set("status", Array.from(state.statuses).join(","));
    if (state.colors.size) params.set("color", Array.from(state.colors).join(","));
    if (state.sex) params.set("sex", state.sex);
    if (state.minPrice) params.set("priceMin", state.minPrice);
    if (state.maxPrice) params.set("priceMax", state.maxPrice);
    if (state.search.trim()) params.set("search", state.search.trim());
    if (state.sort !== "recent") params.set("sort", state.sort);

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/admin/puppies?${query}` : "/admin/puppies");
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters(formState);
  };

  const handleReset = () => {
    setFormState(buildFormState(EMPTY_FILTERS, "recent"));
    startTransition(() => router.push("/admin/puppies"));
  };

  const handleSortChange = (nextSort: AdminPuppySort) => {
    const nextState: FilterFormState = { ...formState, sort: nextSort };
    setFormState(nextState);
    applyFilters(nextState);
  };

  const toggleStatus = (status: AdminPuppyStatus) => {
    setFormState((prev) => {
      const next = new Set(prev.statuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { ...prev, statuses: next };
    });
  };

  const toggleColor = (color: string) => {
    setFormState((prev) => {
      const next = new Set(prev.colors);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return { ...prev, colors: next };
    });
  };

  const handleStatusChange = async (id: string, status: AdminPuppyStatus) => {
    const isDestructive = status === "sold" || status === "unavailable";
    if (isDestructive && typeof window !== "undefined") {
      const confirmed = window.confirm("Tem certeza? Esta ação altera o status de forma definitiva.");
      if (!confirmed) return;
    }
    setMutatingId(id);
    try {
      const res = await fetch("/api/admin/puppies/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Erro ao atualizar status");
      }
      push({ type: "success", message: "Status atualizado com sucesso." });
      router.refresh();
    } catch (error) {
      push({ type: "error", message: error instanceof Error ? error.message : "Erro ao atualizar status" });
    } finally {
      setMutatingId(null);
    }
  };

  const activeFilters = useMemo(() => {
    let count = 0;
    if (formState.statuses.size) count++;
    if (formState.colors.size) count++;
    if (formState.sex) count++;
    if (formState.minPrice) count++;
    if (formState.maxPrice) count++;
    if (formState.search.trim()) count++;
    return count;
  }, [formState]);

  const formattedTotal = new Intl.NumberFormat("pt-BR").format(total);

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
        aria-labelledby="filters-heading"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          <h2 id="filters-heading" className="text-sm font-semibold text-[var(--text)]">
            Filtros avançados {activeFilters ? `(${activeFilters})` : ""}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</legend>
            <div className="grid gap-2">
              {STATUS_OPTIONS.map((option) => {
                const id = `status-${option.value}`;
                return (
                  <label key={option.value} htmlFor={id} className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
                    <input
                      id={id}
                      type="checkbox"
                      checked={formState.statuses.has(option.value)}
                      onChange={() => toggleStatus(option.value)}
                      className="h-4 w-4 rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Cor</legend>
            <div className="grid gap-2">
              {colorOptions.length === 0 && <p className="text-xs text-[var(--text-muted)]">Sem cores cadastradas.</p>}
              {colorOptions.map((color) => {
                const id = `color-${color}`;
                return (
                  <label key={color} htmlFor={id} className="inline-flex items-center gap-2 text-sm text-[var(--text)] capitalize">
                    <input
                      id={id}
                      type="checkbox"
                      checked={formState.colors.has(color)}
                      onChange={() => toggleColor(color)}
                      className="h-4 w-4 rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500"
                    />
                    {color.replace(/-/g, " ")}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sexo</legend>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, sex: option.value }))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${formState.sex === option.value ? "bg-emerald-600 text-white" : "bg-[var(--surface)] text-[var(--text)]"}`}
                  aria-pressed={formState.sex === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor="price-min">
              Faixa de preço (R$)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="price-min"
                type="number"
                inputMode="numeric"
                placeholder="Mínimo"
                value={formState.minPrice}
                onChange={(e) => setFormState((prev) => ({ ...prev, minPrice: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-sm text-[var(--text-muted)]">até</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Máximo"
                value={formState.maxPrice}
                onChange={(e) => setFormState((prev) => ({ ...prev, maxPrice: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor="search-term">
              Buscar por nome, slug ou cidade
            </label>
            <input
              id="search-term"
              type="search"
              value={formState.search}
              onChange={(e) => setFormState((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Limpar filtros
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Filter className="h-4 w-4" aria-hidden /> Aplicar filtros
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text)]" role="status" aria-live="polite">
            {formattedTotal} filhote(s) encontrados {hasMore ? "(há mais registros, refine a busca)" : ""}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Visão focada em estoque real, filtros aplicados via Supabase.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--text)]">
            Ordenar por
            <select
              value={formState.sort}
              onChange={(e) => handleSortChange(e.target.value as AdminPuppySort)}
              className="ml-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1" role="group" aria-label="Alternar visualização">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${view === "table" ? "bg-emerald-600 text-white" : "text-[var(--text)]"}`}
              aria-pressed={view === "table"}
            >
              <TableProperties className="h-4 w-4" aria-hidden /> Tabela
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${view === "board" ? "bg-emerald-600 text-white" : "text-[var(--text)]"}`}
              aria-pressed={view === "board"}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden /> Kanban
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="list" aria-label="Resumo por status">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" role="listitem">
            <p className="font-semibold text-[var(--text)]">{option.label}</p>
            <p className="text-xl font-bold text-[var(--text)]">{statusSummary[option.value] ?? 0}</p>
          </div>
        ))}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Atualizando dados...
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[var(--text)]">Nenhum filhote encontrado para este filtro.</p>
          <p className="text-xs text-[var(--text-muted)]">Ajuste os filtros ou limpe para visualizar todo o estoque.</p>
        </div>
      ) : view === "board" ? (
        <PuppiesBoard items={items} leadCounts={leadCounts} onStatusChange={handleStatusChange} mutatingId={mutatingId} />
      ) : (
        <PuppiesTable items={items} leadCounts={leadCounts} onStatusChange={handleStatusChange} mutatingId={mutatingId} />
      )}
    </div>
  );
}
