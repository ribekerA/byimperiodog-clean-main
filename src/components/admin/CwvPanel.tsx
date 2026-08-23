"use client";

import { AlertTriangle, CheckCircle, Loader2, XCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type MetricSummary = {
  good: number; needs: number; poor: number;
  p75: number | null; p50: number | null; samples: number;
};

type TrendPoint = { date: string; LCP?: number | null; INP?: number | null; CLS?: number | null; FCP?: number | null; TTFB?: number | null };
type SlowPage   = { page: string; lcpP75: number | null; samples: number };

type CwvData = {
  ok: boolean;
  error?: string;
  summary: Record<string, MetricSummary>;
  trend: TrendPoint[];
  slowPages: SlowPage[];
  totalSamples: number;
  days: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const METRICS: { key: "LCP" | "INP" | "CLS" | "FCP" | "TTFB"; label: string; unit: string; good: number; poor: number; isScaled?: boolean; tip: string }[] = [
  { key: "LCP",  label: "Largest Contentful Paint", unit: "ms",  good: 2500,  poor: 4000,  tip: "Velocidade de carregamento do maior elemento visível. Meta: < 2.5s" },
  { key: "INP",  label: "Interaction to Next Paint", unit: "ms",  good: 200,   poor: 500,   tip: "Responsividade a interações do usuário. Meta: < 200ms" },
  { key: "CLS",  label: "Cumulative Layout Shift",   unit: "",    good: 100,   poor: 250,   isScaled: true, tip: "Estabilidade visual durante carregamento. Meta: < 0.10" },
  { key: "FCP",  label: "First Contentful Paint",    unit: "ms",  good: 1800,  poor: 3000,  tip: "Tempo até o primeiro conteúdo aparecer. Meta: < 1.8s" },
  { key: "TTFB", label: "Time to First Byte",        unit: "ms",  good: 800,   poor: 1800,  tip: "Velocidade de resposta do servidor. Meta: < 800ms" },
];

const RECS: Record<string, string[]> = {
  LCP:  ["Optimize cover images com next/image priority", "Adicionar fetchPriority='high' na imagem hero", "Reduzir JavaScript bloqueante acima da dobra"],
  INP:  ["Quebrar tarefas longas com setTimeout ou scheduler.yield", "Evitar handlers síncronos pesados em eventos de clique", "Usar Suspense para carregar componentes interativos"],
  CLS:  ["Definir width/height explícito em todas as imagens", "Reservar espaço para elementos dinâmicos (anúncios, banners)", "Evitar injetar conteúdo acima do viewport após carregamento"],
  FCP:  ["Reduzir CSS crítico inline", "Evitar fonts bloqueantes (usar font-display: swap)", "Usar preconnect para recursos de terceiros"],
  TTFB: ["Habilitar cache em rotas estáticas (stale-while-revalidate)", "Usar CDN edge para assets", "Otimizar queries Supabase lentas com índices"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeRating(key: string, p75: number | null): "good" | "needs" | "poor" | null {
  if (p75 === null) return null;
  const m = METRICS.find((x) => x.key === key);
  if (!m) return null;
  if (p75 <= m.good) return "good";
  if (p75 <= m.poor) return "needs";
  return "poor";
}

function formatValue(key: string, val: number | null, isScaled?: boolean): string {
  if (val === null) return "—";
  if (isScaled) return (val / 1000).toFixed(3);
  return val >= 1000 ? `${(val / 1000).toFixed(2)}s` : `${val}ms`;
}

function RatingIcon({ r }: { r: "good" | "needs" | "poor" | null }) {
  if (r === "good")  return <CheckCircle  className="h-4 w-4 text-[var(--brand)]" />;
  if (r === "needs") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (r === "poor")  return <XCircle      className="h-4 w-4 text-rose-600" />;
  return null;
}

function badgeCls(r: "good" | "needs" | "poor" | null) {
  if (r === "good")  return "border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] text-[var(--brand)]";
  if (r === "needs") return "border-amber-200 bg-amber-50 text-amber-700";
  if (r === "poor")  return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-400";
}

function cardBorder(r: "good" | "needs" | "poor" | null) {
  if (r === "good")  return "border-[var(--brand-tint-200)]";
  if (r === "needs") return "border-amber-200";
  if (r === "poor")  return "border-rose-300";
  return "border-[var(--border)]";
}

function DistBar({ good, needs, poor }: { good: number; needs: number; poor: number }) {
  const total = good + needs + poor || 1;
  const gPct = Math.round((good  / total) * 100);
  const nPct = Math.round((needs / total) * 100);
  const pPct = 100 - gPct - nPct;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      {gPct > 0 && <div className="bg-[var(--brand)]" style={{ width: `${gPct}%` }} />}
      {nPct > 0 && <div className="bg-amber-400"   style={{ width: `${nPct}%` }} />}
      {pPct > 0 && <div className="bg-rose-500"    style={{ width: `${pPct}%` }} />}
    </div>
  );
}

// Mini sparkline using SVG — no chart library needed
function Sparkline({ data, metricKey }: { data: TrendPoint[]; metricKey: string }) {
  const vals = data.map((d) => (d as Record<string, unknown>)[metricKey] as number | null).filter((v) => v !== null) as number[];
  if (vals.length < 2) return <div className="h-8 text-xs text-zinc-300">sem dados</div>;
  const min = Math.min(...vals);
  const max = Math.max(...vals) || 1;
  const w = 120; const h = 32;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" points={pts} className="text-[var(--brand)]" />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const DAYS_OPTS = [{ label: "7d", v: 7 }, { label: "14d", v: 14 }, { label: "30d", v: 30 }];

export default function CwvPanel() {
  const [days,    setDays]    = useState(7);
  const [data,    setData]    = useState<CwvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"visao-geral" | "tendencia" | "paginas" | "recomendacoes">("visao-geral");

  async function load(d: number) {
    setLoading(true);
    try {
      const r = await adminFetch(`/api/rum?days=${d}`);
      setData(await r.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(days); }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
        <span className="text-sm text-[var(--text-muted)]">Carregando Core Web Vitals...</span>
      </div>
    );
  }

  if (!data?.ok || data.error === "no_table") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <p className="text-sm font-semibold text-amber-900">Tabela <code>rum_vitals</code> não encontrada.</p>
        <p className="text-xs text-amber-800">Execute este SQL no Supabase para ativar a coleta de Core Web Vitals:</p>
        <pre className="rounded-lg border border-amber-200 bg-white p-3 text-[11px] overflow-x-auto text-zinc-700 leading-relaxed">{`create table if not exists rum_vitals (
  id         uuid primary key default gen_random_uuid(),
  metric     text not null,
  value      integer not null,
  rating     text,
  metric_id  text,
  page       text,
  created_at timestamptz default now()
);
create index if not exists rum_vitals_idx
  on rum_vitals(metric, created_at);`}</pre>
        <p className="text-xs text-amber-700">Após criar a tabela, os dados começam a chegar automaticamente dos visitantes reais.</p>
      </div>
    );
  }

  const { summary, trend, slowPages, totalSamples } = data;

  // Score geral: % de métricas "boas"
  const metricRatings = METRICS.map((m) => computeRating(m.key, summary[m.key]?.p75 ?? null));
  const goodCount = metricRatings.filter((r) => r === "good").length;
  const overallScore = Math.round((goodCount / METRICS.length) * 100);
  const overallColor = overallScore >= 80 ? "text-[var(--brand)]" : overallScore >= 50 ? "text-amber-600" : "text-rose-600";

  const problemMetrics = METRICS.filter((m) => {
    const r = computeRating(m.key, summary[m.key]?.p75 ?? null);
    return r === "needs" || r === "poor";
  });

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
              <Zap className="h-4 w-4 text-[var(--brand)]" />
              Core Web Vitals
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {totalSamples.toLocaleString("pt-BR")} amostras · p75 de usuários reais
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-bold ${overallColor} border-current`}>
            {overallScore}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {DAYS_OPTS.map((o) => (
              <button key={o.v} onClick={() => { setDays(o.v); load(o.v); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${days === o.v ? "bg-[var(--brand)] text-white" : "border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(["visao-geral", "tendencia", "paginas", "recomendacoes"] as const).map((t) => {
          const labels: Record<string, string> = { "visao-geral": "Visão geral", tendencia: "Tendência", paginas: "Páginas lentas", recomendacoes: "Recomendações" };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-semibold transition ${tab === t ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Visão geral ───────────────────────────────────────────────── */}
      {tab === "visao-geral" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {METRICS.map((m) => {
            const s = summary[m.key] ?? { good: 0, needs: 0, poor: 0, p75: null, p50: null, samples: 0 };
            const r = computeRating(m.key, s.p75);
            const total = s.good + s.needs + s.poor;
            const gPct  = total > 0 ? Math.round((s.good / total) * 100) : 0;
            return (
              <div key={m.key} className={`rounded-xl border-2 bg-white p-4 shadow-sm ${cardBorder(r)}`} title={m.tip}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[var(--text-muted)]">{m.key}</span>
                  <RatingIcon r={r} />
                </div>
                <p className="text-2xl font-bold tabular-nums text-[var(--text)]">
                  {formatValue(m.key, s.p75, m.isScaled)}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.label}</p>

                {total > 0 && (
                  <>
                    <div className="mt-2">
                      <DistBar good={s.good} needs={s.needs} poor={s.poor} />
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {gPct}% bom · {s.samples} amostras
                    </p>
                  </>
                )}

                <div className="mt-2 flex gap-1 flex-wrap">
                  {s.good  > 0 && <span className="rounded-full bg-[var(--brand-tint-50)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--brand)]">{s.good} bom</span>}
                  {s.needs > 0 && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">{s.needs} melhorar</span>}
                  {s.poor  > 0 && <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">{s.poor} ruim</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tendência ─────────────────────────────────────────────────── */}
      {tab === "tendencia" && (
        <div className="rounded-xl border border-[var(--border)] bg-white p-5">
          {trend.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sem dados de tendência ainda.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-muted)]">P75 diário por métrica (últimos {days} dias)</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {METRICS.map((m) => {
                  const lastVal = trend.length > 0 ? (trend[trend.length - 1] as Record<string, unknown>)[m.key] as number | null : null;
                  const r = computeRating(m.key, lastVal);
                  return (
                    <div key={m.key} className={`rounded-xl border p-3 ${badgeCls(r)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold">{m.key}</span>
                        <span className="text-xs">{formatValue(m.key, lastVal, m.isScaled)}</span>
                      </div>
                      <Sparkline data={trend} metricKey={m.key} />
                      <div className="mt-1 flex justify-between text-[9px] opacity-60">
                        <span>{trend[0]?.date.slice(5)}</span>
                        <span>{trend[trend.length - 1]?.date.slice(5)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Páginas lentas ────────────────────────────────────────────── */}
      {tab === "paginas" && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {slowPages.length === 0 ? (
            <p className="p-6 text-sm text-[var(--text-muted)]">Sem dados suficientes por página ainda (mín. 3 amostras por página).</p>
          ) : (
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 text-left">Página</th>
                  <th className="px-4 py-2 text-right">LCP p75</th>
                  <th className="px-4 py-2 text-right">Rating</th>
                  <th className="px-4 py-2 text-right">Amostras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {slowPages.map((p, i) => {
                  const r = computeRating("LCP", p.lcpP75);
                  return (
                    <tr key={i} className="hover:bg-[var(--surface)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--text)] max-w-[280px] truncate">
                        <a href={p.page} target="_blank" rel="noopener noreferrer" className="hover:underline text-[var(--brand)]">
                          {p.page}
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-[var(--text)]">
                        {formatValue("LCP", p.lcpP75)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeCls(r)}`}>
                          {r === "good" ? "Bom" : r === "needs" ? "Melhorar" : r === "poor" ? "Ruim" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-[var(--text-muted)]">{p.samples}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Recomendações ─────────────────────────────────────────────── */}
      {tab === "recomendacoes" && (
        <div className="space-y-3">
          {problemMetrics.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] p-4">
              <CheckCircle className="h-5 w-5 text-[var(--brand)] flex-shrink-0" />
              <p className="text-sm font-semibold text-[var(--brand)]">Todas as métricas estão com rating "Bom". Excelente performance!</p>
            </div>
          ) : (
            problemMetrics.map((m) => {
              const r = computeRating(m.key, summary[m.key]?.p75 ?? null);
              return (
                <div key={m.key} className={`rounded-xl border p-4 ${badgeCls(r)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <RatingIcon r={r} />
                    <span className="text-sm font-semibold">{m.key} — {m.label}</span>
                    <span className="ml-auto text-sm font-bold">
                      {formatValue(m.key, summary[m.key]?.p75 ?? null, m.isScaled)}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mb-2">{m.tip}</p>
                  <ul className="space-y-1">
                    {RECS[m.key]?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="mt-0.5 flex-shrink-0">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}

          {/* Thresholds de referência */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold text-[var(--text)] mb-2">Thresholds Google (valores p75)</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-[var(--text-muted)]">
                    <th className="text-left py-1 pr-4">Métrica</th>
                    <th className="text-right pr-4 text-[var(--brand)]">Bom</th>
                    <th className="text-right pr-4 text-amber-600">Melhorar</th>
                    <th className="text-right text-rose-600">Ruim</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((m) => (
                    <tr key={m.key} className="border-t border-[var(--border)]">
                      <td className="py-1 pr-4 font-semibold">{m.key}</td>
                      <td className="pr-4 text-right text-[var(--brand)]">≤ {formatValue(m.key, m.good, m.isScaled)}</td>
                      <td className="pr-4 text-right text-amber-600">≤ {formatValue(m.key, m.poor, m.isScaled)}</td>
                      <td className="text-right text-rose-600">{`> ${formatValue(m.key, m.poor, m.isScaled)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
