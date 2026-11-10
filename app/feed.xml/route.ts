import { BRAND } from "@/domain/config";
import { generatedPosts } from "@/lib/_generated-posts";

/**
 * /feed.xml — feed RSS 2.0 dos artigos do blog.
 *
 * Criado em 10/11/2026, com aprovação da responsável. Avisa leitores de feed e
 * agregadores quando sai artigo novo. Não substitui o sitemap nem garante
 * leitura ou citação por buscador ou mecanismo de IA.
 *
 * A lista sai de _generated-posts, a mesma fonte de /llms.txt e do sitemap dos
 * artigos, na mesma ordem de /blog: título, resumo e data nunca são escritos
 * uma segunda vez aqui. O feed leva só o resumo, e o texto completo fica na
 * página do artigo.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

const site = BRAND.urls.site.replace(/\/$/, "");

function xml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** RSS pede data no formato RFC 822; data inválida fica de fora, não inventada. */
function rfc822(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toUTCString();
}

export function GET() {
  const artigos = [...generatedPosts].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  // Data do artigo mais recente, e não o horário do build: assim o feed só
  // anuncia novidade quando existe artigo novo ou atualizado.
  const maisRecente = artigos
    .map((p): string | null => p.updated ?? p.date)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
  const lastBuildDate = rfc822(maisRecente);

  const itens = artigos.map((p) => {
    const link = `${site}${p.url}`;
    const pubDate = rfc822(p.date);
    return [
      "    <item>",
      `      <title>${xml(p.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      p.description ? `      <description>${xml(p.description)}</description>` : null,
      pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const corpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(`Blog da ${BRAND.name}`)}</title>`,
    `    <link>${site}/blog</link>`,
    `    <description>${xml("Artigos da By Império Dog sobre o Spitz Alemão Anão (Lulu da Pomerânia).")}</description>`,
    "    <language>pt-BR</language>",
    `    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />`,
    lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : null,
    ...itens,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return new Response(corpo, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
