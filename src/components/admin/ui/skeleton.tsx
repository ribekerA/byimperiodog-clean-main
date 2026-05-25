"use client";

import { cn } from "@/lib/cn";

export function AdminSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} aria-hidden />;
}

// Skeleton variants for common patterns
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex gap-4 border-b border-slate-100 px-4 py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <AdminSkeleton key={i} className="h-5 flex-1" />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      <AdminSkeleton className="mb-4 h-6 w-2/3" />
      <AdminSkeleton className="mb-2 h-4 w-full" />
      <AdminSkeleton className="mb-2 h-4 w-5/6" />
      <AdminSkeleton className="h-4 w-4/6" />
      <div className="mt-6 flex gap-2">
        <AdminSkeleton className="h-9 w-24" />
        <AdminSkeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Carregando...">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
        >
          <AdminSkeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <AdminSkeleton className="h-4 w-1/3" />
            <AdminSkeleton className="h-3 w-1/2" />
          </div>
          <AdminSkeleton className="h-8 w-20" />
        </div>
      ))}
      <span className="sr-only">Carregando dados...</span>
    </div>
  );
}
