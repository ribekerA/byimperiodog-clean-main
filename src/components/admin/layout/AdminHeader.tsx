"use client";

import { Bell, Search } from "lucide-react";
import { useEffect } from "react";

import { AdminButton } from "@/components/admin/ui/button";
import { cn } from "@/lib/cn";

export default function AdminHeader() {
  useEffect(() => {
    const focusFilter = () => {
      const el = document.querySelector<HTMLInputElement>("[data-admin-filter]");
      el?.focus();
    };
    window.addEventListener("admin:focus:filter", focusFilter);
    return () => window.removeEventListener("admin:focus:filter", focusFilter);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-6 py-3 shadow-sm backdrop-blur",
      )}
      role="banner"
    >
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            placeholder="Buscar cadastros, templates, relatórios..."
            className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            data-admin-filter
            aria-label="Buscar no painel administrativo"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AdminButton
          variant="outline"
          className="min-h-[40px] rounded-full text-xs"
          onClick={() => window.dispatchEvent(new CustomEvent("admin:kbar:toggle"))}
        >
          Cmd/Ctrl + K
        </AdminButton>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </header>
  );
}
