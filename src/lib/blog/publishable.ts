/**
 * Regra única de "este post do Supabase vira página pública?".
 *
 * A tabela `blog_posts` tem 6 linhas de seed marcadas como `published` com 141
 * a 558 caracteres de corpo — e com "\n" literal no lugar da quebra de linha.
 * Renderizar isso publica seis páginas de conteúdo raso e as declara no
 * sitemap. Abaixo do mínimo o post simplesmente não existe para o site: nem
 * rota, nem sitemap.
 *
 * Importado por /blog/[slug], por app/sitemap.ts e por /sitemaps/posts.xml,
 * para que as três respostas nunca divirjam — sitemap que aponta para 404 é
 * exatamente o que essa constante existe para impedir.
 *
 * Desde a revisão do caminho de IA, o corte por tamanho é só a primeira
 * peneira: quem decide de fato é src/lib/blog/quality.ts, que aplica no banco
 * as mesmas regras de erro que scripts/quality-gate.mjs aplica nos .mdx. Os
 * 800 caracteres continuam aqui porque são um teste barato que elimina as
 * linhas de seed antes de qualquer contagem de palavras.
 */
import { reprovacoesDoPost, type PostAvaliavel } from "@/lib/blog/quality";

export const MIN_SUPABASE_BODY_CHARS = 800;

export function isPublishableSupabasePost(post: PostAvaliavel): boolean {
  if (post.status !== "published") return false;
  if ((post.content_mdx?.trim().length ?? 0) < MIN_SUPABASE_BODY_CHARS) return false;

  return reprovacoesDoPost(post).length === 0;
}
