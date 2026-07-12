"use client";

import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { adminFetch } from "@/lib/adminFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type Issue = {
  severity: "low" | "medium" | "high";
  kind: string;
  page: { slug: string; label: string; type: string };
  message: string;
  suggestion?: string;
};

type SuggestedPost = {
  title: string;
  description: string;
  keywords: string[];
};

type AutopilotResult = {
  ok: boolean;
  issues: Issue[];
  keywordOpportunities: string[];
  suggestedPosts: SuggestedPost[];
  pagesRankedByInterest: { slug: string; label: string; hits: number }[];
  actions: string[];
  manualRecommendations: string[];
};

type GenItem = {
  topic: string;
  status: "pending" | "generating" | "done" | "error";
  warning?: string;
  postId?: string;
  postSlug?: string;
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_CLS: Record<string, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-zinc-300",
};

async function generatePost(topic: string, withImage: boolean): Promise<{ ok: boolean; postId?: string; postSlug?: string; error?: string; warning?: string }> {
  try {
    const res = await adminFetch("/api/admin/blog/ai/generate-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, scope: "guia-completo", status: "draft", generateImage: false }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? "Falha na geração" };

    const post = data.post ?? {};
    let coverUrl = "";
    let warning: string | undefined;

    if (withImage && post.id) {
      try {
        const prompt = `Foto profissional de Spitz Alemão Anão para artigo: ${topic}. Estilo editorial, fundo neutro.`;
        const ri = await adminFetch("/api/admin/blog/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, alt: post.title ?? topic }),
        });
        const ji = await ri.json();
        coverUrl = ji?.url ?? "";
      } catch {
        warning = "Imagem de capa não gerada — adicione manualmente antes de publicar.";
      }
    }

    if (coverUrl && post.id) {
      try {
        await adminFetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: post.id, cover_url: coverUrl, og_image_url: coverUrl }),
        });
      } catch {
        warning = "Imagem foi gerada mas não pôde ser salva no artigo — adicione manualmente.";
      }
    }

    return { ok: true, postId: post.id, postSlug: post.slug, warning };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutopilotPage() {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "generating" | "done">("idle");
  const [result, setResult] = useState<AutopilotResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [customTopic, setCustomTopic] = useState("");
  const [withImages, setWithImages] = useState(true);
  const [publishMode, setPublishMode] = useState<"draft" | "published">("draft");
  const [genItems, setGenItems] = useState<GenItem[]>([]);
  const [showIssues, setShowIssues] = useState(false);
  const [applyingFixes, setApplyingFixes] = useState(false);
  const [fixesApplied, setFixesApplied] = useState<number | null>(null);
  const [confirmApplyFixes, setConfirmApplyFixes] = useState(false);
  const [confirmGeneration, setConfirmGeneration] = useState(false);

  const isGenerating = useRef(false);

  async function analyze() {
    setPhase("loading");
    setError(null);
    setResult(null);
    setSelectedTopics(new Set());
    setGenItems([]);
    setFixesApplied(null);
    try {
      const res = await adminFetch("/api/admin/blog/autopilot");
      const data: AutopilotResult = await res.json();
      if (!data.ok) throw new Error("Falha na análise");
      setResult(data);
      setPhase("ready");
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
      setPhase("idle");
    }
  }

  useEffect(() => { analyze(); }, []);

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      return next;
    });
  }

  function addCustom() {
    const t = customTopic.trim();
    if (!t) return;
    setSelectedTopics((prev) => new Set(prev).add(t));
    setCustomTopic("");
  }

  async function startGeneration() {
    if (isGenerating.current) return;
    const topics = Array.from(selectedTopics);
    if (!topics.length) return;

    isGenerating.current = true;
    setPhase("generating");
    const items: GenItem[] = topics.map((topic) => ({ topic, status: "pending" }));
    setGenItems([...items]);

    for (let i = 0; i < items.length; i++) {
      setGenItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "generating" } : it));
      const r = await generatePost(items[i].topic, withImages);
      setGenItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? r.ok
              ? { ...it, status: "done", postId: r.postId, postSlug: r.postSlug, warning: r.warning }
              : { ...it, status: "error", error: r.error }
            : it
        )
      );
    }

    isGenerating.current = false;
    setPhase("done");
  }

  async function applyFixes() {
    setApplyingFixes(true);
    try {
      const res = await adminFetch("/api/admin/blog/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      });
      const data = await res.json();
      setFixesApplied(data.applied ?? 0);
    } catch {
      setFixesApplied(0);
    } finally {
      setApplyingFixes(false);
    }
  }

  const highIssues = result?.issues.filter((i) => i.severity === "high") ?? [];
  const allTopics = [
    ...(result?.suggestedPosts.map((p) => p.title) ?? []),
    ...(result?.keywordOpportunities.map((k) => `Guia completo: ${k}`) ?? []),
  ];
  const doneCount = genItems.filter((i) => i.status === "done").length;
  const errorCount = genItems.filter((i) => i.status === "error").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <BlogSubnav />

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text)]">
            <Bot className="h-6 w-6 text-[var(--brand)]" /> Autopilot IA — Blog
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Analisa oportunidades de tráfego, gera artigos completos com imagens e corrige SEO automaticamente.
          </p>
        </div>
        <button
          onClick={analyze}
          disabled={phase === "loading" || phase === "generating"}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:bg-[var(--surface)] disabled:opacity-40"
        >
          <RefreshCcw className={`h-4 w-4 ${phase === "loading" ? "animate-spin" : ""}`} />
          {phase === "loading" ? "Analisando..." : "Reanalisar"}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-8 justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
          <p className="text-sm text-[var(--text-muted)]">Analisando posts, filhotes e leads para encontrar oportunidades...</p>
        </div>
      )}

      {(phase === "ready" || phase === "generating" || phase === "done") && result && (
        <>
          {/* SEO Issues */}
          {highIssues.length > 0 && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
              <button
                onClick={() => setShowIssues((v) => !v)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-800">
                    {highIssues.length} problema{highIssues.length > 1 ? "s" : ""} crítico{highIssues.length > 1 ? "s" : ""} de SEO
                  </span>
                </div>
                {showIssues ? <ChevronUp className="h-4 w-4 text-rose-600" /> : <ChevronDown className="h-4 w-4 text-rose-600" />}
              </button>
              {showIssues && (
                <ul className="mt-3 space-y-2">
                  {highIssues.slice(0, 8).map((issue, i) => (
                    <li key={i} className={`rounded-lg border px-3 py-2 text-xs ${SEVERITY_CLS[issue.severity]}`}>
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[issue.severity]}`} />
                        <strong>{issue.page.label}</strong>
                      </div>
                      <p className="mt-0.5">{issue.message}</p>
                      {issue.suggestion && <p className="mt-0.5 opacity-70">{issue.suggestion}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => setConfirmApplyFixes(true)}
                  disabled={applyingFixes}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {applyingFixes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  {applyingFixes ? "Aplicando..." : "Corrigir SEO automaticamente"}
                </button>
                {fixesApplied !== null && (
                  <span className="text-xs font-semibold text-rose-700">
                    {fixesApplied} posts corrigidos ✓
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Keyword Opportunities */}
          {result.keywordOpportunities.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                <Sparkles className="h-4 w-4 text-[var(--brand)]" />
                Keywords com demanda de leads
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Termos que seus leads pesquisam — ainda sem conteúdo publicado suficiente.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.keywordOpportunities.map((kw) => {
                  const topic = `Guia completo: ${kw}`;
                  const selected = selectedTopics.has(topic);
                  return (
                    <button
                      key={kw}
                      onClick={() => toggleTopic(topic)}
                      aria-pressed={selected}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selected
                          ? "border-[var(--brand)] bg-[var(--brand-tint-50)] text-[var(--brand)]"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-[var(--brand)]"
                      }`}
                    >
                      {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {kw}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Suggested Posts */}
          {result.suggestedPosts.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[var(--text)]">Artigos sugeridos pela IA</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Tópicos gerados com base no interesse dos seus leads. Selecione os que deseja criar.
              </p>
              <div className="mt-3 space-y-2">
                {result.suggestedPosts.map((post) => {
                  const selected = selectedTopics.has(post.title);
                  return (
                    <button
                      key={post.title}
                      onClick={() => toggleTopic(post.title)}
                      aria-pressed={selected}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-[var(--brand)] bg-[var(--brand-tint-50)]"
                          : "border-zinc-200 bg-zinc-50 hover:border-[var(--brand)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">{post.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{post.description}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {post.keywords.map((k) => (
                              <span key={k} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">{k}</span>
                            ))}
                          </div>
                        </div>
                        <div className={`flex-shrink-0 rounded-full p-1 ${selected ? "bg-[var(--brand)] text-white" : "bg-zinc-200 text-zinc-400"}`}>
                          <Check className="h-3 w-3" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Custom topic input */}
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--text)]">Adicionar tópico personalizado</h2>
            <div className="mt-2 flex gap-2">
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="Ex.: Cuidados com Spitz filhote nos primeiros meses..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:border-[var(--brand)] focus:bg-white focus:outline-none"
              />
              <button
                onClick={addCustom}
                disabled={!customTopic.trim()}
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {selectedTopics.size > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from(selectedTopics).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-tint-300)] bg-[var(--brand-tint-50)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                    {t.length > 50 ? `${t.slice(0, 50)}…` : t}
                    <button onClick={() => toggleTopic(t)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Generation settings + trigger */}
          {selectedTopics.size > 0 && phase !== "generating" && phase !== "done" && (
            <section className="rounded-2xl border border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[var(--brand)]">
                Gerar {selectedTopics.size} artigo{selectedTopics.size > 1 ? "s" : ""} com IA
              </h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withImages}
                    onChange={(e) => setWithImages(e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  <ImageIcon className="h-4 w-4 text-[var(--brand)]" />
                  <span className="text-[var(--brand)] font-medium">Gerar imagem de capa (DALL-E 3)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--brand)] font-medium">Salvar como:</span>
                  {(["draft", "published"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPublishMode(m)}
                      aria-pressed={publishMode === m}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold ${publishMode === m ? "border-[var(--brand)] bg-white text-[var(--brand)]" : "border-zinc-200 text-zinc-500"}`}
                    >
                      {m === "draft" ? "Rascunho" : "Publicado"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setConfirmGeneration(true)}
                className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-hover)]"
              >
                <Bot className="inline mr-2 h-4 w-4" />
                Iniciar geração automática →
              </button>
              <p className="mt-2 text-center text-xs text-[var(--brand)]">
                Cada artigo leva ~30–60s. Total estimado: ~{selectedTopics.size * 45}s
              </p>
            </section>
          )}

          {/* Generation Progress */}
          {(phase === "generating" || phase === "done") && genItems.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--text)]">
                  Geração em andamento {phase === "done" ? "— concluída" : ""}
                </h2>
                {phase === "done" && (
                  <span className="rounded-full bg-[var(--brand-tint-100)] px-3 py-0.5 text-xs font-bold text-[var(--brand)]">
                    {doneCount} criados · {errorCount} erros
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {genItems.map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                    item.status === "done"
                      ? "border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)]"
                      : item.status === "error"
                      ? "border-rose-200 bg-rose-50"
                      : item.status === "generating"
                      ? "border-blue-200 bg-blue-50"
                      : "border-zinc-100 bg-zinc-50"
                  }`}>
                    <div className="flex-shrink-0">
                      {item.status === "done" && <Check className="h-4 w-4 text-[var(--brand)]" />}
                      {item.status === "error" && <X className="h-4 w-4 text-rose-600" />}
                      {item.status === "generating" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                      {item.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-zinc-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-[var(--text)]">{item.topic}</p>
                      {item.status === "generating" && <p className="text-xs text-blue-600">Gerando conteúdo + imagem...</p>}
                      {item.status === "error" && <p className="text-xs text-rose-600">{item.error}</p>}
                      {item.status === "done" && item.warning && (
                        <p className="text-xs text-amber-700" role="status">⚠️ {item.warning}</p>
                      )}
                    </div>
                    {item.status === "done" && item.postId && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/admin/blog/editor?id=${item.postId}`} className="rounded-lg border border-[var(--brand-tint-300)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint-50)]">
                          Editar
                        </Link>
                        {item.postSlug && (
                          <Link href={`/blog/${item.postSlug}`} target="_blank" className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50">
                            Ver →
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {phase === "done" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/admin/blog" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                    Ver todos os posts
                  </Link>
                  <button
                    onClick={() => { setPhase("ready"); setGenItems([]); setSelectedTopics(new Set()); }}
                    className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]"
                  >
                    Gerar mais artigos
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Pages by interest */}
          {result.pagesRankedByInterest.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Páginas com mais interesse de leads</h2>
              <ol className="space-y-2">
                {result.pagesRankedByInterest.slice(0, 8).map((p, i) => (
                  <li key={p.slug} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint-100)] text-[11px] font-bold text-[var(--brand)]">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-medium text-[var(--text)] truncate">{p.label}</span>
                    <span className="flex-shrink-0 rounded-full bg-[var(--brand-tint-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand)]">{p.hits} leads</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Recommended actions */}
          {result.actions.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Ações recomendadas</h2>
              <ul className="space-y-2">
                {result.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <Check className="h-4 w-4 flex-shrink-0 text-[var(--brand)] mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmGeneration}
        onOpenChange={setConfirmGeneration}
        title={`Gerar ${selectedTopics.size} artigo${selectedTopics.size > 1 ? "s" : ""} com IA?`}
        description={
          publishMode === "published"
            ? `Os artigos serão publicados diretamente no site público assim que gerados, sem revisão manual antes disso.`
            : `Os artigos serão salvos como rascunho — revise antes de publicar.`
        }
        confirmLabel="Sim, gerar"
        variant={publishMode === "published" ? "danger" : "default"}
        onConfirm={startGeneration}
      />

      <ConfirmDialog
        open={confirmApplyFixes}
        onOpenChange={setConfirmApplyFixes}
        title="Corrigir SEO automaticamente?"
        description="A IA vai editar o conteúdo/metadados dos posts listados acima para corrigir os problemas críticos encontrados. Essa ação não pode ser desfeita automaticamente."
        confirmLabel="Sim, corrigir"
        variant="danger"
        onConfirm={applyFixes}
      />
    </div>
  );
}
