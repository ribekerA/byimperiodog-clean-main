import Image from "next/image";
import Link from "next/link";

import { BLUR_DATA_URL } from "@/lib/placeholders";

export type PostCardProps = {
  href: string;
  title: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
  excerpt?: string | null;
  date?: string | null;
  readingTime?: number | null;
  status?: string | null;
  previewMode?: boolean;
  priorityImage?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusStyle: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 border border-amber-200",
  review: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  scheduled: "bg-sky-100 text-sky-700 border border-sky-200",
  archived: "bg-zinc-200 text-zinc-700 border border-zinc-300",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

function resolveReadingTime(readingTime?: number | null, excerpt?: string | null) {
  if (typeof readingTime === "number" && readingTime > 0) {
    return readingTime;
  }
  if (!excerpt) return null;
  const words = excerpt.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function PostCard({
  href,
  title,
  coverUrl,
  coverAlt,
  excerpt,
  date,
  readingTime,
  status,
  previewMode = false,
  priorityImage = false,
}: PostCardProps) {
  const formattedDate = formatDate(date);
  const minutes = resolveReadingTime(readingTime, excerpt);
  const pendingStatus = previewMode && status && status !== "published" ? status : null;
  const statusClass = pendingStatus ? statusStyle[pendingStatus] || "bg-zinc-900/80 text-white" : "";

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-within:ring-2 focus-within:ring-brand/60 focus-within:ring-offset-2 focus-within:ring-offset-[var(--surface)]">
      <Link href={href} className="absolute inset-0" aria-label={title} tabIndex={-1}></Link>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface-2)]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={coverAlt || title}
            width={960}
            height={600}
            loading={priorityImage ? "eager" : "lazy"}
            priority={priorityImage}
            fetchPriority={priorityImage ? "high" : "auto"}
            decoding={priorityImage ? "sync" : "async"}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.04]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--surface-2)] text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Sem capa
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/0"></div>
        {pendingStatus ? (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}>
            {pendingStatus}
          </span>
        ) : null}
        {minutes ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold tracking-wide text-white">
            {minutes} min
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold leading-snug text-[var(--text)] transition-colors duration-200 group-hover:text-brand">
            {title}
          </h3>
          {excerpt ? (
            <p className="line-clamp-3 text-sm text-[var(--text-muted)]">{excerpt}</p>
          ) : (
            <p className="text-xs italic text-[var(--text-muted)]">Sem resumo disponível.</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{formattedDate || "Sem data definida"}</span>
          {previewMode ? <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 font-medium">Preview</span> : null}
        </div>
      </div>
    </li>
  );
}

export default PostCard;


