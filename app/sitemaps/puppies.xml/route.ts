import { NextResponse } from 'next/server';

export const revalidate = 3600;

/**
 * Sitemap desativado — mantido apenas para responder 200.
 *
 * Este endpoint listava URLs no padrão `/filhote/{id}`, rota que não
 * existe no site: todas retornavam 404. Ele já foi retirado do
 * /sitemap-index.xml, mas a URL do sitemap em si pode ter sido enviada ao
 * Search Console, e removê-la faria o próprio sitemap virar 404 no relatório.
 * Por isso responde um urlset válido e vazio: o Google reprocessa, zera as
 * URLs com erro e o relatório de cobertura limpa sozinho.
 *
 * O conteúdo indexável de blog está em /sitemaps/posts.xml e /sitemap.xml.
 */
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
