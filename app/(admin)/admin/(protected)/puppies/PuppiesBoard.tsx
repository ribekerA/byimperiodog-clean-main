"use client";

import { useMemo } from "react";

import type { AdminPuppyListItem, AdminPuppyStatus } from "./queries";

type BoardStatus = Exclude<AdminPuppyStatus, "unavailable">;

const COLUMNS: { key: BoardStatus; label: string; tone: string }[] = [
  { key: "available", label: "Disponível", tone: "bg-emerald-50 border-emerald-100" },
  { key: "reserved", label: "Reservado", tone: "bg-amber-50 border-amber-100" },
  { key: "sold", label: "Vendido", tone: "bg-rose-50 border-rose-100" },
  { key: "coming_soon", label: "Em breve", tone: "bg-slate-50 border-slate-200" },
];

type Props = {
  items: AdminPuppyListItem[];
  leadCounts: Record<string, number>;
  onStatusChange: (id: string, status: AdminPuppyStatus) => void;
  mutatingId?: string | null;
};

export function PuppiesBoard({ items, leadCounts, onStatusChange, mutatingId }: Props) {
  const grouped = useMemo(() => {
    const buckets = new Map<BoardStatus, AdminPuppyListItem[]>();
    COLUMNS.forEach((c) => buckets.set(c.key, []));
    items.forEach((puppy) => {
      const status = (puppy.status as BoardStatus) ?? "available";
      const bucket = buckets.get(status);
      bucket?.push(puppy);
    });
    return buckets;
  }, [items]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4" role="list" aria-label="Kanban de estoque de filhotes">
      {COLUMNS.map((col) => {
        const list = grouped.get(col.key) ?? [];
        return (
          <section
            key={col.key}
            className={`flex min-h-[320px] flex-col gap-3 rounded-2xl border p-3 ${col.tone}`}
            role="region"
            aria-label={`Coluna ${col.label}`}
          >
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{col.label}</p>
                <p className="text-sm text-[var(--text-muted)]">{list.length} filhote(s)</p>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-3" role="list">
              {list.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">Nenhum item aqui.</p>}
              {list.map((p) => {
                const slug = p.slug ?? undefined;
                const leads = slug ? leadCounts[slug] ?? 0 : 0;
                const cover = p.imageUrl || "/placeholder.png";
                return (
                  <article key={p.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm" role="listitem">
                    <div className="flex gap-3 p-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface)]">
                        <img src={cover} alt={p.name} className="h-full w-full object-cover" loading="lazy" width={64} height={64} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2">{p.name}</h3>
                          <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                            {formatPrice(p.priceCents)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {[p.color || "Cor ?", p.sex ? (p.sex === "male" ? "Macho" : "Fêmea") : "Sexo ?"].join(" • ")}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{[p.city, p.state].filter(Boolean).join(", ") || "Local ?"}</p>
                        <p className="text-[11px] font-semibold text-emerald-700">{leads} lead{leads === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2">
                      <a
                        href={`/admin/puppies/edit/${p.id}`}
                        className="text-xs font-semibold text-[var(--text)] hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                      >
                        Editar
                      </a>
                      <div className="flex items-center gap-2">
                        {COLUMNS.map((target) => (
                          <button
                            key={target.key}
                            type="button"
                            onClick={() => onStatusChange(p.id, target.key)}
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                              p.status === target.key ? "bg-emerald-100 text-emerald-800" : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                            }`}
                            aria-label={`Marcar ${p.name} como ${target.label}`}
                            disabled={mutatingId === p.id}
                          >
                            {target.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => onStatusChange(p.id, "unavailable")}
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                            p.status === "unavailable" ? "bg-red-100 text-red-800" : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                          }`}
                          aria-label={`Arquivar ${p.name}`}
                          disabled={mutatingId === p.id}
                        >
                          Arquivar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}
