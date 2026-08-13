// PATH: src/lib/blog/related.ts
// Wrapper para combinar estratégias de posts relacionados (Supabase vs Contentlayer)
// Mantém API simples para o front.

import { getRelatedPosts as getRelatedStatic } from '@/lib/content';
import { getRelatedPosts as getRelatedSupabase } from '@/lib/relatedPosts';

/** Formato consumido por app/(public)/blog/[slug]/page.tsx (colunas do Supabase). */
export type RelatedUnified = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  cover_url: string | null;
};

/**
 * Obtém posts relacionados independente da origem.
 * Prioriza Supabase (conteúdo dinâmico); fallback para o corpus MDX estático se
 * retornar vazio.
 *
 * O fallback estava só no comentário: `getRelatedSupabase` consulta a tabela
 * `blog_posts`, e os 30 artigos publicados hoje vêm de content/posts/*.mdx — o
 * mesmo motivo que já faz o corpo do artigo ser servido pelo MDX (ver comentário
 * em app/(public)/blog/[slug]/page.tsx). Resultado: a consulta não achava o post
 * base, devolvia [], e o bloco "Artigos relacionados" nunca era renderizado.
 * Medido no HTML servido: `href="/blog/..."` aparecia 0 vez dentro de qualquer
 * artigo, ou seja, os 30 artigos eram becos sem saída no grafo de links internos
 * — cada um só apontava para as páginas comerciais e para o menu.
 *
 * `getRelatedStatic` (src/lib/content.ts) já existia e já rankeia por tags em
 * comum, com queda para os mais recentes quando não há interseção. Aqui só
 * mapeamos os nomes de campo para o formato que a página espera.
 */
export async function getRelatedUnified(slug: string, limit = 6): Promise<RelatedUnified[]> {
  try {
    const supa = await getRelatedSupabase(slug, limit);
    if (supa.length) {
      return supa.slice(0, limit).map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? null,
        published_at: p.published_at ?? null,
        cover_url: null,
      }));
    }
  } catch (e) {
    console.error('relatedUnified erro', e);
  }

  try {
    const estaticos = await getRelatedStatic(slug, limit);
    return estaticos.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? null,
      published_at: p.date ?? null,
      cover_url: p.cover ?? null,
    }));
  } catch (e) {
    console.error('relatedUnified fallback estatico erro', e);
    return [];
  }
}
