"use client";

import * as React from "react";

import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { blogRepo } from "@/lib/db";
import type { Post } from "@/lib/db/types";

export default function AdminPostsPage() {
  const [initial, setInitial] = React.useState<{ items: Post[]; total: number; page: number; perPage: number } | null>(null);
  React.useEffect(() => {
    let abort = false;
    void blogRepo.listPosts({ limit: 50, offset: 0 }).then((result) => {
      if (!abort) setInitial({ ...result, page: 1, perPage: 50 });
    });
    return () => {
      abort = true;
    };
  }, []);

  if (!initial) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-zinc-600" aria-busy>
        Carregando posts...
      </div>
    );
  }

  return <BlogPostsTable initialData={initial} />;
}
