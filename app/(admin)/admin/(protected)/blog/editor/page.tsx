
import Link from "next/link";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { blogRepo } from "@/lib/db";

import EditorWrapper from "./EditorWrapper";

interface PageProps {
  searchParams: {
    id?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function BlogEditorPage({ searchParams }: PageProps) {
  const postId = searchParams.id;
  const post = postId ? await blogRepo.getPostById(postId) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <BlogSubnav />
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Editor de Post</h1>
          <p className="text-sm text-emerald-700">
            Preencha título, conteúdo, SEO e agendamento com validações em tempo real.
          </p>
        </div>
        <Link
          href="/admin/blog"
          className="inline-flex min-h-[36px] items-center rounded-full border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          Voltar para lista
        </Link>
      </header>
      <EditorWrapper post={post} />
    </div>
  );
}
