"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";

import type { AdminPuppyListItem, AdminPuppyStatus } from "./queries";

type Props = {
  items: AdminPuppyListItem[];
  leadCounts: Record<string, number>;
  onStatusChange: (id: string, status: AdminPuppyStatus) => Promise<void> | void;
  mutatingId?: string | null;
  selectionEnabled?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  selectionDisabled?: boolean;
};

const STATUS_LABELS: Record<AdminPuppyStatus, string> = {
  available: "Disponível",
  coming_soon: "Em breve",
  reserved: "Reservado",
  sold: "Vendido",
  unavailable: "Arquivado",
};

const EMPTY = "—";

export function PuppiesTable({
  items,
  leadCounts,
  onStatusChange,
  mutatingId,
  selectionEnabled,
  onSelectionChange,
  selectionDisabled,
}: Props) {
  const columns = useMemo<ColumnDef<AdminPuppyListItem, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        cell: ({ row }) => {
          const puppy = row.original;
          return (
            <div className="flex flex-col">
              <a className="font-semibold text-[var(--text)] hover:underline" href={`/admin/puppies/${puppy.id}`}>
                {puppy.name}
              </a>
              <span className="text-xs text-[var(--text-muted)]">{puppy.slug || EMPTY}</span>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const puppy = row.original;
          return (
            <select
              value={puppy.status}
              onChange={(e) => onStatusChange(puppy.id, e.target.value as AdminPuppyStatus)}
              className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)] shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
              aria-label={`Alterar status de ${puppy.name}`}
              disabled={mutatingId === puppy.id}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        id: "demandScore",
        header: "Score demanda",
        cell: ({ row }) => {
          const score = row.original.demandScore;
          return score != null ? (
            <span className="inline-flex min-w-[3rem] items-center justify-center rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--text)]">
              {score}
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">{EMPTY}</span>
          );
        },
      },
      {
        id: "price",
        header: "Preço",
        cell: ({ row }) => <span className="text-[var(--text)]">{formatPrice(row.original.priceCents)}</span>,
      },
      {
        id: "colorSex",
        header: "Cor / Sexo",
        cell: ({ row }) => {
          const puppy = row.original;
          return (
            <span className="text-[var(--text-muted)]">
              {[puppy.color || EMPTY, puppy.sex ? (puppy.sex === "male" ? "Macho" : "Fêmea") : EMPTY].join(" • ")}
            </span>
          );
        },
      },
      {
        id: "location",
        header: "Cidade/UF",
        cell: ({ row }) => (
          <span className="text-[var(--text-muted)]">
            {[row.original.city, row.original.state].filter(Boolean).join(", ") || EMPTY}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Criado em",
        cell: ({ row }) => (
          <span className="text-[var(--text-muted)]">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString("pt-BR") : EMPTY}
          </span>
        ),
      },
      {
        id: "leads",
        header: "Leads",
        cell: ({ row }) => {
          const puppy = row.original;
          const leads = puppy.slug ? leadCounts[puppy.slug] ?? 0 : 0;
          return puppy.slug ? (
            <a
              className="text-xs font-semibold text-[var(--brand)] hover:underline"
              href={`/admin/leads?puppy=${encodeURIComponent(puppy.slug)}`}
            >
              {leads} {leads === 1 ? "lead" : "leads"}
            </a>
          ) : (
            <span className="text-[var(--text-muted)]">{EMPTY}</span>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const puppy = row.original;
          return (
            <div className="inline-flex items-center gap-2">
              <a href={`/admin/puppies/edit/${puppy.id}`} className="text-xs font-semibold text-[var(--text)] hover:underline">
                Editar
              </a>
              {mutatingId === puppy.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-hidden />}
            </div>
          );
        },
      },
    ],
    [leadCounts, mutatingId, onStatusChange],
  );

  return (
    <div className={selectionDisabled ? "pointer-events-none opacity-60" : undefined}>
      <VirtualizedDataTable
        columns={columns}
        data={items}
        height={560}
        enableSelection={Boolean(selectionEnabled)}
        onSelectionChange={onSelectionChange ? (ids) => onSelectionChange(ids.map(String)) : undefined}
        emptyState="Nenhum filhote disponível."
        role="table"
        aria-label="Tabela completa de filhotes"
      />
    </div>
  );
}

function formatPrice(cents?: number | null) {
  if (!cents) return EMPTY;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}
