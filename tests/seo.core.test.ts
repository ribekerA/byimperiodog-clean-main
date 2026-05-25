import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  SITE_ORIGIN,
  canonical,
  baseSiteMetadata,
  baseBlogMetadata,
  buildBlogPostMetadata,
  blogJsonLdOrg,
  buildAuthorJsonLd,
  adminNoIndexMetadata
} from '../src/lib/seo.core';

describe('seo.core', () => {
  it('canonical: path vazio retorna origem', () => {
    expect(canonical('')).toBe(SITE_ORIGIN);
    expect(canonical('/')).toBe(`${SITE_ORIGIN}/`); // barra mantida
  });

  it('baseSiteMetadata: aplica defaults e permite override de title/description', () => {
    const base = baseSiteMetadata();
    expect(base.title).toBeTypeOf('object');
    const overridden = baseSiteMetadata({ title: 'Custom', description: 'Desc X' });
    expect(overridden.title).toBe('Custom');
    expect(overridden.description).toBe('Desc X');
  });

  it('baseBlogMetadata: canonical de /blog e merge de twitter/openGraph override', () => {
    const meta = baseBlogMetadata({ openGraph: { locale: 'pt_BR' }, twitter: { site: '@imperio' } });
    expect(meta.alternates?.canonical).toContain('/blog');
    // openGraph override preserva campos padrão + merge
    // @ts-expect-error openGraph merge adiciona locale não tipado explicitamente
    expect(meta.openGraph.locale).toBe('pt_BR');
    // @ts-expect-error twitter merge com campo site adicional
    expect(meta.twitter.site).toBe('@imperio');
  });

  it('buildBlogPostMetadata: compõe campos principais e ignora imagem nula', () => {
    const meta = buildBlogPostMetadata({ slug: 'slug-x', title: 'Titulo', description: null, image: null });
    expect(meta.title).toBe('Titulo');
    expect(meta.description).toBeUndefined();
    // @ts-expect-error imagens ausentes quando image null
    expect(meta.openGraph.images).toBeUndefined();
  });

  it('buildBlogPostMetadata: inclui imagem e published_time quando fornecidos', () => {
    const meta = buildBlogPostMetadata({ slug: 'abc', title: 'T', description: 'D', image: '/img.png', published: '2025-01-01' });
    // @ts-expect-error openGraph.images indexado dinamicamente
    expect(meta.openGraph.images[0].url).toBe('/img.png');
    expect(meta.other).toEqual({ 'article:published_time': '2025-01-01' });
  });

  describe('buildPostMetadata (async com supabase)', () => {
  // Encadeadores simplificados diretamente inline — removidos helpers eq1/eq2 para evitar lint unused.

    let maybeSinglePost = vi.fn();
    let maybeSingleOverride = vi.fn();

    beforeEach(() => {
      vi.resetModules();
      maybeSinglePost = vi.fn().mockResolvedValue({ data: { id: 'p1', slug: 's1', title: 'Post T', excerpt: 'Exc', cover_url: '/c.png', og_image_url: '/og.png', published_at: '2025-01-02' } });
      maybeSingleOverride = vi.fn().mockResolvedValue({ data: { data_json: { title: 'Override T', description: 'Override D', og_image_url: '/o.png', canonical: 'https://x/custom', robots: 'noindex' } } });

      // Mock encadeado simplificado
      const sbMock = {
        from: (table: string) => {
          if (table === 'blog_posts') {
            const chain = { maybeSingle: maybeSinglePost };
            return { select: () => ({ eq: () => ({ eq: () => chain }) }) } as { select: () => { eq: () => { eq: () => { maybeSingle: typeof maybeSinglePost } } } };
          }
          if (table === 'seo_overrides') {
            const chain = { maybeSingle: maybeSingleOverride };
            return { select: () => ({ eq: () => ({ eq: () => chain }) }) } as { select: () => { eq: () => { eq: () => { maybeSingle: typeof maybeSingleOverride } } } };
          }
          throw new Error('table inesperada');
        }
      };

      vi.doMock('../src/lib/supabasePublic', () => ({ supabasePublic: () => sbMock }));
    });

    it('usa override quando existe', async () => {
      const { buildPostMetadata: build } = await import('../src/lib/seo.core');
      const meta = await build('s1');
      expect(meta.title).toBe('Override T');
      expect(meta.description).toBe('Override D');
      expect(meta.alternates?.canonical).toBe('https://x/custom');
      // @ts-expect-error override fornece openGraph.images
      expect(meta.openGraph.images[0].url).toBe('/o.png');
      expect(meta.other).toEqual({ 'article:published_time': '2025-01-02' });
    });

    it('fallback quando não há override', async () => {
      maybeSingleOverride.mockResolvedValue({ data: null });
      const { buildPostMetadata: build } = await import('../src/lib/seo.core');
      const meta = await build('s1');
      expect(meta.title).toBe('Post T');
      expect(meta.description).toBe('Exc');
      // @ts-expect-error fallback imagem original
      expect(meta.openGraph.images[0].url).toBe('/og.png');
    });

    it('post inexistente gera metadata genérica', async () => {
      maybeSinglePost.mockResolvedValue({ data: null });
      const { buildPostMetadata: build } = await import('../src/lib/seo.core');
      const meta = await build('slug-x');
      expect(meta.title).toMatch(/Post | Blog/); // título genérico default
    });
  });

  it('blogJsonLdOrg retorna estrutura base Blog', () => {
    const json = blogJsonLdOrg();
    expect(json['@type']).toBe('Blog');
    expect(json.url).toContain('/blog');
  });

  it('buildAuthorJsonLd monta Person JSON-LD', () => {
    const jd = buildAuthorJsonLd({ name: 'Fulano', slug: 'fulano', avatar_url: '/a.png', bio: 'Bio' });
    expect(jd['@type']).toBe('Person');
    expect(jd.image).toBe('/a.png');
  });

  it('adminNoIndexMetadata define robots noindex', () => {
    expect(adminNoIndexMetadata.robots).toEqual({ index: false, follow: false });
  });
});
