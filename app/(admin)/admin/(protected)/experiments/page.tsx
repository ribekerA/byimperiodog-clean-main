"use client";

import { Beaker, Play, Pause, TrendingUp, Target, CheckCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type ExperimentStatus = "draft" | "running" | "paused" | "completed";

interface Variant {
  key: string;
  label: string;
  weight: number;
}

interface Experiment {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  status: ExperimentStatus;
  variants: Variant[];
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface VariantMetrics {
  variant: string;
  views: number;
  conversions: number;
  conversionRate: number;
}

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [metricsMap, setMetricsMap] = useState<Record<string, VariantMetrics[]>>({});

  async function loadMetrics(key: string) {
    try {
      const res = await fetch(`/api/admin/experiments/metrics?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (Array.isArray(json.metrics)) {
        setMetricsMap((prev) => ({ ...prev, [key]: json.metrics }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    async function loadExperiments() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/experiments?limit=50", { cache: "no-store" });
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        setExperiments(items);
        // Carregar métricas para cada experimento
        for (const exp of items) {
          loadMetrics(exp.key);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExperiments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createExperiment() {
    const name = prompt("Nome do experimento:");
    if (!name) return;
    const key = prompt("Chave única (ex.: hero-test-2025):");
    if (!key) return;
    const variantALabel = prompt("Nome da variante A:") || "Control";
    const variantBLabel = prompt("Nome da variante B:") || "Variant B";

    try {
      const res = await fetch("/api/admin/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name,
          status: "draft",
          variants: [
            { key: "A", label: variantALabel, weight: 50 },
            { key: "B", label: variantBLabel, weight: 50 },
          ],
        }),
      });
      const json = await res.json();
      if (json.item) {
        setExperiments((prev) => [json.item, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleStatus(exp: Experiment) {
    const newStatus: ExperimentStatus = exp.status === "running" ? "paused" : "running";
    try {
      const res = await fetch("/api/admin/experiments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: exp.id, status: newStatus }),
      });
      const json = await res.json();
      if (json.item) {
        setExperiments((prev) => prev.map((e) => (e.id === exp.id ? json.item : e)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const runningCount = experiments.filter((e) => e.status === "running").length;
  const completedCount = experiments.filter((e) => e.status === "completed").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Experimentos A/B</h1>
          <p className="mt-1 text-sm text-emerald-700">
            Crie testes, monitore resultados e otimize conversões
          </p>
        </div>
        <button
          onClick={createExperiment}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Novo Experimento
        </button>
      </header>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Ativos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{runningCount}</p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Completos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{completedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Total</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{experiments.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Lista de Experimentos */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-4 text-sm text-emerald-700">Carregando experimentos…</div>
        ) : experiments.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-12 text-center shadow-sm">
            <Beaker className="mx-auto h-12 w-12 text-emerald-300" />
            <p className="mt-4 text-emerald-600">Nenhum experimento criado ainda.</p>
            <button
              onClick={createExperiment}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Experimento
            </button>
          </div>
        ) : (
          experiments.map((exp) => {
            const metrics = metricsMap[exp.key] || [];
            const variantA = exp.variants.find((v) => v.key === "A");
            const variantB = exp.variants.find((v) => v.key === "B");
            const metricsA = metrics.find((m) => m.variant === "A");
            const metricsB = metrics.find((m) => m.variant === "B");
            const winner =
              metricsA && metricsB && metricsA.conversionRate > metricsB.conversionRate ? "A" : "B";

            return (
              <div
                key={exp.id}
                className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-emerald-900">{exp.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          exp.status === "running"
                            ? "bg-green-100 text-green-700"
                            : exp.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : exp.status === "paused"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {exp.status === "running"
                          ? "Ativo"
                          : exp.status === "completed"
                          ? "Completo"
                          : exp.status === "paused"
                          ? "Pausado"
                          : "Rascunho"}
                      </span>
                      {exp.status === "running" && metricsA && metricsB && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          Líder: Variante {winner}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="mt-1 text-sm text-emerald-600">{exp.description}</p>
                    )}
                    <p className="mt-1 text-xs text-emerald-500">Chave: {exp.key}</p>
                  </div>
                  {exp.status !== "completed" && (
                    <button
                      onClick={() => toggleStatus(exp)}
                      className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
                    >
                      {exp.status === "running" ? (
                        <>
                          <Pause className="inline h-4 w-4" /> Pausar
                        </>
                      ) : (
                        <>
                          <Play className="inline h-4 w-4" /> Ativar
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Variante A */}
                  {variantA && (
                    <div
                      className={`rounded-xl border p-4 ${
                        winner === "A" && exp.status === "running"
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-emerald-100 bg-emerald-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-emerald-900">
                          Variante A: {variantA.label}
                        </h4>
                        {winner === "A" && exp.status === "running" && (
                          <Target className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      {metricsA ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-600">Conversões</span>
                            <span className="font-semibold text-emerald-900">
                              {metricsA.conversions}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-600">Visualizações</span>
                            <span className="font-semibold text-emerald-900">{metricsA.views}</span>
                          </div>
                          <div className="mt-3 rounded-lg bg-white p-2 text-center">
                            <span className="text-2xl font-bold text-emerald-900">
                              {metricsA.conversionRate.toFixed(2)}%
                            </span>
                            <p className="text-xs text-emerald-600">Taxa de Conversão</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-emerald-500">Sem dados ainda</p>
                      )}
                    </div>
                  )}

                  {/* Variante B */}
                  {variantB && (
                    <div
                      className={`rounded-xl border p-4 ${
                        winner === "B" && exp.status === "running"
                          ? "border-blue-400 bg-blue-50"
                          : "border-blue-100 bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-blue-900">
                          Variante B: {variantB.label}
                        </h4>
                        {winner === "B" && exp.status === "running" && (
                          <Target className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      {metricsB ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">Conversões</span>
                            <span className="font-semibold text-blue-900">
                              {metricsB.conversions}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">Visualizações</span>
                            <span className="font-semibold text-blue-900">{metricsB.views}</span>
                          </div>
                          <div className="mt-3 rounded-lg bg-white p-2 text-center">
                            <span className="text-2xl font-bold text-blue-900">
                              {metricsB.conversionRate.toFixed(2)}%
                            </span>
                            <p className="text-xs text-blue-600">Taxa de Conversão</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-blue-500">Sem dados ainda</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
