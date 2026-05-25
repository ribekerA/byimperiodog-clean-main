"use client";

import { Loader2 } from "lucide-react";

import type { AdminPuppyListItem, AdminPuppyStatus } from "./queries";

type Props = {
  items: AdminPuppyListItem[];
  leadCounts: Record<string, number>;
  onStatusChange: (id: string, status: AdminPuppyStatus) => Promise<void> | void;
  mutatingId?: string | null;
};

const STATUS_LABELS: Record<AdminPuppyStatus, string> = {
  available: "Disponível",
  coming_soon: "Em breve",
  reserved: "Reservado",
  sold: "Vendido",
  unavailable: "Arquivado",
};

const EMPTY = "—";

export function PuppiesTable({ items, leadCounts, onStatusChange, mutatingId }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm" aria-label="Tabela completa de filhotes">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <caption className="sr-only">Tabela com estoque de filhotes</caption>
        <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Score demanda</th>
            <th className="px-4 py-3">Preço</th>
            <th className="px-4 py-3">Cor / Sexo</th>
            <th className="px-4 py-3">Cidade/UF</th>
            <th className="px-4 py-3">Criado em</th>
            <th className="px-4 py-3">Leads</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-white">
          {items.map((puppy) => {
            const leads = puppy.slug ? leadCounts[puppy.slug] ?? 0 : 0;
            return (
              <tr key={puppy.id} className="hover:bg-[var(--surface-2)]">
                <td className="px-4 py-3 font-semibold text-[var(--text)]">
                  <div className="flex flex-col">
                    <a className="hover:underline" href={`/admin/puppies/${puppy.id}`}>
                      {puppy.name}
                    </a>
                    <span className="text-xs text-[var(--text-muted)]">{puppy.slug || EMPTY}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={puppy.status}
                    onChange={(e) => onStatusChange(puppy.id, e.target.value as AdminPuppyStatus)}
                    className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    aria-label={`Alterar status de ${puppy.name}`}
                    disabled={mutatingId === puppy.id}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-[var(--text)]">
                  {puppy.demandScore != null ? (
                    <span className="inline-flex min-w-[3rem] items-center justify-center rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold">
                      {puppy.demandScore}
                    </span>
                  ) : (
                    EMPTY
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text)]">{formatPrice(puppy.priceCents)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {[puppy.color || EMPTY, puppy.sex ? (puppy.sex === "male" ? "Macho" : "Fêmea") : EMPTY].join(" • ")}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {[puppy.city, puppy.state].filter(Boolean).join(", ") || EMPTY}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {puppy.createdAt ? new Date(puppy.createdAt).toLocaleDateString("pt-BR") : EMPTY}
                </td>
                <td className="px-4 py-3">
                  {puppy.slug ? (
                    <a
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                      href={`/admin/leads?puppy=${encodeURIComponent(puppy.slug)}`}
                    >
                      {leads} {leads === 1 ? "lead" : "leads"}
                    </a>
                  ) : (
                    EMPTY
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="inline-flex items-center gap-2">
                    <a href={`/admin/puppies/edit/${puppy.id}`} className="text-xs font-semibold text-[var(--text)] hover:underline">
                      Editar
                    </a>
                    {mutatingId === puppy.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-hidden />}
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                Nenhum filhote disponível.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatPrice(cents?: number | null) {
  if (!cents) return EMPTY;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}
