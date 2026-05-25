"use client";

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/ui/button";
import { showAdminToast } from "@/components/admin/ui/toast";
import { cn } from "@/lib/cn";

type BulkAction<TData> = {
  label: string;
  onAction: (rows: TData[]) => Promise<void> | void;
};

type AdminTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  bulkActions?: BulkAction<TData>[];
};

export function AdminDataTable<TData, TValue>({ columns, data, bulkActions = [] }: AdminTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const enhancedColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    return [
      {
        id: "__select",
        header: ({ table }) => (
          <label className="inline-flex h-12 w-12 items-center justify-center" aria-label="Selecionar todas as linhas">
            <input
              type="checkbox"
              aria-label="Selecionar todas as linhas"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
              className="h-5 w-5"
            />
          </label>
        ),
        cell: ({ row }) => (
          <label className="inline-flex h-12 w-12 items-center justify-center" aria-label="Selecionar linha">
            <input
              type="checkbox"
              aria-label="Selecionar linha"
              checked={row.getIsSelected()}
              onChange={(event) => row.toggleSelected(event.target.checked)}
              className="h-5 w-5"
            />
          </label>
        ),
        size: 48,
      } as ColumnDef<TData, TValue>,
      ...columns,
    ];
  }, [columns]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: { rowSelection, globalFilter },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 52,
    overscan: 8,
    getScrollElement: () => document.getElementById("admin-table-scroll"),
  });
  const virtualItems = virtualizer.getVirtualItems();

  const selectedRows = useMemo(() => table.getSelectedRowModel().rows.map((row) => row.original), [table]);

  async function handleBulk(action: BulkAction<TData>) {
    if (!selectedRows.length) {
      showAdminToast({ title: "Selecione ao menos um item.", variant: "info" });
      return;
    }
    await action.onAction(selectedRows);
    showAdminToast({ title: action.label, description: "Ação executada com sucesso.", variant: "success" });
    table.resetRowSelection();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          placeholder="Filtrar..."
          aria-label="Filtrar tabela"
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {bulkActions.map((action) => (
            <AdminButton
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => handleBulk(action)}
              disabled={!selectedRows.length}
            >
              {action.label}
            </AdminButton>
          ))}
        </div>
      </div>

      <div
        id="admin-table-scroll"
        className="relative max-h-[540px] overflow-auto rounded-3xl border border-slate-200 bg-white"
        role="table"
      >
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-[0.2em] text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex h-12 items-center gap-1 text-xs font-semibold uppercase tracking-widest text-slate-600"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Ordenar por ${header.column.columnDef.header}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: "▲",
                          desc: "▼",
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody style={{ height: virtualizer.getTotalSize() }}>
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  ref={(node) => {
                    if (node) virtualizer.measureElement(node);
                  }}
                  className={cn(
                    "h-[52px] border-b border-slate-100 text-sm text-slate-700 transition",
                    row.getIsSelected() && "bg-emerald-50/80",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          {table.getRowModel().rows.length} registros • {selectedRows.length} selecionados
        </span>
        <div className="flex items-center gap-2">
          <AdminButton
            variant="outline"
            size="lg"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            Anterior
          </AdminButton>
          <AdminButton
            variant="outline"
            size="lg"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
          >
            Próxima
          </AdminButton>
        </div>
      </div>
    </section>
  );
}
