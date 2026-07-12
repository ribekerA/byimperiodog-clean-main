"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

type DayPoint = { label: string; value: number };

function ChartSkeleton() {
  return <div className="h-36 animate-pulse rounded-lg bg-gray-100" />;
}

const LeadsTrendChart = dynamic(
  () => import("./DashboardCharts").then((m) => m.LeadsTrendChart),
  { ssr: false }
);

const PuppyStatusDonut = dynamic(
  () => import("./DashboardCharts").then((m) => m.PuppyStatusDonut),
  { ssr: false }
);

export function DashboardChartsSection({
  leadsByDay,
  puppiesAvail,
  puppiesReserved,
  puppiesSold,
}: {
  leadsByDay: DayPoint[];
  puppiesAvail: number;
  puppiesReserved: number;
  puppiesSold: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Tendência de leads (14d)</h2>
            <p className="text-xs text-[var(--text-muted)]">Captações por dia nas últimas 2 semanas.</p>
          </div>
          <a href="/admin/analytics" className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]">
            Ver analytics →
          </a>
        </div>
        {mounted ? <LeadsTrendChart data={leadsByDay} /> : <ChartSkeleton />}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">Status do estoque</h2>
          <p className="text-xs text-[var(--text-muted)]">Distribuição atual dos filhotes cadastrados.</p>
        </div>
        {mounted ? (
          <PuppyStatusDonut
            available={puppiesAvail}
            reserved={puppiesReserved}
            sold={puppiesSold}
          />
        ) : (
          <ChartSkeleton />
        )}
      </div>
    </section>
  );
}
