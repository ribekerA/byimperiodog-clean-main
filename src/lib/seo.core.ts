import type { Metadata } from 'next';

import { supabasePublic } from './supabasePublic';

/**
 * URL base do site (canonical origin)
 * 
 * Prioridade de resolução:
 * 1. NEXT_PUBLIC_SITE_URL (variável de ambiente)
 * 2. NEXT_PUBLIC_CANONICAL_ORIGIN (domínio custom para canonical)
 * 3. Fallback: https://www.byimperiodog.com.br
 * 
 * Para usar domínio canilspitzalemao.com.br:
 * Defina NEXT_PUBLIC_CANONICAL_ORIGIN=https://www.canilspitzalemao.com.br
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_CANONICAL_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.byimperiodog.com.br'
).replace(/\/$/, '');

/**
 * Domínio alternativo (para redirects e alias)
 * Usado em redirect rules e validações de domínio
 */
export const ALTERNATE_ORIGINS = [
  'https://www.byimperiodog.com.br',
  'https://byimperiodog.com.br',
  'https://www.canilspitzalemao.com.br',
  'https://canilspitzalemao.com.br',
].map(url => url.replace(/\/$/, ''));

export function canonical(path: string) {
  if (!path) return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Metadados base do site público (home / institucionais). */
export function baseSiteMetadata(overrides: Partial<Metadata> = {}): Metadata {
  const title = overrides.title || { default: 'Spitz Alemão Anão | By Imperio Dog', template: '%s | By Imperio Dog' };
  const description = overrides.description || 'Filhotes legítimos, entrega responsável e pós-venda acolhedor.';
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    alternates: { canonical: SITE_ORIGIN + '/' },
    openGraph: {
      type: 'website',
      url: SITE_ORIGIN + '/',
  siteName: 'By Imperio Dog',
  images: [{ url: '/spitz-hero-desktop.webp', width: 1200, height: 630, alt: 'Spitz Alemão Anão — By Imperio Dog' }],
      ...overrides.openGraph,
    },
    twitter: { card: 'summary_large_image', ...(overrides.twitter || {}) },
    ...overrides,
  } as Metadata;
}

/** Metadados base da listagem do blog. */
export function baseBlogMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
  title: 'Blog | By Imperio Dog',
    description: 'Conteúdo especializado sobre Spitz Alemão, saúde, adestramento e bem-estar.',
    alternates: { canonical: canonical('/blog') },
    openGraph: {
      type: 'website',
      url: canonical('/blog'),
  siteName: 'By Imperio Dog',
  title: 'Blog | By Imperio Dog',
      description: 'Conteúdo especializado sobre Spitz Alemão, saúde, adestramento e bem-estar.',
      ...overrides.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
  title: 'Blog | By Imperio Dog',
      description: 'Conteúdo sobre Spitz Alemão e bem-estar.',
      ...(overrides.twitter || {}),
    },
    ...overrides,
  } as Metadata;
}

/** Metadados para um post específico do blog (dados já recebidos). */
export function buildBlogPostMetadata({ slug, title, description, image, published }: { slug: string; title: string; description?: string | null; image?: string | null; published?: string | null; }): Metadata {
  const url = canonical(`/blog/${slug}`);
  return {
    title,
    description: description || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description: description || undefined,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || undefined,
      images: image ? [image] : undefined,
    },
    other: published ? { 'article:published_time': published } : undefined,
  } as Metadata;
}

/** Constrói metadata de post consultando DB + overrides (mantém compatibilidade antiga). */
export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const sb = supabasePublic();
  const { data: post } = await sb
    .from('blog_posts')
    .select('id,slug,title,excerpt,cover_url,og_image_url, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  const url = canonical(`/blog/${post?.slug ?? slug}`);
  let override: any = null;
  if (post?.id) {
    const { data: ovr } = await sb
      .from('seo_overrides')
      .select('data_json')
      .eq('entity_type', 'post')
      .eq('entity_id', post.id)
      .maybeSingle();
    override = ovr?.data_json || null;
  }

  const title = override?.title ?? post?.title ?? 'Post | Blog';
  const description = override?.description ?? post?.excerpt ?? undefined;
  const image = override?.og_image_url ?? post?.og_image_url ?? post?.cover_url ?? undefined;
  const canonicalFinal = override?.canonical ?? url;
  const robots = override?.robots as string | undefined;
  const published = post?.published_at || undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalFinal },
    robots,
    openGraph: {
      type: 'article',
      url: canonicalFinal,
      title,
      description,
      images: image ? [{ url: image as string, width: 1200, height: 630 }] : undefined,
    },
    twitter: image ? { card: 'summary_large_image', images: [image as string] } : undefined,
    other: published ? { 'article:published_time': published } : undefined,
  } as Metadata;
}

/** JSON-LD para o blog. */
export function blogJsonLdOrg() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
  name: 'By Imperio Dog - Blog',
    url: canonical('/blog'),
    description: 'Artigos sobre Spitz Alemão, cuidados, genética e qualidade de vida.'
  };
}

/** JSON-LD Person para autores */
export function buildAuthorJsonLd(author: { name:string; slug:string; avatar_url?:string|null; bio?:string|null }){
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: canonical(`/autores/${author.slug}`),
    image: author.avatar_url || undefined,
    description: author.bio || undefined,
  };
}

/** Metadata para áreas internas / admin (noindex). */
export const adminNoIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * ⚠️ HREFLANG NÃO IMPLEMENTADO
 * 
 * Motivos:
 * 1. Não há multi-idioma/i18n configurado no projeto
 * 2. Páginas em outros idiomas (ex: húngaro) foram bloqueadas via redirects
 * 3. Incluir hreflang sem implementar i18n prejudica SEO (confunde crawlers)
 * 
 * SE IMPLEMENTAR I18N NO FUTURO:
 * - Adicionar hreflang tags para cada variação de idioma
 * - Incluir x-default para versão sem prefixo de idioma
 * - Exemplo:
 *   <link rel="alternate" hreflang="pt-BR" href="https://www.canilspitzalemao.com.br/..." />
 *   <link rel="alternate" hreflang="en-US" href="https://www.canilspitzalemao.com.br/en/..." />
 *   <link rel="alternate" hreflang="x-default" href="https://www.canilspitzalemao.com.br/..." />
 */
