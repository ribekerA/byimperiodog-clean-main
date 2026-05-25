// PATH: src/components/blog/ModernEditorWrapper.tsx
"use client";

import { Save, Eye, Calendar, Tag, Image as ImageIcon, FileText, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Post } from "@/lib/db/types";
// Import dinâmico: Tiptap NUNCA executa no SSR (previne hydration mismatch)
// IMPORTANTE: Sempre manter ssr: false para evitar erro "SSR has been detected"
const ModernEditor = dynamic(() => import("./ModernEditor").then(m => ({ default: m.ModernEditor })), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-surface">
      <p className="text-sm text-text-secondary">Carregando editor...</p>
    </div>
  ),
});

interface FormState {
  id?: string;
  title: string;
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
}

interface ModernEditorWrapperProps {
  post: Post | null;
}

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

export default function ModernEditorWrapper({ post }: ModernEditorWrapperProps) {
  const router = useRouter();
  const { push: pushToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "seo" | "meta">("editor");
  const [slugEdited, setSlugEdited] = useState(!!post?.slug);

  const { register, watch, setValue, handleSubmit, formState } = useForm<FormState>({
    defaultValues: {
      id: post?.id,
      title: post?.title || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      category: post?.category?.id || null,
      tags: post?.tags?.map((t) => t.id) || [],
      coverUrl: post?.coverUrl || null,
      coverAlt: post?.coverAlt || null,
      metaTitle: post?.seo?.title || null,
      metaDescription: post?.seo?.description || null,
      ogImageUrl: post?.seo?.ogImageUrl || null,
    },
  });

  const title = watch("title");
  const slug = watch("slug");
  const content = watch("content");

  // Auto-generate slug from title (dentro de useEffect para evitar hydration mismatch)
  useEffect(() => {
    if (!slugEdited && title && !slug) {
      setValue("slug", slugify(title));
    }
  }, [title, slug, slugEdited, setValue]);

  const onSubmit = async (data: FormState) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/blog", {
        method: post?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post?.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao salvar post");
      }

      const result = await response.json();
      
      pushToast({
        message: post?.id ? "Post atualizado com sucesso" : "Post criado com sucesso",
        type: "success",
      });

      if (result.slug && !post?.id) {
        router.push(`/admin/blog/editor?id=${result.id}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      pushToast({
        message: error instanceof Error ? error.message : "Falha ao salvar post",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <select
            {...register("status")}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="scheduled">Agendado</option>
          </select>
          
          <span className="text-sm text-text-secondary">
            {formState.isDirty ? "Alterações não salvas" : "Tudo salvo"}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (post?.slug) {
                window.open(`/blog/${post.slug}`, "_blank");
              }
            }}
            disabled={!post?.slug}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("editor")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "editor"
              ? "border-b-2 border-brand text-brand"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="h-4 w-4" />
          Editor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("meta")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "meta"
              ? "border-b-2 border-brand text-brand"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Tag className="h-4 w-4" />
          Metadados
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "seo"
              ? "border-b-2 border-brand text-brand"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          SEO
        </button>
      </div>

      {/* Editor Tab */}
      {activeTab === "editor" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="post-title" className="mb-2 block text-sm font-medium text-text-primary">
              Título *
            </label>
            <Input
              id="post-title"
              {...register("title", { required: true })}
              placeholder="Digite o título do post..."
              className="text-2xl font-bold"
            />
          </div>

          <div>
            <label htmlFor="post-slug" className="mb-2 block text-sm font-medium text-text-primary">
              Slug *
            </label>
            <div className="flex gap-2">
              <Input
                id="post-slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setValue("slug", slugify(e.target.value));
                }}
                placeholder="url-do-post"
                className="font-mono text-sm"
              />
              <span className="flex items-center text-sm text-text-secondary">
                /blog/{slug || "..."}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 block text-sm font-medium text-text-primary">
              Conteúdo *
            </p>
            <ModernEditor
              content={content}
              onChange={(value) => setValue("content", value, { shouldDirty: true })}
              placeholder="Escreva seu conteúdo aqui..."
            />
          </div>
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === "meta" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="post-excerpt" className="mb-2 block text-sm font-medium text-text-primary">
              Resumo
            </label>
            <textarea
              id="post-excerpt"
              {...register("excerpt")}
              rows={3}
              placeholder="Breve resumo do post (exibido em listagens)"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="post-cover-url" className="mb-2 block text-sm font-medium text-text-primary">
                <ImageIcon className="mr-1 inline h-4 w-4" />
                URL da Capa
              </label>
              <Input
                id="post-cover-url"
                {...register("coverUrl")}
                placeholder="https://..."
              />
            </div>
            <div>
              <label htmlFor="post-cover-alt" className="mb-2 block text-sm font-medium text-text-primary">
                Texto Alternativo da Capa
              </label>
              <Input
                id="post-cover-alt"
                {...register("coverAlt")}
                placeholder="Descrição da imagem"
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-publish-at" className="mb-2 block text-sm font-medium text-text-primary">
              <Calendar className="mr-1 inline h-4 w-4" />
              Data de Publicação Agendada
            </label>
            <Input
              id="post-publish-at"
              type="datetime-local"
              {...register("publishAt")}
              className="max-w-xs"
            />
          </div>

          <div>
            <label htmlFor="post-category" className="mb-2 block text-sm font-medium text-text-primary">
              Categoria
            </label>
            <Input
              id="post-category"
              {...register("category")}
              placeholder="guia-do-tutor, saude, comportamento..."
            />
          </div>

          <div>
            <label htmlFor="post-tags" className="mb-2 block text-sm font-medium text-text-primary">
              <Tag className="mr-1 inline h-4 w-4" />
              Tags (separadas por vírgula)
            </label>
            <Input
              id="post-tags"
              {...register("tags")}
              placeholder="spitz, alimentacao, cuidados..."
            />
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="post-meta-title" className="mb-2 block text-sm font-medium text-text-primary">
              Meta Título
            </label>
            <Input
              id="post-meta-title"
              {...register("metaTitle")}
              placeholder="Título otimizado para SEO (max 60 caracteres)"
              maxLength={60}
            />
            <p className="mt-1 text-xs text-text-secondary">
              {watch("metaTitle")?.length || 0}/60 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="post-meta-description" className="mb-2 block text-sm font-medium text-text-primary">
              Meta Descrição
            </label>
            <textarea
              id="post-meta-description"
              {...register("metaDescription")}
              rows={3}
              maxLength={160}
              placeholder="Descrição otimizada para SEO (max 160 caracteres)"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="mt-1 text-xs text-text-secondary">
              {watch("metaDescription")?.length || 0}/160 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="post-og-image-url" className="mb-2 block text-sm font-medium text-text-primary">
              <ImageIcon className="mr-1 inline h-4 w-4" />
              Imagem Open Graph
            </label>
            <Input
              id="post-og-image-url"
              {...register("ogImageUrl")}
              placeholder="URL da imagem para redes sociais (1200x630px)"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-surface-alt p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Preview Google
            </h3>
            <div className="space-y-1">
              <p className="text-lg text-blue-600 hover:underline">
                {watch("metaTitle") || title || "Título do Post"}
              </p>
              <p className="text-xs text-green-700">
                https://byimperiodog.com.br/blog/{slug || "url-do-post"}
              </p>
              <p className="text-sm text-gray-600">
                {watch("metaDescription") || watch("excerpt") || "Descrição do post aparecerá aqui..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
