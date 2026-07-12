"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { adminFetch } from "@/lib/adminFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "brief" | "outline" | "generating" | "review" | "done";

interface Draft {
  id?: string;
  slug?: string;
  title: string;
  excerpt: string;
  content_mdx: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  cover_url: string;
  status: string;
  scheduled_at?: string;
}

interface OutlineSection {
  heading: string;
  children?: { heading: string }[];
  summary?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreQuality(draft: Draft): { score: number; issues: string[] } {
  const issues: string[] = [];
  let s = 0;

  const titleLen = draft.title.trim().length;
  if (titleLen >= 30 && titleLen <= 70) s += 15;
  else issues.push("Título ideal tem entre 30 e 70 caracteres");

  const words = draft.content_mdx.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 600) s += 20;
  else if (words >= 300) s += 10;
  else issues.push("Conteúdo com menos de 300 palavras — artigos rasos rankeiam pior");

  const headingCount = (draft.content_mdx.match(/^#{2,3}\s/gm) ?? []).length;
  if (headingCount >= 3) s += 15;
  else if (headingCount >= 1) s += 7;
  else issues.push("Sem subtítulos (##) — prejudica leitura e SEO");

  const excerptLen = draft.excerpt.trim().length;
  if (excerptLen >= 100 && excerptLen <= 200) s += 10;
  else issues.push("Resumo ideal tem entre 100 e 200 caracteres");

  const seoTitleLen = draft.seo_title.trim().length;
  if (seoTitleLen >= 30 && seoTitleLen <= 60) s += 15;
  else issues.push("Título de SEO ideal tem entre 30 e 60 caracteres (o Google corta acima disso)");

  const seoDescLen = draft.seo_description.trim().length;
  if (seoDescLen >= 100 && seoDescLen <= 160) s += 15;
  else issues.push("Meta description ideal tem entre 100 e 160 caracteres");

  if (draft.og_image_url || draft.cover_url) s += 10;
  else issues.push("Sem imagem de capa");

  return { score: Math.min(100, s), issues };
}

function QualityBar({ draft }: { draft: Draft }) {
  const { score, issues } = useMemo(() => scoreQuality(draft), [draft]);

  const color = score >= 80 ? "bg-[var(--brand)]" : score >= 50 ? "bg-amber-400" : "bg-zinc-300";
  const label = score >= 80 ? "Excelente" : score >= 50 ? "Bom" : "Incompleto";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 h-2">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-semibold text-zinc-500 w-24 text-right">
          {score}% — {label}
        </span>
      </div>
      {issues.length > 0 && (
        <ul className="space-y-0.5 text-xs text-zinc-500">
          {issues.map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "brief",      label: "Tópico"    },
    { key: "outline",    label: "Outline"   },
    { key: "generating", label: "Gerando"   },
    { key: "review",     label: "Revisão"   },
    { key: "done",       label: "Publicado" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center gap-1 text-xs" aria-label="Etapas do wizard">
      {steps.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <li className={`flex items-center gap-1 font-medium ${active ? "text-[var(--brand)]" : done ? "text-[var(--brand)]" : "text-zinc-400"}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-[var(--brand)] text-white" : done ? "bg-[var(--brand-tint-100)] text-[var(--brand)]" : "bg-zinc-100 text-zinc-400"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </li>
            {i < steps.length - 1 && (
              <span className={`h-px flex-1 ${i < idx ? "bg-[var(--brand-tint-300)]" : "bg-zinc-200"}`} aria-hidden />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WizardPage() {
  const [step,         setStep]         = useState<Step>("brief");
  const [topic,        setTopic]        = useState("");
  const [outline,      setOutline]      = useState<OutlineSection[]>([]);
  const [draft,        setDraft]        = useState<Draft>({ title: "", excerpt: "", content_mdx: "", seo_title: "", seo_description: "", og_image_url: "", cover_url: "", status: "draft" });
  const [publishMode,  setPublishMode]  = useState<"now" | "schedule" | "draft">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [progress,     setProgress]     = useState(0);
  const [progressMsg,  setProgressMsg]  = useState("");
  const [error,        setError]        = useState<string | null>(null);
  const [warnings,     setWarnings]     = useState<string[]>([]);
  const [genImage,     setGenImage]     = useState(true);

  async function handleOutline() {
    if (!topic.trim()) return;
    setError(null);
    setStep("outline");
    try {
      const r = await adminFetch("/api/admin/blog/ai/outline", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Falha ao gerar outline");
      setOutline(j.outline ?? []);
    } catch (e: unknown) {
      setError(String((e as Error)?.message ?? e));
      setStep("brief");
    }
  }

  async function handleGenerate() {
    setError(null);
    setWarnings([]);
    setStep("generating");

    // Progresso proporcional às etapas reais desta execução (2 sem imagem, 3 com imagem),
    // em vez de percentuais fixos que não refletiam o tempo real de cada chamada.
    const totalSteps = genImage ? 3 : 2;
    let completedSteps = 0;
    const advance = (msg: string) => {
      setProgress(Math.round((completedSteps / totalSteps) * 100));
      setProgressMsg(msg);
    };

    advance("Gerando rascunho completo...");
    try {
      const r = await adminFetch("/api/admin/blog/ai/generate-post", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic, scope: "guia-completo", status: "draft", generateImage: false }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Falha na geração");

      const p = j.post ?? {};
      completedSteps = 1;
      advance("Otimizando SEO...");

      let seoTitle = "", seoDesc = "";
      try {
        const rs = await adminFetch("/api/admin/blog/seo-suggestions", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ title: p.title, excerpt: p.excerpt, content_mdx: p.content_mdx }),
        });
        const js = await rs.json();
        seoTitle = js?.suggestions?.seo_title       ?? p.title   ?? "";
        seoDesc  = js?.suggestions?.seo_description ?? p.excerpt ?? "";
      } catch {
        seoTitle = p.title ?? "";
        seoDesc = p.excerpt ?? "";
        setWarnings((w) => [...w, "Não foi possível gerar sugestões de SEO automaticamente — título e resumo padrão foram usados, revise antes de publicar."]);
      }

      completedSteps = 2;
      let imageUrl = "";
      if (genImage) {
        advance("Gerando imagem de capa com IA...");
        try {
          const ri = await adminFetch("/api/admin/blog/ai/image", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              prompt: `Foto profissional de Spitz Alemão Anão para artigo: ${topic}. Estilo editorial limpo, fundo neutro.`,
              alt:    p.title ?? topic,
            }),
          });
          const ji = await ri.json();
          imageUrl = ji?.url ?? "";
        } catch {
          setWarnings((w) => [...w, "Não foi possível gerar a imagem de capa automaticamente — você pode adicionar uma manualmente depois."]);
        }
        completedSteps = 3;
      }

      setProgress(100);
      setProgressMsg("Concluído!");
      setDraft({ ...draft, id: p.id, slug: p.slug, title: p.title ?? "", excerpt: p.excerpt ?? "", content_mdx: p.content_mdx ?? "", seo_title: seoTitle, seo_description: seoDesc, og_image_url: imageUrl, cover_url: imageUrl, status: "draft" });
      setStep("review");
    } catch (e: unknown) {
      setError(String((e as Error)?.message ?? e));
      setStep("outline");
      setProgress(0);
    }
  }

  async function handlePublish() {
    setError(null);
    const status = publishMode === "now" ? "published" : publishMode === "schedule" ? "scheduled" : "draft";
    try {
      const r = await adminFetch("/api/admin/blog", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...draft, status, scheduled_at: publishMode === "schedule" ? scheduleDate || null : null, published_at: publishMode === "now" ? new Date().toISOString() : null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Falha ao salvar");
      setDraft((d) => ({ ...d, id: j.id, slug: j.slug ?? d.slug, status }));
      setStep("done");
    } catch (e: unknown) {
      setError(String((e as Error)?.message ?? e));
    }
  }

  const inputCls = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <BlogSubnav />

      <header>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Wizard IA — Criar artigo</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gere um artigo completo com IA: outline → conteúdo → SEO → imagem → publicar ou agendar.
        </p>
      </header>

      <StepIndicator current={step} />

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div role="status" className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* Brief */}
      {step === "brief" && (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-800">Sobre o que é o artigo?</h2>
          <Field label="Tópico principal" required>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && topic.trim() && handleOutline()}
              className={inputCls}
              placeholder="Ex.: Guia completo de cuidados com Spitz Alemão Anão"
            />
          </Field>
          <div className="flex items-center gap-2.5">
            <input id="gen-img" type="checkbox" checked={genImage} onChange={(e) => setGenImage(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
            <label htmlFor="gen-img" className="text-sm text-zinc-700">Gerar imagem de capa com IA (DALL-E 3)</label>
          </div>
          <button onClick={handleOutline} disabled={!topic.trim()} className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-40">
            Gerar outline →
          </button>
        </section>
      )}

      {/* Outline */}
      {step === "outline" && (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800">Estrutura do artigo</h2>
            {outline.length > 0 && <span className="rounded-full bg-[var(--brand-tint-100)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">{outline.length} seções</span>}
          </div>
          {outline.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Gerando outline...
            </div>
          ) : (
            <ol className="space-y-2 text-sm">
              {outline.map((s, i) => (
                <li key={i} className="rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="font-medium text-zinc-800">{i + 1}. {s.heading}</span>
                  {s.summary && <p className="mt-0.5 text-xs text-zinc-500">{s.summary}</p>}
                  {s.children && <ul className="mt-1 ml-4 space-y-0.5">{s.children.map((c, j) => <li key={j} className="text-xs text-zinc-500">↳ {c.heading}</li>)}</ul>}
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep("brief")} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">← Voltar</button>
            <button onClick={handleGenerate} disabled={outline.length === 0} className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-sm font-bold text-white shadow hover:bg-[var(--brand-hover)] disabled:opacity-40">
              Gerar artigo completo →
            </button>
          </div>
        </section>
      )}

      {/* Generating */}
      {step === "generating" && (
        <section className="space-y-4 rounded-2xl border border-[var(--brand-tint-100)] bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-tint-50)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-zinc-800">{progressMsg || "Processando..."}</p>
            <p className="mt-1 text-xs text-zinc-400">Isso pode levar 30–60 segundos</p>
          </div>
          <div className="overflow-hidden rounded-full bg-zinc-100 h-2.5">
            <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-semibold text-[var(--brand)]">{progress}%</p>
        </section>
      )}

      {/* Review */}
      {step === "review" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Qualidade do artigo</p>
            <QualityBar draft={draft} />
          </div>

          {(draft.og_image_url || draft.cover_url) && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <Image src={draft.og_image_url || draft.cover_url} alt={draft.title || topic} width={800} height={420} className="w-full object-cover max-h-64" />
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <Field label="Título" required>
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Resumo">
              <textarea value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))} className={inputCls} rows={2} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`SEO Title (${draft.seo_title.length}/70)`}>
                <input value={draft.seo_title} maxLength={70} onChange={(e) => setDraft((d) => ({ ...d, seo_title: e.target.value }))} className={inputCls} />
              </Field>
              <Field label={`SEO Desc (${draft.seo_description.length}/160)`}>
                <input value={draft.seo_description} maxLength={160} onChange={(e) => setDraft((d) => ({ ...d, seo_description: e.target.value }))} className={inputCls} />
              </Field>
            </div>
            <Field label="Conteúdo MDX">
              <textarea value={draft.content_mdx} onChange={(e) => setDraft((d) => ({ ...d, content_mdx: e.target.value }))} className={`${inputCls} font-mono text-xs`} rows={16} />
            </Field>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-zinc-800">Como publicar?</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["now", "schedule", "draft"] as const).map((m) => (
                <button key={m} onClick={() => setPublishMode(m)} className={`rounded-xl border py-3 text-sm font-medium transition ${publishMode === m ? "border-[var(--brand)] bg-[var(--brand-tint-50)] text-[var(--brand)] shadow-sm" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                  {m === "now" ? "🚀 Publicar agora" : m === "schedule" ? "🗓️ Agendar" : "💾 Salvar rascunho"}
                </button>
              ))}
            </div>
            {publishMode === "schedule" && (
              <Field label="Data e hora de publicação">
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} className={inputCls} />
              </Field>
            )}
            <button onClick={handlePublish} disabled={!draft.title.trim() || (publishMode === "schedule" && !scheduleDate)} className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-40">
              {publishMode === "now" ? "🚀 Publicar agora" : publishMode === "schedule" ? "🗓️ Agendar publicação" : "💾 Salvar rascunho"}
            </button>
          </div>
        </section>
      )}

      {/* Done */}
      {step === "done" && (
        <section className="rounded-2xl border border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)] text-2xl text-white shadow-lg">✓</div>
          <div>
            <h2 className="text-lg font-bold text-[var(--brand)]">
              {draft.status === "published" ? "Artigo publicado!" : draft.status === "scheduled" ? "Artigo agendado!" : "Rascunho salvo!"}
            </h2>
            <p className="mt-1 text-sm text-[var(--brand)]">
              {draft.status === "scheduled" && scheduleDate ? `Será publicado em ${new Date(scheduleDate).toLocaleString("pt-BR")}` : draft.slug ? `Disponível em /blog/${draft.slug}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {draft.slug && draft.status === "published" && (
              <Link href={`/blog/${draft.slug}`} target="_blank" className="rounded-xl border border-[var(--brand-tint-300)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint-100)]">
                Ver artigo →
              </Link>
            )}
            {draft.id && <Link href={`/admin/blog/editor?id=${draft.id}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Abrir no editor</Link>}
            <button onClick={() => { setStep("brief"); setTopic(""); setOutline([]); setProgress(0); setDraft({ title: "", excerpt: "", content_mdx: "", seo_title: "", seo_description: "", og_image_url: "", cover_url: "", status: "draft" }); }} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Criar outro artigo
            </button>
            <Link href="/admin/blog" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Ver todos os posts</Link>
          </div>
        </section>
      )}
    </div>
  );
}
