"use client";

import dynamic from "next/dynamic";

const CwvPanelLazy = dynamic(() => import("@/components/admin/CwvPanel"), { ssr: false });
const GscPanelLazy = dynamic(() => import("@/components/admin/GscPanel"), { ssr: false });

import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "dashboard" | "audit" | "autopilot" | "sitemap" | "redirects" | "robots" | "cwv" | "gsc";

type AuditIssue = {
  type: "error" | "warning";
  page: string;
  issue: string;
  priority: "Alta" | "Média" | "Baixa";
  fix?: string;
};

type SeoMetrics = { score: number; indexed: number; errors: number; warnings: number };

type RedirectItem = { from_path: string; to_url: string; code: number; active: boolean; hits?: number };

type AutopilotResult = {
  issues: Array<{
    severity: string;
    kind: string;
    page: { slug: string; label: string; type: string };
    message: string;
    suggestion?: string;
  }>;
  keywordOpportunities: string[];
  pagesRankedByInterest: Array<{ slug: string; label: string; hits: number }>;
  generatedMeta: Array<{ slug: string; title: string; description: string; kind: string }>;
  suggestedPosts: Array<{ title: string; description: string; keywords: string[] }>;
  actions: string[];
  manualRecommendations: string[];
};

type ScorePoint = { score: number; errors: number; warnings: number; date: string };

type SitemapData = {
  total: number;
  posts: number;
  puppies: number;
  statics: number;
  urls: Array<{ loc: string; priority: string; changefreq: string }>;
  sitemapUrl: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-600";
  if (s >= 50) return "text-yellow-600";
  return "text-red-600";
}

function scoreBg(s: number) {
  if (s >= 75) return "border-emerald-200 bg-emerald-50";
  if (s >= 50) return "border-yellow-200 bg-yellow-50";
  return "border-red-200 bg-red-50";
}

function barColor(s: number) {
  if (s >= 75) return "bg-emerald-400";
  if (s >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

function priorityCls(p: string) {
  if (p === "Alta") return "bg-red-100 text-red-700";
  if (p === "Média") return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

function severityDot(s: string) {
  if (s === "high") return "bg-red-500";
  if (s === "medium") return "bg-yellow-500";
  return "bg-blue-400";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SeoHub() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // shared metrics
  const [metrics, setMetrics] = useState<SeoMetrics>({ score: 0, indexed: 0, errors: 0, warnings: 0 });

  // dashboard
  const [scoreHistory, setScoreHistory] = useState<ScorePoint[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // audit
  const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);

  // autopilot
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [applyingAutopilot, setApplyingAutopilot] = useState(false);
  const [autopilotApplied, setAutopilotApplied] = useState(false);

  // sitemap
  const [sitemapData, setSitemapData] = useState<SitemapData | null>(null);
  const [loadingSitemap, setLoadingSitemap] = useState(false);
  const [pingingGoogle, setPingingGoogle] = useState(false);
  const [pingDone, setPingDone] = useState(false);

  // redirects
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loadingRedirects, setLoadingRedirects] = useState(false);
  const [showAddRedirect, setShowAddRedirect] = useState(false);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newCode, setNewCode] = useState<301 | 302>(301);
  const [savingRedirect, setSavingRedirect] = useState(false);
  const [deletingRedirect, setDeletingRedirect] = useState<string | null>(null);

  // robots
  const [robotsTxt, setRobotsTxt] = useState("");
  const [loadingRobots, setLoadingRobots] = useState(false);
  const [savingRobots, setSavingRobots] = useState(false);
  const [robotsSaved, setRobotsSaved] = useState(false);

  // ─── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "audit" && !auditLoaded) runAudit();
    if (activeTab === "sitemap" && !sitemapData) loadSitemap();
    if (activeTab === "redirects" && redirects.length === 0) loadRedirects();
    if (activeTab === "robots" && !robotsTxt) loadRobots();
  }, [activeTab]);

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async function loadDashboard() {
    setLoadingDashboard(true);
    try {
      const [auditRes, historyRes] = await Promise.all([
        fetch("/api/admin/seo/audit", { cache: "no-store" }),
        fetch("/api/admin/seo/score-history", { cache: "no-store" }),
      ]);
      const aj = await auditRes.json();
      const hj = await historyRes.json();
      setMetrics(aj.metrics ?? { score: 0, indexed: 0, errors: 0, warnings: 0 });
      setAuditIssues(Array.isArray(aj.issues) ? aj.issues : []);
      setAuditLoaded(true);
      setScoreHistory(Array.isArray(hj.history) ? hj.history : []);
    } catch {}
    setLoadingDashboard(false);
  }

  // ─── Audit ─────────────────────────────────────────────────────────────────
  async function runAudit() {
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/admin/seo/audit", { cache: "no-store" });
      const j = await res.json();
      setMetrics(j.metrics ?? { score: 0, indexed: 0, errors: 0, warnings: 0 });
      setAuditIssues(Array.isArray(j.issues) ? j.issues : []);
      setAuditLoaded(true);
    } catch {}
    setLoadingAudit(false);
  }

  // ─── Autopilot ─────────────────────────────────────────────────────────────
  async function runAutopilot() {
    setRunningAutopilot(true);
    setAutopilotResult(null);
    setAutopilotApplied(false);
    try {
      const res = await fetch("/api/admin/seo/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: false }),
      });
      const j = await res.json();
      setAutopilotResult(j.result ?? null);
    } catch {}
    setRunningAutopilot(false);
  }

  async function applyAutopilot() {
    setApplyingAutopilot(true);
    try {
      await fetch("/api/admin/seo/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: true }),
      });
      setAutopilotApplied(true);
      setAutopilotResult(null);
      await loadDashboard();
    } catch {}
    setApplyingAutopilot(false);
  }

  // ─── Sitemap ───────────────────────────────────────────────────────────────
  async function loadSitemap() {
    setLoadingSitemap(true);
    try {
      const res = await fetch("/api/admin/seo/sitemap", { cache: "no-store" });
      setSitemapData(await res.json());
    } catch {}
    setLoadingSitemap(false);
  }

  async function pingGoogle() {
    setPingingGoogle(true);
    try {
      await fetch("/api/admin/seo/sitemap", { method: "POST" });
      setPingDone(true);
      setTimeout(() => setPingDone(false), 3000);
    } catch {}
    setPingingGoogle(false);
  }

  // ─── Redirects ─────────────────────────────────────────────────────────────
  async function loadRedirects() {
    setLoadingRedirects(true);
    try {
      const res = await fetch("/api/admin/seo/redirects", { cache: "no-store" });
      const j = await res.json();
      setRedirects(
        ((j.items || []) as Record<string, unknown>[]).map((r) => ({
          from_path: r.from_path as string,
          to_url: r.to_url as string,
          code: (r.code as number) || 301,
          active: r.active !== false,
          hits: (r.hits as number) || 0,
        })),
      );
    } catch {}
    setLoadingRedirects(false);
  }

  async function createRedirect() {
    if (!newFrom || !newTo) return;
    setSavingRedirect(true);
    try {
      const res = await fetch("/api/admin/seo/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_path: newFrom, to_url: newTo, code: newCode }),
      });
      const j = await res.json();
      if (j.item) {
        setRedirects((prev) => [
          { from_path: j.item.from_path, to_url: j.item.to_url, code: j.item.code, active: true, hits: 0 },
          ...prev,
        ]);
        setNewFrom("");
        setNewTo("");
        setNewCode(301);
        setShowAddRedirect(false);
      }
    } catch {}
    setSavingRedirect(false);
  }

  async function deleteRedirect(from_path: string) {
    setDeletingRedirect(from_path);
    try {
      await fetch(`/api/admin/seo/redirects?from=${encodeURIComponent(from_path)}`, { method: "DELETE" });
      setRedirects((prev) => prev.filter((r) => r.from_path !== from_path));
    } catch {}
    setDeletingRedirect(null);
  }

  // ─── Robots ────────────────────────────────────────────────────────────────
  async function loadRobots() {
    setLoadingRobots(true);
    try {
      const res = await fetch("/api/admin/seo/robots", { cache: "no-store" });
      const j = await res.json();
      setRobotsTxt(j.robotsTxt || "");
    } catch {}
    setLoadingRobots(false);
  }

  async function saveRobots() {
    setSavingRobots(true);
    try {
      await fetch("/api/admin/seo/robots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robotsTxt }),
      });
      setRobotsSaved(true);
      setTimeout(() => setRobotsSaved(false), 2500);
    } catch {}
    setSavingRobots(false);
  }

  // ─── Tabs config ───────────────────────────────────────────────────────────
  const TABS: Array<{ id: TabId; label: string; icon: React.ElementType; badge?: number }> = [
    { id: "dashboard",  label: "Dashboard",    icon: LayoutDashboard },
    { id: "audit",      label: "Auditoria",    icon: Search, badge: metrics.errors || undefined },
    { id: "autopilot",  label: "Autopilot",    icon: Zap },
    { id: "cwv",        label: "Web Vitals",   icon: TrendingUp },
    { id: "gsc",        label: "Search Console", icon: Globe },
    { id: "sitemap",    label: "Sitemap",      icon: FileText },
    { id: "redirects",  label: "Redirects",    icon: ArrowRight },
    { id: "robots",     label: "Robots.txt",   icon: Bot },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!mounted) return null;
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">SEO Hub</h1>
          <p className="mt-1 text-sm text-emerald-600">
            Auditoria · Autopilot · Sitemap · Robots · Redirects
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loadingDashboard}
          className="flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
        >
          {loadingDashboard ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`rounded-2xl border p-6 shadow-sm ${scoreBg(metrics.score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">SEO Score</p>
              <p className={`mt-1 text-4xl font-bold ${scoreColor(metrics.score)}`}>
                {metrics.score}
                <span className="text-base font-normal text-emerald-500">/100</span>
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Páginas Indexadas</p>
              <p className="mt-1 text-4xl font-bold text-emerald-900">{metrics.indexed}</p>
            </div>
            <Search className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Erros Críticos</p>
              <p className="mt-1 text-4xl font-bold text-red-900">{metrics.errors}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-yellow-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Avisos</p>
              <p className="mt-1 text-4xl font-bold text-yellow-900">{metrics.warnings}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
        {/* Tab nav */}
        <div className="border-b border-emerald-100">
          <nav className="flex gap-0.5 overflow-x-auto px-4" aria-label="Tabs">
            {TABS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${
                  activeTab === id
                    ? "border-emerald-600 text-emerald-900"
                    : "border-transparent text-emerald-500 hover:border-emerald-300 hover:text-emerald-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* ════════════════ DASHBOARD ════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-7">
              {/* Score trend */}
              {scoreHistory.length > 1 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                    Evolução do Score — últimas {Math.min(14, scoreHistory.length)} auditorias
                  </h3>
                  <div className="flex h-14 items-end gap-1">
                    {scoreHistory.slice(-14).map((pt, i) => (
                      <div
                        key={i}
                        className="group relative flex-1"
                        title={`${pt.score}/100 — ${new Date(pt.date).toLocaleDateString("pt-BR")}`}
                      >
                        <div
                          className={`w-full rounded-t transition-all ${barColor(pt.score)}`}
                          style={{ height: `${Math.max(6, (pt.score / 100) * 56)}px` }}
                        />
                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-emerald-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {pt.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Quick actions */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">Ações Rápidas</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTab("autopilot");
                      runAutopilot();
                    }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Zap className="h-4 w-4" />
                    Rodar Autopilot
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("audit");
                      setAuditLoaded(false);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Nova Auditoria
                  </button>
                  <button
                    onClick={() => setActiveTab("sitemap")}
                    className="flex items-center gap-2 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    <FileText className="h-4 w-4" />
                    Ver Sitemap
                  </button>
                  <button
                    onClick={() => setActiveTab("redirects")}
                    className="flex items-center gap-2 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Redirects
                  </button>
                </div>
              </section>

              {/* Priority issues preview */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-emerald-700">Problemas Prioritários</h3>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                  >
                    Ver todos ({auditIssues.length}) <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {loadingDashboard ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-emerald-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : auditIssues.filter((i) => i.priority === "Alta").length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Nenhum erro crítico — bom trabalho!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditIssues
                      .filter((i) => i.priority === "Alta")
                      .slice(0, 5)
                      .map((issue, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <div className="min-w-0 flex-1">
                            <code className="block truncate text-xs font-mono text-emerald-800">
                              {issue.page}
                            </code>
                            <p className="mt-0.5 text-sm text-emerald-900">{issue.issue}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ════════════════ AUDITORIA ════════════════ */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-900">Auditoria de SEO</h3>
                <button
                  onClick={() => {
                    setAuditLoaded(false);
                    runAudit();
                  }}
                  disabled={loadingAudit}
                  className="flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                >
                  {loadingAudit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Re-auditar
                </button>
              </div>

              {auditIssues.length > 0 && !loadingAudit && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
                    {auditIssues.filter((i) => i.type === "error").length} erros
                  </span>
                  <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-700">
                    {auditIssues.filter((i) => i.type === "warning").length} avisos
                  </span>
                  <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-600">
                    {auditIssues.filter((i) => i.priority === "Alta").length} alta prioridade
                  </span>
                  <span className="rounded-full bg-yellow-50 px-3 py-1 font-medium text-yellow-600">
                    {auditIssues.filter((i) => i.priority === "Média").length} média prioridade
                  </span>
                </div>
              )}

              {loadingAudit ? (
                <div className="flex items-center gap-2 py-6 text-sm text-emerald-700">
                  <Loader2 className="h-5 w-5 animate-spin" /> Analisando {metrics.indexed} páginas...
                </div>
              ) : auditIssues.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Ótimo! Nenhum problema de SEO encontrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {[...auditIssues]
                    .sort((a, b) => {
                      const w = { Alta: 0, Média: 1, Baixa: 2 } as const;
                      return w[a.priority as keyof typeof w] - w[b.priority as keyof typeof w];
                    })
                    .map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                      >
                        <AlertCircle
                          className={`mt-0.5 h-5 w-5 shrink-0 ${
                            issue.type === "error" ? "text-red-500" : "text-yellow-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="max-w-xs truncate rounded bg-emerald-100 px-2 py-0.5 text-xs font-mono text-emerald-900">
                              {issue.page}
                            </code>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityCls(issue.priority)}`}>
                              {issue.priority}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                issue.type === "error"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {issue.type === "error" ? "Erro" : "Aviso"}
                            </span>
                          </div>
                          <p className="text-sm text-emerald-900">{issue.issue}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ AUTOPILOT ════════════════ */}
          {activeTab === "autopilot" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">SEO Autopilot</h3>
                  <p className="mt-1 text-sm text-emerald-600">
                    Analisa posts, filhotes e leads para gerar títulos, metas, FAQs e JSON-LD
                    automaticamente.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={runAutopilot}
                    disabled={runningAutopilot || applyingAutopilot}
                    className="flex items-center gap-2 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {runningAutopilot ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Analisar
                  </button>
                  {autopilotResult && (
                    <button
                      onClick={applyAutopilot}
                      disabled={applyingAutopilot || runningAutopilot}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {applyingAutopilot ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      Aplicar Tudo
                    </button>
                  )}
                </div>
              </div>

              {autopilotApplied && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Autopilot aplicado com sucesso — títulos, metas e FAQs atualizados.
                </div>
              )}

              {!autopilotResult && !runningAutopilot && !autopilotApplied && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-12 text-center">
                  <Zap className="h-10 w-10 text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-700">
                    Clique em <strong>Analisar</strong> para rodar o Autopilot SEO.
                  </p>
                  <p className="text-xs text-emerald-500">
                    Analisa posts, filhotes e leads em tempo real. Não aplica nada sem confirmação.
                  </p>
                </div>
              )}

              {runningAutopilot && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-emerald-700">Analisando conteúdo e dados de leads...</p>
                </div>
              )}

              {autopilotResult && !runningAutopilot && (
                <div className="space-y-6">
                  {/* Issues */}
                  {autopilotResult.issues.length > 0 && (
                    <section>
                      <h4 className="mb-3 text-sm font-semibold text-emerald-800">
                        Problemas Detectados ({autopilotResult.issues.length})
                      </h4>
                      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                        {autopilotResult.issues.slice(0, 25).map((issue, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-white p-3 text-sm"
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot(issue.severity)}`}
                            />
                            <div className="min-w-0">
                              <code className="text-xs font-mono text-emerald-600">{issue.page.slug}</code>
                              <p className="text-emerald-900">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="mt-0.5 text-xs text-emerald-500">{issue.suggestion}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {autopilotResult.issues.length > 25 && (
                          <p className="pl-1 text-xs text-emerald-400">
                            +{autopilotResult.issues.length - 25} mais problemas...
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Keyword opportunities */}
                  {autopilotResult.keywordOpportunities.length > 0 && (
                    <section>
                      <h4 className="mb-3 text-sm font-semibold text-emerald-800">
                        Keywords por Demanda de Leads
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {autopilotResult.keywordOpportunities.map((kw, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Generated meta */}
                  {autopilotResult.generatedMeta.length > 0 && (
                    <section>
                      <h4 className="mb-3 text-sm font-semibold text-emerald-800">
                        Títulos e Metas Geradas ({autopilotResult.generatedMeta.length})
                      </h4>
                      <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                        {autopilotResult.generatedMeta.slice(0, 12).map((meta, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-emerald-100 bg-white p-3 text-sm"
                          >
                            <code className="text-xs font-mono text-emerald-500">
                              {meta.kind === "blog" ? "/blog/" : "/filhotes/"}
                              {meta.slug}
                            </code>
                            <p className="mt-1 font-medium text-emerald-900">{meta.title}</p>
                            <p className="mt-0.5 text-xs text-emerald-600 line-clamp-2">
                              {meta.description}
                            </p>
                          </div>
                        ))}
                        {autopilotResult.generatedMeta.length > 12 && (
                          <p className="pl-1 text-xs text-emerald-400">
                            +{autopilotResult.generatedMeta.length - 12} mais...
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Suggested posts */}
                  {autopilotResult.suggestedPosts.length > 0 && (
                    <section>
                      <h4 className="mb-3 text-sm font-semibold text-emerald-800">
                        Posts Sugeridos por Oportunidade de Keyword
                      </h4>
                      <div className="space-y-2">
                        {autopilotResult.suggestedPosts.map((post, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4"
                          >
                            <p className="text-sm font-semibold text-emerald-900">{post.title}</p>
                            <p className="mt-1 text-xs text-emerald-600">{post.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {post.keywords.map((kw, j) => (
                                <span
                                  key={j}
                                  className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Pages by interest */}
                  {autopilotResult.pagesRankedByInterest.length > 0 && (
                    <section>
                      <h4 className="mb-3 text-sm font-semibold text-emerald-800">
                        Páginas com Mais Interesse de Leads
                      </h4>
                      <div className="space-y-1">
                        {autopilotResult.pagesRankedByInterest.slice(0, 8).map((pg, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-lg border border-emerald-50 px-4 py-2"
                          >
                            <span className="w-5 text-right text-xs font-bold text-emerald-400">
                              #{i + 1}
                            </span>
                            <code className="flex-1 truncate text-xs font-mono text-emerald-800">
                              {pg.slug}
                            </code>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              {pg.hits} leads
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Actions */}
                  {autopilotResult.actions.length > 0 && (
                    <section>
                      <h4 className="mb-3 text-sm font-semibold text-emerald-800">
                        Ações Recomendadas
                      </h4>
                      <ul className="space-y-1.5">
                        {autopilotResult.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Manual recommendations */}
                  {autopilotResult.manualRecommendations.length > 0 && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-yellow-800">
                        Revisão Manual Necessária
                      </h4>
                      <ul className="space-y-1">
                        {autopilotResult.manualRecommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ SITEMAP ════════════════ */}
          {activeTab === "sitemap" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-emerald-900">Sitemap XML</h3>
                <div className="flex gap-2">
                  <button
                    onClick={loadSitemap}
                    disabled={loadingSitemap}
                    className="flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {loadingSitemap ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Atualizar
                  </button>
                  <button
                    onClick={pingGoogle}
                    disabled={pingingGoogle || pingDone}
                    className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                      pingDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    } disabled:opacity-50`}
                  >
                    {pingingGoogle ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : pingDone ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                    {pingDone ? "Enviado!" : "Notificar Google"}
                  </button>
                </div>
              </div>

              {loadingSitemap ? (
                <div className="flex items-center gap-2 py-6 text-sm text-emerald-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : sitemapData ? (
                <>
                  {/* Sitemap URL bar */}
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <FileText className="h-5 w-5 shrink-0 text-emerald-600" />
                    <code className="flex-1 text-sm text-emerald-900">{sitemapData.sitemapUrl}</code>
                    <a
                      href={sitemapData.sitemapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 transition hover:text-emerald-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Total de URLs", value: sitemapData.total },
                      { label: "Posts do Blog", value: sitemapData.posts },
                      { label: "Filhotes", value: sitemapData.puppies },
                      { label: "Páginas Estáticas", value: sitemapData.statics },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-emerald-100 bg-white p-4 text-center shadow-sm"
                      >
                        <p className="text-2xl font-bold text-emerald-900">{s.value}</p>
                        <p className="mt-1 text-xs text-emerald-600">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* URL preview */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-emerald-700">
                      Preview de URLs (primeiras {Math.min(20, sitemapData.urls.length)})
                    </h4>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-emerald-100">
                      {sitemapData.urls.slice(0, 20).map((url, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 border-b border-emerald-50 px-4 py-2 last:border-0 hover:bg-emerald-50/50"
                        >
                          <span className="w-8 text-right text-xs text-emerald-400">{url.priority}</span>
                          <code className="flex-1 truncate text-xs font-mono text-emerald-900">
                            {url.loc}
                          </code>
                          <span className="text-xs text-emerald-400">{url.changefreq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-sm text-emerald-600">
                  Não foi possível carregar o sitemap.
                </div>
              )}
            </div>
          )}

          {/* ════════════════ REDIRECTS ════════════════ */}
          {activeTab === "redirects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-900">
                  Redirects ({redirects.length})
                </h3>
                <button
                  onClick={() => setShowAddRedirect((v) => !v)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {showAddRedirect ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showAddRedirect ? "Cancelar" : "Novo Redirect"}
                </button>
              </div>

              {/* Add form */}
              {showAddRedirect && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <h4 className="mb-4 text-sm font-semibold text-emerald-800">Novo Redirect</h4>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-emerald-700">
                        De (path)
                      </label>
                      <input
                        type="text"
                        placeholder="/pagina-antiga"
                        value={newFrom}
                        onChange={(e) => setNewFrom(e.target.value)}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-emerald-700">
                        Para (URL ou path)
                      </label>
                      <input
                        type="text"
                        placeholder="/pagina-nova"
                        value={newTo}
                        onChange={(e) => setNewTo(e.target.value)}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-emerald-700">Tipo</label>
                      <select
                        value={newCode}
                        onChange={(e) => setNewCode(Number(e.target.value) as 301 | 302)}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                      >
                        <option value={301}>301 — Permanente</option>
                        <option value={302}>302 — Temporário</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={createRedirect}
                      disabled={savingRedirect || !newFrom || !newTo}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingRedirect ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Salvar Redirect
                    </button>
                  </div>
                </div>
              )}

              {loadingRedirects ? (
                <div className="flex items-center gap-2 py-6 text-sm text-emerald-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : redirects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-emerald-200 p-8 text-center text-sm text-emerald-500">
                  Nenhum redirect configurado.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-emerald-100">
                  <table className="w-full text-sm">
                    <thead className="border-b border-emerald-100 bg-emerald-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">De</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">Para</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">
                          Hits
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {redirects.map((r, i) => (
                        <tr
                          key={i}
                          className="border-b border-emerald-50 last:border-0 hover:bg-emerald-50/40"
                        >
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono text-emerald-900">{r.from_path}</code>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono text-emerald-600">{r.to_url}</code>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                r.code === 301
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {r.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-emerald-500">
                            {r.hits ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteRedirect(r.from_path)}
                              disabled={deletingRedirect === r.from_path}
                              className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              {deletingRedirect === r.from_path ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ WEB VITALS ════════════════ */}
          {activeTab === "cwv" && (
            <div className="space-y-4">
              <CwvPanelLazy />
            </div>
          )}

          {/* ════════════════ SEARCH CONSOLE ════════════════ */}
          {activeTab === "gsc" && (
            <div className="space-y-4">
              <GscPanelLazy />
            </div>
          )}

          {/* ════════════════ ROBOTS.TXT ════════════════ */}
          {activeTab === "robots" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-900">Robots.txt</h3>
                {robotsSaved && (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <Check className="h-4 w-4" /> Salvo com sucesso!
                  </span>
                )}
              </div>
              {loadingRobots ? (
                <div className="flex items-center gap-2 py-6 text-sm text-emerald-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <>
                  <textarea
                    className="min-h-[320px] w-full rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 font-mono text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                    value={robotsTxt}
                    onChange={(e) => setRobotsTxt(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-emerald-500">
                      Inclua{" "}
                      <code className="rounded bg-emerald-100 px-1 text-emerald-800">
                        Sitemap: https://byimperiodog.com.br/sitemap.xml
                      </code>
                    </p>
                    <button
                      disabled={savingRobots}
                      onClick={saveRobots}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {savingRobots ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {savingRobots ? "Salvando…" : "Salvar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
