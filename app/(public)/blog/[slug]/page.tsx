import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import ArticleSources from "@/components/blog/ArticleSources";
import BlogCTAs from "@/components/blog/BlogCTAs";
import BlogPuppyBanner from "@/components/blog/BlogPuppyBanner";
import Comments from "@/components/blog/Comments";
import FloatingReadCTA from "@/components/blog/FloatingReadCTA";
import PostCard from "@/components/blog/PostCard";
import Prose from "@/components/blog/Prose";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ScrollAnalytics from "@/components/blog/ScrollAnalytics";
import ShareButtons from "@/components/blog/ShareButtons";
import StickyArticleCTA from "@/components/blog/StickyArticleCTA";
import TocPanel from "@/components/blog/TocPanel";
import Breadcrumbs from "@/components/Breadcrumbs";
import LeadForm from "@/components/LeadForm";
import { mdxComponents } from "@/components/MDXContent";
import PageViewPing from "@/components/PageViewPing";
import SeoJsonLd from "@/components/SeoJsonLd";
import { getImageSize } from "@/lib/_generated-image-sizes";
import { generatedPosts } from "@/lib/_generated-posts";
import { isCommentablePostId } from "@/lib/blog/commentable";
import { compileBlogMdx, demoteBodyH1Plugin } from "@/lib/blog/mdx/compile";
import { isPublishableSupabasePost } from "@/lib/blog/publishable";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { getRelatedUnified } from "@/lib/blog/related";
import { buildBlogMetadata, buildArticleJsonLd, extractFaqFromMdx } from "@/lib/blog/seo";
import { parseSources } from "@/lib/blog/sources";
import { getPostBySlug as getMdxPostBySlug } from "@/lib/content";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { supabaseAnon } from "@/lib/supabaseAnon";
import { whatsappLeadUrl } from "@/lib/utm";

interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content_mdx?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  author_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  lang?: string | null;
  // Só o caminho MDX preenche: `blog_posts` não tem essa coluna.
  sources?: string[] | null;
}

interface Author {
  name: string;
  slug?: string;
  avatar_url?: string | null;
}

interface RelatedAny {
  slug: string;
  title: string;
  excerpt?: string | null;
  published_at?: string | null;
  cover_url?: string | null;
}

type MDXComponentsMap = Record<string, React.ComponentType<Record<string, unknown>>>;

// Colunas reais de blog_posts. A lista antiga terminava em ",faq" — coluna que
// não existe na tabela. O PostgREST respondia 42703 ("column blog_posts.faq
// does not exist") em TODA requisição, então o ramo do Supabase nunca devolvia
// post nenhum: o blog inteiro era servido pelo fallback MDX, e os slugs que só
// existem no banco davam 404 mesmo estando declarados no sitemap.
const POST_COLUMNS =
  "id,slug,title,subtitle,excerpt,content_mdx,cover_url,cover_alt,published_at,created_at,updated_at,status,author_id,seo_title,seo_description,category,tags,lang";

async function fetchSupabasePost(slug: string): Promise<Post | null> {
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb.from("blog_posts").select(POST_COLUMNS).eq("slug", slug).maybeSingle();

    if (!error && data) {
      const post = data as Post;
      if (isPublishableSupabasePost(post)) return post;
    }
  } catch {
    // Supabase fora do ar nao pode derrubar o artigo: o MDX ja respondeu antes
    // daqui, e quando nao respondeu o retorno nulo cai no notFound() da pagina.
  }
  return null;
}

async function fetchPost(slug: string): Promise<Post | null> {
  // Precedência: MDX primeiro, Supabase depois — fora do preview.
  //
  // Não é a ordem que o código pedia, é a ordem que o site já pratica. Com o
  // select quebrado (ver POST_COLUMNS) os 30 artigos publicados sempre saíram
  // de content/posts. Consertar só o nome da coluna trocaria, sem aviso, o
  // corpo de artigos já indexados pela versão mais curta que dormia no banco
  // (cores-spitz-alemao-anao-qual-mais-cara: 6.709 caracteres em MDX contra
  // 2.018 no Supabase). O arquivo continua mandando onde existe arquivo; o
  // Supabase atende os slugs que só existem lá — posts criados pelo admin.
  //
  // O `?preview=1` saiu daqui. Ele so funcionava com NODE_ENV != production
  // (ou seja, nunca no site publicado), nenhuma pagina linkava para ele, e ler
  // `searchParams` e uma API dinamica: a presenca do parametro sozinha tirava
  // os 30 artigos do prerender e obrigava uma renderizacao por requisicao.
  const fromFile = await fetchMdxPost(slug);
  if (fromFile) return fromFile;
  return fetchSupabasePost(slug);
}

async function fetchMdxPost(slug: string): Promise<Post | null> {
  try {
    const mdx = await getMdxPostBySlug(slug);
    if (!mdx) return null;
    return {
      id:              mdx.slug,
      slug:            mdx.slug,
      title:           mdx.title,
      subtitle:        null,
      excerpt:         mdx.excerpt ?? null,
      content_mdx:     mdx.bodyRaw ?? null,
      cover_url:       mdx.cover ?? null,
      cover_alt:       mdx.title,
      published_at:    mdx.date ?? new Date().toISOString(),
      created_at:      mdx.date ?? new Date().toISOString(),
      updated_at:      mdx.updated ?? mdx.date ?? null,
      status:          "published",
      author_id:       null,
      seo_title:       mdx.seoTitle ?? null,
      seo_description: mdx.excerpt ?? null,
      category:        mdx.category ?? null,
      tags:            mdx.tags ?? null,
      lang:            "pt-BR",
      sources:         mdx.sources ?? null,
    } as Post;
  } catch {
    return null;
  }
}

async function fetchAuthor(authorId: string | null | undefined): Promise<Author | null> {
  if (!authorId) return null;
  try {
    const sb = supabaseAnon();
    const { data } = await sb.from("blog_authors").select("name,slug,avatar_url").eq("id", authorId).maybeSingle();
    return (data as Author) || null;
  } catch {
    return null;
  }
}

// Os 30 artigos de content/posts sao gerados no build.
//
// Isto devolvia `[]`, entao nenhum artigo era prerenderizado: cada visita
// recompilava o MDX dentro de uma funcao serverless da Netlify. Confirmado no
// .next/prerender-manifest.json — `/blog/[slug]` aparecia so como rota
// dinamica, sem nenhum caminho estatico.
//
// `dynamicParams` fica no padrao (true): slug que so existe no Supabase — post
// criado pelo admin depois do build — continua sendo renderizado sob demanda e
// cacheado. So deixa de ser o caminho de todo mundo.
export async function generateStaticParams() {
  return generatedPosts.map((post: { slug: string }) => ({ slug: post.slug }));
}

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) return {};
  return buildBlogMetadata(post as Post & { content_mdx?: string | null });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  let post: Post | null = null;
  try {
    post = await fetchPost(params.slug);
  } catch (e) {
    console.error('[blog/slug] fetchPost threw:', e);
    return notFound();
  }

  if (!post) return notFound();

  const author = await fetchAuthor(post.author_id);
  let compiled = null;
  try {
    compiled = post.content_mdx ? await compileBlogMdx(post.content_mdx) : null;
  } catch (e) {
    console.error('[blog/slug] compileBlogMdx error:', e);
  }
  const minutes = compiled?.readingTimeMinutes || estimateReadingTime(post.content_mdx || "");
  const related = (await getRelatedUnified(post.slug, 6)) as RelatedAny[];
  // Só do corpo do artigo: `blog_posts` não tem coluna `faq`, então o fallback
  // que lia post.faq era código morto — nunca chegou a valer nada.
  const faqItems = extractFaqFromMdx(post.content_mdx ?? "");
  const { article, breadcrumb, faqBlock } = buildArticleJsonLd(
    post as Post & { content_mdx?: string | null },
    author,
    { toc: compiled?.toc, faq: faqItems.length > 0 ? faqItems : undefined }
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br";

  // Um artigo por URL. A página emitia `Article` (buildArticleJsonLd) e
  // `BlogPosting` (blogPostingSchema) ao mesmo tempo, descrevendo o mesmo post
  // com headline e datas iguais mas `@id` e logo do publisher diferentes — duas
  // entidades concorrentes para a mesma página. Ficou o `Article`, que é o mais
  // completo (articleBody/about/wordCount/inLanguage) e usa o logo PNG, formato
  // que o Google aceita para `publisher.logo` (SVG não entra).
  const structuredData = [article, breadcrumb, faqBlock].filter(Boolean);

  const waPhone = (process.env.NEXT_PUBLIC_WA_PHONE || "").replace(/\D/g, "");
  const postUrl = `${siteUrl.replace(/\/$/, "")}/blog/${post.slug}`;
  // Medida real do arquivo. Estava fixo em 1280x720 (16:9) enquanto as capas sao
  // 3:2 — com h-auto o navegador reservava a altura errada e o artigo inteiro
  // pulava quando a imagem carregava, bem no elemento de LCP. Capa vinda do
  // Supabase nao esta no mapa; ai fica o 16:9 de antes como ultimo recurso.
  const [coverW, coverH] = (post.cover_url ? getImageSize(post.cover_url) : undefined) ?? [1280, 720];
  const sidebarWhatsappUrl = waPhone
    ? whatsappLeadUrl(waPhone, { pageType: "blog", url: postUrl })
    : `https://wa.me/5511968633239?text=${encodeURIComponent(`Olá! Li o artigo "${post.title}" e gostaria de saber mais sobre os filhotes.`)}`;

  const interlinks = [
    {
      title: "Filhotes sob consulta",
      description: "Entenda como selecionamos cada família e garanta prioridade na próxima ninhada.",
      href: "/filhotes",
    },
    {
      title: "Processo completo",
      description: "Veja as etapas: entrevista, socialização, entrega humanizada e mentoria vitalícia.",
      href: "/sobre#processo",
    },
    {
      title: "FAQ do tutor",
      description: "Respostas claras sobre investimento, suporte, logística e rotina diária.",
      href: "/faq-do-tutor",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10">
      <PageViewPing pageType="blog" />
      <SeoJsonLd data={structuredData} />
      <ReadingProgress />
      <FloatingReadCTA whatsappUrl={sidebarWhatsappUrl} />

      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Início", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title.length > 55 ? post.title.slice(0, 55) + "…" : post.title, href: `/blog/${post.slug}` },
        ]}
      />

      {/* Grid de 2 colunas no desktop: o sumário é um bloco próprio, renderizado
          UMA única vez no DOM (antes havia uma cópia "mobile" e outra "sidebar"). */}
      <article
        lang={post.lang || "pt-BR"}
        className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-x-12 lg:gap-y-8"
      >

        {/* ── Bloco 1: cabeçalho + capa + compartilhar ── */}
        <div className="w-full min-w-0 lg:col-start-1 lg:row-start-1">

          {/* Header — constrained to reading measure */}
          <div className="mx-auto w-full max-w-[72ch]">
            <header>
              {/* Category badge */}
              <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-brand">
                {post.category || "Conteúdo premium"}
              </span>

              {/* Title — editorial tight leading gives look intencional, não sloppy */}
              <h1 className="mt-3 font-serif leading-[1.1] tracking-tight text-text text-[1.5rem] sm:text-[1.875rem] lg:text-[2.375rem]">
                {post.title}
              </h1>

              {post.subtitle ? (
                <p className="mt-3 text-base leading-relaxed text-text-muted">{post.subtitle}</p>
              ) : null}

              {/* Compact meta row: avatar · author · date · reading time */}
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-text-soft">
                {author ? (
                  <span className="flex items-center gap-1.5">
                    {author.avatar_url ? (
                      <Image
                        src={author.avatar_url}
                        alt={author.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full border object-cover"
                      />
                    ) : null}
                    <span className="font-medium text-text-muted">{author.name}</span>
                  </span>
                ) : null}
                {author && (post.published_at || minutes) ? (
                  <span aria-hidden className="opacity-30 select-none">·</span>
                ) : null}
                {post.published_at ? (
                  <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                ) : null}
                {post.published_at && minutes ? (
                  <span aria-hidden className="opacity-30 select-none">·</span>
                ) : null}
                {minutes ? <span>{minutes} min de leitura</span> : null}
                {post.updated_at && post.updated_at !== post.published_at ? (
                  <>
                    <span aria-hidden className="opacity-30 select-none">·</span>
                    <span className="rounded-full bg-surface-subtle px-2 py-0.5 font-medium text-text">
                      Atualizado {formatDate(post.updated_at)}
                    </span>
                  </>
                ) : null}
              </div>
            </header>
          </div>

          {/* Hero image — full column width for visual impact */}
          {post.cover_url ? (
            <figure className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-soft sm:mt-8 sm:rounded-3xl">
              <Image
                src={post.cover_url}
                alt={post.cover_alt || post.title}
                width={coverW}
                height={coverH}
                priority
                fetchPriority="high"
                className="w-full h-auto"
                sizes="(max-width: 1024px) 100vw, 65vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                decoding="sync"
                draggable={false}
              />
              {post.cover_alt && post.cover_alt !== post.title ? (
                <figcaption className="border-t border-border/40 px-5 py-2.5 text-xs text-text-soft">
                  {post.cover_alt}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* Share bar */}
          <div className="mx-auto mt-6 w-full max-w-[72ch] sm:mt-8">
            <div className="border-y border-border py-4">
              <ShareButtons title={post.title} url={`${siteUrl.replace(/\/$/, "")}/blog/${post.slug}`} />
            </div>
          </div>
        </div>

        {/* ── Bloco 2: sumário (instância única) + CTA lateral ── */}
        <div className="w-full min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:max-w-[16rem]">
          {compiled?.toc ? <TocPanel toc={compiled.toc} /> : null}
          <div className="hidden lg:block">
            <StickyArticleCTA whatsappUrl={sidebarWhatsappUrl} />
          </div>
        </div>

        {/* ── Bloco 3: corpo do artigo ── */}
        <div className="mx-auto w-full min-w-0 max-w-[72ch] space-y-8 sm:space-y-10 lg:col-start-1 lg:row-start-2">

            {/* Article body */}
            <Prose>
              {post.content_mdx ? (
                <MDXRemote
                  source={post.content_mdx}
                  components={mdxComponents as MDXComponentsMap}
                  // demoteBodyH1Plugin: o <h1> da página é o título do post,
                  // logo acima. Posts cujo corpo também começava com "# Título"
                  // mandavam DOIS <h1> para o HTML público.
                  options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, demoteBodyH1Plugin] } }}
                />
              ) : (
                <p className="italic text-text-muted">Conteúdo em atualização.</p>
              )}
            </Prose>

            <ArticleSources sources={parseSources(post.sources)} />

            <BlogPuppyBanner postTitle={post.title} />

            <section aria-labelledby="lead-section-title">
              <h2 id="lead-section-title" className="text-xl font-semibold text-text">
                Quero receber recomendações
              </h2>
              <LeadForm context={{ pageType: "blog", slug: post.slug }} />
              {process.env.NEXT_PUBLIC_WA_PHONE && (
                <div className="pt-3">
                  <a
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-soft transition hover:bg-brand-600 focus-ring"
                    target="_blank"
                    rel="noreferrer noopener"
                    href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), { pageType: "blog", url: `${siteUrl.replace(/\/$/, "")}/blog/${post.slug}` })}
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              )}
            </section>

            <aside aria-label="Links relacionados" className="grid gap-3 rounded-3xl border border-border bg-surface-subtle p-5 shadow-soft sm:grid-cols-3">
              {interlinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand/70"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand">Leia também</span>
                  <h3 className="text-sm font-semibold leading-snug text-text group-hover:text-brand">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-text-muted">{item.description}</p>
                </Link>
              ))}
            </aside>

            <BlogCTAs postTitle={post.title} category={post.category} />

            {isCommentablePostId(post.id) ? (
              <div className="border-t border-border pt-10">
                <Comments postId={post.id} />
              </div>
            ) : null}

            {related?.length ? (
              <aside aria-labelledby="related-posts-title" className="border-t border-border pt-10">
                <h2 id="related-posts-title" className="mb-5 text-xl font-serif text-text">
                  Artigos relacionados
                </h2>
                <ul className="grid gap-5 sm:grid-cols-2">
                  {related.slice(0, 4).map((relatedPost) => (
                    <PostCard
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}`}
                      title={relatedPost.title}
                      coverUrl={relatedPost.cover_url}
                      excerpt={relatedPost.excerpt}
                      date={relatedPost.published_at}
                      readingTime={null}
                    />
                  ))}
                </ul>
              </aside>
            ) : null}

        </div>

      </article>

      <ScrollAnalytics postId={post.id} readingTimeMin={minutes} />
    </div>
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
