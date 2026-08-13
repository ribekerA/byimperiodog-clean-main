/* Content driver: Contentlayer (default) with optional Sanity switch via CMS_DRIVER.
   Provides normalized helpers for blog data access. */

export type BlogPost = {
  slug: string;
  title: string;
  /** Título curto só para o <title>/og:title. Não afeta o H1 do artigo. */
  seoTitle?: string | null;
  excerpt?: string | null;
  cover?: string | null;
  date?: string | null; // ISO
  updated?: string | null;
  tags?: string[] | null;
  category?: string | null;
  author?: string | null;
  readingTime?: number | null;
  url?: string;
  bodyRaw?: string | null;
  /** Fontes externas declaradas no frontmatter, uma por linha "Publisher | Título | URL". */
  sources?: string[] | null;
};

const CMS = (process.env.CMS_DRIVER || 'contentlayer').toLowerCase();

// Import estático gerado por scripts/gen-contentlayer.mjs (roda no predev)
// Webpack bundla normalmente — sem tricks de require/eval
import { generatedPosts } from './_generated-posts';

function loadContentlayerPosts(): any[] {
  try {
    return Array.isArray(generatedPosts) ? (generatedPosts as any[]) : [];
  } catch {
    return [];
  }
}

function normalizePost(p: any): BlogPost {
  return {
    slug: p.slug || p._raw?.sourceFileName?.replace?.(/\.mdx$/, '') || '',
    title: p.title || p.name || 'Post',
    seoTitle: p.seoTitle || p.seo_title || null,
    excerpt: p.description || p.excerpt || null,
    cover: p.cover || p.cover_url || null,
    date: p.date || p.published_at || null,
    updated: p.updated || p.updated_at || null,
    tags: p.tags || null,
    category: p.category || null,
    author: p.author || null,
    readingTime: p.readingTime || p.reading_time || null,
    url: p.url || (p.slug ? `/blog/${p.slug}` : undefined),
    bodyRaw: p.body?.raw || p.content_mdx || p.bodyRaw || null,
    sources: p.sources || null,
  };
}

export async function getAllPosts(opts?: { page?: number; pageSize?: number; q?: string; tag?: string; category?: string }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(opts?.pageSize || 12)));
  const q = (opts?.q || '').trim().toLowerCase();
  const tag = (opts?.tag || '').trim().toLowerCase();
  const category = (opts?.category || '').trim().toLowerCase();

  if (CMS === 'sanity') {
    // TODO: wire Sanity query; for now, return empty with pagination shape
    return { items: [], total: 0, page, pageSize };
  }

  const src = loadContentlayerPosts();
  let items = src.map(normalizePost);
  if (q) {
    items = items.filter((p) =>
      [p.title, p.excerpt, p.bodyRaw].some((t) => String(t || '').toLowerCase().includes(q))
    );
  }
  if (tag) {
    items = items.filter((p) => (p.tags || []).map((t) => String(t).toLowerCase()).includes(tag));
  }
  if (category) {
    items = items.filter((p) => String(p.category || '').toLowerCase() === category);
  }
  // sort by date desc
  items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return { items: paged, total, page, pageSize };
}

export async function getPostBySlug(slug: string) {
  if (!slug) return null;
  if (CMS === 'sanity') {
    // TODO: fetch sanity by slug
    return null;
  }
  const src = loadContentlayerPosts();
  const hit = src.find((p) => p.slug === slug || p._raw?.sourceFileName?.replace?.(/\.mdx$/, '') === slug);
  return hit ? normalizePost(hit) : null;
}

export async function getPostsByTag(tag: string, limit = 12) {
  if (!tag) return [] as BlogPost[];
  if (CMS === 'sanity') {
    return [];
  }
  const src = loadContentlayerPosts();
  const items = src.map(normalizePost).filter((p) => (p.tags || []).map((t) => String(t).toLowerCase()).includes(tag.toLowerCase()));
  return items.slice(0, limit);
}

export async function getRelatedPosts(slug: string, limit = 4) {
  if (!slug) return [] as BlogPost[];
  if (CMS === 'sanity') {
    return [];
  }
  const src = loadContentlayerPosts();
  const items = src.map(normalizePost);
  const post = items.find((p) => p.slug === slug);
  if (!post) return items.slice(0, limit);
  const tags = new Set((post.tags || []).map((t) => String(t).toLowerCase()));
  const related = items
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: (p.tags || []).reduce((acc, t) => acc + (tags.has(String(t).toLowerCase()) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
  return (related.length ? related : items.filter((p) => p.slug !== slug)).slice(0, limit);
}
