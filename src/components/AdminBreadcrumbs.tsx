"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  puppies: "Filhotes",
  config: "Config",
};

export default function AdminBreadcrumbs() {
  const [pathname, setPathname] = useState<string>(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = () => setPathname(window.location.pathname || '/');
    setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const p of parts) {
    acc += "/" + p;
    const label = LABELS[p] || p;
    crumbs.push({ href: acc, label });
  }
  if (!crumbs.length || crumbs[0]?.href !== "/admin") return null;

  return (
    <nav aria-label="breadcrumbs" className="mx-auto mt-2 max-w-6xl px-4 text-xs text-zinc-500">
      {crumbs.map((c, i) => (
        <span key={c.href}>
          {i > 0 && <span className="mx-1">/</span>}
          {i < crumbs.length - 1 ? (
            <Link href={c.href} className="hover:text-emerald-700">
              {c.label}
            </Link>
          ) : (
            <span className="text-zinc-700">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

