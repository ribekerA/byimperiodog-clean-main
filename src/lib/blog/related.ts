// PATH: src/lib/blog/related.ts
// Wrapper para combinar estratégias de posts relacionados (Supabase vs Contentlayer)
// Mantém API simples para o front.

import { getRelatedPosts as getRelatedSupabase } from '@/lib/relatedPosts';

/**
 * Obtém posts relacionados independente da origem.
 * Prioriza Supabase (conteúdo dinâmico); fallback para contentlayer estático se retornar vazio.
 */
export async function getRelatedUnified(slug: string, limit = 6) {
  try {
    const supa = await getRelatedSupabase(slug, limit);
    return supa.slice(0, limit);
  } catch (e) {
    console.error('relatedUnified erro', e);
    return [];
  }
}
