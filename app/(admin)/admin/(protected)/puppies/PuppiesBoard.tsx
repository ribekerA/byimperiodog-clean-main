"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  ADMIN_PUPPY_STATUSES,
  PUPPY_STATUS_COLOR,
  PUPPY_STATUS_LABEL,
  type AdminPuppyListItem,
  type AdminPuppyStatus,
} from "@/lib/admin/puppyAdmin";

import { PuppyBadges, PuppyCover, StatusSelect, formatPuppyPrice, puppyDateLine, puppyFacts } from "./PuppiesTable";

type Props = {
  items: AdminPuppyListItem[];
  busyIds: ReadonlySet<string>;
  showDemand: boolean;
  onStatusChange: (puppy: AdminPuppyListItem, next: AdminPuppyStatus) => void;
};

/** Quatro colunas, uma por status que existe de verdade no banco. */
export function PuppiesBoard({ items, busyIds, showDemand, onStatusChange }: Props) {
  const grouped = useMemo(() => {
    const buckets = new Map<AdminPuppyStatus, AdminPuppyListItem[]>();
    ADMIN_PUPPY_STATUSES.forEach((status) => buckets.set(status, []));
    items.forEach((puppy) => buckets.get(puppy.status)?.push(puppy));
    return buckets;
  }, [items]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      {ADMIN_PUPPY_STATUSES.map((status) => {
        const list = grouped.get(status) ?? [];
        const headingId = `coluna-${status}`;
        return (
          <section
            key={status}
            aria-labelledby={headingId}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
          >
            <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PUPPY_STATUS_COLOR[status] }}
                aria-hidden="true"
              />
              {PUPPY_STATUS_LABEL[status]}
              <span className="font-normal text-[var(--text-muted)]">
                · {list.length} {list.length === 1 ? "filhote" : "filhotes"}
              </span>
            </h2>

            {list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">
                Nenhum filhote neste status.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {list.map((puppy) => {
                  const price = formatPuppyPrice(puppy.priceCents);
                  const facts = puppyFacts(puppy);
                  const dateLine = puppyDateLine(puppy);
                  return (
                    <li key={puppy.id} className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm">
                      <div className="flex gap-3">
                        <PuppyCover puppy={puppy} size={56} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-sm font-semibold leading-snug text-[var(--text)]">
                            <Link
                              href={`/admin/puppies/edit/${puppy.id}`}
                              className="rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                            >
                              {puppy.name}
                            </Link>
                          </h3>
                          {facts ? <p className="text-xs text-[var(--text-muted)]">{facts}</p> : null}
                          <p className="text-sm font-semibold tabular-nums text-[var(--text)]">
                            {price ?? <span className="font-normal text-[var(--text-muted)]">Sem preço</span>}
                          </p>
                          {dateLine ? <p className="text-xs text-[var(--text-muted)]">{dateLine}</p> : null}
                        </div>
                      </div>
                      <PuppyBadges puppy={puppy} showDemand={showDemand} />
                      <StatusSelect
                        puppy={puppy}
                        disabled={busyIds.has(puppy.id)}
                        onChange={(next) => onStatusChange(puppy, next)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
