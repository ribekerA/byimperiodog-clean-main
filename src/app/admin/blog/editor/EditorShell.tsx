// PATH: src/app/admin/blog/editor/EditorShell.tsx
"use client";

import { Sparkles, Wand2, Check, Copy, ListOrdered, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import CoverUploader from "@/components/media/CoverUploader";
import InlineImagePicker, { type InlineImage } from "@/components/media/InlineImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import useAutosave from "@/hooks/useAutosave";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import type { EditorAIRequest, EditorAIResponse } from "@/lib/blog/types";

export interface FormState {
  id?: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  excerpt?: string | null;
  content: string;
  category?: string | null;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  publishAt?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  ogImageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  readingTime?: number | null;
}

interface EditorShellProps {
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<{ id?: string; slug?: string; status?: string } | void>;
  aiEndpoint?: string;
}

type AiState = {
  loading: boolean;
  lastMode?: EditorAIRequest["mode"];
  error?: string | null;
};

type AiOutputs = {
  titles: string[];
  subtitles: string[];
  outline: { heading: string; children?: string[] }[];
  tags: string[];
  metaDescription?: string | null;
  altText?: string | null;
  coverPrompt?: string | null;
};

const defaultValues: FormState = {
  title: "",
  subtitle: null,
  slug: "",
  excerpt: null,
  content: "",
  category: null,
  tags: [],
  status: "draft",
  publishAt: null,
  coverUrl: null,
  coverAlt: null,
  ogImageUrl: null,
  metaTitle: null,
  metaDescription: null,
  readingTime: null,
};

const SLUG_REGEX = /[^a-z0-9-]/g;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditorShell({ initial, onSave, aiEndpoint = "/api/admin/blog/ai" }: EditorShellProps) {
  const { register, watch, setValue, getValues, reset, formState, handleSubmit } = useForm<FormState>({
    defaultValues,
  });
  const {
    ref: contentFieldRef,
    ...contentField
  } = register("content", { required: true });
  const { push: pushToast } = useToast();
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [aiState, setAiState] = useState<AiState>({ loading: false });
  const [aiOutputs, setAiOutputs] = useState<AiOutputs>({ titles: [], subtitles: [], outline: [], tags: [] });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savingSilently, setSavingSilently] = useState<boolean>(false);

  useEffect(() => {
    if (!initial) return;
    const next: FormState = {
      ...defaultValues,
      ...initial,
      tags: Array.isArray(initial.tags) ? initial.tags : [],
      status: initial.status || "draft",
      content: initial.content || "",
      coverUrl: initial.coverUrl ?? null,
      coverAlt: initial.coverAlt ?? null,
    };
    reset(next);
    setSlugEdited(!!initial.slug);
  }, [initial, reset]);

  const title = watch("title");
  const slug = watch("slug");
  const content = watch("content");
  const tags = watch("tags");
  const status = watch("status");
  const publishAtIso = watch("publishAt");
  const coverUrl = watch("coverUrl");
  const coverAlt = watch("coverAlt");

  const readingTime = useMemo(() => {
    const minutes = estimateReadingTime(content);
    return minutes > 0 ? minutes : null;
  }, [content]);

  useEffect(() => {
    if (!slugEdited && title) {
      setValue("slug", slugify(title), { shouldDirty: true });
    }
  }, [title, slugEdited, setValue]);

  function handleSlugChange(next: string) {
    setSlugEdited(true);
    setValue("slug", slugify(next), { shouldDirty: true });
  }

  function setPublishAt(value: string) {
    if (!value) {
      setValue("publishAt", null, { shouldDirty: true });
      return;
    }
    const iso = new Date(value).toISOString();
    setValue("publishAt", iso, { shouldDirty: true });
  }

  function addTagFromInput(event: React.KeyboardEvent<HTMLInputElement>) {
    const target = event.currentTarget;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const raw = target.value.trim().toLowerCase();
      if (!raw) return;
      const next = Array.from(new Set([...(tags || []), raw]));
      setValue("tags", next, { shouldDirty: true });
      target.value = "";
    }
  }

  function removeTag(tag: string) {
    const next = (tags || []).filter((item) => item !== tag);
    setValue("tags", next, { shouldDirty: true });
  }

  function insertAtCursor(snippet: string) {
    const ref = contentRef.current;
    const current = getValues("content") || "";
    if (!ref) {
      setValue("content", `${current}\n\n${snippet}`, { shouldDirty: true });
      return;
    }
    const start = ref.selectionStart ?? current.length;
    const end = ref.selectionEnd ?? current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const next = `${before}${snippet}${after}`;
    setValue("content", next, { shouldDirty: true });
    requestAnimationFrame(() => {
      ref.focus();
      const cursor = start + snippet.length;
      ref.selectionStart = ref.selectionEnd = cursor;
    });
  }

  function handleInlineImage(image: InlineImage) {
    const width = image.width ?? 1200;
    const height = image.height ?? 800;
    const baseImg = `<img src="${image.url}" alt="${image.alt}" width="${width}" height="${height}" loading="lazy" decoding="async" />`;
    const snippet = image.caption
      ? `\n\n<figure>\n  ${baseImg}\n  <figcaption>${image.caption}</figcaption>\n</figure>\n\n`
      : `\n\n${baseImg}\n\n`;
    insertAtCursor(snippet);
    pushToast({ message: "Imagem inline adicionada com ALT e dimensoes.", type: "success" });
  }

  async function copyToClipboard(value: string | null | undefined, key: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      pushToast({ message: "Nao foi possivel copiar agora.", type: "error" });
    }
  }

  async function runAI(request: EditorAIRequest) {
    setAiState({ loading: true, lastMode: request.mode });
    try {
      const response = await fetch(aiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...request, locale: "pt-BR" }),
      });
      if (!response.ok) {
        throw new Error("Falha ao consultar IA");
      }
      const data: EditorAIResponse = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Resposta invalida da IA");
      }
      setAiOutputs((prev) => {
        const next: AiOutputs = { ...prev };
        if (data.mode === "title") next.titles = data.suggestions || [];
        if (data.mode === "subtitle") next.subtitles = data.suggestions || [];
        if (data.mode === "outline") next.outline = data.outline || [];
        if (data.mode === "section" || data.mode === "full") {
          const generated = data.content || "";
          if (generated) {
            insertAtCursor(`\n\n${generated}\n`);
          }
        }
        if (data.mode === "tags") {
          const tagsFromAI = data.tags || [];
          if (tagsFromAI.length) {
            setValue("tags", Array.from(new Set([...(tags || []), ...tagsFromAI])), { shouldDirty: true });
          }
          next.tags = tagsFromAI;
        }
        if (data.mode === "meta") next.metaDescription = data.metaDescription || null;
        if (data.mode === "altText") next.altText = data.altText || null;
        if (data.mode === "coverIdea") next.coverPrompt = data.coverPrompt || null;
        return next;
      });
      if (data.mode === "meta" && data.metaDescription) {
        setValue("metaDescription", data.metaDescription, { shouldDirty: true });
      }
      if (data.mode === "full") {
        pushToast({ message: "Conteudo base adicionado pelo assistente IA.", type: "success" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nao foi possivel usar a IA agora.";
      pushToast({ message, type: "error" });
      setAiState({ loading: false, lastMode: request.mode, error: message });
      return;
    }
    setAiState({ loading: false, lastMode: request.mode, error: null });
  }

  const onSubmit = handleSubmit(async (values) => {
    const uniqueTags = Array.from(new Set((values.tags || []).map((tag) => tag.trim()).filter(Boolean)));
    const payload: FormState = {
      ...values,
      tags: uniqueTags,
      coverUrl: values.coverUrl || null,
      coverAlt: values.coverAlt?.trim() ? values.coverAlt.trim() : null,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
      publishAt: values.publishAt || null,
      readingTime,
    };
    try {
      const result = await onSave(payload);
      if (result && typeof result === "object" && result.id && !getValues("id")) {
        setValue("id", result.id as string, { shouldDirty: false });
      }
      setLastSavedAt(new Date());
      pushToast({ message: "Post salvo com sucesso.", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Revise os campos e tente novamente.";
      pushToast({ message: msg, type: "error" });
    }
  });

  const publishAtValue = useMemo(() => (publishAtIso ? publishAtIso.slice(0, 16) : ""), [publishAtIso]);

  // Autosave com debounce: salva rascunho silenciosamente quando houver alterações
  useAutosave<FormState | null>({
    interval: 800,
    enabled: !!(formState.isDirty && !formState.isSubmitting && (title?.trim().length || 0) >= 3 && (slug?.trim().length || 0) >= 3),
    values: {
      id: getValues("id"),
      title: title || "",
      subtitle: watch("subtitle") ?? null,
      slug: slug || "",
      excerpt: watch("excerpt") ?? null,
      content: content || "",
      category: watch("category") ?? null,
      tags: tags || [],
      status,
      publishAt: publishAtIso || null,
      coverUrl: coverUrl || null,
      coverAlt: coverAlt || null,
      ogImageUrl: watch("ogImageUrl") || null,
      metaTitle: watch("metaTitle") || null,
      metaDescription: watch("metaDescription") || null,
      readingTime,
    },
    onSave: async (vals) => {
      if (!vals) return;
      try {
        setSavingSilently(true);
        const result = await onSave(vals);
        if (result && typeof result === "object" && result.id && !getValues("id")) {
          setValue("id", result.id as string, { shouldDirty: false });
        }
        setLastSavedAt(new Date());
      } catch {
        // autosave silencioso: não exibir toast de erro
      } finally {
        setSavingSilently(false);
      }
    },
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,320px)]">
      <section className="space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Status</p>
              <p className="text-sm font-semibold capitalize">{status === "draft" ? "Rascunho" : status === "scheduled" ? "Agendado" : "Publicado"}</p>
              {publishAtIso && (
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Agendado para {new Date(publishAtIso).toLocaleString("pt-BR")}</p>
              )}
              {readingTime && (
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Tempo estimado de leitura: {readingTime} min</p>
              )}
            </div>
            {slug && (
              <Link href={`/blog/${slug}`} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">
                Preview publico
              </Link>
            )}
          </header>
          <div className="mt-4 space-y-3">
            <label htmlFor="title" className="flex flex-col gap-1 text-xs font-medium">
              Titulo*
              <Input id="title" {...register("title", { required: true })} placeholder="Titulo do post" aria-required />
            </label>
            <label htmlFor="subtitle" className="flex flex-col gap-1 text-xs font-medium">
              Subtitulo
              <Input id="subtitle" value={watch("subtitle") ?? ""} onChange={(event) => setValue("subtitle", event.target.value || null, { shouldDirty: true })} placeholder="Resumo curto" />
            </label>
            <label htmlFor="slug" className="flex flex-col gap-1 text-xs font-medium">
              Slug
              <Input
                id="slug"
                value={slug}
                onChange={(event) => handleSlugChange(event.target.value.replace(SLUG_REGEX, ""))}
                onBlur={() => setSlugEdited(true)}
                placeholder="meu-post-incrivel"
              />
            </label>
            <label htmlFor="category" className="flex flex-col gap-1 text-xs font-medium">
              Categoria
              <Input id="category" value={watch("category") ?? ""} onChange={(event) => setValue("category", event.target.value || null, { shouldDirty: true })} placeholder="Ex: cuidados" />
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Tags</span>
                {tags?.length ? <span className="text-[11px] text-[var(--text-muted)]">{tags.length} selecionadas</span> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <span key={tag} className="group inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-1 text-[11px]">
                    #{tag}
                    <button type="button" className="text-[var(--text-muted)] opacity-70 transition group-hover:opacity-100" onClick={() => removeTag(tag)} aria-label={`Remover tag ${tag}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input placeholder="Digite e pressione Enter" onKeyDown={addTagFromInput} aria-label="Adicionar tag" />
            </div>
            <label htmlFor="publishAt" className="flex flex-col gap-1 text-xs font-medium">
              Publish At
              <Input id="publishAt" type="datetime-local" value={publishAtValue} onChange={(event) => setPublishAt(event.target.value)} />
            </label>
            <label htmlFor="status" className="flex flex-col gap-1 text-xs font-medium">
              Status
              <select
                id="status"
                value={status}
                onChange={(event) => setValue("status", event.target.value as FormState["status"], { shouldDirty: true })}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="published">Publicado</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Resumo & SEO</p>
          <label htmlFor="excerpt" className="flex flex-col gap-1 text-xs font-medium">
            Resumo (excerpt)
            <textarea
              id="excerpt"
              value={watch("excerpt") ?? ""}
              onChange={(event) => setValue("excerpt", event.target.value || null, { shouldDirty: true })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
              placeholder="Resumo curto para listagens"
            />
          </label>
          <label htmlFor="metaTitle" className="flex flex-col gap-1 text-xs font-medium">
            Meta Title
            <Input id="metaTitle" value={watch("metaTitle") ?? ""} onChange={(event) => setValue("metaTitle", event.target.value || null, { shouldDirty: true })} placeholder="Titulo SEO (opcional)" />
          </label>
          <label htmlFor="metaDescription" className="flex flex-col gap-1 text-xs font-medium">
            Meta Description
            <textarea
              id="metaDescription"
              value={watch("metaDescription") ?? ""}
              onChange={(event) => setValue("metaDescription", event.target.value || null, { shouldDirty: true })}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
              placeholder="Descricao ate 155 caracteres"
            />
          </label>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-xs font-medium">
            <span>Capa do post</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => runAI({ mode: "coverIdea", topic: title || slug })} disabled={aiState.loading}>
              <Sparkles className="mr-1 h-4 w-4" aria-hidden /> Sugerir capa
            </Button>
          </div>
          <CoverUploader
            value={coverUrl ?? undefined}
            altValue={coverAlt ?? ""}
            onChange={(url) => setValue("coverUrl", url, { shouldDirty: true })}
            onAltChange={(alt) => setValue("coverAlt", alt || null, { shouldDirty: true })}
            aspect="16:9"
            disabled={aiState.loading}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span>Conteudo principal</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => runAI({ mode: "outline", topic: title || slug })} disabled={aiState.loading}>
              <ListOrdered className="mr-1 h-4 w-4" aria-hidden /> Outline
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => runAI({ mode: "full", topic: title || slug, tone: "informativo", audience: "tutores de caes" })} disabled={aiState.loading}>
              <Wand2 className="mr-1 h-4 w-4" aria-hidden /> Rascunho IA
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            {savingSilently && <span>Salvando…</span>}
            {lastSavedAt && <span>Salvo {lastSavedAt.toLocaleTimeString("pt-BR")}</span>}
            <span>{formState.isDirty ? "Alteracoes nao salvas" : "Tudo sincronizado"}</span>
          </div>
        </div>
        <textarea
          ref={(node) => {
            contentRef.current = node;
            contentFieldRef(node);
          }}
          {...contentField}
          rows={20}
          className="min-h-[420px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm leading-relaxed text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
          placeholder="Escreva em MDX. Use headings (##), listas, imagens etc."
        />
        {aiOutputs.outline.length > 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text)]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--text-muted)]">
              <ListOrdered className="h-3.5 w-3.5" aria-hidden /> Outline sugerido
            </div>
            <ul className="space-y-1">
              {aiOutputs.outline.map((item, index) => (
                <li key={index}>
                  <span className="font-medium">{item.heading}</span>
                  {item.children?.length ? (
                    <ul className="ml-4 list-disc space-y-1">
                      {item.children.map((child, childIndex) => (
                        <li key={childIndex}>{child}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Inserir imagem inline</h3>
          <InlineImagePicker onSelect={handleInlineImage} disabled={aiState.loading} />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden /> Ferramentas IA
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button type="button" variant="outline" size="sm" onClick={() => runAI({ mode: "title", topic: title || "post" })} disabled={aiState.loading}>
              Titulo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => runAI({ mode: "subtitle", topic: title || slug })} disabled={aiState.loading}>
              Subtitulo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => runAI({ mode: "section", sectionHeading: "", currentText: content, tone: "educativo" })} disabled={aiState.loading}>
              Secao
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => runAI({ mode: "tags", topic: title || content })} disabled={aiState.loading}>
              Tags
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => runAI({ mode: "meta", topic: title || content })} disabled={aiState.loading}>
              Meta Desc
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => runAI({ mode: "altText", imageContext: title || "imagem" })} disabled={aiState.loading}>
              Alt text
            </Button>
          </div>
          {aiState.loading && <p className="mt-3 text-[11px] text-[var(--text-muted)]">IA pensando...</p>}
          {aiState.error && <p className="mt-2 text-xs text-destructive">{aiState.error}</p>}
        </div>

        {aiOutputs.titles.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sugestoes de titulo</h4>
            <ul className="space-y-2 text-sm">
              {aiOutputs.titles.map((item, index) => (
                <li key={index}>
                  <button type="button" className="w-full rounded border border-transparent bg-transparent text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]" onClick={() => setValue("title", item, { shouldDirty: true })}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiOutputs.subtitles.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sugestoes de subtitulo</h4>
            <ul className="space-y-2 text-sm">
              {aiOutputs.subtitles.map((item, index) => (
                <li key={index}>
                  <button type="button" className="w-full rounded border border-transparent bg-transparent text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]" onClick={() => setValue("subtitle", item, { shouldDirty: true })}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiOutputs.tags.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <TagIcon className="h-3.5 w-3.5" aria-hidden /> Tags sugeridas
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {aiOutputs.tags.map((tag) => (
                <button key={tag} type="button" className="rounded-full bg-[var(--surface-2)] px-2 py-1 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]" onClick={() => setValue("tags", Array.from(new Set([...(tags || []), tag])), { shouldDirty: true })}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiOutputs.metaDescription && (
          <GeneratedBlock
            title="Meta description sugerida"
            value={aiOutputs.metaDescription}
            onApply={() => setValue("metaDescription", aiOutputs.metaDescription || null, { shouldDirty: true })}
            onCopy={() => copyToClipboard(aiOutputs.metaDescription, "meta")}
            copied={copiedKey === "meta"}
          />
        )}

        {aiOutputs.altText && (
          <GeneratedBlock
            title="Alt-text sugerido"
            value={aiOutputs.altText}
            onApply={() => setValue("coverAlt", aiOutputs.altText || null, { shouldDirty: true })}
            onCopy={() => copyToClipboard(aiOutputs.altText, "alt")}
            copied={copiedKey === "alt"}
          />
        )}

        {aiOutputs.coverPrompt && (
          <GeneratedBlock
            title="Prompt de capa"
            value={aiOutputs.coverPrompt}
            onCopy={() => copyToClipboard(aiOutputs.coverPrompt, "cover")}
            copied={copiedKey === "cover"}
          />
        )}

        <div className="sticky bottom-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <Button type="submit" loading={formState.isSubmitting}>
              Salvar alteracoes
            </Button>
            <Button type="button" variant="outline" onClick={() => runAI({ mode: "section", currentText: content, tone: "consultivo" })} disabled={aiState.loading}>
              Adicionar paragrafo IA
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}

interface GeneratedBlockProps {
  title: string;
  value: string | null;
  onApply?: () => void;
  onCopy: () => void;
  copied: boolean;
}

function GeneratedBlock({ title, value, onApply, onCopy, copied }: GeneratedBlockProps) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm text-sm">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</h4>
      <p className="whitespace-pre-wrap text-[var(--text)]">{value}</p>
      <div className="mt-3 flex items center gap-2 text-xs">
        {onApply && (
          <Button type="button" variant="subtle" size="sm" onClick={onApply}>
            Aplicar
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onCopy={undefined} onClick={onCopy}>
          {copied ? <Check className="mr-1 h-4 w-4" aria-hidden /> : <Copy className="mr-1 h-4 w-4" aria-hidden />} Copiar
        </Button>
      </div>
    </div>
  );
}


