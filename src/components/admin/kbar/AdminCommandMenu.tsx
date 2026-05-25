"use client";

import { Command } from "cmdk";
import * as React from "react";

const COMMANDS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Novo cadastro", href: "/admin/cadastros/novo" },
  { label: "Importar CSV", href: "/admin/cadastros/importar" },
  { label: "Relatorios", href: "/admin/relatorios" },
];

export default function AdminCommandMenu() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const toggle = () => setOpen((prev) => !prev);
    window.addEventListener("admin:kbar:toggle", toggle);
    return () => window.removeEventListener("admin:kbar:toggle", toggle);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Busca e atalhos do painel"
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 backdrop-blur-sm"
    >
      <Command.Input
        autoFocus
        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none"
        placeholder="Busque comandos..."
      />
      <Command.List className="mt-3 max-h-72 w-full overflow-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-xl">
        <Command.Empty className="py-4 text-center text-xs text-slate-400">Nenhum comando encontrado</Command.Empty>
        {COMMANDS.map((item) => (
          <Command.Item
            key={item.label}
            value={item.label}
            onSelect={() => {
              setOpen(false);
              if (item.href) {
                window.location.href = item.href;
              }
            }}
            className="flex min-h-[44px] items-center rounded-2xl px-3 text-sm text-slate-700 data-[selected=true]:bg-emerald-50"
          >
            {item.label}
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
