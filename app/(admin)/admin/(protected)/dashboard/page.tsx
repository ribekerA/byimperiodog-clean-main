import type { Metadata } from "next";
import { cookies } from "next/headers";

import { loadDashboard } from "@/lib/admin/dashboardData";
import { loadWhatsAppClicks } from "@/lib/admin/whatsappClicks";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";

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
 * desenho em DashboardView.tsx. Os cliques no WhatsApp vem do GA4
 * (whatsappClicks.ts). Abrir a tela nao grava nada no banco.
 */
export default async function AdminDashboardPage() {
  // A integracao do GA4 e por usuario do painel: quem abriu a tela.
  const session = await verifyAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  const [load, whatsapp] = await Promise.all([loadDashboard(), loadWhatsAppClicks(session?.userId)]);

  return (
    <DashboardView
      {...load}
      whatsapp={whatsapp}
      refreshSlot={
        <RefreshButton generatedAt={load.data.generatedAt} timeLabel={formatClock(load.data.generatedAt)} />
      }
    />
  );
}
