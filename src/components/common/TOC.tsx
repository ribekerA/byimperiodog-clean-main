"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";

export type TocItem = {
  id: string;
  label: string;
  level?: number;
  children?: TocItem[];
};

export interface TOCProps {
  items: TocItem[];
  className?: string;
  title?: string;
}

export function TOC({ items, className, title = "Sumário" }: TOCProps) {
  if (!items.length) return null;

  return (
    <nav
      aria-label={title}
      className={cn(
        "rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm",
        className
      )}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
        {title}
      </h2>
      <ul role="list" className="mt-4 space-y-2 text-sm text-zinc-700">
        {items.map((item) => (
          <TocEntry key={item.id} item={item} depth={item.level ?? 1} />
        ))}
      </ul>
    </nav>
  );
}

function TocEntry({ item, depth }: { item: TocItem; depth: number }) {
  const nextDepth = depth + 1;
  const hasChildren = Boolean(item.children?.length);

  return (
    <li>
      <Link
        href={`#${item.id}`}
        className={cn(
          "inline-flex min-h-[40px] w-full items-center rounded-xl px-3 text-left font-medium transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50",
          depth > 1 && "pl-6 text-sm"
        )}
      >
        {item.label}
      </Link>
      {hasChildren ? (
        <ul
          role="list"
          className="mt-2 space-y-2 border-l border-emerald-100 pl-4"
        >
          {item.children!.map((child) => (
            <TocEntry key={child.id} item={child} depth={nextDepth} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default TOC;
