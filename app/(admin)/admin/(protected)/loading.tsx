"use client";

import { AdminSkeleton } from "./ui/AdminSkeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--text)] shadow-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
        Carregando painel...
      </div>
      <AdminSkeleton />
    </div>
  );
}
