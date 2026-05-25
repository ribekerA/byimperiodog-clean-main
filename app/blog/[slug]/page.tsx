import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import BlogCTAs from "@/components/blog/BlogCTAs";
import BlogPuppyBanner from "@/components/blog/BlogPuppyBanner";
import Comments from "@/components/blog/Comments";
import PostCard from "@/components/blog/PostCard";
import Prose from "@/components/blog/Prose";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ScrollAnalytics from "@/components/blog/ScrollAnalytics";
import ShareButtons from "@/components/blog/ShareButtons";
import TocNav from "@/components/blog/Toc";
import Breadcrumbs from "@/components/Breadcrumbs";
import LeadForm from "@/components/LeadForm";
import { mdxComponents } from "@/components/MDXContent";
import PageViewPing from "@/components/PageViewPing";
import SeoJsonLd from "@/components/SeoJsonLd";
import { compileBlogMdx } from "@/lib/blog/mdx/compile";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { getRelatedUnified } from "@/lib/blog/related";
import { buildBlogMetadata, buildArticleJsonLd } from "@/lib/blog/seo";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { blogPostingSchema } from "@/lib/schema";
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

async function fetchPost(slug: string, opts: { preview: boolean }): Promise<Post | null> {
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("blog_posts")
      .select(
        "id,slug,title,subtitle,excerpt,content_mdx,cover_url,cover_alt,published_at,created_at,updated_at,status,author_id,seo_title,seo_description,category,tags,lang"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    if (data.status === "published") return data as Post;
    if (opts.preview && (data.status === "review" || data.status === "draft")) return data as Post;
    return null;
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

export async function generateStaticParams() {
  return [];
}

export const revalidate = 300;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { preview?: string };
}): Promise<Metadata> {
  const preview = process.env.NODE_ENV !== "production" && searchParams?.preview === "1";
  const post = await fetchPost(params.slug, { preview });
  if (!post) return {};
  return buildBlogMetadata(post as Post & { content_mdx?: string | null });
}

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { preview?: string };
}) {
  const preview = process.env.NODE_ENV !== "production" && searchParams?.preview === "1";
  const post = await fetchPost(params.slug, { preview });

  if (!post) return notFound();

  const author = await fetchAuthor(post.author_id);
  const compiled = post.content_mdx ? await compileBlogMdx(post.content_mdx) : null;
  const minutes = compiled?.readingTimeMinutes || estimateReadingTime(post.content_mdx || "");
  const related = (await getRelatedUnified(post.slug, 6)) as RelatedAny[];
  const { article, breadcrumb, faqBlock } = buildArticleJsonLd(
    post as Post & { content_mdx?: string | null },
    author,
    { toc: compiled?.toc }
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
  const description =
    (article?.description as string | undefined) || post.seo_description || post.excerpt || post.subtitle || "";
  const blogSchema = blogPostingSchema(siteUrl, {
    slug: post.slug,
    title: post.title,
    description,
    publishedAt: post.published_at || post.created_at || new Date().toISOString(),
    modifiedAt: post.updated_at || undefined,
    image: post.cover_url ? { url: post.cover_url, alt: post.cover_alt } : undefined,
    author: author ? { name: author.name, url: author.slug ? `${siteUrl.replace(/\/$/, "")}/autores/${author.slug}` : undefined } : undefined,
    keywords: post.tags || undefined,
    articleSection: post.category || null,
  });

  const structuredData = [article, breadcrumb, faqBlock, blogSchema].filter(Boolean);

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
      href: "/faq",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10">
      <PageViewPing pageType="blog" />
      <SeoJsonLd data={structuredData} />
      <ReadingProgress />

      {preview && post.status !== "published" ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-medium">Pré-visualização</span>
          <span>
            Status atual: <strong>{post.status}</strong>
          </span>
          <PublishButton slug={post.slug} />
          <a href={`/blog/${post.slug}`} className="underline decoration-dotted">
            Sair do modo preview
          </a>
        </div>
      ) : null}

      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Início", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      <article className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="w-full flex-1 space-y-10">
          <header className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              {post.category || "Conteúdo premium"}
            </span>
            <h1 className="text-3xl font-serif text-text sm:text-4xl">{post.title}</h1>
            {post.subtitle ? <p className="text-base text-text-muted">{post.subtitle}</p> : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-soft">
              {post.published_at ? <span>Publicado em {formatDate(post.published_at)}</span> : null}
              {post.updated_at && post.updated_at !== post.published_at ? (
                <span className="rounded-pill bg-surface-subtle px-3 py-1 font-medium text-text">Atualizado em {formatDate(post.updated_at)}</span>
              ) : null}
              {minutes ? (
                <span className="rounded-pill bg-surface-subtle px-3 py-1 font-semibold text-text">
                  {minutes} min de leitura
                </span>
              ) : null}
            </div>
            {author ? (
              <div className="mt-2 flex items-center gap-3 text-sm text-text">
                {author.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt={author.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full border bg-surface-subtle" aria-hidden />
                )}
                <div>
                  <span className="text-text-muted">Por </span>
                  {author.slug ? (
                    <Link href={`/autores/${author.slug}`} className="font-medium underline-offset-2 hover:underline">
                      {author.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{author.name}</span>
                  )}
                </div>
              </div>
            ) : null}
          </header>

          {post.cover_url ? (
            <figure className="overflow-hidden rounded-3xl border border-border bg-surface-subtle shadow-soft">
              <Image
                src={post.cover_url}
                alt={post.cover_alt || post.title}
                width={1280}
                height={720}
                priority
                fetchPriority="high"
                className="h-full w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                decoding="async"
                draggable={false}
              />
              {post.cover_alt ? (
                <figcaption className="px-5 py-3 text-xs text-text-soft">{post.cover_alt}</figcaption>
              ) : null}
            </figure>
          ) : null}

          <div className="flex flex-col gap-4 rounded-2xl border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Compartilhe</p>
              <p className="text-sm text-text-muted">Leve conhecimento premium para outros tutores responsáveis.</p>
            </div>
            <ShareButtons title={post.title} url={`${siteUrl.replace(/\/$/, "")}/blog/${post.slug}`} />
          </div>

          <Prose>
            {post.content_mdx ? (
              <MDXRemote
                source={post.content_mdx}
                components={mdxComponents as MDXComponentsMap}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings] } }}
              />
            ) : (
              <p className="italic text-text-muted">Conteúdo em atualização.</p>
            )}
          </Prose>

          <BlogPuppyBanner postTitle={post.title} />

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Quero receber recomendações</h2>
            <LeadForm context={{ pageType: "blog", slug: post.slug }} />
            {process.env.NEXT_PUBLIC_WA_PHONE && (
              <div className="pt-2">
                <a
                  className="inline-block rounded bg-green-600 px-4 py-2 text-white"
                  target="_blank"
                  rel="noreferrer"
                  href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), { pageType: "blog", url: `${siteUrl.replace(/\/$/, "")}/blog/${post.slug}` })}
                >
                  Falar no WhatsApp
                </a>
              </div>
            )}
          </section>

          <aside className="grid gap-4 rounded-3xl border border-border bg-surface-subtle p-6 shadow-soft sm:grid-cols-3">
            {interlinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-surface p-4 transition hover:-translate-y-1 hover:border-brand/70"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Leia também</span>
                <h3 className="text-sm font-semibold text-text group-hover:text-brand">{item.title}</h3>
                <p className="text-xs text-text-muted">{item.description}</p>
              </Link>
            ))}
          </aside>

          <BlogCTAs postTitle={post.title} category={post.category} />

          <div className="mt-16 border-t border-border pt-12">
            <Comments postId={post.id} />
          </div>

          {related?.length ? (
            <aside className="mt-20 border-t border-border pt-12">
              <h2 className="mb-6 text-2xl font-serif text-text">Artigos relacionados</h2>
              <ul className="grid gap-6 sm:grid-cols-2">
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

        <div className="hidden w-full max-w-xs shrink-0 lg:block">
          {compiled?.toc ? <TocNav toc={compiled.toc} /> : null}
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

function PublishButton({ slug }: { slug: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/admin/blog/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN || "",
          },
          body: JSON.stringify({ slug }),
        });

        try {
          const mod = await import("next/cache");
          mod.revalidatePath(`/blog/${slug}`);
          mod.revalidatePath("/blog");
        } catch {
          // ignore cache errors
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
      >
        Publicar agora
      </button>
    </form>
  );
}
