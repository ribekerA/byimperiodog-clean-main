"use client";

import { ExternalLink, Loader2, MousePointerClick, Search, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminFetch";

type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
type PageRow  = { page:  string; clicks: number; impressions: number; ctr: number; position: number };

type GscData = {
  ok: boolean;
  error?: string;
  message?: string;
  topQueries: QueryRow[];
  topPages:   PageRow[];
  totals:     { clicks: number; impressions: number; ctr: number; position: number };
  dateRange:  { start: string; end: string };
};

const DAYS_OPTIONS = [
  { label: "7 dias",  value: 7  },
  { label: "28 dias", value: 28 },
  { label: "90 dias", value: 90 },
];

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

function posColor(pos: number) {
  if (pos <= 3)  return "text-[var(--brand)]";
  if (pos <= 10) return "text-amber-600";
  return "text-zinc-400";
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-[var(--brand-tint-50)] p-2 text-[var(--brand)]">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
        <p className="text-xl font-bold tabular-nums text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}

export default function GscPanel() {
  const [days,    setDays]    = useState(28);
  const [data,    setData]    = useState<GscData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"queries" | "pages">("queries");

  async function load(d: number) {
    setLoading(true);
    try {
      const res  = await adminFetch(`/api/admin/seo/gsc?days=${d}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setData({ ok: false, error: String(e), topQueries: [], topPages: [], totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 }, dateRange: { start: "", end: "" } });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(days); }, [days]);

  function handleDays(d: number) { setDays(d); }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
        <p className="text-sm text-[var(--text-muted)]">Carregando dados do Google Search Console...</p>
      </div>
    );
  }

  if (!data?.ok) {
    const isNotConfigured = data?.error === "GSC_NOT_CONFIGURED";
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-amber-900">
          {isNotConfigured ? "Google Search Console não configurado" : "Erro ao carregar GSC"}
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          {data?.message || data?.error || "Erro desconhecido."}
        </p>
        {isNotConfigured && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-xs text-zinc-700 space-y-2">
            <p className="font-semibold">Como configurar:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Crie um projeto no Google Cloud Console</li>
              <li>Ative a API Search Console</li>
              <li>Crie uma conta de serviço e baixe a chave JSON</li>
              <li>Adicione o e-mail da conta de serviço no GSC como proprietário ou usuário</li>
              <li>Defina <code className="rounded bg-zinc-100 px-1">GOOGLE_SERVICE_ACCOUNT_KEY</code> no .env.local (JSON em string)</li>
              <li>Defina <code className="rounded bg-zinc-100 px-1">GOOGLE_SEARCH_CONSOLE_SITE_URL</code> com a URL verificada no GSC</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  const { totals, topQueries, topPages, dateRange } = data;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
            <Search className="h-4 w-4 text-[var(--brand)]" />
            Google Search Console
          </h2>
          {dateRange.start && (
            <p className="text-xs text-[var(--text-muted)]">
              {new Date(dateRange.start).toLocaleDateString("pt-BR")} → {new Date(dateRange.end).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {DAYS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => handleDays(o.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${days === o.value ? "bg-[var(--brand)] text-white" : "border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<MousePointerClick className="h-4 w-4" />} label="Cliques" value={fmt(totals.clicks)} />
        <KpiCard icon={<Search className="h-4 w-4" />} label="Impressões" value={fmt(totals.impressions)} />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="CTR médio" value={`${totals.ctr}%`} />
        <KpiCard icon={<ExternalLink className="h-4 w-4" />} label="Posição média" value={totals.position > 0 ? `#${totals.position}` : "—"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(["queries", "pages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold transition ${tab === t ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
          >
            {t === "queries" ? "Top queries" : "Top páginas"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="min-w-full divide-y divide-[var(--border)] text-sm">
          <thead className="bg-[var(--surface)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">{tab === "queries" ? "Query" : "Página"}</th>
              <th className="px-4 py-2 text-right">Cliques</th>
              <th className="px-4 py-2 text-right">Impressões</th>
              <th className="px-4 py-2 text-right">CTR</th>
              <th className="px-4 py-2 text-right">Posição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {(tab === "queries" ? topQueries : topPages).map((row, i) => {
              const label = tab === "queries" ? (row as QueryRow).query : (row as PageRow).page;
              return (
                <tr key={i} className="hover:bg-[var(--surface)]">
                  <td className="px-4 py-2.5 font-medium text-[var(--text)] max-w-[260px] truncate" title={label}>
                    {tab === "pages" ? (
                      <a href={label} target="_blank" rel="noopener noreferrer" className="hover:underline text-[var(--brand)]">
                        {label}
                      </a>
                    ) : label}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--text)]">{fmt(row.clicks)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--text-muted)]">{fmt(row.impressions)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--text-muted)]">{row.ctr}%</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${posColor(row.position)}`}>
                    #{row.position}
                  </td>
                </tr>
              );
            })}
            {(tab === "queries" ? topQueries : topPages).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                  Nenhum dado disponível para o período selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
