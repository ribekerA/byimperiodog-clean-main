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
  color: string;
  match: (post: PublicPost) => boolean;
  cta: { label: string; href: string };
};

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "comportamento",
    title: "Comportamento",
    description:
      "Socialização guiada, enriquecimento ambiental e reforço positivo focado em lares urbanos.",
    highlight: "Protocolos semanais com vídeos e check-ins pelo WhatsApp.",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    match: (post) => includesCategory(post, ["adestramento", "comportamento", "socializacao", "tutor", "guia"]),
    cta: { label: "Conhecer nosso processo", href: "/sobre#processo" },
  },
  {
    id: "saude",
    title: "Saúde",
    description:
      "Preventivo completo: exames genéticos, cardiológicos e protocolos veterinários para Spitz.",
    highlight: "Transparência total com laudos digitais e acompanhamento pós-entrega.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    match: (post) => includesCategory(post, ["saude", "clínico", "veterin", "check-up", "exame"]),
    cta: { label: "Entender exames", href: "/faq#saude" },
  },
  {
    id: "preco",
    title: "Preços",
    description:
      "Respostas diretas sobre investimento, formas de pagamento e o que está incluído no valor.",
    highlight: "Conteúdo didático produzido com base nas dúvidas reais dos tutores.",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    match: (post) => includesCategory(post, ["preco", "investimento", "valor", "custo"]),
    cta: { label: "Ver preços", href: "/preco-spitz-anao" },
  },
  {
    id: "cuidados",
    title: "Cuidados",
    description:
      "Nutrição personalizada, higiene estratégica e protocolos preventivos para manter o Spitz saudável.",
    highlight: "Orientações da neonatologia ao primeiro ano com suporte contínuo.",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    match: (post) => includesCategory(post, ["cuidado", "rotina", "nutri", "higiene", "enxoval"]),
    cta: { label: "Ver dicas de cuidados", href: "/faq#cuidados" },
  },
  {
    id: "raca",
    title: "Raça",
    description:
      "Tudo sobre o Spitz Alemão Anão (Lulu da Pomerânia): características, padrão e história da raça.",
    highlight: "Guias completos escritos pela criadora com 13 anos de experiência.",
    color: "bg-rose-50 border-rose-200 text-rose-700",
    match: (post) => includesCategory(post, ["raca", "spitz", "pomerani", "historico", "caracteristica"]),
    cta: { label: "Conhecer a raça", href: "/spitz-alemao" },
  },
];

// Revalidate cache every 60 seconds in production, but disable cache in development
export const revalidate = process.env.NODE_ENV === "production" ? 60 : 0;
// Force dynamic rendering to always show latest posts
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | Guia do Spitz Alemão Anão (Lulu da Pomerânia) — By Império Dog",
  description:
    "Guias escritos pela criadora com 13 anos de experiência sobre Spitz Alemão Anão (Lulu da Pomerânia): cuidados, rotina, comportamento, saúde preventiva e preços.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | By Império Dog — Tudo sobre o Spitz Alemão Anão",
    description:
      "Pilares evergreen sobre saúde, rotina e comportamento do Spitz Alemão Anão (Lulu da Pomerânia).",
  },
};

type PageSearchParams = {
  q?: string;
  sort?: SortOption;
  page?: string;
  categoria?: string;
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const sort = searchParams?.sort === "antigos" ? "antigos" : "recentes";
  const searchTerm = (searchParams?.q || "").trim();
  const pageNum = Number(searchParams?.page || 1);
  const activeCat = searchParams?.categoria || "todos";
  const fetchState = await fetchPosts({ sort, page: pageNum });

  const siteBase = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br"
  ).replace(/\/$/, "");

  // Em caso de ambiente Supabase ausente, tentamos fallback ao Contentlayer
  if (fetchState.status === "env-missing") {
    const fallback = await fetchFromContentlayer();
    if (fallback.status === "ok") {
      return renderPage({ posts: fallback.posts, searchTerm, activeCat, siteBase, sort, pagination: null });
    }
    return renderEmpty(searchTerm, "Nenhum artigo publicado ainda", "Assim que novos conteúdos estiverem prontos, você será notificado nas redes sociais.");
  }

  if (fetchState.status === "error") {
    return renderEmpty(searchTerm, "Não foi possível carregar os artigos", fetchState.message || "Tente novamente em instantes.");
  }

  if (fetchState.status === "empty") {
    const fb = await fetchFromContentlayer();
    if (fb.status === "ok") {
      return renderPage({ posts: fb.posts, searchTerm, activeCat, siteBase, sort, pagination: null });
    }
    return renderEmpty(searchTerm, "Nenhum artigo publicado ainda", "Assim que novos conteúdos estiverem prontos, você será notificado nas redes sociais.");
  }

  return renderPage({
    posts: fetchState.posts,
    searchTerm,
    activeCat,
    siteBase,
    sort,
    pagination: {
      page: fetchState.page,
      pageSize: fetchState.pageSize,
      total: fetchState.total,
      hasNext: fetchState.hasNext,
      hasPrev: fetchState.hasPrev,
    },
  });
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function renderEmpty(searchTerm: string, title: string, message: string) {
  return (
    <div className="min-h-screen bg-white">
      <BlogHero searchTerm={searchTerm} />
      <div className="mx-auto max-w-4xl px-5 py-16">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-10 text-center">
          <p className="text-2xl font-bold text-zinc-800">{title}</p>
          <p className="mt-3 text-zinc-500">{message}</p>
        </div>
      </div>
    </div>
  );
}

function renderPage({
  posts,
  searchTerm,
  activeCat,
  siteBase,
  sort,
  pagination,
}: {
  posts: PublicPost[];
  searchTerm: string;
  activeCat: string;
  siteBase: string;
  sort: SortOption;
  pagination: { page: number; pageSize: number; total: number; hasNext: boolean; hasPrev: boolean } | null;
}) {
  const metaTitleStr = "Blog | By Império Dog — Tudo sobre o Spitz Alemão Anão";
  const metaDescStr =
    "Guias escritos pela criadora com 13 anos de experiência sobre Spitz Alemão Anão.";

  const blogSchema = buildBlogSchema({
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br",
    headline: metaTitleStr,
    description: metaDescStr,
    posts: posts.slice(0, 12),
  });
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${siteBase}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteBase}/blog` },
    ],
  };

  const filtered = searchTerm
    ? posts.filter((post) => {
        const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
        return target.includes(searchTerm.toLowerCase());
      })
    : activeCat !== "todos"
      ? posts.filter((post) => {
          const def = CATEGORY_DEFINITIONS.find((d) => d.id === activeCat);
          return def ? def.match(post) : true;
        })
      : posts;

  const featured = filtered[0] ?? posts[0];
  const rest = filtered.slice(1);
  const collections = buildCollections(posts);

  return (
    <div className="min-h-screen bg-white">
      <SeoJsonLd data={[blogSchema, crumbs]} />

      {/* Hero */}
      <BlogHero searchTerm={searchTerm} />

      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Category tabs */}
        <div className="sticky top-0 z-30 -mx-4 bg-white/95 backdrop-blur-sm sm:-mx-6 lg:-mx-8">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
            {[{ id: "todos", title: "Todos" }, ...CATEGORY_DEFINITIONS].map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?categoria=${cat.id}${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ""}`}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeCat === cat.id
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {searchTerm && filtered.length > 0 &&
            `${filtered.length} artigo${filtered.length > 1 ? "s" : ""} encontrado${filtered.length > 1 ? "s" : ""} para "${searchTerm}"`}
          {searchTerm && filtered.length === 0 && `Nenhum artigo encontrado para "${searchTerm}"`}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-zinc-100 bg-zinc-50 p-10 text-center">
            <p className="text-xl font-bold text-zinc-800">Nenhum artigo encontrado</p>
            <p className="mt-2 text-zinc-500">
              Use palavras-chave como saúde, rotina, comportamento ou investimento.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Ver todos os artigos
            </Link>
          </div>
        )}

        {/* Featured post */}
        {featured && !searchTerm && activeCat === "todos" && (
          <div className="mt-8">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
              Artigo em destaque
            </p>
            <FeaturedPost post={featured} />
          </div>
        )}

        {/* Collections by category (when no filter active) */}
        {!searchTerm && activeCat === "todos" && (
          <div className="mt-16 space-y-16">
            {collections.map((collection) =>
              collection.posts.length > 0 ? (
                <CategorySection key={collection.definition.id} collection={collection} />
              ) : null
            )}
          </div>
        )}

        {/* Filtered grid */}
        {(searchTerm || activeCat !== "todos") && filtered.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <nav className="mt-12 flex items-center justify-center gap-3">
            {pagination.hasPrev ? (
              <Link
                href={`/blog?${new URLSearchParams({ q: searchTerm || "", sort, page: String((pagination.page || 1) - 1) })}`}
                className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700"
              >
                ← Anteriores
              </Link>
            ) : null}
            <span className="text-xs text-zinc-400">
              Página {pagination.page} de{" "}
              {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
            </span>
            {pagination.hasNext ? (
              <Link
                href={`/blog?${new URLSearchParams({ q: searchTerm || "", sort, page: String((pagination.page || 1) + 1) })}`}
                className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700"
              >
                Próximos →
              </Link>
            ) : null}
          </nav>
        )}

        {/* Mini FAQ + CTA final */}
        <BlogFooterSection />
      </div>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function BlogHero({ searchTerm }: { searchTerm: string }) {
  return (
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
          <span className="text-emerald-400">Spitz Alemão Anão</span>
        </h1>
        <p className="mt-4 text-base text-zinc-300 sm:text-lg">
          Guias escritos pela criadora com 13 anos de experiência.
          Sem jargão, sem enrolação.
        </p>
        <form
          action="/blog"
          method="GET"
          className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="blog-search-hero" className="sr-only">
            Pesquisar artigos
          </label>
          <input
            id="blog-search-hero"
            name="q"
            defaultValue={searchTerm}
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
  );
}

function FeaturedPost({ post }: { post: PublicPost }) {
  const formattedDate = formatDate(post.published_at || post.updated_at);
  const minutes = estimateReadingTime(post.content_mdx ?? post.excerpt ?? "");
  const href = `/blog/${post.slug}`;

  return (
    <article className="grid overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md lg:grid-cols-[1.6fr,1fr]">
      {/* Content */}
      <div className="order-2 flex flex-col justify-between gap-5 p-8 lg:order-1 lg:p-10">
        <div className="space-y-3">
          {post.category && (
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {post.category}
            </span>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            <Link href={href} className="hover:text-emerald-700 transition">
              {post.title}
            </Link>
          </h2>
          {post.excerpt && (
            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            {formattedDate && <span>{formattedDate}</span>}
            {minutes ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-600">
                {minutes} min de leitura
              </span>
            ) : null}
          </div>
          <Link
            href={href}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            Ler artigo →
          </Link>
        </div>
      </div>

      {/* Image */}
      <div className="relative order-1 min-h-[220px] overflow-hidden bg-emerald-50 lg:order-2">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt || post.title}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="h-full w-full object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🐾</div>
        )}
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
        <div className="space-y-1">
          <span
            className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${definition.color}`}
          >
            {definition.title}
          </span>
          <h2
            id={`categoria-${definition.id}`}
            className="text-2xl font-bold tracking-tight text-zinc-900"
          >
            {definition.title}
          </h2>
          <p className="max-w-2xl text-sm text-zinc-500">{definition.description}</p>
          <p className="text-xs font-semibold text-emerald-700">{definition.highlight}</p>
        </div>
        <Link
          href={definition.cta.href}
          className="shrink-0 rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-emerald-500 hover:text-emerald-700 transition"
        >
          {definition.cta.label}
        </Link>
      </div>

      <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

const MINI_FAQ = [
  {
    q: "Os artigos são escritos por quem?",
    a: "Todo o conteúdo é produzido ou revisado pela criadora, com 13 anos de experiência exclusiva com Spitz Alemão Anão (Lulu da Pomerânia). Sem terceiros, sem conteúdo genérico.",
  },
  {
    q: "Posso compartilhar os artigos?",
    a: "Sim, e incentivamos! Os conteúdos são gratuitos e produzidos para ajudar futuros tutores a tomar decisões mais conscientes.",
  },
  {
    q: "Como recebo novos conteúdos?",
    a: "Siga nosso Instagram @byimperiodog ou entre em contato pelo WhatsApp para receber novidades em primeira mão.",
  },
];

function BlogFooterSection() {
  return (
    <div className="mt-20 space-y-10">
      {/* Mini FAQ */}
      <section className="rounded-3xl border border-zinc-100 bg-zinc-50 p-8 sm:p-10">
        <h2 className="text-lg font-bold text-zinc-900">Perguntas sobre o blog</h2>
        <dl className="mt-6 space-y-5">
          {MINI_FAQ.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-semibold text-zinc-900">{item.q}</dt>
              <dd className="mt-1 text-sm text-zinc-500">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-center text-white sm:p-10">
        <h2 className="text-2xl font-bold">Pronto para conhecer um filhote?</h2>
        <p className="mt-3 text-emerald-100">
          Mais de 180 famílias já encontraram o Spitz ideal conosco. Pode ser a sua vez.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/filhotes"
            className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition"
          >
            Ver filhotes disponíveis
          </Link>
          <Link
            href="/contato"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Falar com a criadora
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function includesCategory(post: PublicPost, tags: string[]) {
  const category = (post.category || "").toLowerCase();
  const hasTag = tags.some((tag) => category.includes(tag));
  if (hasTag) return true;
  const normalizedTags = (post.tags ?? []) as string[] | undefined;
  return normalizedTags
    ? normalizedTags.some((tag) => tags.includes(tag.toLowerCase()))
    : false;
}

async function fetchPosts({
  sort,
  page,
}: {
  sort: SortOption;
  page: number;
}): Promise<FetchState> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { status: "env-missing" };
    }

    const { posts, page: current, pageSize, total, hasNext, hasPrev } =
      await listPostsWithMeta({ page, pageSize: 12, sort, status: "published" });
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
  } catch {
    return { status: "empty" };
  }
}

function buildCollections(posts: PublicPost[]) {
  return CATEGORY_DEFINITIONS.map((definition) => {
    const filtered = posts.filter((post) => definition.match(post));
    const bucket = filtered.length > 0 ? filtered : [];
    return { definition, posts: bucket.slice(0, 4) };
  });
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
