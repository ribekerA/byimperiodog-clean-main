import { Users, PawPrint, BarChart2, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { generateDecisions } from "@/lib/ai/decision-engine";
import { generateDeepInsights } from "@/lib/ai/deep-insights";
import { recalcDemandPredictions } from "@/lib/ai/demand-prediction";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { refreshOperationalInsightsAction } from "./actions";
import { AIInsightsPanel, type AIInsightPayload } from "./AIInsightsPanel";
import { DashboardChartsSection } from "./DashboardChartsSection";
import { DashboardErrorNotifier } from "./DashboardErrorNotifier";
import { mapDeepInsightsToPayload } from "./insights";
import { OperationalAlertsPanel, type OperationalAlerts } from "./OperationalAlertsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  robots: { index: false, follow: false },
};

type LeadRow = {
  id: string;
  created_at: string;
  nome?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  status?: string | null;
  utm_source?: string | null;
  lead_ai_insights?: {
    matched_puppy_id?: string | null;
  } | null;
};

type SourceBreakdownItem = {
  source: string;
  count: number;
  pct: number;
  fechados: number;
};

type PuppyRow = {
  id: string;
  name?: string | null;
  status?: string | null;
  price_cents?: number | null;
  created_at?: string | null;
  color?: string | null;
  midia?: { url: string }[] | null;
};

type OpsSnapshot = {
  leadsNoResponse: number;
  puppiesNoPrice: number;
  puppiesNoPhoto: number;
  puppies90: number;
};

type DemandRiskItem = {
  color: string;
  sex?: string | null;
  predicted_leads: number;
  recommendation?: string | null;
  risk_alert?: string | null;
  stock: number;
  risk: "critico" | "alerta" | "ok";
};

type LatestLead = {
  id: string;
  nome?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status?: string | null;
  created_at: string;
  matchedPuppy?: { id: string; name?: string | null } | null;
};

type DayPoint = { label: string; value: number };

type DashboardSnapshot = {
  metrics: {
    leadsToday: number;
    leads7d: number;
    leadsPrev7: number;
    leadsDelta: number;
    puppiesAvail: number;
    puppiesReserved: number;
    puppiesSold: number;
    revenueEstCents: number;
    avgResponseHours: number | null;
  };
  ops: OpsSnapshot;
  demandRisks: DemandRiskItem[];
  aiInsights: AIInsightPayload;
  decisions: Awaited<ReturnType<typeof generateDecisions>>;
  latestLeads: LatestLead[];
  leadsByDay: DayPoint[];
  sourceBreakdown: SourceBreakdownItem[];
};

function createEmptySnapshot(): DashboardSnapshot {
  return {
    metrics: {
      leadsToday: 0,
      leads7d: 0,
      leadsPrev7: 0,
      leadsDelta: 0,
      puppiesAvail: 0,
      puppiesReserved: 0,
      puppiesSold: 0,
      revenueEstCents: 0,
      avgResponseHours: null,
    },
    ops: { leadsNoResponse: 0, puppiesNoPrice: 0, puppiesNoPhoto: 0, puppies90: 0 },
    demandRisks: [],
    aiInsights: mapDeepInsightsToPayload({}),
    decisions: [] as Awaited<ReturnType<typeof generateDecisions>>,
    latestLeads: [],
    leadsByDay: [],
    sourceBreakdown: [],
  };
}

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

async function fetchSnapshot(): Promise<DashboardSnapshot> {
  const sb = supabaseAdmin();
  const startToday = startOfDayIso(new Date());
  const start7 = daysAgoIso(7);
  const startPrev7 = daysAgoIso(14);

  const [
    { data: leads, error: leadsError },
    { data: puppies, error: puppiesError },
    { data: responseLogs },
    demandPredictions,
    deepInsights,
    decisions,
  ] = await Promise.all([
    sb
      .from("leads")
      .select("id,created_at,nome,cidade,estado,cor_preferida,sexo_preferido,status,utm_source,lead_ai_insights")
      .gte("created_at", daysAgoIso(120))
      .order("created_at", { ascending: false }),
    sb
      .from("puppies")
      .select("id,name,status,price_cents,created_at,color,midia")
      .order("created_at", { ascending: false }),
    sb
      .from("autosales_logs")
      .select("lead_id,created_at")
      .gte("created_at", daysAgoIso(30))
      .order("created_at", { ascending: true })
      .limit(1000),
    recalcDemandPredictions().catch(() => [] as Awaited<ReturnType<typeof recalcDemandPredictions>>),
    generateDeepInsights().catch(() => ({} as Awaited<ReturnType<typeof generateDeepInsights>>)),
    generateDecisions().catch(() => [] as Awaited<ReturnType<typeof generateDecisions>>),
  ]);

  if (leadsError) {
    throw new Error(`Falha ao carregar leads: ${leadsError.message}`);
  }
  if (puppiesError) {
    throw new Error(`Falha ao carregar filhotes: ${puppiesError.message}`);
  }

  const leadsArr = (leads ?? []) as LeadRow[];
  const puppiesArr = (puppies ?? []) as PuppyRow[];
  const puppyLookup = new Map(puppiesArr.map((p) => [p.id, { id: p.id, name: p.name }]));

  const leadsToday = leadsArr.filter((l) => l.created_at >= startToday).length;
  const leads7d = leadsArr.filter((l) => l.created_at >= start7).length;
  const leadsPrev7 = leadsArr.filter((l) => l.created_at < start7 && l.created_at >= startPrev7).length;
  const leadsDelta = leadsPrev7 > 0 ? ((leads7d - leadsPrev7) / leadsPrev7) * 100 : 0;

  const leadsNoResponse = leadsArr.filter((l) => !l.status || l.status === "novo").length;

  const puppiesAvail = puppiesArr.filter((p) => p.status === "available").length;
  const puppiesReserved = puppiesArr.filter((p) => p.status === "reserved").length;
  const puppiesSold = puppiesArr.filter((p) => p.status === "sold").length;
  const puppiesNoPrice = puppiesArr.filter((p) => !p.price_cents || p.price_cents <= 0).length;
  const puppiesNoPhoto = puppiesArr.filter((p) => !p.midia || p.midia.length === 0).length;
  const puppies90 = puppiesArr.filter((p) => {
    if (!p.created_at) return false;
    const days = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 90 && (p.status || "available") === "available";
  }).length;

  // Receita estimada: soma dos price_cents dos filhotes vendidos
  const revenueEstCents = puppiesArr
    .filter((p) => p.status === "sold")
    .reduce((sum, p) => sum + (p.price_cents ?? 0), 0);

  // Tempo médio de resposta: diff entre created_at do lead e primeiro log de autosales
  const firstLogByLead = new Map<string, string>();
  (responseLogs ?? []).forEach((log: { lead_id: string; created_at: string }) => {
    if (!firstLogByLead.has(log.lead_id)) firstLogByLead.set(log.lead_id, log.created_at);
  });
  const leadLookupForResponse = new Map(leadsArr.map((l) => [l.id, l.created_at]));
  const responseDiffs: number[] = [];
  firstLogByLead.forEach((logAt, leadId) => {
    const leadCreatedAt = leadLookupForResponse.get(leadId);
    if (!leadCreatedAt) return;
    const diffMs = new Date(logAt).getTime() - new Date(leadCreatedAt).getTime();
    if (diffMs >= 0) responseDiffs.push(diffMs / 3_600_000);
  });
  const avgResponseHours =
    responseDiffs.length > 0
      ? responseDiffs.reduce((s, v) => s + v, 0) / responseDiffs.length
      : null;

  // Breakdown de fonte: leads 30d agrupados por utm_source
  const start30 = daysAgoIso(30);
  const leads30 = leadsArr.filter((l) => l.created_at >= start30);
  const sourceMap = new Map<string, { count: number; fechados: number }>();
  leads30.forEach((l) => {
    const src = l.utm_source?.trim() || "direto";
    const entry = sourceMap.get(src) ?? { count: 0, fechados: 0 };
    entry.count += 1;
    if (l.status === "fechado") entry.fechados += 1;
    sourceMap.set(src, entry);
  });
  const totalLeads30 = leads30.length;
  const sourceBreakdown: SourceBreakdownItem[] = Array.from(sourceMap.entries())
    .map(([source, { count, fechados }]) => ({
      source,
      count,
      pct: totalLeads30 > 0 ? Math.round((count / totalLeads30) * 100) : 0,
      fechados,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const aiInsights = mapDeepInsightsToPayload(deepInsights);

  const latestLeads: LatestLead[] = leadsArr.slice(0, 5).map((lead) => {
    const matchedId = lead.lead_ai_insights?.matched_puppy_id || null;
    const matchedPuppy = matchedId ? puppyLookup.get(matchedId) ?? null : null;
    return {
      id: lead.id,
      created_at: lead.created_at,
      nome: lead.nome,
      cidade: lead.cidade,
      estado: lead.estado,
      status: lead.status,
      matchedPuppy,
    };
  });

  // Leads por dia — últimos 14 dias
  const start14 = daysAgoIso(14);
  const buckets14 = new Map<string, number>();
  leadsArr
    .filter((l) => l.created_at >= start14)
    .forEach((l) => {
      const day = l.created_at.slice(0, 10);
      buckets14.set(day, (buckets14.get(day) ?? 0) + 1);
    });
  // fill any missing days with 0
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (!buckets14.has(key)) buckets14.set(key, 0);
  }
  const leadsByDay: DayPoint[] = Array.from(buckets14.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));

  // Risco: demanda alta x estoque baixo por cor
  const colorStock = new Map<string, number>();
  puppiesArr
    .filter((p) => p.status === "available")
    .forEach((p) => {
      const c = (p.color || "desconhecida").toLowerCase();
      colorStock.set(c, (colorStock.get(c) ?? 0) + 1);
    });
  const demandRisks: DemandRiskItem[] = demandPredictions
    .map((pred): DemandRiskItem => {
      const stock = colorStock.get((pred.color || "desconhecida").toLowerCase()) ?? 0;
      const risk = stock === 0 ? "critico" : pred.predicted_leads > stock * 2 ? "alerta" : "ok";
      return {
        color: pred.color || "desconhecida",
        sex: pred.sex,
        predicted_leads: pred.predicted_leads,
        recommendation: pred.recommendation,
        risk_alert: pred.risk_alert,
        stock,
        risk,
      };
    })
    .slice(0, 6);

  return {
    metrics: { leadsToday, leads7d, leadsPrev7, leadsDelta, puppiesAvail, puppiesReserved, puppiesSold, revenueEstCents, avgResponseHours },
    ops: { leadsNoResponse, puppiesNoPrice, puppiesNoPhoto, puppies90 },
    demandRisks,
    aiInsights,
    decisions,
    latestLeads,
    leadsByDay,
    sourceBreakdown,
  };
}

async function loadDashboardSnapshot(): Promise<{ data: DashboardSnapshot; error?: string }> {
  try {
    const snapshot = await fetchSnapshot();
    return { data: snapshot };
  } catch (error) {
    console.error("dashboard_snapshot_error", error);
    return {
      data: createEmptySnapshot(),
      error: "Não foi possível carregar dados em tempo real. Os números exibidos podem estar desatualizados.",
    };
  }
}

function statusTone(delta: number) {
  if (delta > 5) return "good";
  if (delta < -5) return "bad";
  return "neutral";
}

export default async function DashboardPage() {
  const { data: snapshot, error: snapshotError } = await loadDashboardSnapshot();
  const { metrics, ops, demandRisks, aiInsights, decisions, latestLeads, leadsByDay, sourceBreakdown } = snapshot;
  const operationalAlerts = buildOperationalAlerts(ops, demandRisks);

  return (
    <div className="space-y-6">
      <DashboardErrorNotifier message={snapshotError} />

      {/* Header + Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Console operacional</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">Visão em tempo real com IA aplicada.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/blog/editor"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Novo post
          </Link>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <Users className="h-3.5 w-3.5" aria-hidden /> Leads
          </Link>
          <Link
            href="/admin/puppies"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <PawPrint className="h-3.5 w-3.5" aria-hidden /> Estoque
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <BarChart2 className="h-3.5 w-3.5" aria-hidden /> Analytics
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SmartCard
          label="Leads hoje"
          value={metrics.leadsToday}
          delta={metrics.leadsDelta}
          tone={statusTone(metrics.leadsDelta)}
          helper="Comparado a 7d anteriores"
        />
        <SmartCard
          label="Leads 7d"
          value={metrics.leads7d}
          delta={metrics.leadsDelta}
          tone={statusTone(metrics.leadsDelta)}
          helper="Variação semanal"
        />
        <SmartCard label="Disponíveis" value={metrics.puppiesAvail} tone={metrics.puppiesAvail > 0 ? "good" : "bad"} helper="Estoque atual" />
        <SmartCard label="Reservados" value={metrics.puppiesReserved} tone="neutral" helper="Acompanhar confirmações" />
        <SmartCard
          label="Receita estimada"
          value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metrics.revenueEstCents / 100)}
          tone={metrics.revenueEstCents > 0 ? "good" : "neutral"}
          helper="Total de filhotes vendidos"
        />
        <SmartCard
          label="Tempo de resposta"
          value={metrics.avgResponseHours !== null ? `${metrics.avgResponseHours.toFixed(1)}h` : "—"}
          tone={metrics.avgResponseHours === null ? "neutral" : metrics.avgResponseHours <= 2 ? "good" : metrics.avgResponseHours <= 6 ? "neutral" : "bad"}
          helper="Média lead → 1ª mensagem (30d)"
        />
      </section>

      <DashboardChartsSection
        leadsByDay={leadsByDay}
        puppiesAvail={metrics.puppiesAvail}
        puppiesReserved={metrics.puppiesReserved}
        puppiesSold={metrics.puppiesSold}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-labelledby="latest-leads-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="latest-leads-heading" className="text-lg font-semibold text-[var(--text)]">
              Últimos leads
            </h2>
            <p className="text-sm text-[var(--text-muted)]">Monitoramento dos 5 cadastros mais recentes.</p>
          </div>
        </div>
        {latestLeads.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]" role="status">
            Nenhum lead novo foi registrado recentemente. Assim que novos cadastros chegarem eles aparecem aqui.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-[var(--border)]">
            {latestLeads.map((lead) => (
              <li key={lead.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{lead.nome || "Lead sem nome"}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {[lead.cidade, lead.estado].filter(Boolean).join(" · ") || "Local não informado"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {lead.status || "Status indefinido"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <p>
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(lead.created_at))}
                  </p>
                  <p className="font-medium text-[var(--text)]">
                    {lead.matchedPuppy?.name ? `Filhote: ${lead.matchedPuppy.name}` : "Sem filhote associado"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {sourceBreakdown.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm" aria-labelledby="source-breakdown-heading">
          <h2 id="source-breakdown-heading" className="text-lg font-semibold text-[var(--text)]">Origem dos leads (30d)</h2>
          <p className="text-sm text-[var(--text-muted)]">Qual canal traz mais leads e conversões.</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2">Fonte</th>
                  <th className="px-4 py-2 text-right">Leads</th>
                  <th className="px-4 py-2 text-right">% do total</th>
                  <th className="px-4 py-2 text-right">Fechados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {sourceBreakdown.map((row) => (
                  <tr key={row.source} className="hover:bg-[var(--surface)]">
                    <td className="px-4 py-2 font-medium capitalize text-[var(--text)]">{row.source}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--text)]">{row.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--text-muted)]">{row.pct}%</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-semibold ${row.fechados > 0 ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}>
                        {row.fechados}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Indicadores operacionais</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <IssueCard label="Leads sem resposta" value={ops.leadsNoResponse} severity={ops.leadsNoResponse > 5 ? "high" : ops.leadsNoResponse > 0 ? "medium" : "low"} />
          <IssueCard label="Filhotes sem preço" value={ops.puppiesNoPrice} severity={ops.puppiesNoPrice > 3 ? "high" : ops.puppiesNoPrice > 0 ? "warning" : "low"} />
          <IssueCard label="Filhotes sem foto" value={ops.puppiesNoPhoto} severity={ops.puppiesNoPhoto > 3 ? "high" : ops.puppiesNoPhoto > 0 ? "warning" : "low"} />
          <IssueCard label="Filhotes > 90 dias" value={ops.puppies90} severity={ops.puppies90 > 2 ? "high" : ops.puppies90 > 0 ? "warning" : "low"} />
        </div>
      </section>

      <OperationalAlertsPanel alerts={operationalAlerts} />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Previsão próxima semana</h2>
        <p className="text-sm text-[var(--text-muted)]">Leads previstos vs estoque por cor/sexo.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demandRisks.map((pred, idx) => (
            <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--text)]">
                  {pred.color} · {pred.sex}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    pred.risk === "critico"
                      ? "bg-rose-100 text-rose-800"
                      : pred.risk === "alerta"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[var(--brand-tint-100)] text-[var(--brand)]"
                  }`}
                >
                  {pred.risk === "critico" ? "Risco" : pred.risk === "alerta" ? "Alerta" : "OK"}
                </span>
              </div>
              <p className="text-[var(--text-muted)]">
                Previsto {pred.predicted_leads} leads • estoque {pred.stock}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{pred.recommendation}</p>
              {pred.risk_alert && <p className="text-xs font-semibold text-rose-700">{pred.risk_alert}</p>}
            </div>
          ))}
          {demandRisks.length === 0 && <p className="text-sm text-[var(--text-muted)]">Sem previsões disponíveis.</p>}
        </div>
      </section>

      <AIInsightsPanel
        action={refreshOperationalInsightsAction}
        initialInsight={aiInsights}
        fallbackText="IA indisponível no momento. Tente novamente em instantes."
      />

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Decisões da IA</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Ações sugeridas com explicação.</p>
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
          {decisions.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sem decisões no momento.</li>}
        </ul>
      </section>
    </div>
  );
}

function SmartCard({
  label,
  value,
  delta,
  tone,
  helper,
}: {
  label: string;
  value: number | string;
  delta?: number;
  tone: "good" | "bad" | "neutral";
  helper?: string;
}) {
  const borderClass =
    tone === "good" ? "border-[var(--brand-tint-200)]" : tone === "bad" ? "border-rose-200" : "border-[var(--border)]";
  const badgeClass =
    tone === "good"
      ? "text-[var(--brand)] bg-[var(--brand-tint-50)]"
      : tone === "bad"
      ? "text-rose-700 bg-rose-50"
      : "text-[var(--text-muted)] bg-[var(--surface)]";
  const displayValue = value ?? "—";
  const TrendIcon =
    delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <div className={`rounded-xl border-2 ${borderClass} bg-white p-4 shadow-sm`} role="status" aria-live="polite">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1.5 text-4xl font-bold tabular-nums text-[var(--text)]">{displayValue}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && TrendIcon && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}>
            <TrendIcon className="h-3 w-3" aria-hidden />
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
          </span>
        )}
        {helper && <p className="text-[11px] text-[var(--text-muted)]">{helper}</p>}
      </div>
    </div>
  );
}

function IssueCard({ label, value, severity }: { label: string; value: number; severity: "low" | "medium" | "warning" | "high" }) {
  const isOk = severity === "low";
  const wrapClass = isOk
    ? "bg-white border-[var(--border)]"
    : severity === "high"
      ? "bg-rose-50 border-rose-200"
      : "bg-amber-50 border-amber-200";
  const valueClass = isOk
    ? "text-[var(--brand)]"
    : severity === "high"
      ? "text-rose-700"
      : "text-amber-700";
  const dot = isOk ? "bg-[var(--brand)]" : severity === "high" ? "bg-rose-500" : "bg-amber-400";
  return (
    <div className={`rounded-xl border px-4 py-3 ${wrapClass}`} role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">{label}</p>
      </div>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function buildOperationalAlerts(ops: OpsSnapshot, demandRisks: DemandRiskItem[]): OperationalAlerts {
  const alerts: OperationalAlerts = { critical: [], attention: [], low: [] };

  if (ops.leadsNoResponse > 10) {
    alerts.critical.push({
      id: "leads-no-response",
      title: "Leads sem resposta",
      description: `${ops.leadsNoResponse} leads aguardam primeiro contato nas últimas semanas.`,
      resolveHref: "/admin/leads",
    });
  } else if (ops.leadsNoResponse > 0) {
    alerts.attention.push({
      id: "leads-followup",
      title: "Follow-up pendente",
      description: `${ops.leadsNoResponse} leads precisam de retorno para evitar perda de interesse.`,
      resolveHref: "/admin/leads",
    });
  }

  if (ops.puppiesNoPrice > 0) {
    const bucket = ops.puppiesNoPrice > 3 ? "critical" : "attention";
    alerts[bucket].push({
      id: "puppies-no-price",
      title: "Filhotes sem preço",
      description: `${ops.puppiesNoPrice} anúncios ativos estão sem valor publicado.`,
      resolveHref: "/admin/dashboard",
    });
  }

  if (ops.puppiesNoPhoto > 0) {
    alerts.attention.push({
      id: "puppies-no-photo",
      title: "Fotos ausentes",
      description: `${ops.puppiesNoPhoto} filhotes precisam de mídia antes de liberar campanhas.`,
      resolveHref: "/admin/dashboard",
    });
  }

  if (ops.puppies90 > 0) {
    alerts.low.push({
      id: "aged-puppies",
      title: "> 90 dias disponíveis",
      description: `${ops.puppies90} filhotes estão há mais de 90 dias aguardando família.`,
      resolveHref: "/admin/dashboard",
    });
  }

  demandRisks.forEach((risk, idx) => {
    const bucket = risk.risk === "critico" ? "critical" : risk.risk === "alerta" ? "attention" : "low";
    alerts[bucket].push({
      id: `demand-risk-${idx}`,
      title: `Demanda ${risk.color} · ${risk.sex ?? "-"}`,
      description: `Previstos ${risk.predicted_leads} leads com apenas ${risk.stock} no estoque. ${risk.recommendation ?? risk.risk_alert ?? "Rever oferta."}`,
      resolveHref: "/admin/filhotes",
    });
  });

  if (!alerts.critical.length && !alerts.attention.length && !alerts.low.length) {
    alerts.low.push({
      id: "ops-stable",
      title: "Operação estável",
      description: "Nenhum alerta ativo. Continue monitorando os indicadores.",
    });
  }

  return alerts;
}


