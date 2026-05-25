"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface WebStoryPage {
  id: string;
  type: "image" | "video";
  media_url: string;
  text?: string;
  duration?: number;
}

export default function NewWebStoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    publisher: "By Império Dog",
    poster_url: "",
    logo_url: "/logo.png",
    status: "draft" as "draft" | "published",
  });

  const [pages, setPages] = useState<WebStoryPage[]>([
    {
      id: "page-1",
      type: "image",
      media_url: "",
      text: "",
      duration: 5,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/web-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, pages }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao criar Web Story");
      }

      router.push("/admin/web-stories");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const addPage = () => {
    setPages([
      ...pages,
      {
        id: `page-${Date.now()}`,
        type: "image",
        media_url: "",
        text: "",
        duration: 5,
      },
    ]);
  };

  const removePage = (id: string) => {
    if (pages.length === 1) {
      alert("Uma Web Story precisa ter pelo menos uma página.");
      return;
    }
    setPages(pages.filter((p) => p.id !== id));
  };

  const updatePage = (id: string, field: keyof WebStoryPage, value: string | number) => {
    setPages(pages.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)]">Nova Web Story</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Preencha os dados abaixo para criar uma Web Story AMP válida
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Erro ao criar Web Story</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">Metadados</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="story-title" className="block text-sm font-medium text-[var(--text)]">
                  Título *
                </label>
                <input
                  id="story-title"
                  type="text"
                  required
                  maxLength={70}
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const updates: { title: string; slug?: string } = { title: newTitle };
                    
                    if (!formData.slug) {
                      updates.slug = newTitle
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "");
                    }
                    
                    setFormData({ ...formData, ...updates });
                  }}
                  placeholder="Ex: Filhote Spitz Alemão Branco"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Máximo 70 caracteres (recomendado)
                </p>
              </div>

              <div>
                <label htmlFor="story-slug" className="block text-sm font-medium text-[var(--text)]">
                  Slug (URL) *
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">/web-stories/</span>
                  <input
                    id="story-slug"
                    type="text"
                    required
                    pattern="[a-z0-9-]+"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    placeholder="filhote-spitz-alemao-branco"
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="story-publisher" className="block text-sm font-medium text-[var(--text)]">
                  Publisher *
                </label>
                <input
                  id="story-publisher"
                  type="text"
                  required
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="By Império Dog"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="story-poster" className="block text-sm font-medium text-[var(--text)]">
                    URL da Imagem de Capa (Poster) *
                  </label>
                  <input
                    id="story-poster"
                    type="url"
                    required
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Mín. 640x853px (proporção 3:4)
                  </p>
                </div>

                <div>
                  <label htmlFor="story-logo" className="block text-sm font-medium text-[var(--text)]">
                    URL do Logotipo *
                  </label>
                  <input
                    id="story-logo"
                    type="url"
                    required
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Mín. 96x96px (proporção 1:1)
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="story-status" className="block text-sm font-medium text-[var(--text)]">Status</label>
                <select
                  id="story-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "draft" | "published" })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicada</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">Páginas da Story</h2>
              <button
                type="button"
                onClick={addPage}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                + Adicionar Página
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[var(--text)]">Página {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`page-type-${page.id}`} className="block text-sm font-medium text-[var(--text)]">Tipo</label>
                      <select
                        id={`page-type-${page.id}`}
                        value={page.type}
                        onChange={(e) =>
                          updatePage(page.id, "type", e.target.value as "image" | "video")
                        }
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`page-media-${page.id}`} className="block text-sm font-medium text-[var(--text)]">
                        URL da {page.type === "image" ? "Imagem" : "Vídeo"} *
                      </label>
                      <input
                        id={`page-media-${page.id}`}
                        type="url"
                        required
                        value={page.media_url}
                        onChange={(e) => updatePage(page.id, "media_url", e.target.value)}
                        placeholder="https://..."
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label htmlFor={`page-text-${page.id}`} className="block text-sm font-medium text-[var(--text)]">
                        Texto (opcional)
                      </label>
                      <textarea
                        id={`page-text-${page.id}`}
                        value={page.text || ""}
                        onChange={(e) => updatePage(page.id, "text", e.target.value)}
                        placeholder="Texto para exibir nesta página (máx. ~280 caracteres)"
                        maxLength={280}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {page.type === "image" && (
                      <div>
                        <label htmlFor={`page-duration-${page.id}`} className="block text-sm font-medium text-[var(--text)]">
                          Duração (segundos)
                        </label>
                        <input
                          id={`page-duration-${page.id}`}
                          type="number"
                          min={1}
                          max={20}
                          value={page.duration || 5}
                          onChange={(e) =>
                            updatePage(page.id, "duration", parseInt(e.target.value))
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Criando..." : "Criar Web Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
