import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import BlogCard from "@/components/blog/BlogCard";
import SeoJsonLd from "@/components/SeoJsonLd";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { listPostsWithMeta } from "@/lib/blog/service";
import { getAllPosts } from "@/lib/content";
import { BLUR_DATA_URL } from "@/lib/placeholders";

type SortOption = "recentes" | "antigos";

type PublicPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  content_mdx?: string | null;
  status?: string | null;
  category?: string | null;
  author_id?: string | null;
  tags?: string[] | null;
};

type FetchState =
  | { status: "ok"; posts: PublicPost[]; page: number; pageSize: number; total: number; hasNext: boolean; hasPrev: boolean }
  | { status: "empty" }
  | { status: "env-missing" }
  | { status: "error"; message: string };

type CategoryDefinition = {
  id: string;
  title: string;
  description: string;
  highlight: string;
  match: (post: PublicPost) => boolean;
  cta: { label: string; href: string };
};

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "guia-do-tutor",
    title: "Guia do Tutor",
    description:
      "Rotinas, enxoval, planejamento financeiro e a jornada completa para receber um Spitz equilibrado em casa.",
    highlight: "Checklist premium e mentoria vital�cia para fam�lias exigentes.",
    match: (post) => includesCategory(post, ["guia", "tutor", "planejamento"]),
    cta: { label: "Planejar rotina", href: "/sobre" },
  },
  {
    id: "cuidados",
    title: "Cuidados",
    description:
      "Nutri��o personalizada, higiene estrat�gica e protocolos preventivos para manter o Spitz saud�vel e confiante.",
    highlight: "Orienta��es da neonatologia ao primeiro ano com suporte cont�nuo.",
    match: (post) => includesCategory(post, ["cuidado", "rotina", "nutri", "higiene"]),
    cta: { label: "Ver dicas de cuidados", href: "/faq#cuidados" },
  },
  {
    id: "adestramento",
    title: "Adestramento",
    description:
      "Socializa��o guiada, enriquecimento ambiental e refor�o positivo focado em lares urbanos com agenda cheia.",
    highlight: "Protocolos semanais com v�deos e check-ins pelo WhatsApp.",
    match: (post) => includesCategory(post, ["adestramento", "comportamento", "socializacao"]),
    cta: { label: "Conhecer nosso processo", href: "/sobre#processo" },
  },
  {
    id: "saude",
    title: "Sa�de",
    description:
      "Preventivo completo: exames gen�ticos, cardiol�gicos e protocolos veterin�rios para Spitz at� 22 cm.",
    highlight: "Transpar�ncia total com laudos digitais e acompanhamento p�s-entrega.",
    match: (post) => includesCategory(post, ["saude", "cl�nico", "veterin", "check-up"]),
    cta: { label: "Entender exames", href: "/faq#saude" },
  },
  {
    id: "perguntas-frequentes",
    title: "Perguntas Frequentes",
    description:
      "Respostas diretas sobre investimento, log�stica, conviv�ncia com crian�as e integra��o com outros pets.",
    highlight: "Conte�do did�tico produzido com base nas d�vidas reais dos tutores.",
    match: (post) => includesCategory(post, ["pergunta", "faq", "investimento", "logistica"]),
    cta: { label: "FAQ completo", href: "/faq" },
  },
];

// Revalidate cache every 60 seconds in production, but disable cache in development
export const revalidate = process.env.NODE_ENV === 'production' ? 60 : 0;
// Force dynamic rendering to always show latest posts
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Guia completo do tutor de Spitz Alem�o An�o (Lulu da Pomer�nia)",
  description:
    "Conte�do evergreen para quem busca Spitz Alem�o An�o (Lulu da Pomer�nia) com responsabilidade: cuidados, rotina, comportamento, sa�de preventiva e respostas das principais d�vidas.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | By Imp�rio Dog",
    description:
      "Pilares evergreen sobre sa�de, rotina e comportamento do Spitz Alem�o An�o (Lulu da Pomer�nia) para uma decis�o respons�vel.",
  },
};

type PageSearchParams = {
  q?: string;
  sort?: SortOption;
  page?: string;
};

export default async function BlogListPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const sort = searchParams?.sort === "antigos" ? "antigos" : "recentes";
  const searchTerm = (searchParams?.q || "").trim();
  const pageNum = Number(searchParams?.page || 1);
  const fetchState = await fetchPosts({ sort, page: pageNum });

  const heroLinks = [
    {
      title: "Filhotes dispon�veis sob consulta",
      description: "Acesso antecipado �s ninhadas com sa�de validada e mentoria vital�cia.",
      href: "/filhotes",
    },
    {
      title: "Processo By Imperio Dog",
      description: "Entenda cada etapa: entrevista, socializa��o, entrega humanizada e suporte 24h.",
      href: "/sobre#processo",
    },
    {
      title: "FAQ para tutores",
      description: "Perguntas frequentes sobre investimento, log�stica e rotina em fam�lia.",
      href: "/faq",
    },
  ];

  // Em caso de ambiente Supabase ausente, tentamos fallback ao Contentlayer
  if (fetchState.status === "env-missing") {
    const fallback = await fetchFromContentlayer();
    if (fallback.status === "ok") {
      // Reusa o mesmo template, apenas troca a fonte de dados
      const filtered = searchTerm
        ? fallback.posts.filter((post) => {
            const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
            return target.includes(searchTerm.toLowerCase());
          })
        : fallback.posts;

      const featured = filtered[0] ?? fallback.posts[0];
      const collections = buildCollections(filtered);

      const metaTitleStr = typeof metadata.title === "string" ? metadata.title : "Blog | By Imp�rio Dog";
      const metaDescStr = metadata.description ?? "Conte�do evergreen sobre sa�de, rotina e comportamento do Spitz Alem�o An�o (Lulu da Pomer�nia).";
      const blogSchema = buildBlogSchema({
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br",
        headline: metaTitleStr,
        description: metaDescStr,
        posts: fallback.posts.slice(0, 12),
      });
      const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
      const crumbs = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "In�cio", item: `${siteBase}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteBase}/blog` },
        ],
      };
      const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${siteBase}/blog#itemlist`,
        itemListElement: filtered.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${siteBase}/blog/${p.slug}`,
          name: p.title,
        })),
      };

      const guiaDoTutorCollection = collections.find(c => c.definition.id === "guia-do-tutor");
      const otherCollections = collections.filter(c => c.definition.id !== "guia-do-tutor");

      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
          <SeoJsonLd data={[blogSchema, crumbs, itemList]} />
          <Hero searchTerm={searchTerm} links={heroLinks} />
          {featured ? <FeaturedPost post={featured} /> : null}
          {searchTerm && filtered.length === 0 ? (
            <EmptyState
              title="Nenhum artigo corresponde ao termo pesquisado"
              message="Use palavras-chave como sa�de, rotina, comportamento ou investimento."
            />
          ) : null}
          {guiaDoTutorCollection && guiaDoTutorCollection.posts.length > 0 && !searchTerm ? (
            <GuiaDoTutorSection collection={guiaDoTutorCollection} />
          ) : null}
          {otherCollections.map((collection) =>
            collection.posts.length > 0 ? (
              <CategorySection key={collection.definition.id} collection={collection} />
            ) : null
          )}
        </div>
      );
    }
    // Se fallback também não tiver posts, mostra estado vazio
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={heroLinks} />
        <EmptyState
          title="Nenhum artigo publicado ainda"
          message="Assim que novos conte�dos estiverem prontos, voc� ser� notificado nas redes sociais."
        />
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={heroLinks} />
        <EmptyState
          title="N�o foi poss�vel carregar os artigos"
          message={fetchState.message || "Tente novamente em instantes."}
        />
      </div>
    );
  }

  if (fetchState.status === "empty") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Hero searchTerm={searchTerm} links={heroLinks} />
        {/* tenta fallback para Contentlayer também quando não houver posts no Supabase */}
        {await (async () => {
          const fb = await fetchFromContentlayer();
          if (fb.status !== "ok") {
            return (
              <EmptyState
                title="Nenhum artigo publicado ainda"
                message="Assim que novos conte�dos estiverem prontos, voc� ser� notificado nas redes sociais."
              />
            );
          }
          const filtered = searchTerm
            ? fb.posts.filter((post) => {
                const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
                return target.includes(searchTerm.toLowerCase());
              })
            : fb.posts;
          const guiaDoTutorCollection = buildCollections(filtered).find(c => c.definition.id === "guia-do-tutor");
          const otherCollections = buildCollections(filtered).filter(c => c.definition.id !== "guia-do-tutor");
          return (
            <div className="mt-10 space-y-10">
              {guiaDoTutorCollection && guiaDoTutorCollection.posts.length > 0 ? (
                <GuiaDoTutorSection collection={guiaDoTutorCollection} />
              ) : null}
              {otherCollections.map((collection) =>
                collection.posts.length > 0 ? (
                  <CategorySection key={collection.definition.id} collection={collection} />
                ) : null
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  const filtered = searchTerm
    ? fetchState.posts.filter((post) => {
        const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
        return target.includes(searchTerm.toLowerCase());
      })
    : fetchState.posts;

  const featured = filtered[0] ?? fetchState.posts[0];
  const collections = buildCollections(filtered);

  const metaTitleStr = typeof metadata.title === "string" ? metadata.title : "Blog | By Imp�rio Dog";
  const metaDescStr = metadata.description ?? "Conte�do evergreen sobre sa�de, rotina e comportamento do Spitz Alem�o An�o (Lulu da Pomer�nia).";
  const blogSchema = buildBlogSchema({
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br",
    headline: metaTitleStr,
    description: metaDescStr,
    posts: fetchState.posts.slice(0, 12),
  });
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "In�cio", item: `${siteBase}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteBase}/blog` },
    ],
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteBase}/blog#itemlist`,
    itemListElement: filtered.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${siteBase}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  // Separar "Guia do Tutor" para destaque
  const guiaDoTutorCollection = collections.find(c => c.definition.id === "guia-do-tutor");
  const otherCollections = collections.filter(c => c.definition.id !== "guia-do-tutor");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
  <SeoJsonLd data={[blogSchema, crumbs, itemList]} />
      <Hero searchTerm={searchTerm} links={heroLinks} />
      {featured ? <FeaturedPost post={featured} /> : null}

      {/* An�ncio de resultados para leitores de tela */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {searchTerm && filtered.length > 0 && `${filtered.length} artigo${filtered.length > 1 ? 's' : ''} encontrado${filtered.length > 1 ? 's' : ''} para "${searchTerm}"`}
        {searchTerm && filtered.length === 0 && `Nenhum artigo encontrado para "${searchTerm}"`}
      </div>

      {searchTerm && filtered.length === 0 ? (
        <EmptyState
          title="Nenhum artigo corresponde ao termo pesquisado"
          message="Use palavras-chave como sa�de, rotina, comportamento ou investimento."
        />
      ) : null}

      {/* Guia do Tutor em destaque */}
      {guiaDoTutorCollection && guiaDoTutorCollection.posts.length > 0 && !searchTerm ? (
        <GuiaDoTutorSection collection={guiaDoTutorCollection} />
      ) : null}

      {otherCollections.map((collection) =>
        collection.posts.length > 0 ? (
          <CategorySection key={collection.definition.id} collection={collection} />
        ) : null
      )}

      {fetchState.status === "ok" ? (
        <nav className="mx-auto mt-2 flex items-center justify-center gap-3">
          {fetchState.hasPrev ? (
            <Link
              href={`/blog?${new URLSearchParams({ q: searchTerm || "", sort, page: String((fetchState.page || 1) - 1) })}`}
              className="rounded-pill border border-border px-4 py-2 text-sm"
            >
              Anteriores
            </Link>
          ) : null}
          <span className="text-xs text-text-soft">
            P�gina {fetchState.page} de {Math.max(1, Math.ceil(fetchState.total / fetchState.pageSize))}
          </span>
          {fetchState.hasNext ? (
            <Link
              href={`/blog?${new URLSearchParams({ q: searchTerm || "", sort, page: String((fetchState.page || 1) + 1) })}`}
              className="rounded-pill border border-border px-4 py-2 text-sm"
            >
              Pr�ximos
            </Link>
          ) : null}
        </nav>
      ) : null}

      <aside className="grid gap-6 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:grid-cols-3">
        {heroLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-subtle p-5 transition hover:-translate-y-1 hover:border-brand/70"
          >
            <h3 className="text-base font-semibold text-text group-hover:text-brand">{link.title}</h3>
            <p className="text-sm text-text-muted">{link.description}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              Leia tamb�m
            </span>
          </Link>
        ))}
      </aside>
    </div>
  );
}

function includesCategory(post: PublicPost, tags: string[]) {
  const category = (post.category || "").toLowerCase();
  const hasTag = tags.some((tag) => category.includes(tag));
  if (hasTag) return true;
  const normalizedTags = (post.tags ?? []) as string[] | undefined;
  return normalizedTags ? normalizedTags.some((tag) => tags.includes(tag.toLowerCase())) : false;
}

async function fetchPosts({ sort, page }: { sort: SortOption; page: number }): Promise<FetchState> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { status: "env-missing" };
    }

    const { posts, page: current, pageSize, total, hasNext, hasPrev } = await listPostsWithMeta({ page, pageSize: 12, sort, status: "published" });
    const mapped = (posts ?? []) as PublicPost[];
    if (!mapped.length) {
      const fb = await fetchFromContentlayer(12);
      if (fb.status === "ok") return fb;
      return { status: "empty" };
    }
    return { status: "ok", posts: mapped, page: current, pageSize, total, hasNext, hasPrev };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    if (process.env.NODE_ENV !== "production") {
      console.error("[blog] falha ao carregar posts", message);
    }
    // tentativa final de fallback
    const fb = await fetchFromContentlayer(12);
    if (fb.status === "ok") return fb;
    return { status: "error", message };
  }
}

async function fetchFromContentlayer(limit = 12): Promise<FetchState> {
  try {
    const { items, page, pageSize, total } = await getAllPosts({ page: 1, pageSize: limit });
    const mapped: PublicPost[] = items.map((p) => ({
      id: p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || null,
      cover_url: p.cover || null,
      cover_alt: p.title,
      published_at: p.date || null,
      updated_at: p.updated || null,
      content_mdx: null,
      status: "published",
      category: p.category || null,
      author_id: null,
      tags: p.tags || null,
    }));
    if (!mapped.length) return { status: "empty" };
    return { status: "ok", posts: mapped, page, pageSize, total, hasNext: false, hasPrev: false };
  } catch (e) {
    return { status: "empty" };
  }
}

function buildCollections(posts: PublicPost[]) {
  const fallback = posts.filter((post) => !post.category);
  return CATEGORY_DEFINITIONS.map((definition) => {
    const filtered = posts.filter((post) => definition.match(post));
    const bucket =
      filtered.length > 0
        ? filtered
        : definition.id === "guia-do-tutor"
          ? fallback.length > 0
            ? fallback
            : posts
          : [];
    return { definition, posts: bucket.slice(0, 4) };
  });
}

function Hero({ searchTerm, links }: { searchTerm: string; links: Array<{ title: string; description: string; href: string }> }) {
  return (
    <header className="flex flex-col gap-8 rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-10 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-4">
        <span className="inline-flex items-center gap-2 rounded-pill bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          Conte�do premium para tutores
        </span>
        <h1 className="text-3xl font-serif text-text sm:text-4xl">
          Blog By Imperio Dog: decis�o com responsabilidade come�a pelo conhecimento.
        </h1>
        <p className="text-sm text-text-muted">
          Damos transpar�ncia total sobre rotina, sa�de e comportamento do Spitz Alem�o An�o (Lulu da Pomer�nia).
          Leia os pilares evergreen e avance para o formul�rio sob consulta quando estiver pronto.
        </p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="blog-search" className="sr-only">
            Pesquisar artigos
          </label>
          <input
            id="blog-search"
            name="q"
            defaultValue={searchTerm}
            placeholder="Buscar por sa�de, rotina, comportamento..."
            className="flex-1 rounded-pill border border-border bg-surface-subtle px-5 py-3 text-sm text-text focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft hover:bg-brand-600"
          >
            Pesquisar
          </button>
        </form>
      </div>
      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        {links.slice(0, 2).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-surface-subtle p-5 transition hover:-translate-y-1 hover:border-brand/70"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Leia tamb�m</span>
            <h3 className="text-base font-semibold text-text group-hover:text-brand">{link.title}</h3>
            <p className="text-sm text-text-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </header>
  );
}

function FeaturedPost({ post }: { post: PublicPost }) {
  const formattedDate = formatDate(post.published_at || post.updated_at);
  const minutes = estimateReadingTime(post.content_mdx ?? post.excerpt ?? "");
  const href = `/blog/${post.slug}`;

  return (
    <article className="relative grid gap-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-surface-subtle shadow-soft lg:grid-cols-[1.45fr,1fr]">
      <div className="order-2 flex flex-col justify-between gap-4 p-8 lg:order-1 lg:p-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Destaque
          </span>
          <h2 className="text-3xl font-serif text-text">
            <Link href={href} className="transition hover:text-brand">
              {post.title}
            </Link>
          </h2>
          {post.excerpt ? <p className="text-sm text-text-muted">{post.excerpt}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-soft">
          {formattedDate ? <span>{formattedDate}</span> : null}
          {minutes ? (
            <span className="rounded-pill bg-surface-subtle px-3 py-1 font-semibold text-text">
              {minutes} min de leitura
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow-soft hover:bg-brand-600"
          >
            Ler artigo completo
          </Link>
          <Link
            href="/filhotes"
            className="inline-flex items-center justify-center rounded-pill border border-border px-5 py-2 text-sm font-semibold text-text hover:border-brand"
          >
            Ver filhotes sob consulta
          </Link>
        </div>
      </div>
      <div className="relative order-1 min-h-[240px] overflow-hidden bg-surface-subtle lg:order-2">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt || post.title}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.28em] text-text-soft">
            Conte�do exclusivo
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/0" />
      </div>
    </article>
  );
}

function CategorySection({
  collection,
}: {
  collection: { definition: CategoryDefinition; posts: PublicPost[] };
}) {
  const { definition, posts } = collection;

  return (
    <section aria-labelledby={`categoria-${definition.id}`} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 id={`categoria-${definition.id}`} className="text-2xl font-serif text-text">
            {definition.title}
          </h2>
          <p className="max-w-2xl text-sm text-text-muted">{definition.description}</p>
        </div>
        <Link
          href={definition.cta.href}
          className="inline-flex items-center justify-center rounded-pill border border-border px-5 py-2 text-sm font-semibold text-text hover:border-brand"
        >
          {definition.cta.label}
        </Link>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-brand">{definition.highlight}</p>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
function GuiaDoTutorSection({
  collection,
}: {
  collection: { definition: CategoryDefinition; posts: PublicPost[] };
}) {
  const { definition, posts } = collection;

  return (
    <section
      aria-labelledby="guia-tutor-heading"
      className="space-y-6 rounded-3xl border-2 border-brand/20 bg-gradient-to-br from-brand/5 via-surface to-surface p-8 shadow-lg"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
            Guia do Tutor
          </span>
          <h2 id="guia-tutor-heading" className="text-3xl font-serif text-text">
            {definition.title}
          </h2>
          <p className="max-w-3xl text-base text-text-muted">{definition.description}</p>
        </div>
        <Link
          href={definition.cta.href}
          className="inline-flex items-center justify-center rounded-pill border border-brand/30 px-5 py-2 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/10"
        >
          {definition.cta.label}
        </Link>
      </div>

      <p className="text-sm font-semibold text-brand">{definition.highlight}</p>

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface-subtle px-6 py-10 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function buildBlogSchema({
  url,
  headline,
  description,
  posts,
}: {
  url: string;
  headline: string;
  description: string;
  posts: PublicPost[];
}) {
  const base = url.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${base}/blog#blog`,
    mainEntityOfPage: `${base}/blog`,
    name: headline,
    description,
    publisher: {
      "@type": "Organization",
      name: "By Imperio Dog",
      url: base,
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${base}/blog/${post.slug}`,
      datePublished: post.published_at,
      image: post.cover_url ? [post.cover_url] : undefined,
    })),
  };
}



