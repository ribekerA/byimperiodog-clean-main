"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, FileSpreadsheet, Home, LogOut, Menu, Settings, Star, Users } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  environment: string;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
  { label: "Filhotes / Estoque", href: "/admin/puppies", icon: FileSpreadsheet },
  { label: "Leads / Funil", href: "/admin/leads", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Avaliacoes",    href: "/admin/reviews", icon: Star },
  { label: "Configuracoes", href: "/admin/config",  icon: Settings },
];

export function AdminNav({ environment }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-full flex-col gap-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">By Imperio Dog</p>
          <p className="text-sm font-semibold text-[var(--text)]">Painel Admin</p>
          <p className="text-[11px] text-[var(--text-muted)]">{environment}</p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text)] shadow-sm transition hover:border-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
          aria-pressed={!collapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Activity className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <nav aria-label="Secoes do painel" className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                active ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-[var(--text)] hover:bg-[var(--surface)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <form action="/api/admin/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {!collapsed && <span>Sair</span>}
        </button>
      </form>

      {/* Menu Mobile */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg md:hidden"
        aria-label="Abrir menu"
        aria-expanded={mobileMenuOpen}
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent title="Menu de Navegacao" className="max-w-sm">
          <nav aria-label="Secoes do painel" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-[var(--text)] hover:bg-[var(--surface)]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <form action="/api/admin/logout" method="post" className="border-t border-[var(--border)] pt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span>Sair</span>
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
