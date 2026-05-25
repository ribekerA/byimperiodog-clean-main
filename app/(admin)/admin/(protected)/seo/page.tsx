"use client";

import { Search, FileText, Bot, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type RedirectItem = { id?: string; from_path: string; to_url: string; code?: number; hits?: number };

export default function SeoHub() {
  const [activeTab, setActiveTab] = useState<"audit" | "sitemap" | "robots" | "redirects">("audit");
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loadingRedirects, setLoadingRedirects] = useState(false);
  const [robotsTxt, setRobotsTxt] = useState<string>("");
  const [loadingRobots, setLoadingRobots] = useState(false);
  const [savingRobots, setSavingRobots] = useState(false);
  const [seoMetrics, setSeoMetrics] = useState({ score: 0, indexed: 0, errors: 0, warnings: 0 });
  const [auditIssues, setAuditIssues] = useState<Array<{ type: "error" | "warning"; page: string; issue: string; priority: string }>>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (activeTab !== "audit") return;
    const run = async () => {
      setLoadingAudit(true);
      try {
        const res = await fetch("/api/admin/seo/audit", { cache: "no-store" });
        const json = await res.json();
        setSeoMetrics(json.metrics || { score: 0, indexed: 0, errors: 0, warnings: 0 });
        setAuditIssues(Array.isArray(json.issues) ? json.issues : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAudit(false);
      }
    };
    run();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "redirects") return;
    const load = async () => {
      setLoadingRedirects(true);
      try {
        const res = await fetch("/api/admin/seo/redirects", { cache: "no-store" });
        const json = await res.json();
        const items = json.items || [];
        type Raw = Record<string, unknown>;
        const mapped: RedirectItem[] = (items as Raw[]).map((r) => ({
          from_path: (r["from_path"] as string) || (r["from"] as string),
          to_url: (r["to_url"] as string) || (r["to"] as string),
          code: (r["code"] as number) || (r["status"] as number) || 301,
          hits: (r["hits"] as number) || 0,
        }));
        setRedirects(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRedirects(false);
      }
    };
    load();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "robots") return;
    const loadRobots = async () => {
      setLoadingRobots(true);
      try {
        const res = await fetch("/api/admin/seo/robots", { cache: "no-store" });
        const json = await res.json();
        setRobotsTxt(json.robotsTxt || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRobots(false);
      }
    };
    loadRobots();
  }, [activeTab]);

  const createRedirect = async () => {
    const from = prompt("De (ex.: /old-page)")?.trim();
    if (!from) return;
    const to = prompt("Para (URL ou path ex.: /new-page)")?.trim();
    if (!to) return;
    const code = Number(prompt("Status (301 ou 302)") || 301);
    try {
      const res = await fetch("/api/admin/seo/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_path: from, to_url: to, code }),
      });
      const json = await res.json();
      const r = json.item;
      if (r) setRedirects((prev) => [{ id: r.id, from_path: r.from_path, to_url: r.to_url, code: r.code, hits: r.hits || 0 }, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">SEO Hub</h1>
        <p className="mt-1 text-sm text-emerald-700">
          Auditoria, Sitemaps, Robots e Gerenciamento de Redirects
        </p>
      </header>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">SEO Score</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{seoMetrics.score}/100</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Páginas Indexadas</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{seoMetrics.indexed}</p>
            </div>
            <Search className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Erros Críticos</p>
              <p className="mt-2 text-3xl font-bold text-red-900">{seoMetrics.errors}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-yellow-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Avisos</p>
              <p className="mt-2 text-3xl font-bold text-yellow-900">{seoMetrics.warnings}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100">
          <nav className="flex gap-4 px-6" aria-label="Tabs">
            {[
              { id: "audit", label: "Auditoria", icon: Search },
              { id: "sitemap", label: "Sitemap", icon: FileText },
              { id: "robots", label: "Robots.txt", icon: Bot },
              { id: "redirects", label: "Redirects", icon: ArrowRight },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "audit" | "sitemap" | "robots" | "redirects")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-900"
                      : "border-transparent text-emerald-600 hover:border-emerald-300 hover:text-emerald-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-900">Problemas Encontrados</h3>
              {loadingAudit ? (
                <div className="p-4 text-sm text-emerald-700">Carregando…</div>
              ) : (
                <div className="space-y-2">
                  {auditIssues.length === 0 ? (
                    <div className="p-4 text-sm text-emerald-700">Sem problemas no momento.</div>
                  ) : (
                    auditIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
                      >
                        {issue.type === "error" ? (
                          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-mono text-emerald-900">
                              {issue.page}
                            </code>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                issue.priority === "Alta"
                                  ? "bg-red-100 text-red-700"
                                  : issue.priority === "Média"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {issue.priority}
                            </span>
                          </div>
                          <p className="text-sm text-emerald-900">{issue.issue}</p>
                        </div>
                        <button className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-emerald-700">
                          Corrigir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "sitemap" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-900">Sitemap XML</h3>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <code className="text-sm text-emerald-900">
                  https://byimperiodog.com.br/sitemap.xml
                </code>
              </div>
              <div className="flex gap-3">
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Regenerar Sitemap
                </button>
                <button className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50">
                  Submeter ao Google
                </button>
              </div>
            </div>
          )}

          {activeTab === "robots" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-900">Robots.txt</h3>
              {loadingRobots ? (
                <div className="p-4 text-sm text-emerald-700">Carregando…</div>
              ) : (
                <>
                  <textarea
                    className="min-h-[300px] w-full rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 font-mono text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={robotsTxt}
                    onChange={(e) => setRobotsTxt(e.target.value)}
                  />
                  <button
                    disabled={savingRobots}
                    onClick={async () => {
                      setSavingRobots(true);
                      try {
                        await fetch("/api/admin/seo/robots", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ robotsTxt }),
                        });
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setSavingRobots(false);
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingRobots ? "Salvando…" : "Salvar Alterações"}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "redirects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-900">Redirects (301/302)</h3>
                <button onClick={createRedirect} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Novo Redirect
                </button>
              </div>
              <div className="space-y-2">
                {loadingRedirects ? (
                  <div className="p-4 text-sm text-emerald-700">Carregando…</div>
                ) : redirects.length === 0 ? (
                  <div className="p-4 text-sm text-emerald-700">Nenhum redirect</div>
                ) : (
                  redirects.map((redirect, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-lg border border-emerald-100 bg-white p-4"
                  >
                    <code className="flex-1 text-sm font-mono text-emerald-900">{redirect.from_path}</code>
                    <ArrowRight className="h-4 w-4 text-emerald-600" />
                    <code className="flex-1 text-sm font-mono text-emerald-900">{redirect.to_url}</code>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {redirect.code}
                    </span>
                    <span className="text-sm text-emerald-600">{redirect.hits ?? 0} hits</span>
                  </div>
                ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
