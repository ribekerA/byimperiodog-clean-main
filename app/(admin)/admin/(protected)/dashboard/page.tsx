import type { Metadata } from "next";

import { generateDeepInsights } from "@/lib/ai/deep-insights";
import { generateDecisions } from "@/lib/ai/decision-engine";
import { recalcDemandPredictions } from "@/lib/ai/demand-prediction";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { AIInsightsPanel, type AIInsightPayload } from "./AIInsightsPanel";
import { OperationalAlertsPanel, type OperationalAlerts } from "./OperationalAlertsPanel";
import { refreshOperationalInsightsAction } from "./actions";
import { DashboardErrorNotifier } from "./DashboardErrorNotifier";
import { mapDeepInsightsToPayload } from "./insights";

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
  lead_ai_insights?: {
    matched_puppy_id?: string | null;
  } | null;
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

type DashboardSnapshot = {
  metrics: {
    leadsToday: number;
    leads7d: number;
    leadsPrev7: number;
    leadsDelta: number;
    puppiesAvail: number;
    puppiesReserved: number;
    puppiesSold: number;
  };
  ops: OpsSnapshot;
  demandRisks: DemandRiskItem[];
  aiInsights: AIInsightPayload;
  decisions: Awaited<ReturnType<typeof generateDecisions>>;
  latestLeads: LatestLead[];
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
    },
    ops: { leadsNoResponse: 0, puppiesNoPrice: 0, puppiesNoPhoto: 0, puppies90: 0 },
    demandRisks: [],
    aiInsights: mapDeepInsightsToPayload({}),
    decisions: [] as Awaited<ReturnType<typeof generateDecisions>>,
    latestLeads: [],
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
    demandPredictions,
    deepInsights,
    decisions,
  ] = await Promise.all([
    sb
      .from("leads")
      .select("id,created_at,nome,cidade,estado,cor_preferida,sexo_preferido,status,lead_ai_insights!left(matched_puppy_id)")
      .gte("created_at", daysAgoIso(120))
      .order("created_at", { ascending: false }),
    sb
      .from("puppies")
      .select("id,name,status,price_cents,created_at,color,midia")
      .order("created_at", { ascending: false }),
    recalcDemandPredictions(),
    generateDeepInsights(),
    generateDecisions(),
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
    metrics: { leadsToday, leads7d, leadsPrev7, leadsDelta, puppiesAvail, puppiesReserved, puppiesSold },
    ops: { leadsNoResponse, puppiesNoPrice, puppiesNoPhoto, puppies90 },
    demandRisks,
    aiInsights,
    decisions,
    latestLeads,
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
  const { metrics, ops, demandRisks, aiInsights, decisions, latestLeads } = snapshot;
  const operationalAlerts = buildOperationalAlerts(ops, demandRisks);

  return (
    <div className="space-y-6">
      <DashboardErrorNotifier message={snapshotError} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Console operacional</h1>
          <p className="text-sm text-[var(--text-muted)]">Visao em tempo quase real com IA aplicada.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

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
          <ol className="mt-4 divide-y divide-[var(--border)]" role="list">
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

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Indicadores operacionais</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <IssueCard label="Leads sem resposta" value={ops.leadsNoResponse} severity={ops.leadsNoResponse > 5 ? "high" : "medium"} />
          <IssueCard label="Filhotes sem preço" value={ops.puppiesNoPrice} severity={ops.puppiesNoPrice > 0 ? "high" : "low"} />
          <IssueCard label="Filhotes sem foto" value={ops.puppiesNoPhoto} severity={ops.puppiesNoPhoto > 0 ? "high" : "low"} />
          <IssueCard label="Filhotes > 90 dias" value={ops.puppies90} severity={ops.puppies90 > 0 ? "warning" : "low"} />
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
                      : "bg-emerald-100 text-emerald-800"
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
  const toneClass =
    tone === "good" ? "text-emerald-700 bg-emerald-50" : tone === "bad" ? "text-rose-700 bg-rose-50" : "text-[var(--text)] bg-[var(--surface)]";
  const displayValue = value ?? "—";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm" role="status" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--text)]">{displayValue}</p>
      {delta !== undefined && (
        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
      )}
      {helper && <p className="text-xs text-[var(--text-muted)]">{helper}</p>}
    </div>
  );
}

function IssueCard({ label, value, severity }: { label: string; value: number; severity: "low" | "medium" | "warning" | "high" }) {
  const tone =
    severity === "high"
      ? "bg-rose-50 text-rose-800"
      : severity === "warning" || severity === "medium"
        ? "bg-amber-50 text-amber-800"
        : "bg-[var(--surface)] text-[var(--text)]";
  return (
    <div className={`rounded-xl border border-[var(--border)] px-3 py-2 ${tone}`} role="status" aria-live="polite">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
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

 
