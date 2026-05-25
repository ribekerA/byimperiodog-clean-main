import type { TocItem } from './mdx/toc';

interface BasePost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: string | null;
  tags?: string[] | null;
  reading_time?: number | null;
  lang?: string | null;
}

interface AuthorLike { name: string; slug?: string; avatar_url?: string | null }

export function deriveExcerpt(post: Pick<BasePost, 'excerpt' | 'subtitle'> & { content_mdx?: string | null }): string | undefined {
  if (post.excerpt) return clampExcerpt(post.excerpt);
  if (post.subtitle) return clampExcerpt(post.subtitle);
  if (!post.content_mdx) return undefined;
  const raw = stripMarkdown(post.content_mdx);
  if (!raw) return undefined;
  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0] || raw;
  let candidate = firstSentence.length < 60 ? raw.slice(0, 220) : firstSentence;
  if (candidate.length > 220) candidate = candidate.slice(0, 217).trimEnd() + '…';
  if (candidate.length < 40) return undefined;
  return candidate;
}

function clampExcerpt(text: string): string {
  let t = text.trim();
  if (t.length > 220) t = t.slice(0, 217).trimEnd() + '…';
  return t;
}

function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\(([^)]+)\)/g, ' ') // remove links (texto âncora já misturado)
    .replace(/[#>*_~`>-]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface BuildMetadataOptions { baseUrl?: string }

export function buildBlogMetadata(post: BasePost & { content_mdx?: string | null }, opts: BuildMetadataOptions = {}) {
  const site = (opts.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
  const canonical = `${site}/blog/${encodeURIComponent(post.slug)}`;
  const description = post.seo_description || deriveExcerpt(post) || undefined;
  const title = post.seo_title || post.title;
  const ogImage = post.cover_url || `${site}/byimperiologo.png`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: post.cover_alt || title }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined
    }
  };
}

interface JsonLdExtras { toc?: TocItem[]; faq?: { q: string; a: string }[] }

export function buildArticleJsonLd(post: BasePost & { content_mdx?: string | null }, author: AuthorLike | null, extras: JsonLdExtras = {}) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.byimperiodog.com.br').replace(/\/$/, '');
  const url = `${site}/blog/${post.slug}`;
  const description = post.seo_description || deriveExcerpt(post) || undefined;
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description,
    image: post.cover_url ? [post.cover_url] : undefined,
    author: author ? { '@type': 'Person', name: author.name, url: author.slug ? `${site}/autores/${author.slug}` : undefined } : { '@type': 'Organization', name: 'By Imperio Dog' },
    datePublished: post.published_at || post.created_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    publisher: { '@type': 'Organization', name: 'By Imperio Dog', logo: { '@type': 'ImageObject', url: `${site}/byimperiologo.png` } },
    articleSection: post.category || undefined,
    keywords: post.tags && post.tags.length ? post.tags.join(', ') : undefined,
    inLanguage: post.lang || 'pt-BR'
  };

  if (extras.toc && extras.toc.length > 2) {
    article['articleBody'] = undefined; // evitar corpo gigante aqui
    article['about'] = extras.toc.map(i => ({ '@type': 'Thing', name: i.value }));
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${site}/blog` },
      { '@type': 'ListItem', position: 2, name: post.title, item: url }
    ]
  };

  let faqBlock: Record<string, unknown> | undefined;
  if (extras.faq && extras.faq.length) {
    faqBlock = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: extras.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    };
  }

  return { article, breadcrumb, faqBlock };
}
