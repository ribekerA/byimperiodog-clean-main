"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { CalendarClock, CalendarDays, Check, Clock, Download, Loader2, MoreHorizontal, Plus, RefreshCcw, Search, Trash2, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/adminFetch";
import { iso, toCsv } from "@/lib/csv";
import type { BlogBulkResult, Post, PostMetrics, ScheduleEvent } from "@/lib/db";

type PostRow = Post & {
  metrics?: PostMetrics | null;
  pendingComments?: number;
  schedule?: ScheduleEvent | null;
};

type TableResponse = {
  items: PostRow[];
  total: number;
  page: number;
  perPage: number;
};

type StatusFilter = "all" | Post["status"];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  draft: "Rascunhos",
  review: "Revisão",
  scheduled: "Agendados",
  published: "Publicados",
  archived: "Arquivados",
};

const STATUS_VARIANTS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  review: "bg-amber-100 text-amber-700",
  scheduled: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-200 text-slate-600",
};

const PAGE_SIZES = [25, 50, 75, 100] as const;

const CSV_HEADERS = [
  "id",
  "slug",
  "title",
  "status",
  "category",
  "scheduled_at",
  "published_at",
  "views",
  "leads",
  "ctr",
  "pending_comments",
];

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface BlogPostsTableProps {
  initialData: TableResponse;
}

export default function BlogPostsTable({ initialData }: BlogPostsTableProps) {
  const [rows, setRows] = useState<PostRow[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState(initialData.page);
  const [perPage, setPerPage] = useState<typeof PAGE_SIZES[number]>(initialData.perPage as typeof PAGE_SIZES[number] ?? 50);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 320);
    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        metrics: "1",
        pending: "1",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);
      try {
        const response = await adminFetch(`/api/admin/blog?${params.toString()}`);
        const json = (await response.json()) as TableResponse & { error?: string };
        if (!response.ok) throw new Error(json?.error || "Falha ao carregar posts");
        if (cancelled) return;
        setRows(json.items);
        setTotal(json.total);
        setSelectedIds(new Set());
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [page, perPage, statusFilter, debouncedSearch]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const pendingSelected = useMemo(() => rows.filter((row) => selectedIds.has(row.id)).length, [rows, selectedIds]);

  const allSelectedOnPage = selectedIds.size > 0 && rows.every((row) => selectedIds.has(row.id));

  const toggleSelectAllOnPage = (checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) rows.forEach((row) => next.add(row.id));
    else rows.forEach((row) => next.delete(row.id));
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: "publish" | "archive" | "delete" | "schedule") => {
    if (selectedIds.size === 0) return;
    if (action === "schedule" && !scheduleDate) {
      setScheduleDialogOpen(true);
      return;
    }
    setIsBulkLoading(true);
    setStatusMessage("Processando ações em massa...");
    try {
      const response = await adminFetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          postIds: Array.from(selectedIds),
          scheduleAt:
            action === "schedule"
              ? new Date(scheduleDate).toISOString()
              : undefined,
        }),
      });
      const json = (await response.json()) as BlogBulkResult & { error?: string };
      if (!response.ok) throw new Error(json?.error || "Falha ao aplicar ação em massa");

      const succeeded = json.processed.length;
      const failed = json.failed.length;
      setStatusMessage(
        failed
          ? `Ação concluída com ${succeeded} sucesso(s) e ${failed} falha(s).`
          : `Ação concluída com sucesso para ${succeeded} item(ns).`,
      );

      setScheduleDate("");
      setScheduleDialogOpen(false);
      setSelectedIds(new Set());
      // reload page
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        metrics: "1",
        pending: "1",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);
      const refreshed = await adminFetch(`/api/admin/blog?${params.toString()}`);
      const refreshedJson = (await refreshed.json()) as TableResponse & { error?: string };
      if (!refreshed.ok) throw new Error(refreshedJson?.error || "Erro ao atualizar tabela");
      setRows(refreshedJson.items);
      setTotal(refreshedJson.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleExportCsv = () => {
    const sample = selectedIds.size ? rows.filter((row) => selectedIds.has(row.id)) : rows;
    if (!sample.length) {
      setStatusMessage("Nenhum item para exportar.");
      return;
    }
    const csv = toCsv(
      sample.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title ?? "",
        status: row.status,
        category: row.category?.title ?? "",
        scheduled_at: iso(row.scheduledAt),
        published_at: iso(row.publishedAt),
        views: row.metrics?.views ?? 0,
        leads: row.metrics?.leads ?? 0,
        ctr: row.metrics?.ctr ?? "",
        pending_comments: row.pendingComments ?? 0,
      })),
      CSV_HEADERS,
    );
    downloadCsv(
      `blog-posts-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
    setStatusMessage(`Exportamos ${sample.length} item(ns) para CSV.`);
  };

  const resetSelection = () => {
    setSelectedIds(new Set());
    setScheduleDate("");
    setScheduleDialogOpen(false);
  };

  return (
    <section className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor="blog-search">
            Buscar posts
          </label>
          <div className="relative flex w-full max-w-md items-center">
            <Search className="absolute left-3 h-4 w-4 text-emerald-600" aria-hidden />
            <Input
              id="blog-search"
              placeholder="Buscar por título ou slug"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            <label className="flex items-center gap-2 text-sm">
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm">
              Itens por página
              <select
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value) as typeof PAGE_SIZES[number]);
                  setPage(1);
                }}
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(1);
              setStatusFilter("all");
              setSearchTerm("");
              setDebouncedSearch("");
              setSelectedIds(new Set());
              setStatusMessage("Filtros limpos.");
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" aria-hidden /> Limpar filtros
          </Button>
          <Button type="button" variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" aria-hidden /> Exportar CSV
          </Button>
          <Link
            href="/admin/blog/editor"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus aria-hidden className="mr-2 h-4 w-4" /> Novo post
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {pendingSelected > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="font-semibold">
            {pendingSelected} selecionado(s)
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBulkLoading}
            onClick={() => void handleBulkAction("publish")}
          >
            {isBulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Check className="mr-2 h-4 w-4" aria-hidden />}
            Publicar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBulkLoading}
            onClick={() => void handleBulkAction("archive")}
          >
            Arquivar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBulkLoading}
            onClick={() => {
              setScheduleDialogOpen(true);
            }}
          >
            <Clock className="mr-2 h-4 w-4" aria-hidden /> Agendar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={isBulkLoading}
            onClick={() => void handleBulkAction("delete")}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Excluir
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetSelection}>
            <X className="mr-1 h-4 w-4" aria-hidden /> Limpar seleção
          </Button>
        </div>
      ) : null}

      <div
        ref={parentRef}
        className="relative max-h-[70vh] overflow-auto rounded-2xl border border-emerald-100 bg-white"
        role="grid"
        aria-busy={isLoading}
        aria-rowcount={rows.length}
      >
        <div className="sticky top-0 z-10 grid grid-cols-[48px,1.5fr,1.1fr,1fr,0.7fr,0.6fr,0.6fr,0.8fr] items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold uppercase text-emerald-800">
          <div>
            <input
              type="checkbox"
              aria-label="Selecionar todos os posts desta página"
              checked={rows.length > 0 && allSelectedOnPage}
              onChange={(event) => toggleSelectAllOnPage(event.target.checked)}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            />
          </div>
          <div>Título</div>
          <div>Slug</div>
          <div>Status</div>
          <div>Categoria</div>
          <div>Publicação</div>
          <div>Views / Leads</div>
          <div>Pendentes</div>
        </div>

        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const top = virtualRow.start;
            return (
              <div
                key={row.id}
                role="row"
                aria-rowindex={virtualRow.index + 1}
                className="absolute inset-x-0 grid grid-cols-[48px,1.5fr,1.1fr,1fr,0.7fr,0.6fr,0.6fr,0.8fr] items-center gap-3 border-b border-emerald-50 px-4 py-3 text-sm text-zinc-800"
                style={{ transform: `translateY(${top}px)`, height: virtualRow.size }}
              >
                <div>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${row.slug}`}
                    checked={selectedIds.has(row.id)}
                    onChange={(event) => toggleSelectRow(row.id, event.target.checked)}
                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{row.title ?? "(Sem título)"}</span>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    <a
                      href={`/admin/blog/editor?id=${row.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" aria-hidden /> Editar
                    </a>
                    {row.scheduledAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                        <Clock className="h-3 w-3" aria-hidden /> Agendado
                      </span>
                    ) : null}
                    {row.metrics?.views ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-700">
                        <Trophy className="h-3 w-3" aria-hidden /> {row.metrics.views} views
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="truncate text-sm text-zinc-600">{row.slug}</div>
                <div>
                  <Badge variant="outline" className={STATUS_VARIANTS[row.status] ?? "bg-zinc-100 text-zinc-600"}>
                    {row.status}
                  </Badge>
                </div>
                <div className="truncate text-sm text-zinc-600">{row.category?.title ?? "—"}</div>
                <div className="text-sm text-zinc-600">
                  {row.publishedAt ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(row.publishedAt))}
                    </span>
                  ) : row.scheduledAt ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(row.scheduledAt))}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="text-sm text-zinc-600">
                  {row.metrics ? (
                    <>
                      <span className="font-semibold">{row.metrics.views ?? 0}</span> / {row.metrics.leads ?? 0}
                      {row.metrics.ctr ? (
                        <span className="ml-1 text-xs text-emerald-600">({(row.metrics.ctr * 100).toFixed(1)}%)</span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="text-sm text-zinc-600">
                  {row.pendingComments ? (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Loader2 className="h-3.5 w-3.5" aria-hidden /> {row.pendingComments}
                    </span>
                  ) : (
                    "0"
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-hidden />
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
        <div>
          Página {page} de {totalPages} — {total} posts ao todo
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </Button>
          <span>
            {rows.length} exibidos
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Próxima
          </Button>
        </div>
      </footer>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent title="Agendar publicação">
          <label className="space-y-1 text-sm">
            <span>Data e hora</span>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
              className="w-full rounded-xl border border-emerald-200 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            />
          </label>
          <DialogActions>
            <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleBulkAction("schedule")}
              disabled={!scheduleDate || isBulkLoading}
            >
              {isBulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Clock className="mr-2 h-4 w-4" aria-hidden />}
              Confirmar agendamento
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </section>
  );
}
