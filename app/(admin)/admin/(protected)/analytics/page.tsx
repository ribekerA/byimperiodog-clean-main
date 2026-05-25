import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";

import { MetricCard } from "./components/MetricCard";
import { BarChart } from "./components/BarChart";
import { LineChart } from "./components/LineChart";
import { PieChart } from "./components/PieChart";
import { analyzeConversion } from "@/lib/ai/conversion-analyzer";
import { generateDashboardNarrative } from "@/lib/ai/dashboard-narrative";
import { generateDecisions } from "@/lib/ai/decision-engine";
import { generateOperationalAlerts } from "@/lib/ai/operational-alerts";
import { generatePriorityTasks } from "@/lib/ai/priority-engine";
import { recalcDemandPredictions } from "@/lib/ai/demand-prediction";
import { getCatalogAiMetrics } from "@/lib/ai/catalog-analytics";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Analytics | Admin",
  robots: { index: false, follow: false },
};

type LeadRow = {
  id: string;
  created_at: string;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
  page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
};

type PuppyRow = {
  id: string;
  name: string;
  status?: string | null;
  color?: string | null;
  price_cents?: number | null;
  slug?: string | null;
};

type InteractionRow = {
  lead_id: string;
  response_time_minutes?: number | null;
  messages_sent?: number | null;
  created_at?: string | null;
};

type CatalogAiEventRow = {
  id: string;
  event_type: string;
  puppy_id?: string | null;
  badge?: string | null;
  ctr_before?: number | null;
  ctr_after?: number | null;
  created_at?: string | null;
};

type Forecast = {
  salesNext30: number;
  topColors: string[];
  hotPeriods: string[];
  confidenceLabel: string;
  samples: number;
};

type Insight = { title: string; detail: string; tone: "info" | "alert" };

type AlertAi = { title: string; detail: string; type: "critical" | "warning" };

type Simulation = { title: string; detail: string };

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function fetchLeads(sb: SupabaseClient, sinceIso: string) {
  const { data } = await sb
    .from("leads")
    .select("id,created_at,cor_preferida,sexo_preferido,page_slug,page,utm_source,utm_medium")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  return (data ?? []) as LeadRow[];
}

async function fetchLeadsLimited(sb: SupabaseClient, limit: number) {
  const { data } = await sb
    .from("leads")
    .select("id,created_at,cor_preferida,sexo_preferido,page_slug,page,utm_source,utm_medium")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as LeadRow[];
}

async function fetchPuppies(sb: SupabaseClient) {
  const { data } = await sb
    .from("puppies")
    .select("id,name,status,color,price_cents,slug")
    .order("created_at", { ascending: false });
  return (data ?? []) as PuppyRow[];
}

async function fetchInteractions(sb: SupabaseClient, sinceIso: string) {
  try {
    const { data } = await sb
      .from("lead_interactions")
      .select("lead_id,response_time_minutes,messages_sent,created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false });
    return (data ?? []) as InteractionRow[];
  } catch {
    return [] as InteractionRow[];
  }
}

async function fetchCatalogAiEvents(sb: SupabaseClient) {
  try {
    const { data } = await sb
      .from("catalog_ai_events")
      .select("id,event_type,puppy_id,badge,ctr_before,ctr_after,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []) as CatalogAiEventRow[];
  } catch {
    return [] as CatalogAiEventRow[];
  }
}

function buildForecast(leads: LeadRow[], puppies: PuppyRow[], interactions: InteractionRow[]): Forecast {
  const samples = leads.length;
  const convRate = Math.min(0.4, Math.max(0.08, interactions.length ? 0.18 : 0.12));
  const baseSales = Math.round(samples * convRate * (30 / Math.max(1, samples ? 30 : 1)));

  const colorCounts = new Map<string, number>();
  leads.forEach((l) => {
    if (!l.cor_preferida) return;
    const key = l.cor_preferida.toLowerCase();
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  });
  const topColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  const byWeekday = new Map<number, number>();
  leads.forEach((l) => {
    const d = new Date(l.created_at);
    byWeekday.set(d.getDay(), (byWeekday.get(d.getDay()) ?? 0) + 1);
  });
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const hotPeriods = Array.from(byWeekday.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([idx]) => weekdays[idx]);

  const confidenceLabel = samples > 80 ? "Alta confianca" : samples > 30 ? "Media confianca" : "Baixa confianca";
  return { salesNext30: Math.max(1, baseSales), topColors, hotPeriods, confidenceLabel, samples };
}

function buildIntelligence(leads: LeadRow[]): Insight[] {
  if (leads.length === 0) return [];
  const insights: Insight[] = [];
  const sorted = [...leads].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const last7 = sorted.filter((l) => new Date(l.created_at) >= new Date(daysAgoIso(7)));
  const prev7 = sorted.filter(
    (l) => new Date(l.created_at) < new Date(daysAgoIso(7)) && new Date(l.created_at) >= new Date(daysAgoIso(14)),
  );
  if (prev7.length > 0) {
    const delta = ((last7.length - prev7.length) / Math.max(1, prev7.length)) * 100;
    if (delta >= 30) insights.push({ title: "Pico de leads", detail: `Alta de ${delta.toFixed(0)}% vs semana anterior. Aplique follow-up rapido.`, tone: "alert" });
    if (delta <= -20) insights.push({ title: "Queda de leads", detail: `Queda de ${Math.abs(delta).toFixed(0)}% na semana. Reforce ads ou revisite precos.`, tone: "alert" });
  }

  const colorCounts = new Map<string, number>();
  leads.forEach((l) => {
    if (!l.cor_preferida) return;
    const key = l.cor_preferida.toLowerCase();
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  });
  const topColor = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topColor && topColor[1] >= Math.max(5, leads.length * 0.2)) {
    insights.push({ title: "Cor em alta", detail: `Filhotes ${topColor[0]} lideram interesse. Considere ajuste de preco ou destaque no site.`, tone: "info" });
  }
  return insights;
}

function buildBottlenecks(interactions: InteractionRow[]): Insight[] {
  if (!interactions.length) return [];
  const avgResponse =
    interactions.reduce((acc, it) => acc + (it.response_time_minutes ?? 0), 0) / Math.max(1, interactions.length);
  const slowPct =
    (interactions.filter((it) => (it.response_time_minutes ?? 0) > 10).length / Math.max(1, interactions.length)) * 100;
  const items: Insight[] = [];
  if (avgResponse > 15) {
    items.push({
      title: "Resposta lenta",
      detail: `Tempo medio de resposta ${avgResponse.toFixed(0)} min. Acelere para < 10 min para evitar perda de 40% dos leads.`,
      tone: "alert",
    });
  }
  if (slowPct > 40) {
    items.push({
      title: "Gargalo no primeiro contato",
      detail: `${slowPct.toFixed(0)}% dos leads aguardam mais de 10 min. Automatize mensagens iniciais.`,
      tone: "alert",
    });
  }
  return items;
}

function buildAlerts(puppies: PuppyRow[], leads: LeadRow[], forecast: Forecast): AlertAi[] {
  const alerts: AlertAi[] = [];
  const available = puppies.filter((p) => p.status === "available").length;
  if (available < 3) {
    alerts.push({ title: "Estoque muito baixo", detail: `Apenas ${available} filhotes disponiveis. Reforce captacao.`, type: "critical" });
  }
  if (forecast.salesNext30 > available) {
    alerts.push({ title: "Demanda maior que estoque", detail: `Previsao de ${forecast.salesNext30} vendas com ${available} disponiveis. Planeje novos anuncios.`, type: "warning" });
  }
  const prices = puppies.map((p) => p.price_cents ?? 0).filter(Boolean).sort((a, b) => a - b);
  if (prices.length >= 3) {
    const median = prices[Math.floor(prices.length / 2)];
    const high = prices[prices.length - 1];
    if (high > median * 1.8) alerts.push({ title: "Preco fora do padrao", detail: "Alguns precos estao bem acima do mediano; revise ou acrescente valor percebido.", type: "warning" });
  }
  const colorCounts = new Map<string, number>();
  leads.forEach((l) => {
    if (!l.cor_preferida) return;
    const key = l.cor_preferida.toLowerCase();
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  });
  const spike = Array.from(colorCounts.entries()).find(([, count]) => count >= Math.max(6, leads.length * 0.25));
  if (spike) alerts.push({ title: "Cor explodiu em demanda", detail: `${spike[0]} concentrou muitos leads. Prepare estoque e campanhas.`, type: "warning" });
  return alerts;
}

function buildSimulations(forecast: Forecast): Simulation[] {
  const base = forecast.salesNext30;
  return [
    {
      title: "Aumentar preco em 10%",
      detail: `Impacto estimado: -5% em conversao, ${Math.max(1, Math.round(base * 0.95))} vendas (maior receita unit.).`,
    },
    {
      title: "Publicar mais filhotes creme",
      detail: `Se cor top vender +2 unidades, vendas podem chegar a ${base + 2}.`,
    },
    {
      title: "Responder em 15 minutos",
      detail: `Melhora estimada de +8% em conversao: ${Math.round(base * 1.08)} vendas.`,
    },
  ];
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { period?: string } }) {
  const periodDays = Number(searchParams?.period) || 30;
  const sb = supabaseAdmin();

  const now = new Date();
  const startToday = startOfDayIso(now);
  const start7d = daysAgoIso(7);
  const start30d = daysAgoIso(periodDays);

  const [
    leadsToday,
    leads7d,
    leadsRange,
    latestLeads,
    puppies,
    interactions,
    demandPredictions,
    decisions,
    narrative,
    alerts,
    priorityTasks,
    catalogAiMetrics,
    catalogAiEvents,
  ] = await Promise.all([
    fetchLeads(sb, startToday),
    fetchLeads(sb, start7d),
    fetchLeads(sb, start30d),
    fetchLeadsLimited(sb, 10),
    fetchPuppies(sb),
    fetchInteractions(sb, start30d),
    recalcDemandPredictions(),
    generateDecisions(),
    generateDashboardNarrative(),
    generateOperationalAlerts(),
    generatePriorityTasks(),
    getCatalogAiMetrics(),
    fetchCatalogAiEvents(sb),
  ]);

  const forecast = buildForecast(leadsRange, puppies, interactions);
  const intelligence = buildIntelligence(leadsRange);
  const bottlenecks = buildBottlenecks(interactions);
  const alertsAi = buildAlerts(puppies, leadsRange, forecast);
  const simulations = buildSimulations(forecast);

  const puppiesByStatus = puppies.reduce(
    (acc, p) => {
      const key = (p.status ?? "unknown") as string;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const leadsByDay = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const d = new Date(l.created_at);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  })();

  const leadsByColor = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const key = (l.cor_preferida || "Nao informado").toLowerCase();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
  })();

  const leadsBySex = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const key = (l.sexo_preferido || "Indiferente").toLowerCase();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
  })();

  const leadsBySource = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const key = l.utm_source || l.utm_medium || l.page || "desconhecido";
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  })();

  const topPuppies = (() => {
    const buckets = new Map<string, number>();
    leadsRange.forEach((l) => {
      const slug = l.page_slug || l.page;
      if (!slug) return;
      buckets.set(slug, (buckets.get(slug) ?? 0) + 1);
    });
    const enriched = Array.from(buckets.entries()).map(([slug, value]) => {
      const puppy = puppies.find((p) => p.slug === slug);
      return { label: puppy?.name || slug, value };
    });
    return enriched.sort((a, b) => b.value - a.value).slice(0, 5);
  })();

  const conversionInsights = analyzeConversion(leadsRange as any, puppies as any, interactions as any);
  const catalogReorderCtrDelta = (() => {
    const metric = catalogAiMetrics.find((m) => m.eventType === "reorder");
    if (!metric || metric.avgCtrDelta === null) {
      return "NA";
    }
    return `${(metric.avgCtrDelta * 100).toFixed(1)}%`;
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Analytics</h1>
          <p className="text-sm text-[var(--text-muted)]">Visao consolidada de leads e demanda.</p>
        </div>
        <form className="flex items-center gap-2 text-sm">
          <label className="text-[var(--text)]" htmlFor="period">
            Periodo
          </label>
          <select
            id="period"
            name="period"
            defaultValue={periodDays}
            className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Aplicar
          </button>
        </form>
      </header>

      <section aria-label="Metricas principais" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Leads hoje" value={leadsToday.length} />
        <MetricCard label="Leads 7 dias" value={leads7d.length} />
        <MetricCard label={`Leads ${periodDays} dias`} value={leadsRange.length} />
        <MetricCard
          label="Conversao estimada"
          value={`${Math.min(Math.round((leadsRange.length / Math.max(puppies.length, 1)) * 100), 100)}%`}
          description="Ajuste quando status de venda estiver disponivel"
        />
        <MetricCard label="CTR IA (reordenacao)" value={catalogReorderCtrDelta} description="Variacao media de CTR apos ordenacao" />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Previsao de vendas IA">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Previsao de vendas (IA)</h2>
            <p className="text-sm text-[var(--text-muted)]">Estimativa 30 dias com base em historico e estoque.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{forecast.confidenceLabel}</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-sm text-[var(--text-muted)]">Vendas provaveis</p>
            <p className="text-2xl font-bold text-[var(--text)]">{forecast.salesNext30} filhotes</p>
            <p className="text-xs text-[var(--text-muted)]">Base {forecast.samples} leads analisados</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-sm text-[var(--text-muted)]">Cores mais buscadas</p>
            <p className="text-sm font-semibold text-[var(--text)]">{forecast.topColors.join(", ") || "Sem dado"}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-sm text-[var(--text-muted)]">Epocas de maior demanda</p>
            <p className="text-sm font-semibold text-[var(--text)]">{forecast.hotPeriods.join(", ") || "Estavel"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Insights automaticos">
        <h2 className="text-lg font-semibold text-[var(--text)]">Insights automaticos</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Picos, quedas e sugestoes acionaveis.</p>
        <ul className="space-y-2">
          {intelligence.length === 0 && <li className="text-sm text-[var(--text-muted)]">Nenhum insight detectado.</li>}
          {intelligence.map((insight) => (
            <li
              key={insight.title}
              className={`rounded-lg border px-3 py-2 text-sm ${
                insight.tone === "alert" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
              }`}
            >
              <p className="font-semibold">{insight.title}</p>
              <p className="text-[var(--text-muted)]">{insight.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Gargalos">
        <h2 className="text-lg font-semibold text-[var(--text)]">Gargalos da jornada</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Onde voce perde venda segundo o tempo de resposta.</p>
        <ul className="space-y-2">
          {bottlenecks.length === 0 && <li className="text-sm text-[var(--text-muted)]">Nenhum gargalo critico detectado.</li>}
          {bottlenecks.map((b) => (
            <li key={b.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
              <p className="font-semibold">{b.title}</p>
              <p className="text-[var(--text-muted)]">{b.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Metricas adicionais" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--text)]">Status do estoque</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Disponiveis</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppiesByStatus["available"] ?? 0}</dd>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Reservados</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppiesByStatus["reserved"] ?? 0}</dd>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Vendidos</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppiesByStatus["sold"] ?? 0}</dd>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
              <dt className="text-[var(--text-muted)]">Total</dt>
              <dd className="text-lg font-semibold text-[var(--text)]">{puppies.length}</dd>
            </div>
          </dl>
        </div>

        <LineChart data={leadsByDay} title="Leads por dia" />
        <PieChart data={leadsByColor.slice(0, 6)} title="Demanda por cor" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Interesse por sexo e origem">
        <BarChart data={leadsBySex} title="Interesse por sexo" />
        <BarChart data={leadsBySource} title="Origem dos leads (UTM/referrer)" />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Alertas IA">
        <h2 className="text-lg font-semibold text-[var(--text)]">Alertas automaticos</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Estoque, demanda e precos fora do padrao.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {alertsAi.map((alert) => (
            <div
              key={alert.title}
              className={`rounded-xl border px-3 py-2 text-sm ${
                alert.type === "critical" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <p className="font-semibold">{alert.title}</p>
              <p>{alert.detail}</p>
            </div>
          ))}
          {alertsAi.length === 0 && <p className="text-sm text-[var(--text-muted)]">Sem alertas gerados.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Simulacoes">
        <h2 className="text-lg font-semibold text-[var(--text)]">Simulacoes (E se...)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Preve impacto em vendas com mudancas rapidas.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {simulations.map((sim) => (
            <div key={sim.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold text-[var(--text)]">{sim.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{sim.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Analytics de IA do catalogo">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Catalog AI Analytics</h2>
            <p className="text-sm text-[var(--text-muted)]">Impacto de reordenacao, badges e personalizacao no CTR.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs uppercase text-[var(--text-muted)]">Reordenacao IA</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {(() => {
                const m = catalogAiMetrics.find((m) => m.eventType === "reorder");
                if (!m || m.avgCtrDelta === null) return "NA";
                return `${(m.avgCtrDelta * 100).toFixed(1)}%`;
              })()}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Delta de CTR medio</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs uppercase text-[var(--text-muted)]">Badges IA</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {(() => {
                const m = catalogAiMetrics.find((m) => m.eventType === "badge_click");
                return m ? m.total : "NA";
              })()}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Cliques em cards com badge</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs uppercase text-[var(--text-muted)]">Personalizacao</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {(() => {
                const m = catalogAiMetrics.find((m) => m.eventType === "personalization");
                if (!m || m.avgDwellDelta === null) return "NA";
                return `${m.avgDwellDelta.toFixed(0)} ms`;
              })()}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Delta de dwell medio</p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">Ultimos eventos</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-[var(--text-muted)]">
                  <th className="pb-2 pr-3">Quando</th>
                  <th className="pb-2 pr-3">Tipo</th>
                  <th className="pb-2 pr-3">Puppy</th>
                  <th className="pb-2 pr-3">Badge</th>
                  <th className="pb-2 pr-3">CTR delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {catalogAiEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-[var(--text-muted)]">
                      Sem eventos registrados.
                    </td>
                  </tr>
                )}
                {catalogAiEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[var(--surface)]">
                    <td className="py-2 pr-3 text-[var(--text-muted)]">{ev.created_at ? new Date(ev.created_at).toLocaleString("pt-BR") : "NA"}</td>
                    <td className="py-2 pr-3 text-[var(--text)]">{ev.event_type}</td>
                    <td className="py-2 pr-3 text-[var(--text-muted)]">{ev.puppy_id || "NA"}</td>
                    <td className="py-2 pr-3 text-[var(--text-muted)]">{ev.badge || "NA"}</td>
                    <td className="py-2 pr-3 text-[var(--text-muted)]">
                      {ev.ctr_after !== null && ev.ctr_after !== undefined
                        ? `${(((ev.ctr_after ?? 0) - (ev.ctr_before ?? 0)) * 100).toFixed(1)}%`
                        : "NA"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Listagens auxiliares">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Ultimos leads</h2>
          <table className="mt-3 w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-[var(--text-muted)]">
                <th className="pb-2">Data</th>
                <th className="pb-2">Cor</th>
                <th className="pb-2">Sexo</th>
                <th className="pb-2">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {latestLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[var(--surface)]">
                  <td className="py-2 pr-2 text-[var(--text)]">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </td>
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{lead.cor_preferida || "NA"}</td>
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{lead.sexo_preferido || "NA"}</td>
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{lead.utm_source || lead.page || "NA"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Filhotes mais buscados</h2>
          <ol className="mt-3 space-y-2 text-sm text-[var(--text)]">
            {topPuppies.length === 0 && <li className="text-[var(--text-muted)]">Sem dados no periodo.</li>}
            {topPuppies.map((p, idx) => (
              <li key={p.label} className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-3 py-2">
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  {p.label}
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">{p.value} leads</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Insights da IA">
        <h2 className="text-lg font-semibold text-[var(--text)]">Insights da IA</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Gargalos do funil e recomendacoes automaticas.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Gargalos</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {conversionInsights.bottlenecks.length === 0 && <li>Sem gargalos criticos.</li>}
              {conversionInsights.bottlenecks.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Perdas</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {conversionInsights.losses.length === 0 && <li>Sem perdas significativas.</li>}
              {conversionInsights.losses.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-semibold text-[var(--text)]">Recomendacoes</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
            {conversionInsights.recommendations.length === 0 && <li>Sem recomendacoes no momento.</li>}
            {conversionInsights.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-xs text-[var(--text-muted)]">Resumo: {conversionInsights.summary}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Previsao de demanda">
        <h2 className="text-lg font-semibold text-[var(--text)]">Previsao de demanda (proximas 4 semanas)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Estimativa de leads por cor/sexo e riscos de falta.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {demandPredictions.slice(0, 6).map((pred, idx) => (
            <div key={`${pred.color}-${pred.sex}-${idx}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-sm font-semibold text-[var(--text)]">
                {pred.color} - {pred.sex} - {pred.predicted_leads} leads
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {pred.week_start_date} a {pred.week_end_date}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{pred.recommendation}</p>
              {pred.risk_alert && <p className="text-xs font-semibold text-rose-700">{pred.risk_alert}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-label="Decisoes da IA">
        <h2 className="text-lg font-semibold text-[var(--text)]">Decisoes da IA</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Acoes sugeridas com explicacao.</p>
        <ul className="space-y-2">
          {decisions.map((d, idx) => (
            <li
              key={`${d.title}-${idx}`}
              className={`rounded-lg border border-[var(--border)] px-3 py-2 text-sm ${
                d.severity === "critical"
                  ? "bg-rose-50 text-rose-800"
                  : d.severity === "warning"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-[var(--surface)] text-[var(--text)]"
              }`}
            >
              <p className="font-semibold">{d.title}</p>
              <p>{d.action}</p>
              <p className="text-xs text-[var(--text-muted)]">{d.reason}</p>
            </li>
          ))}
          {decisions.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sem decisoes no momento.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Alertas operacionais (OperationalAlertsAI)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Monitoramento de overbooking, estoque e follow-up.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <AlertList title="Criticos" items={alerts.critical} tone="critical" />
          <AlertList title="Medios" items={alerts.medium} tone="warning" />
          <AlertList title="Baixos" items={alerts.low} tone="info" />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Narrativa executiva (DashboardNarrativeAI)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Resumo textual da operacao e proximos passos.</p>
        <div className="space-y-2">
          <div className="rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">{narrative.summary}</div>
          {narrative.opportunities.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Oportunidades</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.opportunities.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
          {narrative.risks.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Riscos</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {narrative.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Recomendacoes</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Prioridades (PriorityEngine)</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Ordens de acao para operacao diaria.</p>
        <ul className="space-y-2">
          {priorityTasks.map((t, idx) => (
            <li
              key={`${t.title}-${idx}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <p className="font-semibold text-[var(--text)]">{t.title}</p>
              <p className="text-[var(--text-muted)]">{t.detail}</p>
              <p className="text-xs text-[var(--text-muted)]">Prioridade: {t.priority}</p>
            </li>
          ))}
          {priorityTasks.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sem tarefas priorizadas.</li>}
        </ul>
      </section>
    </div>
  );
}

function AlertList({ title, items, tone }: { title: string; items: string[]; tone: "critical" | "warning" | "info" }) {
  const toneClass =
    tone === "critical"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]";
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-1 space-y-1 text-sm">
        {items.map((it) => (
          <li key={it} className="leading-snug">
            {it}
          </li>
        ))}
        {items.length === 0 && <li className="text-[var(--text-muted)]">Sem alertas.</li>}
      </ul>
    </div>
  );
}
