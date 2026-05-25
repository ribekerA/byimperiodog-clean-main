export type PostStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  cover_url?: string | null;
  og_image_url?: string | null;
  status: PostStatus;
  scheduled_at?: string | null;
  published_at?: string | null;
  content_mdx?: string | null;
  content_blocks_json?: unknown | null;
  gallery_json?: unknown | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  reading_time?: number | null;
  author_id?: string | null;
  updated_at?: string;
  updated_by?: string | null;
};


export type BlogTag = {
  id: string;
  slug: string;
  name: string;
};

export type MediaItem = {
  id: string;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  credits?: string | null;
};

export type OutlineSection = {
  heading: string;
  summary?: string;
  children?: OutlineSection[];
};

export type AiOutlineRequest = { topic: string; keywords?: string[] };
export type AiOutlineResponse = { ok: true; outline: OutlineSection[] } | { ok: false; error: string };

export type AiExpandRequest = {
  outline: OutlineSection[];
  tone?: 'informative' | 'friendly' | 'formal';
  audience?: string;
  wordBudget?: number;
};
export type AiExpandResponse = {
  ok: true;
  content_mdx: string;
  content_blocks_json?: unknown;
  recommended_internal_links?: { title: string; href: string }[];
  suggested_ctas?: string[];
} | { ok: false; error: string };

export type AiSeoRequest = { title?: string; excerpt?: string; content_mdx?: string; slug?: string };
export type AiSeoResponse = { ok: true; seo_title: string; seo_description: string } | { ok: false; error: string };

export type AiAltTextRequest = { images: { url: string; context?: string }[] };
export type AiAltTextResponse = { ok: true; items: { url: string; alt: string; caption?: string }[] } | { ok: false; error: string };

