
import Link from "next/link";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { blogRepo } from "@/lib/db";

import EditorWrapper from "./EditorWrapper";

interface PageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function BlogEditorPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const postId = searchParams.id;
  const post = postId ? await blogRepo.getPostById(postId) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <BlogSubnav />
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--brand)]">Editor de Post</h1>
          <p className="text-sm text-[var(--brand)]">
            Preencha título, conteúdo, SEO e agendamento com validações em tempo real.
          </p>
        </div>
        <Link
          href="/admin/blog"
          className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--brand-tint-200)] px-4 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-tint-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2"
        >
          Voltar para lista
        </Link>
      </header>
      <EditorWrapper post={post} />
    </div>
  );
}
