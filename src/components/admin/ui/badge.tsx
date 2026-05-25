"use client";

import { cn } from "@/lib/cn";

export function AdminBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[28px] items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
