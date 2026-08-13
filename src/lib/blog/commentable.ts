/**
 * Regra única de "este artigo consegue receber comentário?".
 *
 * `blog_comments.post_id` é uuid com chave estrangeira para `blog_posts(id)`
 * (sql/blog_comments.sql). Artigo que vem de content/posts não tem linha nessa
 * tabela: em /blog/[slug] o `id` do post é o próprio slug. Conferido no banco de
 * produção — dos 30 artigos MDX, apenas um tem linha em `blog_posts`, e mesmo
 * esse é servido pelo arquivo, então também chega aqui com slug no lugar do uuid.
 *
 * Sem esta checagem a página montava a caixa de comentários em todos os 30
 * artigos. O efeito era: GET /api/blog/comments?post_id=<slug> respondendo 400
 * ("post_id inválido", z.string().uuid) em toda visita, com erro no console, e
 * quem escrevesse um comentário recebia "Erro ao enviar comentário" — a linha
 * nunca teria onde ser gravada.
 *
 * Posts criados pelo admin, que existem no Supabase e têm uuid de verdade,
 * continuam com comentários normalmente.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCommentablePostId(postId: string | null | undefined): boolean {
  return typeof postId === "string" && UUID.test(postId);
}
