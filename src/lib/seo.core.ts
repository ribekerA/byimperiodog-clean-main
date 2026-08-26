import type { Metadata } from 'next';

import { supabasePublic } from './supabasePublic';

/** Origem canônica única do site público. */
export const SITE_ORIGIN = 'https://byimperiodog.com.br';

/**
 * URL canônica de um caminho.
 *
 * Query string e âncora saem fora sempre. Quem chega pelo anúncio chega com
 * `?gclid=...` na barra de endereço, e um canonical que carregasse esse
 * parâmetro faria o Google enxergar uma URL nova a cada clique pago — a mesma
 * página indexada dezenas de vezes, com o rastro do clique junto. Hoje nenhuma
 * página monta o canonical a partir da URL da requisição, então isto é
 * proteção contra o dia em que alguma passar a montar.
 */
export function canonical(path: string) {
  if (!path) return SITE_ORIGIN;
  const semParametros = path.split('?')[0].split('#')[0];
  if (!semParametros) return SITE_ORIGIN;
  return `${SITE_ORIGIN}${semParametros.startsWith('/') ? semParametros : `/${semParametros}`}`;
}

function canonicalOnCurrentDomain(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    const parsed = new URL(value, SITE_ORIGIN);
    return canonical(parsed.pathname);
  } catch {
    return fallback;
  }
}

/** Metadados base do site público (home / institucionais). */
export function baseSiteMetadata(overrides: Partial<Metadata> = {}): Metadata {
  const title = overrides.title || { default: 'Spitz Alemão Anão | By Império Dog', template: '%s | By Império Dog' };
  const description = overrides.description || 'Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP, com consulta veterinária, hemograma completo e pedigree.';
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    // Sem esta chave o HTML não saía com nenhum <link rel="icon">, o navegador
    // caía no /favicon.ico implícito e tomava 404 (erro no console). O Google
    // também mostra o favicon ao lado do resultado na busca mobile: sem ícone
    // declarado e rastreável, aparece o globo genérico no lugar da marca.
    // Fica só aqui, no layout raiz do site público — os segmentos filhos que
    // não declaram `icons` herdam este valor.
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },
    // Aqui NAO entra canonical nem og:url. Este objeto é o metadata do layout
    // de (public), e no App Router tudo que o layout declara é herdado por
    // qualquer segmento filho que não sobrescreva. Com o canonical fixo na
    // home, toda resposta 404 vinda de notFound() — /filhotes/slug-inexistente,
    // /guias/inexistente, /blog/inexistente — saía dizendo ao Google "esta
    // página é a home", com o título da home junto. A home declara o próprio
    // canonical e o próprio og:url em app/(public)/page.tsx, e as demais rotas
    // passam por pageMetadata()/blogPostMetadata(), que também declaram. Nada
    // se perde ao tirar daqui.
    openGraph: {
      type: 'website',
      siteName: 'By Império Dog',
      images: [{ url: '/spitz-hero-desktop.webp', width: 1400, height: 933, alt: 'Spitz Alemão Anão — By Império Dog' }],
      ...overrides.openGraph,
    },
    twitter: { card: 'summary_large_image', ...(overrides.twitter || {}) },
    ...overrides,
  } as Metadata;
}

/** Metadados base da listagem do blog. */
export function baseBlogMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
  title: 'Blog',
    description: 'Conteúdo sobre Spitz Alemão Anão (Lulu da Pomerânia), saúde, adestramento e bem-estar.',
    alternates: { canonical: canonical('/blog') },
    openGraph: {
      type: 'website',
      url: canonical('/blog'),
  siteName: 'By Império Dog',
  title: 'Blog | By Império Dog',
      description: 'Conteúdo sobre Spitz Alemão Anão (Lulu da Pomerânia), saúde, adestramento e bem-estar.',
      ...overrides.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
  title: 'Blog | By Império Dog',
      description: 'Conteúdo sobre Spitz Alemão Anão e bem-estar.',
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
      // Sem width/height: a capa do post e arbitraria (upload do painel oferece
      // 16:9, 4:3 e 1:1) e declarar 1200x630 para todas era uma medida falsa.
      // og:image sem dimensao e valido; og:image com dimensao errada nao.
      images: image ? [{ url: image, alt: title }] : undefined,
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
  const canonicalFinal = canonicalOnCurrentDomain(override?.canonical, url);
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
      // Mesma razao do builder acima: dimensao desconhecida nao se inventa.
      images: image ? [{ url: image as string }] : undefined,
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
  name: 'By Império Dog - Blog',
    url: canonical('/blog'),
    description: 'Artigos sobre Spitz Alemão Anão, cuidados, rotina e qualidade de vida.'
  };
}

/** JSON-LD Person para autores */
export function buildAuthorJsonLd(author: { name:string; slug:string; avatar_url?:string|null; bio?:string|null }){
  // Não emitimos `url` porque não existe página pública /autores/{slug}.
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
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
 */
