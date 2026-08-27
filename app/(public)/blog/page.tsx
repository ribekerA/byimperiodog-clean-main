import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import BlogCard from "@/components/blog/BlogCard";
import SeoJsonLd from "@/components/SeoJsonLd";
import { FOUNDING_YEAR } from "@/domain/config";
import {
  BLOG_CATEGORIES,
  matchesCategory,
  type BlogCategory,
  type BlogListPost,
} from "@/lib/blog/categories";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { TAG_LISTAGEM_BLOG } from "@/lib/blog/revalidate";
import { listPublishableSupabasePosts } from "@/lib/blog/service";
import { getAllPosts } from "@/lib/content";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";

import BlogFilterShell from "./BlogFilterShell";

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

// Esta pagina e ESTATICA. Ela era renderizada por requisicao porque lia
// `searchParams` (busca, categoria e ordenacao) — e ler `searchParams` e, por
// si so, uma API dinamica no App Router. O filtro passou para o cliente
// (BlogFilterShell) e o que sobrou aqui e so leitura de dados cacheada, entao o
// HTML sai pronto no build e o CDN serve sem acordar funcao nenhuma.
//
// O `dynamic = "force-dynamic"` que ja tinha saido daqui antes era pior ainda:
// desligava o cache de dados, refazendo a consulta ao Supabase a cada visita, e
// tinha precedencia sobre `revalidate`.
//
// `revalidate = 300` continua valendo: o HTML e regerado no maximo a cada 5
// minutos quando ha post novo so no banco.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog | Guia do Spitz Alemão Anão",
  description:
    `Guias escritos pela criadora, que cria a raça desde ${FOUNDING_YEAR}, sobre Spitz Alemão Anão: cuidados, rotina, comportamento, saúde preventiva e preços.`,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | By Império Dog — Tudo sobre o Spitz Alemão Anão",
    description:
      "Pilares evergreen sobre saúde, rotina e comportamento do Spitz Alemão Anão.",
    // Sem `images` aqui o Next 14 não herda o opengraph-image do segmento: a
    // página saía com og:title e nenhum og:image. Era a única URL do sitemap
    // ainda sem imagem de compartilhamento.
    images: [OG_DEFAULT_IMAGE],
  },
};

export default async function BlogListPage() {
  const posts = await fetchPosts();

  const siteBase = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br"
  ).replace(/\/$/, "");

  // O que atravessa para o cliente. `content_mdx` fica de fora de proposito: um
  // post vindo do Supabase carrega o corpo inteiro do artigo, e a listagem so
  // precisa do numero de minutos.
  const listPosts: BlogListPost[] = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? null,
    cover_url: post.cover_url ?? null,
    cover_alt: post.cover_alt ?? null,
    published_at: post.published_at ?? null,
    updated_at: post.updated_at ?? null,
    category: post.category ?? null,
    tags: post.tags ?? null,
    reading_minutes: post.content_mdx ? estimateReadingTime(post.content_mdx) : null,
  }));

  const metaTitleStr = "Blog | By Império Dog — Tudo sobre o Spitz Alemão Anão";
  const metaDescStr =
    `Guias escritos pela criadora, que cria a raça desde ${FOUNDING_YEAR}, sobre Spitz Alemão Anão.`;

  const blogSchema = buildBlogSchema({
    url: siteBase,
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

  const featured = posts[0];
  const collections = buildCollections(posts);

  return (
    <>
      <SeoJsonLd data={[blogSchema, crumbs]} />

      <BlogFilterShell posts={listPosts} footer={<BlogFooterSection />}>
        {posts.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-zinc-100 bg-zinc-50 p-10 text-center">
            <p className="text-2xl font-bold text-zinc-800">Nenhum artigo publicado ainda</p>
            <p className="mt-3 text-zinc-500">
              Assim que novos conteúdos estiverem prontos, você será notificado nas redes sociais.
            </p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <div className="mt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
                  Artigo em destaque
                </p>
                <FeaturedPost post={featured} />
              </div>
            )}

            {/* Collections by category */}
            <div className="mt-16 space-y-16">
              {collections.map((collection) =>
                collection.posts.length > 0 ? (
                  <CategorySection key={collection.definition.id} collection={collection} />
                ) : null
              )}
            </div>
          </>
        )}
      </BlogFilterShell>
    </>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

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
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {formattedDate && <span>{formattedDate}</span>}
            {minutes ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-600">
                {minutes} min de leitura
              </span>
            ) : null}
          </div>
          <Link
            href={href}
            className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Ler artigo →
          </Link>
        </div>
      </div>

      {/* Image */}
      <div className="relative order-1 aspect-[4/3] overflow-hidden bg-emerald-50 sm:aspect-[16/9] lg:order-2 lg:aspect-auto">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt || post.title}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-center"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-emerald-50">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">Sem capa</span>
          </div>
        )}
      </div>
    </article>
  );
}

function CategorySection({
  collection,
}: {
  collection: { definition: BlogCategory; posts: PublicPost[] };
}) {
  const { definition, posts } = collection;

  return (
    <section aria-labelledby={`categoria-${definition.id}`} className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${definition.color}`}>
            {definition.title}
          </span>
          <h2 id={`categoria-${definition.id}`} className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {definition.title}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-500">{definition.description}</p>
          {definition.highlight && (
            <p className="text-xs font-semibold text-emerald-700">{definition.highlight}</p>
          )}
        </div>
        <Link
          href={definition.cta.href}
          className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {definition.cta.label}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    a: "Os conteúdos são produzidos com apoio de ferramentas de tecnologia e revisados pela equipe da By Império Dog antes da publicação, com base na experiência prática do canil com Spitz Alemão Anão (Lulu da Pomerânia). Detalhamos o processo na nossa Política Editorial.",
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
          Criamos Spitz Alemão Anão desde {FOUNDING_YEAR}, com registro oficial, consulta veterinária, hemograma completo e mentoria pós-venda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/filhotes"
            className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition"
          >
            Ver a vitrine de filhotes
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

// Mesma precedência de /blog/[slug]: os artigos de content/posts formam a
// lista, e o Supabase só acrescenta os slugs que existem apenas no banco e têm
// corpo de verdade (isPublishableSupabasePost).
//
// Era o contrário — a listagem vinha inteira do Supabase e só caía no MDX se a
// consulta voltasse vazia. Como o banco tem 7 linhas publicadas e 6 delas são
// seed (141 a 558 caracteres, com "\n" literal), /blog mostrava um "artigo em
// destaque" cujo link respondia 404 e não listava nenhum dos 30 artigos reais.
// O Supabase e consultado no maximo uma vez a cada 5 minutos, nao a cada visita.
//
// A consulta traz ate 500 linhas COM `content_mdx` -- o corpo inteiro de todos
// os artigos publicados -- e da tudo isso a listagem usa so titulo, resumo e
// capa. O corpo nao da para tirar do select: e ele que
// `isPublishableSupabasePost` mede para decidir se a linha vira pagina de
// verdade ou e seed. Entao o caminho e cachear, e nao emagrecer a consulta.
//
// Custo de um post novo demorar ate 5 minutos para aparecer na listagem: a
// pagina do artigo (/blog/[slug]) nao depende disto.
// A janela de 5 minutos e o teto, nao a espera normal: publicar pelo admin
// dispara `revalidarListagemBlog()` e o post aparece na hora.
const lerPostsDoSupabase = unstable_cache(
  listPublishableSupabasePosts,
  ["blog-listagem-supabase"],
  { revalidate: 300, tags: [TAG_LISTAGEM_BLOG] }
);

async function fetchPosts(): Promise<PublicPost[]> {
  const bySlug = new Map<string, PublicPost>();

  for (const post of await fetchFromContentlayer()) bySlug.set(post.slug, post);

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      for (const post of await lerPostsDoSupabase()) {
        if (!bySlug.has(post.slug)) bySlug.set(post.slug, post as PublicPost);
      }
    }
  } catch (error) {
    // Banco fora do ar não pode derrubar a listagem: os MDX já são a base.
    if (process.env.NODE_ENV !== "production") {
      console.error("[blog] falha ao ler posts do Supabase", error instanceof Error ? error.message : error);
    }
  }

  // Página única: os 30 artigos ficam a um clique de /blog em vez de escondidos
  // atrás de ?page=2.
  return [...bySlug.values()].sort((a, b) => {
    const dateA = Date.parse(a.published_at ?? "") || 0;
    const dateB = Date.parse(b.published_at ?? "") || 0;
    return dateB - dateA;
  });
}

async function fetchFromContentlayer(): Promise<PublicPost[]> {
  try {
    // 50 e o teto que `getAllPosts` impoe (Math.min(50, pageSize)). Hoje sao 30
    // artigos; passando de 50 esta listagem precisa paginar de verdade, senao o
    // excedente some sem aviso.
    const { items } = await getAllPosts({ page: 1, pageSize: 50 });
    return items.map((p) => ({
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
  } catch {
    return [];
  }
}

function buildCollections(posts: PublicPost[]) {
  // Sem corte em 4. A grade é `lg:grid-cols-4` e quebra sozinha em novas
  // linhas, então o corte não mudava o layout — só escondia artigo. Com ele,
  // 11 dos 30 posts não recebiam nenhum link interno em todo o site: estavam
  // no sitemap e não estavam em lugar nenhum da navegação, /blog/guia-spitz-alemao
  // inclusive. Página órfã é página que o Google encontra sem contexto.
  return BLOG_CATEGORIES.map((definition) => ({
    definition,
    posts: posts.filter((post) => matchesCategory(post, definition)),
  }));
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
      name: "By Império Dog",
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
