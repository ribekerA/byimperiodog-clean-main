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
 */
export const MIN_SUPABASE_BODY_CHARS = 800;

export function isPublishableSupabasePost(post: {
  status?: string | null;
  content_mdx?: string | null;
}): boolean {
  return (
    post.status === "published" &&
    (post.content_mdx?.trim().length ?? 0) >= MIN_SUPABASE_BODY_CHARS
  );
}
