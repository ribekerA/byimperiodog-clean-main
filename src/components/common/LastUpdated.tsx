"use client";

import { cn } from "@/lib/cn";

type DateLike = string | Date | null | undefined;

export interface LastUpdatedProps {
  buildTime?: DateLike;
  contentTime?: DateLike;
  label?: string;
  className?: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("pt-BR", {
  numeric: "auto",
});

export function LastUpdated({
  buildTime,
  contentTime,
  label = "Última atualização do site",
  className,
}: LastUpdatedProps) {
  const buildDate = normalizeDate(buildTime);
  const contentDate = normalizeDate(contentTime);
  const bestDate = pickLatest(buildDate, contentDate);

  if (!bestDate) return null;

  const absolute = formatAbsolute(bestDate);
  const relative = formatRelative(bestDate);

  return (
    <article
      className={cn(
        "rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-emerald-900 shadow-sm",
        className
      )}
      aria-live="polite"
    >
      <h3 className="text-base font-semibold text-emerald-900">{label}</h3>
      <p className="mt-1 text-emerald-700">
        {relative ? `Atualizado ${relative}.` : "Conteúdo atualizado recentemente."}
      </p>
      {absolute ? (
        <time
          dateTime={bestDate.toISOString()}
          className="mt-2 block text-xs uppercase tracking-[0.2em] text-emerald-600"
        >
          {absolute}
        </time>
      ) : null}
    </article>
  );
}

export default LastUpdated;

function normalizeDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickLatest(...dates: (Date | null)[]) {
  const validDates = dates.filter((date): date is Date => Boolean(date));
  if (validDates.length === 0) return null;
  return validDates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  );
}

function formatAbsolute(date: Date) {
  try {
    return DATE_FORMAT.format(date);
  } catch {
    return null;
  }
}

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return null;

  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 1) return "agora";
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_FORMAT.format(-diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_FORMAT.format(-diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_FORMAT.format(-diffDays, "day");
  }

  const diffWeeks = Math.round(diffDays / 7);
  return RELATIVE_FORMAT.format(-diffWeeks, "week");
}
