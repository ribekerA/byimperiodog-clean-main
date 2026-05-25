"use client";

import { HelpCircle, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import CommandPalette from "@/components/admin/CommandPalette";

export default function AdminTopbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event?: KeyboardEvent) => {
      if (!event || typeof event.key !== "string") return;
      const key = event.key.toLowerCase();
      const isK = key === "k";
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault();
        setOpen(true);
      }
      if (key === "/") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "?" && (event.shiftKey || !event.shiftKey)) {
        // future: abrir ajuda
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 text-sm text-zinc-700 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            aria-label="Abrir busca (Cmd/Ctrl+K)"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="ml-1 hidden rounded bg-zinc-100 px-1 text-[10px] sm:inline">⌘/Ctrl K</kbd>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            aria-label="Novo cadastro (N)"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo
          </button>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 text-sm text-zinc-700 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            aria-label="Ajuda (Shift+/)"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Ajuda</span>
          </button>
        </div>
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </header>
  );
}
