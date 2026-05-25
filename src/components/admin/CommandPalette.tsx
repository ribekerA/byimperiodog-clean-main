"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

const COMMANDS = [
  { label: "Ir para Dashboard", shortcut: "G D", href: "/admin" },
  { label: "Novo Post", shortcut: "N P", href: "/admin/posts/novo" },
  { label: "Listar Posts", shortcut: "G P", href: "/admin/posts" },
  { label: "Comentários", shortcut: "G C", href: "/admin/comentarios" },
  { label: "Autores", shortcut: "G A", href: "/admin/autores" },
];

export default function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(c => c.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content
          className="fixed left-1/2 top-24 z-50 w-[90vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl focus:outline-none"
          aria-label="Busca rápida"
        >
          <div className="flex items-center gap-2 border-b border-emerald-100 bg-white px-3 py-2">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="text-zinc-500"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite para buscar…"
              className="h-10 w-full outline-none"
              aria-label="Buscar"
            />
          </div>
          <ul role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-auto p-2">
            {results.length === 0 && (
              <li className="px-2 py-3 text-sm text-zinc-500">Nenhum resultado.</li>
            )}
            {results.map((c) => (
              <li key={c.href}>
                <button
                  type="button"
                  onClick={() => { router.push(c.href); onOpenChange(false); }}
                  className="flex w-full min-h-[40px] items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                >
                  <span>{c.label}</span>
                  <kbd className="rounded bg-zinc-100 px-2 py-0.5 text-[10px]">{c.shortcut}</kbd>
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
