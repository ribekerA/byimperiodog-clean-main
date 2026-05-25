// PATH: app/(admin)/admin/(protected)/blog/page.tsx
"use client";

import {
  CalendarClock,
  CalendarDays,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Tag as TagIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { MetricCard } from "@/components/admin/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { adminFetch } from "@/lib/adminFetch";
import { formatDateShort, formatDateTime } from "@/lib/format/date";

const PER_PAGE = 24;

export type PostStatus = "draft" | "published" | "scheduled" | "review" | "archived" | string;

interface PostRow {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
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

const statusLabels: Record<PostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  review: "Revisao",
  archived: "Arquivado",
};

const statusBadgeVariant: Record<PostStatus, "default" | "outline" | "success" | "warning" | "error"> = {
  draft: "outline",
  scheduled: "warning",
  published: "success",
  review: "warning",
  archived: "outline",
};

function toArrayTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

function statusLabel(status: PostStatus) {
  return statusLabels[status] ?? status;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const { push: pushToast } = useToast();

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostRow | null>(null);
  const [actionLoading, setActionLoading] = useState<{ id: string; type: "publish" | "duplicate" | "delete" } | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PER_PAGE),
      });
      const search = query.trim();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);

      const url = `/api/admin/blog?${params.toString()}`;
      
      const response = await adminFetch(url);
      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json?.error || "Nao foi possivel carregar os posts");
      }

      const items: PostRow[] = (Array.isArray(json?.items) ? json.items : json) || [];
      const mapped = items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        status: (item.status || "draft") as PostStatus,
        excerpt: item.excerpt ?? null,
        category: item.category ?? null,
        tags: toArrayTags(item.tags),
        created_at: item.created_at ?? null,
        published_at: item.published_at ?? null,
        scheduled_at: item.scheduled_at ?? null,
        cover_url: item.cover_url ?? null,
        cover_alt: item.cover_alt ?? null,
        seo_title: item.seo_title ?? null,
        seo_description: item.seo_description ?? null,
      }));

      setPosts(mapped);
      setTotal(typeof json?.total === "number" ? json.total : mapped.length);
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Erro ao carregar posts", type: "error" });
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter, pushToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((post) => post.tags?.forEach((tag) => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!tagFilter) return posts;
    return posts.filter((post) => post.tags?.includes(tagFilter));
  }, [posts, tagFilter]);

  const statusCounts = useMemo(() => {
    return posts.reduce<Record<PostStatus, number>>((acc, post) => {
      const key = (post.status || "draft") as PostStatus;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<PostStatus, number>);
  }, [posts]);

  async function fetchFullPost(id: string) {
    const response = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(id)}`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error || "Nao foi possivel carregar o post");
    }
    return json;
  }

  async function publishNow(post: PostRow) {
    setActionLoading({ id: post.id, type: "publish" });
    try {
      const full = await fetchFullPost(post.id);
      const payload: Record<string, unknown> = {
        ...full,
        status: "published",
        scheduled_at: null,
        published_at: new Date().toISOString(),
      };
      const response = await adminFetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Falha ao publicar");
      }
      pushToast({ message: "Post publicado", type: "success" });
      fetchPosts();
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Nao foi possivel publicar agora", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  function generateDuplicateSlug(slug: string) {
    const suffix = Date.now().toString(36).slice(-4);
    return `${slug}-${suffix}`;
  }

  async function duplicatePost(post: PostRow) {
    setActionLoading({ id: post.id, type: "duplicate" });
    try {
      const full = await fetchFullPost(post.id);
      const payload: Record<string, unknown> = { ...full };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      payload.slug = generateDuplicateSlug(full.slug || "post");
      payload.title = `${full.title || "Post"} (Copia)`.trim();
      payload.status = "draft";
      payload.scheduled_at = null;
      payload.published_at = null;

      const response = await adminFetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Nao foi possivel duplicar");
      }
      pushToast({ message: "Copia criada como rascunho", type: "success" });
      fetchPosts();
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Erro ao duplicar post", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  async function deletePost(id: string) {
    setActionLoading({ id, type: "delete" });
    try {
      const response = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Falha ao excluir post");
      }
      pushToast({ message: "Post excluido", type: "success" });
      setDeleteTarget(null);
      fetchPosts();
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Nao foi possivel excluir", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  const publishedCount = posts.filter((post) => post.status === "published").length;
  const scheduledCount = posts.filter((post) => post.status === "scheduled").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <BlogSubnav />
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Posts do Blog</h1>
            <p className="text-sm text-[var(--text-muted)]">Painel para revisar, publicar e automatizar conteudo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={fetchPosts} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden />}
              Atualizar
            </Button>
            <Button type="button" onClick={() => router.push("/admin/blog/editor")}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Novo post
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Publicados" value={publishedCount} hint="Visiveis no blog" trend={publishedCount ? "up" : null} />
          <MetricCard title="Agendados" value={scheduledCount} hint="Programados" />
          <MetricCard title="Rascunhos" value={draftCount} hint="Em edicao" />
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
                <Input
                  placeholder="Buscar por titulo ou slug"
                  className="pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setPage(1);
                      fetchPosts();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={fetchPosts} disabled={loading}>
                <Filter className="mr-2 h-4 w-4" aria-hidden /> Aplicar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["all", "draft", "scheduled", "published"] as (PostStatus | "all")[]).map((status) => {
                const label = status === "all" ? "Todos" : statusLabel(status as PostStatus);
                const count = status === "all" ? total : statusCounts[status as PostStatus] || 0;
                const isActive = statusFilter === status;
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={isActive ? "solid" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                  >
                    {label}
                    <span className="ml-1 opacity-70">{count}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]">
                <TagIcon className="h-3.5 w-3.5" aria-hidden /> Tags
              </span>
              <Button type="button" variant={tagFilter === null ? "solid" : "outline"} size="sm" onClick={() => setTagFilter(null)}>
                Todas
              </Button>
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={tagFilter === tag ? "solid" : "outline"}
                  size="sm"
                  onClick={() => setTagFilter(tag)}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="hidden min-w-full overflow-hidden rounded-2xl md:block">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">Post</th>
                  <th scope="col" className="px-4 py-3">Categoria / Tags</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Publicacao</th>
                  <th scope="col" className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredPosts.map((post) => {
                  const publishing = actionLoading?.id === post.id && actionLoading?.type === "publish";
                  const duplicating = actionLoading?.id === post.id && actionLoading?.type === "duplicate";
                  return (
                    <tr key={post.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                            {post.cover_url ? (
                              <Image src={post.cover_url} alt={post.cover_alt || `Capa de ${post.title}`} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-muted)]">Sem capa</div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <Link href={`/blog/${post.slug}`} className="font-semibold text-[var(--text)] hover:underline" target="_blank" rel="noreferrer">
                                {post.title}
                              </Link>
                              <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden />
                            </div>
                            {post.excerpt && <p className="line-clamp-2 text-xs text-[var(--text-muted)]">{post.excerpt}</p>}
                            <p className="text-[11px] text-[var(--text-muted)]">Slug: {post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2 text-xs">
                          {post.category && <Badge variant="outline">{post.category}</Badge>}
                          <div className="flex flex-wrap gap-1">
                            {post.tags?.length ? post.tags.map((tag) => <span key={tag} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">#{tag}</span>) : <span className="text-[var(--text-muted)]">Sem tags</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusBadgeVariant[post.status] || "outline"}>{statusLabel(post.status)}</Badge>
                        {post.status === "scheduled" && post.scheduled_at && (
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">{formatDateTime(post.scheduled_at)}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--text-muted)]">
                        <div className="flex flex-col gap-1">
                          {post.published_at ? (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Publicado {formatDateShort(post.published_at)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Criado {post.created_at ? formatDateShort(post.created_at) : "-"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2 text-xs">
                          <Button type="button" size="sm" variant="outline" onClick={() => router.push(`/admin/blog/editor?id=${post.id}`)}>
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(post.status === "published" ? `/blog/${post.slug}` : `/admin/blog/preview/${post.id}`, "_blank", "noopener")}
                          >
                            Preview
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={publishing} onClick={() => publishNow(post)}>
                            {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Publicar"}
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={duplicating} onClick={() => duplicatePost(post)}>
                            {duplicating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                          </Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => setDeleteTarget(post)}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                      Nenhum post encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--border)] md:hidden">
            {filteredPosts.map((post) => {
              const publishing = actionLoading?.id === post.id && actionLoading?.type === "publish";
              const duplicating = actionLoading?.id === post.id && actionLoading?.type === "duplicate";
              return (
                <article key={post.id} className="flex flex-col gap-3 p-4">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                      {post.cover_url ? (
                        <Image src={post.cover_url} alt={post.cover_alt || `Capa de ${post.title}`} fill className="object-cover" sizes="96px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-muted)]">Sem capa</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold text-[var(--text)]">{post.title}</h2>
                      <Badge className="mt-1" variant={statusBadgeVariant[post.status] || "outline"}>
                        {statusLabel(post.status)}
                      </Badge>
                      <p className="text-[11px] text-[var(--text-muted)]">Slug: {post.slug}</p>
                    </div>
                  </div>
                  {post.excerpt && <p className="text-xs text-[var(--text-muted)]">{post.excerpt}</p>}
                  <div className="flex flex-wrap gap-1 text-[11px] text-[var(--text-muted)]">
                    {post.category && <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">{post.category}</span>}
                    {post.tags?.map((tag) => (
                      <span key={tag} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                    {post.published_at ? (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {formatDateShort(post.published_at)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {post.created_at ? formatDateShort(post.created_at) : "-"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => router.push(`/admin/blog/editor?id=${post.id}`)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(post.status === "published" ? `/blog/${post.slug}` : `/admin/blog/preview/${post.id}`, "_blank", "noopener")}
                    >
                      Preview
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={publishing} onClick={() => publishNow(post)}>
                      {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Publicar"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={duplicating} onClick={() => duplicatePost(post)}>
                      {duplicating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => setDeleteTarget(post)}>
                      Excluir
                    </Button>
                  </div>
                </article>
              );
            })}
            {!loading && filteredPosts.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Nenhum post encontrado.</p>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 border-t border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando...
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
            <span>
              Pagina {page} de {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}>
                Proxima
              </Button>
            </div>
            <span>Total {total}</span>
          </div>
        </section>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent title="Excluir post" description="Esta acao removera o post permanentemente.">
          <p className="text-sm text-[var(--text-muted)]">Tem certeza que deseja excluir &ldquo;{deleteTarget?.title}&rdquo;?</p>
          <DialogActions>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={actionLoading?.id === deleteTarget?.id && actionLoading?.type === "delete"}
              onClick={() => deleteTarget && deletePost(deleteTarget.id)}
            >
              {actionLoading?.id === deleteTarget?.id && actionLoading?.type === "delete" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Excluir"}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
}
