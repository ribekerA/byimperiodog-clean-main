import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/adminAuth';
import { createLogger } from '@/lib/logger';
import { supabaseAnon } from '@/lib/supabaseAnon';

export const dynamic = 'force-dynamic';

const logger = createLogger('debug:blog');

/**
 * Contagem de posts por status.
 *
 * Trocou o header `x-debug-token` (segredo proprio, sem tamanho minimo e sem
 * comparacao em tempo constante) pelo mesmo portao das outras rotas privadas.
 */
export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { permission: 'blog:read' });
  if (guard) return guard;

  const sb = supabaseAnon();
  const { data, error } = await sb.from('blog_posts').select('status');
  if (error) {
    logger.warn('falha ao contar posts', { error: error.message });
    return NextResponse.json({ error: 'consulta_falhou' }, { status: 500 });
  }
  const counts: Record<string, number> = {};
  for (const linha of (data as { status: string }[] | null) ?? []) {
    counts[linha.status] = (counts[linha.status] ?? 0) + 1;
  }
  return NextResponse.json({ counts });
}
