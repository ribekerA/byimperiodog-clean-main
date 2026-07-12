import type { Metadata } from "next";

import { platformLabel } from "@/lib/attribution";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Relatórios | Admin",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

// ─── Tipos ────────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string;
  created_at: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  page?: string | null;
  page_slug?: string | null;
};

type PlatformStat = {
  source: string;
  label: string;
  leads: number;
  last_lead?: string;
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchStats(): Promise<{
  byPlatform: PlatformStat[];
  total: number;
  totalThisMonth: number;
  topPages: { page: string; count: number }[];
  recentLeads: LeadRow[];
}> {
  try {
    const sb = supabaseAdmin();

    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const { data: leads } = await sb
      .from("leads")
      .select("id,created_at,utm_source,utm_medium,utm_campaign,page,page_slug")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000);

    if (!leads) {
      return { byPlatform: [], total: 0, totalThisMonth: 0, topPages: [], recentLeads: [] };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const totalThisMonth = leads.filter((l: LeadRow) => l.created_at >= startOfMonth).length;

    // Agrupa por utm_source
    const counts: Record<string, { leads: number; last_lead: string }> = {};
    for (const lead of leads) {
      const src = (lead.utm_source ?? "direto").toLowerCase();
      if (!counts[src]) counts[src] = { leads: 0, last_lead: lead.created_at };
      counts[src].leads += 1;
      if (lead.created_at > counts[src].last_lead) {
        counts[src].last_lead = lead.created_at;
      }
    }

    const byPlatform: PlatformStat[] = Object.entries(counts)
      .map(([source, { leads: count, last_lead }]) => ({
        source,
        label: platformLabel(source),
        leads: count,
        last_lead,
      }))
      .sort((a, b) => b.leads - a.leads);

    // Top páginas de entrada
    const pageCounts: Record<string, number> = {};
    for (const lead of leads) {
      const page = lead.page ?? lead.page_slug ?? "(desconhecida)";
      pageCounts[page] = (pageCounts[page] ?? 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      byPlatform,
      total: leads.length,
      totalThisMonth,
      topPages,
      recentLeads: leads.slice(0, 15),
    };
  } catch {
    return { byPlatform: [], total: 0, totalThisMonth: 0, topPages: [], recentLeads: [] };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function pct(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

const UTM_GUIDE = [
  { label: "Instagram",          url: "?utm_source=instagram&utm_medium=social&utm_campaign=organico" },
  { label: "Facebook",           url: "?utm_source=facebook&utm_medium=social&utm_campaign=organico" },
  { label: "Pinterest",          url: "?utm_source=pinterest&utm_medium=social&utm_campaign=organico" },
  { label: "TikTok",             url: "?utm_source=tiktok&utm_medium=social&utm_campaign=organico" },
  { label: "YouTube",            url: "?utm_source=youtube&utm_medium=video&utm_campaign=organico" },
  { label: "Tumblr",             url: "?utm_source=tumblr&utm_medium=social&utm_campaign=organico" },
  { label: "Threads",            url: "?utm_source=threads&utm_medium=social&utm_campaign=organico" },
  { label: "X (Twitter)",        url: "?utm_source=x&utm_medium=social&utm_campaign=organico" },
  { label: "Kwai",               url: "?utm_source=kwai&utm_medium=video&utm_campaign=organico" },
  { label: "VSCO",               url: "?utm_source=vsco&utm_medium=social&utm_campaign=organico" },
  { label: "Google Meu Negócio", url: "?utm_source=googlebusiness&utm_medium=organic&utm_campaign=local" },
  { label: "WhatsApp Status",    url: "?utm_source=whatsappstatus&utm_medium=social&utm_campaign=organico" },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default async function RelatoriosPage() {
  const { byPlatform, total, totalThisMonth, topPages, recentLeads } = await fetchStats();

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Relatórios por Plataforma</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Leads captados via formulário nos últimos 12 meses, agrupados por{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono">utm_source</code>.
          Cliques em WhatsApp aparecem no GA4 como evento{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono">lead_whatsapp</code>.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">Leads (12 meses)</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{total}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">Este mês</p>
          <p className="mt-1 text-3xl font-bold text-[var(--brand)]">{totalThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">Plataformas ativas</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{byPlatform.length}</p>
        </div>
      </div>

      {/* Leads por plataforma */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Leads por Plataforma</h2>
        {byPlatform.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-muted)]">
            Nenhum lead com UTM registrado ainda. Use os parâmetros UTM do guia abaixo nos seus links.
          </p>
        ) : (
          <div className="overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <caption className="sr-only">Leads por plataforma</caption>
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Plataforma</th>
                  <th scope="col" className="px-4 py-3 text-right">Leads</th>
                  <th scope="col" className="px-4 py-3 text-right">% do total</th>
                  <th scope="col" className="px-4 py-3 text-left">Último lead</th>
                  <th scope="col" className="px-4 py-3 text-left font-mono">utm_source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {byPlatform.map((row) => (
                  <tr key={row.source} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{row.label}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--brand)]">{row.leads}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{pct(row.leads, total)}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(row.last_lead)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top páginas que geram leads */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Páginas que Geram Mais Leads</h2>
        <div className="overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Páginas que geram mais leads</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Página</th>
                <th scope="col" className="px-4 py-3 text-right">Leads</th>
                <th scope="col" className="px-4 py-3 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {topPages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center text-zinc-400">Nenhum dado</td>
                </tr>
              ) : (
                topPages.map((row) => (
                  <tr key={row.page} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{row.page}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--brand)]">{row.count}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{pct(row.count, total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leads recentes */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Leads Recentes</h2>
        <div className="overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Leads recentes</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Data</th>
                <th scope="col" className="px-4 py-3 text-left">Plataforma</th>
                <th scope="col" className="px-4 py-3 text-left">Campanha</th>
                <th scope="col" className="px-4 py-3 text-left">Página</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-zinc-400">Nenhum lead registrado ainda.</td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(lead.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">
                      {platformLabel(lead.utm_source)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {lead.utm_campaign ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {lead.page ?? lead.page_slug ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Guia de UTMs */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-[var(--text)]">Guia de UTMs por Plataforma</h2>
        <p className="mb-3 text-sm text-[var(--text-muted)]">
          Cole esses sufixos ao final da URL do site em todos os links publicados nas redes sociais.
          Exemplo:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono">
            https://byimperiodog.com.br/filhotes?utm_source=instagram&utm_medium=social&utm_campaign=organico
          </code>
        </p>
        <div className="overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Guia de sufixos UTM por plataforma</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Plataforma</th>
                <th scope="col" className="px-4 py-3 text-left">Sufixo UTM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {UTM_GUIDE.map((g) => (
                <tr key={g.label} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{g.label}</td>
                  <td className="select-all px-4 py-3 font-mono text-xs text-zinc-500">{g.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Para diferenciar stories de reels de feed: adicione{" "}
          <code className="font-mono">&utm_content=feed</code>,{" "}
          <code className="font-mono">&utm_content=stories</code> ou{" "}
          <code className="font-mono">&utm_content=reels</code>.
        </p>
      </section>
    </div>
  );
}
