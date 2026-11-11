import type { Metadata } from "next";

import { loadDashboard } from "@/lib/admin/dashboardData";

import { DashboardView, formatClock } from "./DashboardView";
import { RefreshButton } from "./RefreshButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  robots: { index: false, follow: false },
};

/**
 * Dashboard do admin.
 *
 * A pagina so junta as pecas: a leitura do banco fica em
 * src/lib/admin/dashboardData.ts, as contas em dashboardMetrics.ts e o
 * desenho em DashboardView.tsx. Abrir a tela nao grava nada no banco.
 */
export default async function AdminDashboardPage() {
  const load = await loadDashboard();

  return (
    <DashboardView
      {...load}
      refreshSlot={
        <RefreshButton generatedAt={load.data.generatedAt} timeLabel={formatClock(load.data.generatedAt)} />
      }
    />
  );
}
