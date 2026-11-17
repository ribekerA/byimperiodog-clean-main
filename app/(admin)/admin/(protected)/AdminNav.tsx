"use client";

import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  Clapperboard,
  ClipboardList,
  FileText,
  FlaskConical,
  Globe,
  Heart,
  Home,
  Image,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  ScrollText,
  Server,
  Settings,
  Star,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = { environment: string };

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

/** Evento que o botao de menu da barra do topo dispara no celular. */
export const EVENTO_ABRIR_MENU = "admin:abrir-menu";

const CHAVE_RECOLHIDO = "admin:nav-recolhido";

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
      { label: "Engajamento",     href: "/admin/media-engagement", icon: Heart },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { label: "SEO",             href: "/admin/seo",           icon: Globe },
      { label: "Google Ads",      href: "/admin/config/google-ads", icon: Megaphone },
      { label: "Webhooks",        href: "/admin/webhooks",      icon: Webhook },
      { label: "Saúde do Sistema",href: "/admin/system/health", icon: Server },
      { label: "Configurações",   href: "/admin/config",        icon: Settings },
    ],
  },
];

const TODOS_OS_ITENS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { label: "Tracking & Pixels", href: "/admin/config/tracking", icon: Zap },
];

/**
 * Item ativo = o de href mais longo que casa com a rota.
 *
 * Com startsWith puro, /admin/config/google-ads acendia "Google Ads" e
 * "Configurações" ao mesmo tempo, e a pessoa nao sabia onde estava.
 */
function hrefAtivo(pathname: string): string | null {
  let melhor: string | null = null;
  for (const item of TODOS_OS_ITENS) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!melhor || item.href.length > melhor.length) melhor = item.href;
    }
  }
  return melhor;
}

function NavLink({
  item,
  active,
  collapsed = false,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`group relative flex items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)] ${
        collapsed ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2"
      } ${
        active
          ? "bg-[var(--brand)] text-white shadow-sm"
          : "text-[var(--text)] hover:bg-[var(--brand-tint-50)] hover:text-[var(--brand)]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={`h-[18px] w-[18px] flex-shrink-0 ${
          active ? "text-white" : "text-[var(--text-muted)] group-hover:text-[var(--brand)]"
        }`}
        aria-hidden
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function GroupSection({
  group,
  ativo,
  collapsed,
}: {
  group: NavGroup;
  ativo: string | null;
  collapsed: boolean;
}) {
  const hasActive = group.items.some((i) => i.href === ativo);
  const [open, setOpen] = useState(true);
  const principal = group.label === "Principal";

  // Navegar para uma tela de um grupo fechado reabre o grupo: a pessoa precisa
  // ver no menu onde esta.
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0">
        {group.items.map((item) => (
          <NavLink key={item.href} item={item} active={item.href === ativo} collapsed />
        ))}
      </div>
    );
  }

  return (
    <div>
      {!principal && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-lg px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          <span>{group.label}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
        </button>
      )}
      {(open || principal) && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} active={item.href === ativo} />
          ))}
        </div>
      )}
    </div>
  );
}

function Marca({ environment, compacta = false }: { environment: string; compacta?: boolean }) {
  return (
    <Link
      href="/admin/dashboard"
      className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
      title="By Imperio Dog · Painel"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
        <PawPrint className="h-5 w-5" aria-hidden />
      </span>
      {!compacta ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[var(--text)]">By Imperio Dog</span>
          <span className="block truncate text-xs text-[var(--text-muted)]">Painel · {environment}</span>
        </span>
      ) : (
        <span className="sr-only">By Imperio Dog</span>
      )}
    </Link>
  );
}

export function AdminNav({ environment }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const ativo = hrefAtivo(pathname);

  // Recolher passou a ser lembrado: antes voltava aberto a cada tela.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE_RECOLHIDO) === "1") setCollapsed(true);
    } catch {
      /* armazenamento bloqueado: segue aberto */
    }
  }, []);

  useEffect(() => {
    const abrir = () => setMobileMenuOpen(true);
    window.addEventListener(EVENTO_ABRIR_MENU, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_MENU, abrir);
  }, []);

  function alternarRecolhido() {
    setCollapsed((v) => {
      const novo = !v;
      try {
        window.localStorage.setItem(CHAVE_RECOLHIDO, novo ? "1" : "0");
      } catch {
        /* sem armazenamento, vale so nesta tela */
      }
      return novo;
    });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const trackingAtivo = ativo === "/admin/config/tracking";

  return (
    <>
      <div
        className={`hidden h-full flex-col gap-4 py-4 transition-[width] duration-200 md:flex ${
          collapsed ? "w-[72px] items-center px-2" : "w-64 px-3"
        }`}
      >
        <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-2 px-1"}`}>
          <Marca environment={environment} compacta={collapsed} />
          <button
            type="button"
            onClick={alternarRecolhido}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--brand-tint-50)] hover:text-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        <nav aria-label="Seções do painel" className={`flex-1 overflow-y-auto ${collapsed ? "space-y-2" : "space-y-2 pr-1"}`}>
          {NAV_GROUPS.map((group) => (
            <GroupSection key={group.label} group={group} ativo={ativo} collapsed={collapsed} />
          ))}
        </nav>

        <div className={`space-y-1 border-t border-[var(--border)] pt-3 ${collapsed ? "flex w-full flex-col items-center" : ""}`}>
          <NavLink
            item={{ label: "Tracking & Pixels", href: "/admin/config/tracking", icon: Zap }}
            active={trackingAtivo}
            collapsed={collapsed}
          />
          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            title={collapsed ? "Sair" : undefined}
            aria-label={collapsed ? "Sair" : undefined}
            className={`flex items-center rounded-xl text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
              collapsed ? "h-10 w-10 justify-center" : "w-full gap-3 px-3 py-2"
            }`}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" aria-hidden />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Menu do celular: aberto pelo botao da barra do topo. O botao
          flutuante que ficava no canto cobria os botoes de salvar das telas. */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent title="Menu" className="max-h-[85vh] max-w-sm overflow-y-auto">
          <div className="mb-4">
            <Marca environment={environment} />
          </div>
          <nav aria-label="Seções do painel" className="space-y-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                {group.label !== "Principal" && (
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={item.href === ativo}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-4 space-y-1 border-t border-[var(--border)] pt-3">
            <NavLink
              item={{ label: "Tracking & Pixels", href: "/admin/config/tracking", icon: Zap }}
              active={trackingAtivo}
              onClick={() => setMobileMenuOpen(false)}
            />
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setConfirmLogoutOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden />
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
