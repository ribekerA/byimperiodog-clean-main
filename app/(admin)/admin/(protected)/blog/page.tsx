import Link from "next/link";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { blogRepo } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const initial = await blogRepo.listSummaries({
    limit: 50,
    offset: 0,
    includeMetrics: true,
    includePendingComments: true,
  });

  // Debug log
  console.log('[AdminBlogPage] listSummaries result:', {
    items: initial.items.length,
    total: initial.total,
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <BlogSubnav />
      <header className="flex flex-col gap-2 border-b border-emerald-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Gestão de Posts</h1>
          <p className="text-sm text-emerald-700">
            Controle completo dos artigos, agendamentos, métricas e revisões com autosave e regras de conteúdo.
          </p>
        </div>
        <Link
          href="/admin/blog/editor"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          Criar novo post
        </Link>
      </header>

      <BlogPostsTable
        initialData={{
          items: initial.items,
          total: initial.total,
          page: 1,
          perPage: 50,
        }}
      />
    </div>
  );
}
