"use client";

import { LayoutGrid, List, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, useTransition, type FormEvent } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  ADMIN_PUPPY_STATUSES,
  PUPPY_STATUS_COLOR,
  PUPPY_STATUS_LABEL,
  hasActiveFilters,
  type AdminPuppyListItem,
  type AdminPuppySort,
  type AdminPuppyStatus,
  type ParsedPuppyFilters,
  type PuppyStatusSummary,
} from "@/lib/admin/puppyAdmin";

import { PuppiesBoard } from "./PuppiesBoard";
import { PuppiesList } from "./PuppiesTable";

type ViewMode = "list" | "board";
const VIEW_KEY = "byimperiodog:admin:puppies:view";

const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";
const INPUT =
  "min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]";
const LABEL = "mb-1 block text-sm font-medium text-[var(--text)]";
const BUTTON =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const SORT_LABEL: Record<AdminPuppySort, string> = {
  recent: "Cadastro mais recente",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  demand: "Mais procurados",
};

/** Estes dois tiram o filhote da lista de disponiveis: pedem confirmacao. */
const NEEDS_CONFIRM: AdminPuppyStatus[] = ["sold", "unavailable"];

export type PuppiesPageClientProps = {
  items: AdminPuppyListItem[];
  filters: ParsedPuppyFilters;
  sort: AdminPuppySort;
  total: number;
  truncated: boolean;
  statusSummary: PuppyStatusSummary;
  colorOptions: string[];
  hasDemand: boolean;
  configured: boolean;
  error: { code: string } | null;
};

type FormState = {
  statuses: AdminPuppyStatus[];
  colors: string[];
  sex: "" | "male" | "female";
  priceMin: string;
  priceMax: string;
  search: string;
  sort: AdminPuppySort;
};

type PendingChange = { puppies: AdminPuppyListItem[]; next: AdminPuppyStatus };

function toFormState(filters: ParsedPuppyFilters, sort: AdminPuppySort): FormState {
  return {
    statuses: filters.statuses,
    colors: filters.colors,
    sex: filters.sex ?? "",
    priceMin: typeof filters.minPrice === "number" ? String(filters.minPrice) : "",
    priceMax: typeof filters.maxPrice === "number" ? String(filters.maxPrice) : "",
    search: filters.search ?? "",
    sort,
  };
}

export function buildPuppiesHref(state: FormState): string {
  const params = new URLSearchParams();
  if (state.statuses.length) params.set("status", state.statuses.join(","));
  if (state.colors.length) params.set("color", state.colors.join(","));
  if (state.sex) params.set("sex", state.sex);
  if (state.priceMin.trim()) params.set("priceMin", state.priceMin.trim());
  if (state.priceMax.trim()) params.set("priceMax", state.priceMax.trim());
  if (state.search.trim()) params.set("search", state.search.trim());
  if (state.sort !== "recent") params.set("sort", state.sort);
  const query = params.toString();
  return query ? `/admin/puppies?${query}` : "/admin/puppies";
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function plural(count: number): string {
  return `${count} ${count === 1 ? "filhote" : "filhotes"}`;
}

export function PuppiesPageClient({
  items,
  filters,
  sort,
  total,
  truncated,
  statusSummary,
  colorOptions,
  hasDemand,
  configured,
  error,
}: PuppiesPageClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const filtersId = useId();
  const [refreshing, startRefresh] = useTransition();

  const [form, setForm] = useState<FormState>(() => toFormState(filters, sort));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [overrides, setOverrides] = useState<Record<string, AdminPuppyStatus>>({});
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [bulkStatus, setBulkStatus] = useState<AdminPuppyStatus>("reserved");
  const [announcement, setAnnouncement] = useState("");

  // O endereco e a fonte da verdade dos filtros: quando ele muda, o formulario acompanha.
  useEffect(() => {
    setForm(toFormState(filters, sort));
  }, [filters, sort]);

  // Lista nova vinda do servidor: o que estava marcado "de cabeca" ja esta gravado.
  useEffect(() => {
    setOverrides({});
    setSelected((current) => {
      const alive = new Set(items.map((item) => item.id));
      const next = new Set([...current].filter((id) => alive.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [items]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(VIEW_KEY) === "board") setView("board");
    } catch {
      // sem armazenamento local a tela abre em lista
    }
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // preferencia nao gravada; a tela segue funcionando
    }
  };

  const visible = useMemo(
    () => items.map((item) => (overrides[item.id] ? { ...item, status: overrides[item.id] } : item)),
    [items, overrides],
  );

  const filtered = hasActiveFilters(filters);
  const activeCount =
    filters.statuses.length +
    filters.colors.length +
    (filters.sex ? 1 : 0) +
    (typeof filters.minPrice === "number" ? 1 : 0) +
    (typeof filters.maxPrice === "number" ? 1 : 0) +
    (filters.search ? 1 : 0);

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildPuppiesHref(form));
  };

  const clearFilters = () => {
    router.push(buildPuppiesHref({ ...toFormState({ statuses: [], colors: [] }, form.sort) }));
  };

  const applyChange = useCallback(
    async ({ puppies, next }: PendingChange) => {
      const ids = puppies.map((puppy) => puppy.id);
      setBusyIds((current) => new Set([...current, ...ids]));

      const done: string[] = [];
      const failed: { name: string; reason: string }[] = [];
      for (const puppy of puppies) {
        try {
          const response = await fetch("/api/admin/puppies/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: puppy.id, status: next }),
          });
          const json = (await response.json().catch(() => null)) as { error?: string } | null;
          if (!response.ok) throw new Error(json?.error || `Erro ${response.status}`);
          done.push(puppy.id);
        } catch (cause) {
          failed.push({ name: puppy.name, reason: cause instanceof Error ? cause.message : "falha de rede" });
        }
      }

      setBusyIds((current) => {
        const copy = new Set(current);
        ids.forEach((id) => copy.delete(id));
        return copy;
      });

      if (done.length) {
        setOverrides((current) => {
          const copy = { ...current };
          done.forEach((id) => {
            copy[id] = next;
          });
          return copy;
        });
        setSelected((current) => {
          const copy = new Set(current);
          done.forEach((id) => copy.delete(id));
          return copy;
        });
        const message =
          done.length === 1
            ? `${puppies.find((puppy) => puppy.id === done[0])?.name ?? "Filhote"} agora está como ${PUPPY_STATUS_LABEL[next]}.`
            : `${plural(done.length)} agora como ${PUPPY_STATUS_LABEL[next]}.`;
        push({ type: "success", message });
        setAnnouncement(message);
        startRefresh(() => router.refresh());
      }
      if (failed.length) {
        const message =
          failed.length === 1
            ? `Não foi possível mudar ${failed[0].name}: ${failed[0].reason}`
            : `${failed.length} filhotes não mudaram de status. Primeiro erro: ${failed[0].reason}`;
        push({ type: "error", message, duration: 8000 });
        setAnnouncement(message);
      }
    },
    [push, router],
  );

  const requestChange = (puppies: AdminPuppyListItem[], next: AdminPuppyStatus) => {
    const changing = puppies.filter((puppy) => puppy.status !== next);
    if (changing.length === 0) return;
    const change = { puppies: changing, next };
    if (NEEDS_CONFIRM.includes(next)) setPending(change);
    else void applyChange(change);
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const copy = new Set(current);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const allSelected = visible.length > 0 && visible.every((item) => selected.has(item.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((item) => item.id)));
  const selectedPuppies = visible.filter((item) => selected.has(item.id));

  const confirmTitle = pending
    ? pending.puppies.length === 1
      ? `Marcar ${pending.puppies[0].name} como ${PUPPY_STATUS_LABEL[pending.next]}?`
      : `Marcar ${plural(pending.puppies.length)} como ${PUPPY_STATUS_LABEL[pending.next]}?`
    : "";
  const confirmDescription = pending
    ? pending.next === "sold"
      ? "A data da venda é gravada com o dia de hoje. Isto muda só o controle interno de estoque: as páginas do site não são alteradas por aqui."
      : "O filhote sai da conta de disponíveis no painel. Isto muda só o controle interno de estoque: as páginas do site não são alteradas por aqui."
    : "";

  /* ---------------------------------------------------------------- */
  /* Estados em que nao ha lista para mostrar                           */
  /* ---------------------------------------------------------------- */

  if (!configured) {
    return (
      <div className={CARD} role="alert">
        <h2 className="text-base font-semibold text-[var(--text)]">O painel não está ligado ao banco de dados</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Faltam as credenciais do banco neste ambiente, por isso a lista de filhotes não pode ser lida. Nada foi
          apagado: assim que as credenciais forem configuradas, o estoque volta a aparecer.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={CARD} role="alert">
        <h2 className="text-base font-semibold text-[var(--text)]">Não foi possível carregar os filhotes</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          O banco de dados respondeu com erro (código {error.code}). A lista abaixo não é mostrada para não parecer que
          o estoque está vazio.
        </p>
        <button
          type="button"
          className={`${BUTTON} mt-4`}
          disabled={refreshing}
          onClick={() => startRefresh(() => router.refresh())}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          {refreshing ? "Carregando…" : "Tentar de novo"}
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Tela normal                                                        */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-5">
      <nav aria-label="Estoque por status">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ADMIN_PUPPY_STATUSES.map((status) => {
            const current = filters.statuses.length === 1 && filters.statuses[0] === status;
            return (
              <li key={status}>
                <Link
                  href={current ? "/admin/puppies" : `/admin/puppies?status=${status}`}
                  aria-current={current ? "true" : undefined}
                  className={`block rounded-2xl border bg-white p-4 shadow-sm transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] ${
                    current ? "border-[var(--brand)] ring-1 ring-[var(--brand)]" : "border-[var(--border)]"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PUPPY_STATUS_COLOR[status] }}
                      aria-hidden="true"
                    />
                    {PUPPY_STATUS_LABEL[status]}
                  </span>
                  <span className="mt-1 block text-2xl font-semibold tabular-nums text-[var(--text)]">
                    {statusSummary[status]}
                  </span>
                  <span className="sr-only">
                    {current ? ". Filtro ativo; toque para ver todos." : ". Toque para ver só este status."}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className={CARD} aria-label="Filtros">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <button
            type="button"
            className={BUTTON}
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros{activeCount ? ` (${activeCount})` : ""}
          </button>
          {filtered ? (
            <button type="button" className={BUTTON} onClick={clearFilters}>
              <X className="h-4 w-4" aria-hidden="true" />
              Limpar
            </button>
          ) : null}
        </div>

        <form
          id={filtersId}
          onSubmit={submitFilters}
          className={`${filtersOpen ? "mt-4 block" : "hidden"} space-y-4 md:mt-0 md:block`}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label htmlFor={`${filtersId}-busca`} className={LABEL}>
                Buscar
              </label>
              <input
                id={`${filtersId}-busca`}
                type="search"
                className={INPUT}
                placeholder="Nome, código, cor ou cidade"
                value={form.search}
                onChange={(event) => setForm((state) => ({ ...state, search: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor={`${filtersId}-sexo`} className={LABEL}>
                Sexo
              </label>
              <select
                id={`${filtersId}-sexo`}
                className={INPUT}
                value={form.sex}
                onChange={(event) => setForm((state) => ({ ...state, sex: event.target.value as FormState["sex"] }))}
              >
                <option value="">Todos</option>
                <option value="male">Macho</option>
                <option value="female">Fêmea</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${filtersId}-ordem`} className={LABEL}>
                Ordenar por
              </label>
              <select
                id={`${filtersId}-ordem`}
                className={INPUT}
                value={form.sort}
                onChange={(event) => setForm((state) => ({ ...state, sort: event.target.value as AdminPuppySort }))}
              >
                {(Object.keys(SORT_LABEL) as AdminPuppySort[])
                  .filter((option) => option !== "demand" || hasDemand || form.sort === "demand")
                  .map((option) => (
                    <option key={option} value={option}>
                      {SORT_LABEL[option]}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${filtersId}-min`} className={LABEL}>
                Preço mínimo (R$)
              </label>
              <input
                id={`${filtersId}-min`}
                inputMode="decimal"
                className={INPUT}
                placeholder="Ex.: 4500"
                value={form.priceMin}
                onChange={(event) => setForm((state) => ({ ...state, priceMin: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor={`${filtersId}-max`} className={LABEL}>
                Preço máximo (R$)
              </label>
              <input
                id={`${filtersId}-max`}
                inputMode="decimal"
                className={INPUT}
                placeholder="Ex.: 9000"
                value={form.priceMax}
                onChange={(event) => setForm((state) => ({ ...state, priceMax: event.target.value }))}
              />
            </div>
          </div>

          <fieldset>
            <legend className={LABEL}>Status</legend>
            <div className="flex flex-wrap gap-2">
              {ADMIN_PUPPY_STATUSES.map((status) => (
                <label
                  key={status}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text)] has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--surface-2)]"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand)]"
                    checked={form.statuses.includes(status)}
                    onChange={() => setForm((state) => ({ ...state, statuses: toggle(state.statuses, status) }))}
                  />
                  {PUPPY_STATUS_LABEL[status]}
                </label>
              ))}
            </div>
          </fieldset>

          {colorOptions.length > 0 ? (
            <fieldset>
              <legend className={LABEL}>Cor</legend>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <label
                    key={color}
                    className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text)] has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--surface-2)]"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--brand)]"
                      checked={form.colors.includes(color)}
                      onChange={() => setForm((state) => ({ ...state, colors: toggle(state.colors, color) }))}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={BUTTON_PRIMARY}>
              Aplicar filtros
            </button>
            {filtered ? (
              <button type="button" className={`${BUTTON} hidden md:inline-flex`} onClick={clearFilters}>
                <X className="h-4 w-4" aria-hidden="true" />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-[var(--text-muted)]">
          {filtered
            ? `Mostrando ${visible.length} de ${plural(total)} do estoque.`
            : `${plural(total)} no estoque.`}
          {refreshing ? " Atualizando…" : ""}
        </p>
        <div role="group" aria-label="Modo de visualização" className="inline-flex rounded-lg border border-[var(--border)] bg-white p-1">
          {(
            [
              { key: "list", label: "Lista", Icon: List },
              { key: "board", label: "Kanban", Icon: LayoutGrid },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => changeView(key)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] ${
                view === key ? "bg-[var(--brand)] text-white" : "text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {truncated ? (
        <p className="rounded-xl border border-[#e5b9a3] bg-[#fdf1ea] p-3 text-sm text-[#8a3a12]" role="note">
          O estoque passou do limite de leitura desta tela, então a lista e os números acima estão incompletos.
        </p>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {visible.length === 0 ? (
        <div className={`${CARD} text-center`}>
          {filtered ? (
            <>
              <h2 className="text-base font-semibold text-[var(--text)]">Nenhum filhote com esses filtros</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                O estoque tem {plural(total)}, mas nenhum combina com o que foi escolhido.
              </p>
              <button type="button" className={`${BUTTON} mt-4`} onClick={clearFilters}>
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-[var(--text)]">Nenhum filhote cadastrado</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Cadastre o primeiro para começar o controle de estoque.</p>
              <Link href="/admin/puppies/new" className={`${BUTTON_PRIMARY} mt-4`}>
                Novo filhote
              </Link>
            </>
          )}
        </div>
      ) : view === "list" ? (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text)]">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--brand)]"
                checked={allSelected}
                onChange={toggleAll}
              />
              Selecionar todos
            </label>
            {selectedPuppies.length > 0 ? (
              <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-sm text-[var(--text-muted)]">
                  {selectedPuppies.length} {selectedPuppies.length === 1 ? "selecionado" : "selecionados"}
                </span>
                <label htmlFor={`${filtersId}-lote`} className="sr-only">
                  Novo status para os selecionados
                </label>
                <select
                  id={`${filtersId}-lote`}
                  className={`${INPUT} w-auto`}
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value as AdminPuppyStatus)}
                >
                  {ADMIN_PUPPY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PUPPY_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={BUTTON_PRIMARY}
                  disabled={busyIds.size > 0}
                  onClick={() => requestChange(selectedPuppies, bulkStatus)}
                >
                  Mudar status
                </button>
              </div>
            ) : null}
          </div>
          <PuppiesList
            items={visible}
            selected={selected}
            busyIds={busyIds}
            showDemand={hasDemand}
            onToggle={toggleSelected}
            onStatusChange={(puppy, next) => requestChange([puppy], next)}
          />
        </>
      ) : (
        <PuppiesBoard
          items={visible}
          busyIds={busyIds}
          showDemand={hasDemand}
          onStatusChange={(puppy, next) => requestChange([puppy], next)}
        />
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pending ? `Marcar como ${PUPPY_STATUS_LABEL[pending.next]}` : "Confirmar"}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={() => {
          const change = pending;
          setPending(null);
          if (change) void applyChange(change);
        }}
      />
    </div>
  );
}
