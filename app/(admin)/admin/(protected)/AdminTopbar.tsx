"use client";

import { ChevronRight, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { EVENTO_ABRIR_MENU } from "./AdminNav";

type Props = {
  environment: string;
  userName?: string;
};

const LABEL_MAP: Record<string, string> = {
  admin:        "Admin",
  dashboard:    "Dashboard",
  blog:         "Blog",
  puppies:      "Filhotes",
  leads:        "Leads",
  analytics:    "Analytics",
  relatorios:   "Relatórios",
  reviews:      "Avaliações",
  config:       "Configurações",
  settings:     "Configurações",
  seo:          "SEO",
  media:        "Mídia",
  webhooks:     "Webhooks",
  experiments:  "Experimentos",
  content:      "Conteúdo",
  calendar:     "Calendário",
  tracking:     "Tracking & Pixels",
  system:       "Sistema",
  health:       "Saúde do Sistema",
  "web-stories":"Web Stories",
  "pixel-experiments": "Experimentos de Pixel",
  "google-ads": "Google Ads",
  "media-engagement": "Engajamento",
  autosales:    "AutoSales IA",
  contracts:    "Contratos",
  cadastros:    "Cadastros",
  wizard:       "Wizard",
  editor:       "Editor",
  new:          "Novo",
  edit:         "Editar",
};

/** Segmento que e um ID (uuid, numero, slug longo) vira "Detalhe" na trilha. */
function rotulo(parte: string): string {
  if (LABEL_MAP[parte]) return LABEL_MAP[parte];
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(parte) || /^\d+$/.test(parte)) return "Detalhe";
  const legivel = decodeURIComponent(parte).replace(/-/g, " ");
  return legivel.charAt(0).toUpperCase() + legivel.slice(1);
}

export function AdminTopbar({ environment, userName = "Admin" }: Props) {
  const pathname = usePathname();
  const producao = /produ/i.test(environment);

  const crumbs = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    const entries: { href: string; label: string }[] = [];
    let acc = "";
    parts.forEach((part) => {
      acc += `/${part}`;
      // "/admin" sozinho nao e tela: a trilha comeca na secao.
      if (part === "admin" && acc === "/admin") return;
      entries.push({ href: acc, label: rotulo(part) });
    });
    return entries;
  }, [pathname]);

  return (
    <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_MENU))}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text)] transition hover:bg-[var(--brand-tint-50)] md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <nav aria-label="Trilha de navegação" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <li
                  key={crumb.href}
                  className={`flex min-w-0 items-center gap-1.5 ${isLast ? "" : "hidden sm:flex"}`}
                >
                  {isLast ? (
                    <span className="truncate font-semibold text-[var(--text)]" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <>
                      <Link
                        href={crumb.href}
                        className="truncate text-[var(--text-muted)] transition-colors hover:text-[var(--brand)]"
                      >
                        {crumb.label}
                      </Link>
                      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)]" aria-hidden />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            producao ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
          }`}
          title={producao ? "Mudanças aqui afetam o site público" : "Ambiente local: não afeta o site público"}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${producao ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
          <span className="hidden sm:inline">{producao ? "Produção" : "Desenvolvimento"}</span>
        </span>
        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white py-1 pl-1 pr-3 text-sm font-medium text-[var(--text)]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-tint-100)] text-[var(--brand)]">
            <UserRound className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden max-w-[10rem] truncate sm:inline">{userName}</span>
        </div>
      </div>
    </div>
  );
}
