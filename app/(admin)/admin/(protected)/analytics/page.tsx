import type { Metadata } from "next";

import { loadAnalytics } from "@/lib/admin/analyticsData";
import { parseAnalyticsPeriod } from "@/lib/admin/analyticsMetrics";

import { RefreshButton } from "../dashboard/RefreshButton";

import { AnalyticsView, formatAnalyticsClock } from "./AnalyticsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics | Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Analytics do admin.
 *
 * A pagina so junta as pecas: a leitura do banco fica em
 * src/lib/admin/analyticsData.ts, as contas em analyticsMetrics.ts e o desenho
 * em AnalyticsView.tsx. Abrir a tela nao grava nada no banco.
 */
export default async function AdminAnalyticsPage(props: { searchParams?: Promise<SearchParams> }) {
  const searchParams = (await props.searchParams) ?? {};
  const load = await loadAnalytics(parseAnalyticsPeriod(searchParams.period));

  return (
    <AnalyticsView
      {...load}
      refreshSlot={
        <RefreshButton
          generatedAt={load.data.generatedAt}
          timeLabel={formatAnalyticsClock(load.data.generatedAt)}
        />
      }
    />
  );
}
