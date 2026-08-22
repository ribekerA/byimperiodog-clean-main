import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/adminAuth';
import { blogRepo } from '@/lib/db';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger('debug:blog-posts');

/**
 * Diagnostico da listagem do blog.
 *
 * Respondia publicamente com `hasServiceKey` e `hasUrl` — um mapa de quais
 * credenciais o servidor tem configuradas, que e exatamente o que alguem
 * sondando o site quer saber primeiro. Esses dois campos sairam e a rota passou
 * a exigir sessao de admin.
 */
export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { permission: 'blog:read' });
  if (guard) return guard;

  try {
    const result = await blogRepo.listSummaries({ limit: 10, offset: 0 });

    return NextResponse.json({
      success: true,
      itemsCount: result.items.length,
      total: result.total,
      firstItem: result.items[0]
        ? { id: result.items[0].id, slug: result.items[0].slug, title: result.items[0].title }
        : null,
    });
  } catch (error) {
    logger.error('falha ao listar posts', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'erro_interno' }, { status: 500 });
  }
}
