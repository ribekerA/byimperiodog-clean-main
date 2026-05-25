"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

type RowId = string | number;

export interface VirtualizedDataTableProps<TData extends { id?: RowId }>
  extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  height?: number; // px
  rowEstimate?: number; // px
  enableSelection?: boolean;
  onSelectionChange?: (ids: RowId[]) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function VirtualizedDataTable<TData extends { id?: RowId }>(props: VirtualizedDataTableProps<TData>) {
  const {
    columns,
    data,
    height = 520,
    rowEstimate = 48,
    enableSelection = true,
    onSelectionChange,
    isLoading,
    emptyState,
    className,
    ...divProps
  } = props;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selected, setSelected] = React.useState<Set<RowId>>(new Set());

  const cols = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableSelection) return columns;
    return [
      {
        id: "_select",
        header: () => (
          <input
            type="checkbox"
            aria-label="Selecionar todos"
            checked={selected.size > 0 && selected.size >= data.length}
            onChange={(e) => {
              const next = new Set<RowId>();
              if (e.target.checked) data.forEach((d, i) => next.add((d.id ?? i) as RowId));
              setSelected(next);
              onSelectionChange?.(Array.from(next));
            }}
            className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          />
        ),
        cell: ({ row }) => {
          const id = (row.original.id ?? row.index) as RowId;
          const checked = selected.has(id);
          return (
            <input
              type="checkbox"
              aria-label={`Selecionar linha ${row.index + 1}`}
              checked={checked}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(id);
                else next.delete(id);
                setSelected(next);
                onSelectionChange?.(Array.from(next));
              }}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            />
          );
        },
        size: 44,
        enableSorting: false,
      },
      ...columns,
    ];
  }, [columns, data, enableSelection, onSelectionChange, selected]);

  const table = useReactTable<TData>({
    data,
    columns: cols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowEstimate,
    overscan: 8,
  });

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div {...divProps} className={"rounded-2xl border border-emerald-100 bg-white " + (className ?? "")}> 
      {/* Header */}
      <div role="rowgroup" className="sticky top-0 z-10 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div role="row" className="grid grid-cols-[auto,repeat(var(--cols),minmax(0,1fr))] items-center gap-3 px-3 py-2 text-xs font-semibold text-zinc-600"
            style={{
               // CSS var used to match number of columns excluding the selection checkbox
               // When selection enabled we already added one 'auto' col at start
               ["--cols" as string]: String(table.getAllLeafColumns().length - (enableSelection ? 1 : 0)),
             }}>
          {table.getHeaderGroups().map((hg) =>
            hg.headers.map((header) => (
              <div key={header.id} role="columnheader" aria-sort={header.column.getIsSorted() ? (header.column.getIsSorted() === 'asc' ? 'ascending' : 'descending') : 'none'}>
                {header.isPlaceholder ? null : (
                  header.column.getCanSort() ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (
                        <span aria-hidden className="text-[10px]">{header.column.getIsSorted() === 'asc' ? '▲' : '▼'}</span>
                      ) : null}
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )
                )}
              </div>
            )))
          }
        </div>
      </div>

      {/* Body */}
      <div ref={parentRef} role="rowgroup" className="relative h-[520px] overflow-auto" style={{ height }}>
        {isLoading && data.length === 0 && (
          <div className="p-4 text-sm text-zinc-500" aria-live="polite">Carregando…</div>
        )}
        {!isLoading && data.length === 0 && (
          <div className="p-6 text-center text-sm text-zinc-500">{emptyState ?? 'Sem resultados.'}</div>
        )}
        <div
          style={{ height: totalSize, position: 'relative' }}
          aria-rowcount={rows.length}
        >
          {virtualRows.map(vRow => {
            const row = rows[vRow.index];
            return (
              <div
                key={row.id}
                role="row"
                className="absolute inset-x-0 grid grid-cols-[auto,repeat(var(--cols),minmax(0,1fr))] items-center gap-3 border-b border-emerald-50 px-3"
                style={{ transform: `translateY(${vRow.start}px)`, height: vRow.size }}
              >
                {row.getVisibleCells().map(cell => (
                  <div key={cell.id} role="gridcell" className="py-2 text-sm text-zinc-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedDataTable;
