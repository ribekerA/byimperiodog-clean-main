import type { Metadata } from "next";
import { Suspense } from "react";

import { buscarConteudo } from "@/lib/search";
import { baseSiteMetadata, canonical } from "@/lib/seo.core";

export const metadata: Metadata = baseSiteMetadata({
  title: "Buscar filhotes e conteúdos",
  description:
    "Pesquise no site da By Império Dog: filhotes de Spitz Alemão Anão disponíveis, guias de criação, saúde e rotina, e artigos do blog.",
  alternates: { canonical: canonical("/search") },
  robots: { index: false },
});

async function SearchResults({ q }: { q: string }) {
  if (!q) {
    return <p className="text-sm text-zinc-500">Digite um termo para buscar.</p>;
  }

  try {
    // Chamada direta a lib, e nao fetch na propria /api/search: o endpoint era
    // montado com NEXT_PUBLIC_SITE_URL, que nunca foi definida nem aqui nem na
    // Netlify. A URL saia relativa, o fetch de servidor falhava e esta pagina
    // respondia "Erro ao buscar" para qualquer termo.
    const { results: items } = await buscarConteudo(q, { limit: 20 });

    if (!items.length) {
      return <p className="text-sm text-zinc-500">Nenhum resultado para "{q}".</p>;
    }

    return (
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="rounded-md border border-zinc-200 p-4 transition hover:bg-zinc-50">
            <a href={item.url} className="font-medium text-emerald-700 hover:underline">
              {item.title}
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
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
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
    </div>
  );
}