// PATH: src/lib/blog/blog-table-columns.tsx
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Copy, ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/format/date';

export interface BlogTablePost {
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

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
  review: 'Revisão',
  archived: 'Arquivado',
};

const statusBadgeVariant: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'error'> = {
  draft: 'outline',
  scheduled: 'warning',
  published: 'success',
  review: 'warning',
  archived: 'outline',
};

interface ColumnActionsContext {
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: { id: string; type: 'publish' | 'duplicate' | 'delete' } | null;
}

export function createBlogTableColumns(context: ColumnActionsContext): ColumnDef<BlogTablePost>[] {
  return [
    {
      id: 'cover',
      header: '',
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="relative h-12 w-16 overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)]">
            {post.cover_url ? (
              <Image
                src={post.cover_url}
                alt={post.cover_alt || `Capa de ${post.title}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-muted)]">
                Sem capa
              </div>
            )}
          </div>
        );
      },
      size: 80,
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 h-8 text-[11px] uppercase tracking-wide"
        >
          Post
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" aria-hidden />
        </Button>
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/blog/${post.slug}`}
                className="font-semibold text-[var(--text)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {post.title}
              </Link>
              <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden />
            </div>
            {post.excerpt && <p className="line-clamp-2 text-xs text-[var(--text-muted)]">{post.excerpt}</p>}
            <p className="text-[11px] text-[var(--text-muted)]">Slug: {post.slug}</p>
          </div>
        );
      },
      size: 300,
    },
    {
      accessorKey: 'category',
      header: 'Categoria / Tags',
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="space-y-2 text-xs">
            {post.category && <Badge variant="outline">{post.category}</Badge>}
            <div className="flex flex-wrap gap-1">
              {post.tags?.length ? (
                post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-[var(--text-muted)]">Sem tags</span>
              )}
            </div>
          </div>
        );
      },
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 h-8 text-[11px] uppercase tracking-wide"
        >
          Status
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" aria-hidden />
        </Button>
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <Badge variant={statusBadgeVariant[post.status] || 'outline'}>
            {statusLabels[post.status] || post.status}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'published_at',
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 h-8 text-[11px] uppercase tracking-wide"
        >
          Publicação
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" aria-hidden />
        </Button>
      ),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <span className="text-xs text-[var(--text-muted)]">
            {post.published_at ? formatDateShort(post.published_at) : formatDateShort(post.created_at || '')}
          </span>
        );
      },
      size: 120,
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const post = row.original;
        const publishing = context.actionLoading?.id === post.id && context.actionLoading?.type === 'publish';
        const duplicating = context.actionLoading?.id === post.id && context.actionLoading?.type === 'duplicate';

        return (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => context.onEdit(post.id)}
              title="Editar"
            >
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={publishing}
              onClick={() => context.onPublish(post.id)}
              title="Publicar agora"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Publicar'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={duplicating}
              onClick={() => context.onDuplicate(post.id)}
              title="Duplicar"
            >
              {duplicating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            </Button>
          </div>
        );
      },
      size: 200,
      enableSorting: false,
    },
  ];
}
