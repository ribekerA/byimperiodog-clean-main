"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import BlogCard from "@/components/blog/BlogCard";
import { FOUNDING_YEAR } from "@/domain/config";
import { BLOG_CATEGORIES, filterBlogPosts, type BlogListPost } from "@/lib/blog/categories";

/**
 * Busca e filtro por categoria de /blog, no cliente.
 *
 * Antes isto era `searchParams` lido pela pagina. Ler `searchParams` e uma API
 * dinamica do App Router: sozinha, ela tirava /blog do prerender e obrigava uma
 * renderizacao por requisicao — uma invocacao de funcao na Netlify a cada visita
 * da pagina que aponta para os 30 artigos.
 *
 * O estado padrao (sem busca, categoria "todos") e exatamente o que vem em
 * `children`, renderizado no SERVIDOR e presente no HTML estatico: destaque,
 * secoes por categoria e os 30 links internos continuam onde o Google le. O
 * cliente so entra em cena quando ha filtro ativo.
 *
 * `?q=` e `?categoria=` continuam funcionando: o efeito de montagem le a query
 * string e reaplica o filtro, e cada mudanca reescreve a URL com
 * `replaceState`, entao o link continua compartilhavel. Sem JavaScript, essas
 * URLs abrem a listagem completa em vez de erro.
 */
export default function BlogFilterShell({
  posts,
  children,
  footer,
}: {
  posts: BlogListPost[];
  children: ReactNode;
  footer: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [sort, setSort] = useState<"recentes" | "antigos">("recentes");
  // A primeira renderizacao do cliente tem de ser igual a do servidor, senao a
  // hidratacao quebra. So depois de montado e que a query string entra.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get("q") ?? "").trim();
    const cat = params.get("categoria") ?? "todos";
    if (q) setQuery(q);
    if (cat !== "todos" && BLOG_CATEGORIES.some((item) => item.id === cat)) setCategoria(cat);
    if (params.get("sort") === "antigos") setSort("antigos");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categoria !== "todos") params.set("categoria", categoria);
    if (sort === "antigos") params.set("sort", sort);
    const qs = params.toString();
    const next = qs ? `/blog?${qs}` : "/blog";
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [hydrated, query, categoria, sort]);

  const term = query.trim();
  const filtering = term.length > 0 || categoria !== "todos";

  const filtered = useMemo(() => {
    if (!filtering) return [];
    const result = filterBlogPosts(posts, { q: term, categoria });
    if (sort === "antigos") {
      return [...result].sort(
        (a, b) => (Date.parse(a.published_at ?? "") || 0) - (Date.parse(b.published_at ?? "") || 0)
      );
    }
    return result;
  }, [posts, term, categoria, sort, filtering]);

  function selectCategory(id: string) {
    setCategoria(id);
    setQuery("");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 px-5 py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 60%, #059669 0%, transparent 50%), radial-gradient(circle at 80% 30%, #065f46 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/60 bg-emerald-900/50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Conteúdo Premium · Gratuito
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Tudo que você precisa saber sobre o{" "}
            <span className="text-emerald-400">Spitz Alemão Anão</span>{" "}
            <span className="text-zinc-300 text-2xl sm:text-3xl font-normal">(Lulu da Pomerânia)</span>
          </h1>
          <p className="mt-4 text-base text-zinc-300 sm:text-lg">
            Guias escritos pela criadora, que cria a raça desde {FOUNDING_YEAR}.
            Sem jargão, sem enrolação.
          </p>
          {/* `action`/`method` continuam de pe como degradacao sem JavaScript. */}
          <form
            action="/blog"
            method="GET"
            onSubmit={(event) => event.preventDefault()}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="blog-search-hero" className="sr-only">
              Pesquisar artigos
            </label>
            <input
              id="blog-search-hero"
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar: saúde, rotina, comportamento, preço..."
              className="flex-1 rounded-full border border-emerald-800/60 bg-emerald-950/70 px-5 py-3 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Category tabs */}
        <div className="sticky top-0 z-30 -mx-4 bg-white/95 backdrop-blur-sm sm:-mx-6 lg:-mx-8">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
            {[{ id: "todos", title: "Todos" }, ...BLOG_CATEGORIES].map((cat) => (
              // O href serve a quem abre em nova aba: o efeito de montagem le
              // `?categoria=` e reaplica o filtro. Para robo, nao serve nada — o
              // servidor ignora a query string, entao /blog?categoria=X devolve
              // HTML identico a /blog. Sao 5 URLs duplicadas consumindo
              // rastreamento sem existir como pagina. O canonical fixo de /blog
              // ja consolida; o rel="nofollow" evita que elas virem caminho de
              // rastreamento. Filtro e estado de interface, nao arquitetura de URL.
              <a
                key={cat.id}
                href={cat.id === "todos" ? "/blog" : `/blog?categoria=${cat.id}`}
                rel={cat.id === "todos" ? undefined : "nofollow"}
                onClick={(event) => {
                  event.preventDefault();
                  selectCategory(cat.id);
                }}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  categoria === cat.id && !term
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                {cat.title}
              </a>
            ))}
          </div>
        </div>

        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {term && filtered.length > 0 &&
            `${filtered.length} artigo${filtered.length > 1 ? "s" : ""} encontrado${filtered.length > 1 ? "s" : ""} para "${term}"`}
          {term && filtered.length === 0 && `Nenhum artigo encontrado para "${term}"`}
        </div>

        {/* Sem filtro, o conteudo vem pronto do servidor: destaque + colecoes. */}
        {!filtering && children}

        {filtering && filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-zinc-100 bg-zinc-50 p-10 text-center">
            <p className="text-xl font-bold text-zinc-800">Nenhum artigo encontrado</p>
            <p className="mt-2 text-zinc-500">
              Use palavras-chave como saúde, rotina, comportamento ou investimento.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategoria("todos");
              }}
              className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Ver todos os artigos
            </button>
          </div>
        )}

        {filtering && filtered.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* A paginacao saiu daqui: `fetchPosts` devolve os 30 artigos em pagina
            unica por decisao explicita (ver comentario em page.tsx), entao o
            bloco so sabia escrever "Página 1 de 1" sem nenhum link ao lado. */}

        {footer}
      </div>
    </div>
  );
}
