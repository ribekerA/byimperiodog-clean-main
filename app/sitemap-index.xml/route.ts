import { NextResponse } from "next/server";

import { guides } from "@/content/guides";
import { LASTMOD, maxLastmod } from "@/lib/_generated-lastmod";
import { generatedPosts } from "@/lib/_generated-posts";

export const revalidate = 300; // 5 min

const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * <lastmod> de um sitemap filho é a data mais recente entre as URLs que ele
 * declara — não o horário do build. Antes os dois filhos saíam com
 * `new Date().toISOString()`, então o índice anunciava novidade a cada deploy e
 * o Google era mandado reler os dois arquivos inteiros sem motivo.
 */
function lastmodDoSitemapPrincipal(): string | undefined {
  return maxLastmod([
    ...Object.values(LASTMOD),
    ...guides.map((g) => g.updatedAt ?? g.publishedAt),
  ]);
}

function lastmodDosPosts(): string | undefined {
  return maxLastmod(generatedPosts.map((p) => p.updated ?? p.date));
}

export async function GET() {
  // Apenas sitemaps cujas URLs resolvem em 200.
  // /sitemaps/{tags,authors,categories,puppies}.xml apontavam para rotas
  // inexistentes (/blog/tag, /autores, /categorias, /filhote/{id}) e foram
  // removidos do índice para não alimentar o Google com 404.
  const sitemaps: Array<{ loc: string; lastmod?: string }> = [
    { loc: `${site}/sitemap.xml`, lastmod: lastmodDoSitemapPrincipal() },
    { loc: `${site}/sitemaps/posts.xml`, lastmod: lastmodDosPosts() },
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps
    .map(
      (s) =>
        `  <sitemap><loc>${xmlEscape(s.loc)}</loc>${
          s.lastmod ? `<lastmod>${s.lastmod}</lastmod>` : ""
        }</sitemap>`
    )
    .join("\n")}\n</sitemapindex>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
