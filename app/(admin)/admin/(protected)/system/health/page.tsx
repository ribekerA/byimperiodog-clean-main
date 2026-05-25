"use client";

import { Activity, Zap, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function SystemHealth() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  const [uptime, setUptime] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [errorRate, setErrorRate] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [vitals, setVitals] = useState({ lcp: 0, inp: 0, cls: 0 });
  const [recentErrors, setRecentErrors] = useState<Array<{ message: string; created_at: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/system/health", { cache: "no-store" });
        const json = await res.json();
        setUptime(Math.round((Number(json.uptime || 0) / (24 * 60 * 60)) * 10000) / 100); // aprox % do dia
        setResponseTime(Math.round(Number(json.responseTimeMs || 0)));
        setErrorRate(Math.round(Number(json.errorRate || 0) * 100) / 100);
        setActiveUsers(Number(json.activeUsers || 0));
        setVitals({
          lcp: Math.round(Number(json.webVitals?.lcp || 0) * 10) / 10,
          inp: Math.round(Number(json.webVitals?.inp || 0) * 10) / 10,
          cls: Math.round(Number(json.webVitals?.cls || 0) * 1000) / 1000,
        });
        setRecentErrors(Array.isArray(json.recentErrors) ? json.recentErrors : []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-100";
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-100";
      case "poor":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  //

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Saúde do Sistema</h1>
          <p className="mt-1 text-sm text-emerald-700">
            Monitoramento de Core Web Vitals, uptime e logs de erro
          </p>
        </div>
        <div className="flex gap-2 rounded-lg border border-emerald-200 bg-white p-1">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                timeRange === range
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Uptime</p>
              <p className="mt-2 text-3xl font-bold text-green-900">{uptime}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Response Time</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">{responseTime}ms</p>
            </div>
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Error Rate</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{errorRate}%</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Active Users</p>
              <p className="mt-2 text-3xl font-bold text-purple-900">{activeUsers}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-emerald-900">Core Web Vitals</h2>
        <p className="mt-1 text-sm text-emerald-600">Métricas de performance do usuário</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              { key: "LCP", value: vitals.lcp, unit: "ms", status: vitals.lcp < 2500 ? "good" : vitals.lcp < 4000 ? "needs-improvement" : "poor", label: "Largest Contentful Paint" },
              { key: "INP", value: vitals.inp, unit: "ms", status: vitals.inp < 200 ? "good" : vitals.inp < 500 ? "needs-improvement" : "poor", label: "Interaction to Next Paint" },
              { key: "CLS", value: vitals.cls, unit: "", status: vitals.cls < 0.1 ? "good" : vitals.cls < 0.25 ? "needs-improvement" : "poor", label: "Cumulative Layout Shift" },
            ] as const
          ).map((v) => (
            <div key={v.key} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">{v.key}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(v.status)}`}>
                  {v.status === "good" ? "Bom" : v.status}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {v.value}
                {v.unit}
              </p>
              <p className="mt-1 text-xs text-emerald-600">{v.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Erros Recentes */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-emerald-900">Erros Recentes</h2>
          <button className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50">
            Ver Todos
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {recentErrors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
            >
              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-emerald-900">Erro</span>
                  <span className="text-xs text-emerald-600">{error.created_at}</span>
                </div>
                <p className="text-sm text-emerald-900">{error.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
