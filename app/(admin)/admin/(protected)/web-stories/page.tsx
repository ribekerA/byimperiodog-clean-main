"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface WebStory {
  id: string;
  title: string;
  slug: string;
  publisher: string;
  poster_url: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published";
}

export default function WebStoriesPage() {
  const [stories, setStories] = useState<WebStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/web-stories");
      if (!response.ok) throw new Error("Falha ao carregar Web Stories");
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta Web Story?")) return;
    
    try {
      const response = await fetch(`/api/admin/web-stories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao excluir Web Story");
      await loadStories();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text)]">Web Stories AMP</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Crie e gerencie Web Stories para o Google Discover e Pesquisa
              </p>
            </div>
            <Link
              href="/admin/web-stories/new"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 transition"
            >
              + Nova Web Story
            </Link>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Erro ao carregar Web Stories</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={loadStories}
              className="mt-3 inline-flex rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center"
          >
            <svg
              className="mx-auto h-16 w-16 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
              Nenhuma Web Story criada
            </h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Comece criando sua primeira Web Story para aparecer no Google Discover
            </p>
            <Link
              href="/admin/web-stories/new"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 transition"
            >
              Criar primeira Web Story
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg hover:shadow-xl transition"
              >
                <div className="aspect-[9/16] w-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200">
                  {story.poster_url ? (
                    <Image
                      src={story.poster_url}
                      alt={story.title}
                      width={640}
                      height={853}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-20 w-20 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex-1 font-semibold text-[var(--text)] line-clamp-2">
                      {story.title}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                        story.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {story.status === "published" ? "Publicada" : "Rascunho"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    /{story.slug}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/admin/web-stories/edit/${story.id}`}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition"
                    >
                      Editar
                    </Link>
                    <a
                      href={`/web-stories/${story.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => deleteStory(story.id)}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Sobre Web Stories AMP
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>Web Stories aparecem no Google Discover e Pesquisa como cards visuais</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>Formato otimizado para mobile com navegação por toque/deslize</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>Todas as stories são páginas AMP válidas e indexáveis pelo Google</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>Suporte a vídeos, imagens, animações e texto</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
