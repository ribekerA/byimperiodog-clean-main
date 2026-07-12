import Link from "next/link";
import { BookOpen, Bot, Calendar, Clock, MessageSquare, TrendingUp } from "lucide-react";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import GscPanel from "@/components/admin/GscPanel";
import ReindexEmbeddingsButton from "@/components/admin/ReindexEmbeddingsButton";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type AnalyticsApiResponse = {
  total_published: number;
  posts_last_30d: number;
  comments_last_30d: number;
  avg_read_time_min: number | null;
  top_posts_by_comments: { slug: string; title: string; comments: number }[];
  recent_posts: { slug: string; title: string; published_at: string | null }[];
};

type PostSeoRow = {
  id: string;
  slug: string;
  title: string | null;
  status: string | null;
  seo_score: number | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string | null;
};

async function fetchAnalyticsApi(): Promise<AnalyticsApiResponse> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const res = await fetch(`${base}/api/admin/blog/analytics`, { cache: "no-store" });
    if (!res.ok) throw new Error("api fail");
    return res.json();
  } catch {
    return { total_published: 0, posts_last_30d: 0, comments_last_30d: 0, avg_read_time_min: null, top_posts_by_comments: [], recent_posts: [] };
  }
}

async function fetchPostsSeo(): Promise<PostSeoRow[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("blog_posts")
      .select("id,slug,title,status,seo_score,seo_title,seo_description,published_at,created_at")
      .order("published_at", { ascending: false })
      .limit(100);
    return (data ?? []) as PostSeoRow[];
  } catch {
    return [];
  }
}

function scoreColor(score: number | null) {
  if (score === null) return "text-zinc-400";
  if (score >= 80) return "text-[var(--brand)]";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

function scoreBg(score: number | null) {
  if (score === null) return "bg-zinc-100 text-zinc-400";
  if (score >= 80) return "bg-[var(--brand-tint-50)] text-[var(--brand)]";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-[var(--brand-tint-50)] p-2 text-[var(--brand)]">{icon}</div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
      </div>
    </div>
  );
}

export default async function BlogAnalyticsPage() {
  const [api, posts] = await Promise.all([fetchAnalyticsApi(), fetchPostsSeo()]);

  const byStatus = posts.reduce<Record<string, number>>((acc, p) => {
    const s = p.status ?? "draft";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const noSeoTitle = posts.filter((p) => p.status === "published" && (!p.seo_title || p.seo_title.length < 20)).length;
  const noSeoDesc = posts.filter((p) => p.status === "published" && (!p.seo_description || p.seo_description.length < 40)).length;
  const avgSeoScore = (() => {
    const scored = posts.filter((p) => typeof p.seo_score === "number");
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, p) => s + (p.seo_score ?? 0), 0) / scored.length);
  })();

  const byMonth = posts
    .filter((p) => p.published_at)
    .reduce<Record<string, number>>((acc, p) => {
      const key = (p.published_at as string).slice(0, 7);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  const monthKeys = Object.keys(byMonth).sort().slice(-6);

  const topBySeo = [...posts]
    .filter((p) => p.status === "published" && typeof p.seo_score === "number")
    .sort((a, b) => (b.seo_score ?? 0) - (a.seo_score ?? 0))
    .slice(0, 10);

  const recentDrafts = posts
    .filter((p) => p.status === "draft" || p.status === "review")
    .slice(0, 5);

  return (
    <div className="space-y-6 px-4 py-6 max-w-6xl mx-auto">
      <BlogSubnav />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Analytics do Blog</h1>
          <p className="text-sm text-[var(--text-muted)]">Performance, SEO e produção de conteúdo para tráfego orgânico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReindexEmbeddingsButton />
          <Link
            href="/admin/blog/autopilot"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
          >
            <Bot className="h-4 w-4" /> Autopilot IA
          </Link>
          <Link
            href="/admin/blog/editor/wizard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:bg-[var(--surface)]"
          >
            Criar com wizard →
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Publicados" value={api.total_published} sub="total no ar" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Últimos 30d" value={api.posts_last_30d} sub="posts publicados" />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Comentários" value={api.comments_last_30d} sub="últimos 30 dias" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Leitura média" value={api.avg_read_time_min ? `${api.avg_read_time_min} min` : "—"} sub="tempo estimado" />
      </section>

      {/* Status + SEO health */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--text)]">Posts por status</h2>
          <div className="mt-3 space-y-2">
            {[
              { key: "published", label: "Publicados", color: "bg-[var(--brand)]" },
              { key: "scheduled", label: "Agendados", color: "bg-blue-400" },
              { key: "draft", label: "Rascunhos", color: "bg-zinc-300" },
              { key: "review", label: "Em revisão", color: "bg-amber-400" },
              { key: "archived", label: "Arquivados", color: "bg-zinc-200" },
            ].map(({ key, label, color }) => {
              const count = byStatus[key] ?? 0;
              const total = posts.length || 1;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-[var(--text-muted)]">{label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 h-2">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-[var(--text)]">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEO Health */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--text)]">Saúde SEO</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[var(--surface)] p-3">
              <p className={`text-3xl font-bold ${scoreColor(avgSeoScore)}`}>{avgSeoScore ?? "—"}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Score médio</p>
            </div>
            <div className={`rounded-xl p-3 ${noSeoTitle > 0 ? "bg-rose-50" : "bg-[var(--brand-tint-50)]"}`}>
              <p className={`text-3xl font-bold ${noSeoTitle > 0 ? "text-rose-600" : "text-[var(--brand)]"}`}>{noSeoTitle}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Sem title SEO</p>
            </div>
            <div className={`rounded-xl p-3 ${noSeoDesc > 0 ? "bg-amber-50" : "bg-[var(--brand-tint-50)]"}`}>
              <p className={`text-3xl font-bold ${noSeoDesc > 0 ? "text-amber-600" : "text-[var(--brand)]"}`}>{noSeoDesc}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Sem description</p>
            </div>
          </div>
          {(noSeoTitle > 0 || noSeoDesc > 0) && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Posts publicados sem SEO completo perdem ranqueamento. Use o{" "}
              <Link href="/admin/blog/autopilot" className="font-semibold underline">Autopilot IA</Link> para corrigir automaticamente.
            </div>
          )}
        </section>
      </div>

      {/* Produção mensal */}
      {monthKeys.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
            <h2 className="text-base font-semibold text-[var(--text)]">Produção mensal (últimos 6 meses)</h2>
          </div>
          <div className="flex items-end gap-3 h-24">
            {monthKeys.map((key) => {
              const count = byMonth[key] ?? 0;
              const max = Math.max(...monthKeys.map((k) => byMonth[k] ?? 0), 1);
              const pct = Math.round((count / max) * 100);
              const [year, month] = key.split("-");
              const label = new Date(Number(year), Number(month) - 1).toLocaleString("pt-BR", { month: "short" });
              return (
                <div key={key} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-bold text-[var(--text)]">{count}</span>
                  <div className="w-full rounded-t-md bg-[var(--brand)]" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[10px] text-[var(--text-muted)] capitalize">{label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top posts por SEO score */}
      {topBySeo.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Top posts — Score SEO</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 text-left">Post</th>
                  <th className="px-4 py-2 text-right">Score SEO</th>
                  <th className="px-4 py-2 text-right">Publicado</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {topBySeo.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--surface)]">
                    <td className="px-4 py-2 font-medium text-[var(--text)]">{p.title ?? p.slug}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${scoreBg(p.seo_score)}`}>
                        {p.seo_score ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-[var(--text-muted)]">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/admin/blog/editor?slug=${p.slug}`} className="text-[11px] font-semibold text-[var(--brand)] hover:underline">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top posts por comentários */}
      {api.top_posts_by_comments.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Top posts — Comentários</h2>
          <ol className="space-y-2">
            {api.top_posts_by_comments.map((p, i) => (
              <li key={p.slug} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint-100)] text-[11px] font-bold text-[var(--brand)]">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-[var(--text)] truncate">{p.title}</span>
                <span className="text-xs font-bold text-[var(--text-muted)]">{p.comments} comentários</span>
                <Link href={`/blog/${p.slug}`} target="_blank" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">
                  Ver →
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Google Search Console */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <GscPanel />
      </section>

      {/* Rascunhos pendentes */}
      {recentDrafts.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-amber-900">Rascunhos pendentes de publicação</h2>
          <ul className="space-y-2">
            {recentDrafts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-amber-800">{p.title ?? p.slug}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                    {p.status}
                  </span>
                  <Link href={`/admin/blog/editor?id=${p.id}`} className="text-[11px] font-semibold text-[var(--brand)] hover:underline">
                    Continuar →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
