import { revalidateTag } from "next/cache";

/**
 * Tag do cache da consulta que alimenta a listagem em /blog.
 *
 * Fica aqui, e nao solta como string em cada rota, porque ela precisa ser
 * exatamente a mesma nos dois lados: quem cacheia (app/(public)/blog/page.tsx)
 * e quem invalida (as rotas de publicacao). Um typo em um dos lados nao quebra
 * o build -- so faz a invalidacao silenciosamente nao surtir efeito.
 */
export const TAG_LISTAGEM_BLOG = "blog-posts";

/**
 * Invalida o cache da listagem do blog.
 *
 * Precisa ser chamada junto do `revalidatePath("/blog")` que ja existe nas
 * rotas de publicacao: os dois caches sao independentes. O `revalidatePath`
 * derruba o cache da rota renderizada; ele nao alcanca a entrada de
 * `unstable_cache` da consulta ao Supabase, que so responde a `revalidateTag`.
 *
 * O perfil `max`, exigido no Next 16, marca a entrada como stale e atualiza em
 * segundo plano na proxima visita. Route Handlers nao podem usar `updateTag`,
 * que e exclusivo de Server Actions.
 */
export function revalidarListagemBlog() {
  revalidateTag(TAG_LISTAGEM_BLOG, "max");
}
