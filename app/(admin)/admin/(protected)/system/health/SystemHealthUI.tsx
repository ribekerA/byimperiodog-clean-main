"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Database,
  Globe,
  HardDrive,
  Loader2,
  MessageSquare,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Range = "24h" | "7d" | "30d";
type TabId = "overview" | "services" | "vitals" | "errors";
type OverallStatus = "healthy" | "degraded" | "critical";

export type HealthData = {
  generatedAt: string;
  range: string;
  overallStatus: OverallStatus;
  services: {
    database: { status: "ok" | "degraded" | "down"; latencyMs: number };
    analytics: { status: "ok" | "no_data"; eventsInRange: number };
    storage: { status: "ok" | "not_configured" };
    ai: { status: "configured" | "not_configured" };
    whatsapp: { status: "configured" | "not_configured" };
  };
  metrics: {
    responseTimeP50: number;
    responseTimeP95: number;
    errorRate: number;
    activeUsers: number;
    totalEvents: number;
  };
  webVitals: { lcp: number; inp: number; cls: number; samples: number };
  tableStats: { blog_posts: number; puppies: number; leads: number };
  recentErrors: Array<{ message: string; path: string; created_at: string }>;
  errorByPath: Record<string, number>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUTO_REFRESH_S = 30;

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));
  } catch { return iso; }
}

function vitalStatus(key: "lcp" | "inp" | "cls", val: number) {
  if (val === 0) return "no_data";
  if (key === "lcp") return val < 2500 ? "good" : val < 4000 ? "needs-improvement" : "poor";
  if (key === "inp") return val < 200 ? "good" : val < 500 ? "needs-improvement" : "poor";
  return val < 0.1 ? "good" : val < 0.25 ? "needs-improvement" : "poor";
}

function vitalLabel(s: string) {
  return s === "good" ? "Bom" : s === "needs-improvement" ? "Atenção" : s === "poor" ? "Ruim" : "Sem dados";
}
function vitalCls(s: string) {
  return s === "good" ? "bg-[var(--brand-tint-100)] text-[var(--brand)]" : s === "needs-improvement" ? "bg-yellow-100 text-yellow-700" : s === "poor" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500";
}
function statusDot(s: string) {
  return s === "ok" || s === "configured" ? "bg-[var(--brand)]" : s === "degraded" || s === "no_data" ? "bg-yellow-500" : s === "down" ? "bg-red-500" : "bg-slate-400";
}
function statusBadge(s: string) {
  return s === "ok" || s === "configured" ? "bg-[var(--brand-tint-100)] text-[var(--brand)]" : s === "degraded" || s === "no_data" ? "bg-yellow-100 text-yellow-700" : s === "down" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500";
}
function statusLabel(s: string) {
  const m: Record<string, string> = { ok: "Online", configured: "Configurado", not_configured: "Não configurado", degraded: "Degradado", down: "Offline", no_data: "Sem dados" };
  return m[s] ?? s;
}
function overallBanner(status: OverallStatus) {
  if (status === "healthy") return { bg: "bg-[var(--brand-tint-50)] border-[var(--brand-tint-200)]", icon: CheckCircle2, iconCls: "text-[var(--brand)]", text: "Sistema saudável", textCls: "text-[var(--brand)]" };
  if (status === "degraded") return { bg: "bg-yellow-50 border-yellow-200", icon: AlertTriangle, iconCls: "text-yellow-600", text: "Sistema degradado", textCls: "text-yellow-800" };
  return { bg: "bg-red-50 border-red-200", icon: XCircle, iconCls: "text-red-600", text: "Sistema crítico", textCls: "text-red-800" };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { initialData: HealthData; initialRange: Range };

export function SystemHealthUI({ initialData, initialRange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<HealthData>(initialData);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_S);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/system/health?range=${r}`, { cache: "no-store" });
      setData(await res.json());
      setCountdown(AUTO_REFRESH_S);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { fetchData(range); return AUTO_REFRESH_S; }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [range, fetchData]);

  const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: "overview", label: "Overview", icon: Server },
    { id: "services", label: "Serviços", icon: Globe },
    { id: "vitals", label: "Web Vitals", icon: Zap },
    { id: "errors", label: "Erros", icon: AlertTriangle },
  ];

  const banner = overallBanner(data.overallStatus);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--brand)]">Saúde do Sistema</h1>
          <p className="mt-1 text-sm text-[var(--brand)]">Monitoramento de serviços, Core Web Vitals e erros em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-[var(--brand-tint-200)] bg-white p-1">
            {(["24h", "7d", "30d"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${range === r ? "bg-[var(--brand)] text-white" : "text-[var(--brand)] hover:bg-[var(--brand-tint-50)]"}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(range)} disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[var(--brand-tint-200)] bg-white px-3 py-2 text-sm font-medium text-[var(--brand)] transition hover:bg-[var(--brand-tint-50)] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="text-xs text-[var(--brand)]">{loading ? "..." : `${countdown}s`}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-5 py-3 ${banner.bg}`}>
        <banner.icon className={`h-5 w-5 shrink-0 ${banner.iconCls}`} />
        <div className="flex-1">
          <span className={`text-sm font-semibold ${banner.textCls}`}>{banner.text}</span>
          <span className="ml-3 text-xs text-[var(--text-muted)]">Última verificação: {fmtDate(data.generatedAt)}</span>
        </div>
      </div>

      {/* Tab panel */}
      <div className="rounded-2xl border border-[var(--brand-tint-100)] bg-white shadow-sm">
        <div className="border-b border-[var(--brand-tint-100)]">
          <nav className="flex gap-0.5 overflow-x-auto px-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${activeTab === id ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-[var(--brand)] hover:border-[var(--brand)] hover:text-[var(--brand-hover)]"}`}>
                <Icon className="h-4 w-4" />
                {label}
                {id === "errors" && data.recentErrors.length > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{data.recentErrors.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {[
                  { label: "DB Latência", value: `${data.services.database.latencyMs}ms`, sub: statusLabel(data.services.database.status), color: data.services.database.latencyMs < 200 ? "emerald" : data.services.database.latencyMs < 1000 ? "yellow" : "red", icon: Database },
                  { label: "Response P95", value: `${data.metrics.responseTimeP95}ms`, sub: data.metrics.responseTimeP95 === 0 ? "Sem dados" : data.metrics.responseTimeP95 < 1000 ? "Bom" : "Lento", color: data.metrics.responseTimeP95 === 0 ? "slate" : data.metrics.responseTimeP95 < 1000 ? "emerald" : data.metrics.responseTimeP95 < 3000 ? "yellow" : "red", icon: Zap },
                  { label: "Taxa de Erros", value: `${data.metrics.errorRate}%`, sub: data.metrics.errorRate === 0 ? "Sem erros" : data.metrics.errorRate < 1 ? "Aceitável" : "Atenção", color: data.metrics.errorRate === 0 ? "emerald" : data.metrics.errorRate < 1 ? "yellow" : "red", icon: AlertTriangle },
                  { label: "Eventos", value: data.metrics.totalEvents.toLocaleString("pt-BR"), sub: `Últimas ${range}`, color: "blue", icon: Activity },
                  { label: "Usuários Ativos", value: data.metrics.activeUsers.toString(), sub: `Sessões em ${range}`, color: "purple", icon: Activity },
                  { label: "P50 Response", value: `${data.metrics.responseTimeP50}ms`, sub: "Mediana", color: "slate", icon: Zap },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className={`rounded-2xl border border-${card.color}-100 bg-white p-5 shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium text-${card.color}-600`}>{card.label}</p>
                          <p className={`mt-1 text-3xl font-bold text-${card.color}-900`}>{card.value}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{card.sub}</p>
                        </div>
                        <Icon className={`h-7 w-7 text-${card.color}-400`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-[var(--brand)]">Registros no Banco</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Posts publicados", value: data.tableStats.blog_posts },
                    { label: "Filhotes cadastrados", value: data.tableStats.puppies },
                    { label: "Leads captados", value: data.tableStats.leads },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-[var(--brand-tint-100)] bg-[var(--brand-tint-50)] p-4 text-center">
                      <p className="text-2xl font-bold text-[var(--brand)]">{s.value.toLocaleString("pt-BR")}</p>
                      <p className="mt-1 text-xs text-[var(--brand)]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SERVICES */}
          {activeTab === "services" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[var(--brand)]">Status dos Serviços</p>
                <p className="text-xs text-[var(--text-muted)]">Estado atual de cada dependência do sistema.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "Database", icon: Database, status: data.services.database.status, detail: `Latência: ${data.services.database.latencyMs}ms`, desc: "Supabase PostgreSQL" },
                  { name: "Analytics", icon: Activity, status: data.services.analytics.status, detail: `${data.services.analytics.eventsInRange.toLocaleString("pt-BR")} eventos`, desc: "Coleta de eventos" },
                  { name: "Storage", icon: HardDrive, status: data.services.storage.status, detail: data.services.storage.status === "ok" ? "Supabase Storage" : "Verificar SUPABASE_URL", desc: "Armazenamento de arquivos" },
                  { name: "AI / LLM", icon: Bot, status: data.services.ai.status, detail: data.services.ai.status === "configured" ? "API key configurada" : "Verificar OPENAI_API_KEY", desc: "Geração de conteúdo IA" },
                  { name: "WhatsApp", icon: MessageSquare, status: data.services.whatsapp.status, detail: data.services.whatsapp.status === "configured" ? "Número configurado" : "Verificar WA_PHONE", desc: "Canal de atendimento" },
                ].map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <div key={svc.name} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint-50)]">
                            <Icon className="h-5 w-5 text-[var(--brand)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text)]">{svc.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{svc.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusDot(svc.status)}`} />
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(svc.status)}`}>{statusLabel(svc.status)}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[var(--text-muted)]">{svc.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEB VITALS */}
          {activeTab === "vitals" && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-[var(--brand)]">Core Web Vitals</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Médias de {data.webVitals.samples} amostras nas últimas {range}.
                  {data.webVitals.samples === 0 && " Sem dados coletados neste período."}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { key: "lcp" as const, label: "LCP", fullName: "Largest Contentful Paint", value: data.webVitals.lcp, unit: "ms", good: "< 2.5s", avg: "2.5–4s", poor: "> 4s", desc: "Tempo até o maior elemento visível ser renderizado." },
                  { key: "inp" as const, label: "INP", fullName: "Interaction to Next Paint", value: data.webVitals.inp, unit: "ms", good: "< 200ms", avg: "200–500ms", poor: "> 500ms", desc: "Latência de resposta a interações do usuário." },
                  { key: "cls" as const, label: "CLS", fullName: "Cumulative Layout Shift", value: data.webVitals.cls, unit: "", good: "< 0.1", avg: "0.1–0.25", poor: "> 0.25", desc: "Estabilidade visual durante o carregamento." },
                ].map((v) => {
                  const st = vitalStatus(v.key, v.value);
                  return (
                    <div key={v.key} className="rounded-xl border border-[var(--brand-tint-100)] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand)]">{v.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${vitalCls(st)}`}>{vitalLabel(st)}</span>
                      </div>
                      <p className="mt-3 text-4xl font-bold text-[var(--brand)]">{v.value}{v.unit}</p>
                      <p className="mt-0.5 text-sm text-[var(--text-muted)]">{v.fullName}</p>
                      <p className="mt-3 text-xs text-[var(--text-muted)]">{v.desc}</p>
                      <div className="mt-4 space-y-1 border-t border-[var(--brand-tint-50)] pt-3">
                        {[{ label: "Bom", value: v.good, cls: "text-[var(--brand)]" }, { label: "Atenção", value: v.avg, cls: "text-yellow-600" }, { label: "Ruim", value: v.poor, cls: "text-red-600" }].map((t) => (
                          <div key={t.label} className="flex items-center justify-between text-xs">
                            <span className={`font-medium ${t.cls}`}>{t.label}</span>
                            <span className="text-[var(--text-muted)]">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {data.webVitals.samples === 0 && (
                <div className="rounded-xl border border-dashed border-yellow-200 bg-yellow-50 p-5 text-center">
                  <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                  <p className="text-sm font-medium text-yellow-800">Sem dados de Web Vitals neste período</p>
                  <p className="mt-1 text-xs text-yellow-600">
                    Coletados automaticamente em produção. Em dev, use{" "}
                    <code className="rounded bg-yellow-100 px-1">NEXT_PUBLIC_FORCE_ANALYTICS=1</code>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ERRORS */}
          {activeTab === "errors" && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-[var(--brand)]">Erros Recentes — {data.recentErrors.length} eventos</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Taxa: <span className={data.metrics.errorRate > 1 ? "font-semibold text-red-600" : "font-semibold text-[var(--brand)]"}>{data.metrics.errorRate}%</span> nas últimas {range}.
                </p>
              </div>
              {Object.keys(data.errorByPath).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Por página</p>
                  <div className="space-y-1.5">
                    {Object.entries(data.errorByPath).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, count]) => (
                      <div key={path} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-2">
                        <ChevronRight className="h-3 w-3 shrink-0 text-red-400" />
                        <code className="flex-1 truncate text-xs font-mono text-[var(--text)]">{path}</code>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.recentErrors.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] p-6 text-sm text-[var(--brand)]">
                  <CheckCircle2 className="h-5 w-5 text-[var(--brand)]" />
                  Nenhum erro registrado neste período.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-red-100 bg-white p-4 transition hover:border-red-200">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="rounded bg-red-50 px-2 py-0.5 text-xs font-mono text-red-800">{err.path}</code>
                          <span className="text-xs text-[var(--text-muted)]">{fmtDate(err.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text)]">{err.message || "(sem mensagem)"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
