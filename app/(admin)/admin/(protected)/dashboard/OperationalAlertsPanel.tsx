"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AlertItem = {
  id: string;
  title: string;
  description: string;
  resolveHref?: string;
};

export type OperationalAlerts = {
  critical: AlertItem[];
  attention: AlertItem[];
  low: AlertItem[];
};

const categories: { key: keyof OperationalAlerts; label: string; tone: string }[] = [
  {
    key: "critical",
    label: "Críticos",
    tone: "border-rose-200 bg-rose-50 text-rose-900",
  },
  {
    key: "attention",
    label: "Atenção",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "low",
    label: "Baixo impacto",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
];
const STORAGE_KEY = "byimperiodog:admin:ops-alerts:resolved";
const RESOLUTION_TTL_MS = 1000 * 60 * 60 * 48; // keep dismissals for 48h

type ResolvedMap = Record<string, number>;

export function OperationalAlertsPanel({ alerts }: { alerts: OperationalAlerts }) {
  const router = useRouter();
  const [resolved, setResolved] = useState<ResolvedMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ResolvedMap;
        const now = Date.now();
        const freshEntries = Object.entries(parsed).filter(([, timestamp]) => now - timestamp < RESOLUTION_TTL_MS);
        const freshMap = Object.fromEntries(freshEntries);
        setResolved(freshMap);
      }
    } catch (error) {
      console.warn("Failed to read stored operational alerts", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
    } catch (error) {
      console.warn("Failed to persist operational alerts", error);
    }
  }, [resolved, hydrated]);

  const visibleAlerts = useMemo<OperationalAlerts>(() => {
    const filterCategory = (items: AlertItem[]) => items.filter((item) => !resolved[item.id]);
    return {
      critical: filterCategory(alerts.critical),
      attention: filterCategory(alerts.attention),
      low: filterCategory(alerts.low),
    };
  }, [alerts, resolved]);

  const totalAlerts = useMemo(
    () => visibleAlerts.critical.length + visibleAlerts.attention.length + visibleAlerts.low.length,
    [visibleAlerts],
  );

  const handleResolve = useCallback((alertId: string) => {
    setResolved((prev) => ({ ...prev, [alertId]: Date.now() }));
  }, []);

  const handleOpenPanel = useCallback(
    (href?: string) => {
      if (!href) return;
      if (href.startsWith("http")) {
        if (typeof window !== "undefined") {
          window.open(href, "_blank", "noopener,noreferrer");
        }
        return;
      }
      router.push(href);
    },
    [router],
  );

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Alertas operacionais</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Monitoramento rápido do que precisa de atenção.
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {totalAlerts === 0 ? "Todos resolvidos" : `${totalAlerts} ativos`}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {categories.map((category) => {
          const items = visibleAlerts[category.key];
          return (
            <div key={category.key} className={`rounded-xl border px-3 py-3 ${category.tone}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wide">{category.label}</p>
                <span className="text-xs font-semibold">{items.length}</span>
              </div>
              {items.length ? (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-white/40 bg-white/40 px-3 py-2 text-[var(--text)] shadow-sm"
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-current px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                        >
                          Resolver
                        </button>
                        {item.resolveHref ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPanel(item.resolveHref)}
                            className="inline-flex items-center gap-1 rounded-full border border-transparent bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text)]"
                          >
                            Abrir painel
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-muted)] opacity-80">Sem alertas.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
