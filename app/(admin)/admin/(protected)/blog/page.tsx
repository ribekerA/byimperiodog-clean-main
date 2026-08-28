import Link from "next/link";

import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { blogRepo } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const initial = await blogRepo.listSummaries({
    limit: 50,
    offset: 0,
    includeMetrics: true,
    includePendingComments: true,
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <BlogSubnav />
      <header className="flex flex-col gap-2 border-b border-[var(--brand-tint-100)] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--brand)]">Gestão de Posts</h1>
          <p className="text-sm text-[var(--brand)]">
            Controle completo dos artigos, agendamentos, métricas e revisões com autosave e regras de conteúdo.
          </p>
        </div>
        <Link
          href="/admin/blog/editor"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2"
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
