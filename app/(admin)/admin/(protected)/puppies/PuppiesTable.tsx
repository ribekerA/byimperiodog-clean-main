"use client";

import { ImageOff, Pencil } from "lucide-react";
import Link from "next/link";

import {
  ADMIN_PUPPY_STATUSES,
  PUPPY_STATUS_COLOR,
  PUPPY_STATUS_LABEL,
  puppySexLabel,
  type AdminPuppyListItem,
  type AdminPuppyStatus,
} from "@/lib/admin/puppyAdmin";

/* ------------------------------------------------------------------ */
/* Formatacao                                                           */
/* ------------------------------------------------------------------ */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DAY = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function formatPuppyPrice(cents: number): string | null {
  return cents > 0 ? BRL.format(cents / 100) : null;
}

/** Data so com dia ("2026-03-14") nao passa por fuso; data com hora usa Sao Paulo. */
export function formatPuppyDate(value: string | null): string | null {
  if (!value) return null;
  const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dayOnly) return `${dayOnly[3]}/${dayOnly[2]}/${dayOnly[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : DAY.format(date);
}

export function puppyFacts(puppy: AdminPuppyListItem): string {
  const place = [puppy.city, puppy.state].filter(Boolean).join("/");
  return [puppy.color, puppySexLabel(puppy.sex), place].filter(Boolean).join(" · ");
}

/** Linha de data que faz sentido para o status atual. */
export function puppyDateLine(puppy: AdminPuppyListItem): string | null {
  if (puppy.status === "sold") {
    const sold = formatPuppyDate(puppy.soldAt);
    if (sold) return `Vendido em ${sold}`;
  }
  if (puppy.status === "reserved") {
    const reserved = formatPuppyDate(puppy.reservedAt);
    if (reserved) return `Reservado em ${reserved}`;
  }
  const created = formatPuppyDate(puppy.createdAt);
  return created ? `Cadastrado em ${created}` : null;
}

/* ------------------------------------------------------------------ */
/* Pecas compartilhadas com o kanban                                    */
/* ------------------------------------------------------------------ */

export function PuppyCover({ puppy, size = 64 }: { puppy: AdminPuppyListItem; size?: number }) {
  const style = { width: size, height: size };
  if (!puppy.imageUrl) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]"
        style={style}
        aria-hidden="true"
      >
        <ImageOff className="h-5 w-5" />
      </span>
    );
  }
  return (
    // A capa vem do Storage e pode ser de qualquer endereco gravado no cadastro:
    // <img> simples nao quebra a tela se o endereco nao estiver na lista do next/image.
    <img
      src={puppy.imageUrl}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-lg bg-[var(--surface-2)] object-cover"
      style={style}
    />
  );
}

export function PuppyBadges({ puppy, showDemand }: { puppy: AdminPuppyListItem; showDemand: boolean }) {
  const badges: { key: string; label: string; tone: "warn" | "neutral" }[] = [];
  if (puppy.photoCount === 0) badges.push({ key: "foto", label: "Sem foto", tone: "warn" });
  if (puppy.priceCents <= 0) badges.push({ key: "preco", label: "Sem preço", tone: "warn" });
  if (puppy.photoCount > 0) {
    const parts = [`${puppy.photoCount} ${puppy.photoCount === 1 ? "foto" : "fotos"}`];
    if (puppy.videoCount > 0) parts.push(`${puppy.videoCount} ${puppy.videoCount === 1 ? "vídeo" : "vídeos"}`);
    badges.push({ key: "midia", label: parts.join(" · "), tone: "neutral" });
  }
  if (showDemand && puppy.demandScore != null) {
    badges.push({ key: "procura", label: `Procura ${Math.round(puppy.demandScore)}`, tone: "neutral" });
  }
  if (badges.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Sinais do cadastro">
      {badges.map((badge) => (
        <li
          key={badge.key}
          className={
            badge.tone === "warn"
              ? "rounded-full border border-[#e5b9a3] bg-[#fdf1ea] px-2 py-0.5 text-xs font-semibold text-[#8a3a12]"
              : "rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
          }
        >
          {badge.label}
        </li>
      ))}
    </ul>
  );
}

export function StatusSelect({
  puppy,
  disabled,
  onChange,
}: {
  puppy: AdminPuppyListItem;
  disabled?: boolean;
  onChange: (next: AdminPuppyStatus) => void;
}) {
  const id = `status-${puppy.id}`;
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: PUPPY_STATUS_COLOR[puppy.status] }}
        aria-hidden="true"
      />
      <label htmlFor={id} className="sr-only">
        Status de {puppy.name}
      </label>
      <select
        id={id}
        value={puppy.status}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as AdminPuppyStatus)}
        className="min-h-[44px] w-full min-w-[9.5rem] rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:cursor-wait disabled:opacity-60"
      >
        {ADMIN_PUPPY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PUPPY_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lista                                                                */
/* ------------------------------------------------------------------ */

type Props = {
  items: AdminPuppyListItem[];
  selected: ReadonlySet<string>;
  busyIds: ReadonlySet<string>;
  showDemand: boolean;
  onToggle: (id: string) => void;
  onStatusChange: (puppy: AdminPuppyListItem, next: AdminPuppyStatus) => void;
};

export function PuppiesList({ items, selected, busyIds, showDemand, onToggle, onStatusChange }: Props) {
  return (
    <ul className="space-y-3" aria-label="Filhotes do estoque">
      {items.map((puppy) => {
        const price = formatPuppyPrice(puppy.priceCents);
        const facts = puppyFacts(puppy);
        const dateLine = puppyDateLine(puppy);
        const checked = selected.has(puppy.id);
        return (
          <li
            key={puppy.id}
            className={`rounded-2xl border bg-white p-3 shadow-sm sm:p-4 ${
              checked ? "border-[var(--brand)]" : "border-[var(--border)]"
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <label className="-m-2 grid h-11 w-11 shrink-0 cursor-pointer place-items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(puppy.id)}
                    className="h-5 w-5 rounded border-[var(--border)] accent-[var(--brand)]"
                  />
                  <span className="sr-only">Selecionar {puppy.name}</span>
                </label>
                <PuppyCover puppy={puppy} />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-semibold leading-snug text-[var(--text)]">
                    <Link
                      href={`/admin/puppies/edit/${puppy.id}`}
                      className="rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                    >
                      {puppy.name}
                    </Link>
                    {puppy.code ? (
                      <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">Cód. {puppy.code}</span>
                    ) : null}
                  </h3>
                  {facts ? <p className="text-sm text-[var(--text-muted)]">{facts}</p> : null}
                  {dateLine ? <p className="text-xs text-[var(--text-muted)]">{dateLine}</p> : null}
                  <PuppyBadges puppy={puppy} showDemand={showDemand} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-end">
                <p className="min-w-[7.5rem] text-base font-semibold tabular-nums text-[var(--text)] md:text-right">
                  {price ?? <span className="text-sm font-normal text-[var(--text-muted)]">Sem preço</span>}
                </p>
                <div className="min-w-[11rem] flex-1 md:flex-none">
                  <StatusSelect
                    puppy={puppy}
                    disabled={busyIds.has(puppy.id)}
                    onChange={(next) => onStatusChange(puppy, next)}
                  />
                </div>
                <Link
                  href={`/admin/puppies/edit/${puppy.id}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar<span className="sr-only"> {puppy.name}</span>
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
