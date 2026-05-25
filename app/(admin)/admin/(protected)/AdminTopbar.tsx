"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";

type Props = {
  environment: string;
  userName?: string;
};

const LABEL_MAP: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  puppies: "Estoque de Filhotes",
  leads: "Leads & Funil",
  relatorios: "Analytics",
  analytics: "Analytics",
  tracking: "Configuracoes & Tracking",
};

export function AdminTopbar({ environment, userName = "Admin" }: Props) {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    const entries: { href: string; label: string }[] = [];
    let acc = "";
    parts.forEach((part) => {
      acc += `/${part}`;
      const label = LABEL_MAP[part] || part;
      entries.push({ href: acc, label });
    });
    return entries;
  }, [pathname]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
      <div>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-2">
                  <a
                    href={crumb.href}
                    className={`font-semibold ${isLast ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-emerald-700"}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {crumb.label}
                  </a>
                  {!isLast && <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Painel operacional</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {environment}
        </span>
        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-semibold text-[var(--text)]">
          <UserRound className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          <span>{userName}</span>
        </div>
      </div>
    </div>
  );
}
