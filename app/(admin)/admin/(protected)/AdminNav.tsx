"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  ClipboardList,
  FileText,
  FlaskConical,
  Globe,
  Home,
  Image,
  LogOut,
  Menu,
  PawPrint,
  ScrollText,
  Server,
  Settings,
  Star,
  Users,
  Webhook,
  Zap,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = { environment: string };

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: Home },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { label: "Blog",            href: "/admin/blog",          icon: FileText },
      { label: "Web Stories",     href: "/admin/web-stories",   icon: Clapperboard },
      { label: "Calendário",      href: "/admin/content/calendar", icon: Calendar },
      { label: "Mídia",           href: "/admin/media",         icon: Image },
    ],
  },
  {
    label: "Negócio",
    items: [
      { label: "Filhotes",        href: "/admin/puppies",       icon: PawPrint },
      { label: "Leads",           href: "/admin/leads",         icon: Users },
      { label: "AutoSales IA",    href: "/admin/autosales",     icon: Bot },
      { label: "Contratos",       href: "/admin/contracts",     icon: FileText },
      { label: "Avaliações",      href: "/admin/reviews",       icon: Star },
      { label: "Wizard de Cadastro", href: "/admin/cadastros/wizard", icon: ClipboardList },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { label: "Analytics",       href: "/admin/analytics",     icon: BarChart3 },
      { label: "Relatórios",      href: "/admin/relatorios",    icon: ScrollText },
      { label: "Experimentos",    href: "/admin/experiments",   icon: FlaskConical },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { label: "SEO",             href: "/admin/seo",           icon: Globe },
      { label: "Webhooks",        href: "/admin/webhooks",      icon: Webhook },
      { label: "Saúde do Sistema",href: "/admin/system/health", icon: Server },
      { label: "Configurações",   href: "/admin/config",        icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
        active
          ? "bg-[var(--brand-tint-50)] text-[var(--brand)] ring-1 ring-inset ring-[var(--brand-tint-200)]"
          : "text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`} aria-hidden />
      <span className="truncate">{item.label}</span>
    </a>
  );
}

function GroupSection({ group, pathname, collapsed }: { group: NavGroup; pathname: string; collapsed: boolean }) {
  const hasActive = group.items.some((i) => pathname?.startsWith(i.href));
  const [open, setOpen] = useState(hasActive || group.label === "Principal");

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
                active
                  ? "bg-[var(--brand-tint-50)] text-[var(--brand)] ring-1 ring-inset ring-[var(--brand-tint-200)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {group.label !== "Principal" && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <span>{group.label}</span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      )}
      {(open || group.label === "Principal") && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} active={!!pathname?.startsWith(item.href)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminNav({ environment }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <div
        className={`flex h-full flex-col gap-3 overflow-y-auto py-4 transition-all duration-200 ${
          collapsed ? "px-2 items-center" : "px-3"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"}`}>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                By Imperio Dog
              </p>
              <p className="text-sm font-bold text-[var(--text)]">Admin</p>
              <p className="text-[10px] text-[var(--text-muted)]">{environment}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition hover:border-[var(--brand)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            aria-pressed={!collapsed}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Activity className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Nav Groups */}
        <nav aria-label="Seções do painel" className="flex-1 space-y-3">
          {NAV_GROUPS.map((group) => (
            <GroupSection key={group.label} group={group} pathname={pathname ?? ""} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer — Quick links + Logout */}
        <div className={`space-y-0.5 border-t border-[var(--border)] pt-3 ${collapsed ? "w-full" : ""}`}>
          {!collapsed && (
            <a
              href="/admin/config/tracking"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
            >
              <Zap className="h-4 w-4 flex-shrink-0" aria-hidden />
              <span>Tracking & Pixels</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-lg transition hover:bg-[var(--brand-hover)] md:hidden"
        aria-label="Abrir menu"
        aria-expanded={mobileMenuOpen}
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>

      {/* Mobile Dialog */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent title="Menu de Navegação" className="max-w-sm max-h-[85vh] overflow-y-auto">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">By Imperio Dog</p>
            <p className="text-sm font-bold text-[var(--text)]">Painel Admin · {environment}</p>
          </div>
          <nav aria-label="Seções do painel" className="space-y-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                {group.label !== "Principal" && (
                  <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={!!pathname?.startsWith(item.href)}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-3">
            <a
              href="/admin/config/tracking"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
            >
              <Zap className="h-4 w-4" aria-hidden />
              <span>Tracking & Pixels</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setConfirmLogoutOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span>Sair</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Sair do painel administrativo?"
        description="Você precisará fazer login novamente para acessar o admin."
        confirmLabel="Sair"
        variant="warning"
        onConfirm={handleLogout}
      />
    </>
  );
}
