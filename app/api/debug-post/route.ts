import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/adminAuth';
import { getPostBySlug } from '@/lib/content';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger('debug:post');

/**
 * Diagnostico de um post do conteudo.
 *
 * Antes respondia a qualquer visitante e, no erro, devolvia as cinco primeiras
 * linhas do stack trace — caminho de arquivo, nomes de modulo e a forma interna
 * do build, entregues de graca. Agora exige sessao de admin e o erro sai apenas
 * no log do servidor.
 */
export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { permission: 'blog:read' });
  if (guard) return guard;

  const slug = new URL(req.url).searchParams.get('slug') ?? 'preco-spitz-alemao-anao';
  try {
    const post = await getPostBySlug(slug);
    if (!post) return NextResponse.json({ found: false, slug });
    return NextResponse.json({
      found: true,
      slug: post.slug,
      title: post.title,
      bodyRawLength: post.bodyRaw?.length ?? 0,
      hasBodyRaw: !!post.bodyRaw,
    });
  } catch (e: unknown) {
    logger.error('falha ao ler post', { slug, error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: 'erro_interno' }, { status: 500 });
  }
}
