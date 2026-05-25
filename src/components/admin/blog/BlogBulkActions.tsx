// PATH: src/components/admin/blog/BlogBulkActions.tsx
"use client";

import { Archive, Download, Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminFetch } from "@/lib/adminFetch";
import { exportToCSV } from "@/lib/export-csv";
import { formatDateShort } from "@/lib/format/date";

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[];
  created_at?: string | null;
  published_at?: string | null;
  scheduled_at?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

interface BlogBulkActionsProps {
  selectedIds: string[];
  allPosts: PostRow[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BlogBulkActions({
  selectedIds,
  allPosts,
  onActionComplete,
  onClearSelection,
}: BlogBulkActionsProps) {
  const { push: pushToast } = useToast();
  const [loading, setLoading] = useState<'publish' | 'archive' | 'delete' | null>(null);

  const selectedPosts = allPosts.filter((post) => selectedIds.includes(post.id));

  async function bulkPublish() {
    if (selectedIds.length === 0) return;
    
    setLoading('publish');
    try {
      const now = new Date().toISOString();
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await adminFetch('/api/admin/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              status: 'published',
              published_at: now,
              scheduled_at: null,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      pushToast({
        type: successCount > 0 ? 'success' : 'error',
        message: `${successCount} publicados, ${errorCount} falhas`,
      });

      onActionComplete();
      onClearSelection();
    } catch (error) {
      pushToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao publicar',
      });
    } finally {
      setLoading(null);
    }
  }

  async function bulkArchive() {
    if (selectedIds.length === 0) return;
    
    setLoading('archive');
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await adminFetch('/api/admin/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              status: 'archived',
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      pushToast({
        type: successCount > 0 ? 'success' : 'error',
        message: `${successCount} arquivados, ${errorCount} falhas`,
      });

      onActionComplete();
      onClearSelection();
    } catch (error) {
      pushToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao arquivar',
      });
    } finally {
      setLoading(null);
    }
  }

  async function bulkDelete() {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Excluir ${selectedIds.length} posts permanentemente?`)) {
      return;
    }

    setLoading('delete');
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      pushToast({
        type: successCount > 0 ? 'success' : 'error',
        message: `${successCount} excluídos, ${errorCount} falhas`,
      });

      onActionComplete();
      onClearSelection();
    } catch (error) {
      pushToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao excluir',
      });
    } finally {
      setLoading(null);
    }
  }

  function exportCSV() {
    if (selectedPosts.length === 0) {
      pushToast({ type: 'error', message: 'Nenhum post selecionado' });
      return;
    }

    try {
      exportToCSV(
        selectedPosts,
        [
          { header: 'ID', accessor: (row) => row.id },
          { header: 'Título', accessor: (row) => row.title },
          { header: 'Slug', accessor: (row) => row.slug },
          { header: 'Status', accessor: (row) => row.status },
          { header: 'Categoria', accessor: (row) => row.category || '' },
          { header: 'Tags', accessor: (row) => (row.tags || []).join('; ') },
          { header: 'Publicado em', accessor: (row) => row.published_at ? formatDateShort(row.published_at) : '' },
          { header: 'Criado em', accessor: (row) => row.created_at ? formatDateShort(row.created_at) : '' },
          { header: 'SEO Title', accessor: (row) => row.seo_title || '' },
          { header: 'SEO Description', accessor: (row) => row.seo_description || '' },
        ],
        `blog-posts-${new Date().toISOString().split('T')[0]}.csv`
      );

      pushToast({ type: 'success', message: `${selectedPosts.length} posts exportados` });
    } catch (error) {
      pushToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao exportar',
      });
    }
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-950">
      <p className="font-medium text-amber-900 dark:text-amber-100">
        {selectedIds.length} {selectedIds.length === 1 ? 'post selecionado' : 'posts selecionados'}
      </p>
      
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={bulkPublish}
        >
          {loading === 'publish' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="mr-2 h-4 w-4" aria-hidden />
          )}
          Publicar
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={bulkArchive}
        >
          {loading === 'archive' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Archive className="mr-2 h-4 w-4" aria-hidden />
          )}
          Arquivar
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading === null}
          onClick={exportCSV}
        >
          <Download className="mr-2 h-4 w-4" aria-hidden />
          Exportar CSV
        </Button>

        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={loading !== null}
          onClick={bulkDelete}
        >
          {loading === 'delete' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          )}
          Excluir
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClearSelection}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
