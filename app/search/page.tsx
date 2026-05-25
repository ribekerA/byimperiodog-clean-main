import type { Metadata } from "next";
import { Suspense } from "react";

import { baseSiteMetadata, canonical } from "@/lib/seo.core";

export const metadata: Metadata = baseSiteMetadata({
  title: "Busca | By Imperio Dog",
  description: "Pesquise conteudos e filhotes disponiveis pela By Imperio Dog.",
  alternates: { canonical: canonical("/search") },
  robots: { index: false },
});

interface SearchItem {
  id: string | number;
  url: string;
  title?: string;
  name?: string;
  excerpt?: string;
}

async function SearchResults({ q }: { q: string }) {
  if (!q) {
    return <p className="text-sm text-zinc-500">Digite um termo para buscar.</p>;
  }

  try {
    const endpoint = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${endpoint}/api/search?q=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error("Falha na busca");
    const data = await res.json();
    const items: SearchItem[] = Array.isArray(data?.results) ? data.results : [];

    if (!items.length) {
      return <p className="text-sm text-zinc-500">Nenhum resultado para "{q}".</p>;
    }

    return (
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-zinc-200 p-4 transition hover:bg-zinc-50">
            <a href={item.url} className="font-medium text-emerald-700 hover:underline">
              {item.title || item.name}
            </a>
            {item.excerpt ? (
              <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{item.excerpt}</p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  } catch {
    return <p className="text-sm text-rose-600">Erro ao buscar. Tente novamente.</p>;
  }
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q || "").trim();

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <h1 className="text-2xl font-bold tracking-tight">Busca</h1>
      <form
        className="mt-6 flex gap-3"
        action="/search"
        method="get"
        role="search"
        aria-label="Buscar no site"
      >
        <label htmlFor="site-search" className="sr-only">
          Buscar no site
        </label>
        <input
          type="search"
          name="q"
          id="site-search"
          defaultValue={q}
          placeholder="Pesquisar..."
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          type="submit"
        >
          Buscar
        </button>
      </form>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Carregando...</p>}>
        <SearchResults q={q} />
      </Suspense>
    </main>
  );
}