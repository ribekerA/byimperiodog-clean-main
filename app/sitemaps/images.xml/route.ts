import { NextResponse } from "next/server";

import { staticPuppies } from "@/content/puppies-static";
import { GALLERY_VIDEOS } from "@/domain/gallery-videos";
import { getImageSize } from "@/lib/_generated-image-sizes";

export const revalidate = 300;

const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Imagem = { loc: string; title: string };
type Pagina = { loc: string; imagens: Imagem[] };

/**
 * Só entra imagem que o manifesto de dimensões conhece.
 *
 * O manifesto é gerado por scripts/gen-image-sizes.mjs medindo os arquivos de
 * public/ um por um com o sharp — se o caminho está lá, o arquivo existe e abre.
 * É a checagem de existência que este sitemap precisa sem depender de `fs` em
 * tempo de execução, que numa função serverless não enxerga public/.
 */
function existe(src: string): boolean {
  return getImageSize(src) !== undefined;
}

export async function GET() {
  // Uma imagem aparece uma vez só, na página canônica dela. Declarar a mesma
  // foto em três URLs não amplia cobertura — é duplicação, e o Google trata
  // como tal.
  const jaUsadas = new Set<string>();
  const paginas: Pagina[] = [];

  // ─── Fotos dos filhotes → a página do próprio filhote ──────────────────────
  for (const filhote of staticPuppies) {
    const imagens = filhote.images
      .filter((src) => !src.endsWith(".mp4"))
      .filter(existe)
      .filter((src) => !jaUsadas.has(src));

    if (imagens.length === 0) continue;
    imagens.forEach((src) => jaUsadas.add(src));

    paginas.push({
      loc: `${site}/filhotes/${filhote.slug}`,
      imagens: imagens.map((src) => ({ loc: site + src, title: filhote.name })),
    });
  }

  // ─── Capas dos vídeos → a galeria, que é onde eles são exibidos ────────────
  const capas = GALLERY_VIDEOS.map((v) => ({ src: v.poster, title: v.title }))
    .filter((c) => existe(c.src) && !jaUsadas.has(c.src));
  capas.forEach((c) => jaUsadas.add(c.src));

  if (capas.length > 0) {
    paginas.push({
      loc: `${site}/galeria`,
      imagens: capas.map((c) => ({ loc: site + c.src, title: c.title })),
    });
  }

  // Ícone, favicon, logo e fundo decorativo ficam de fora por construção: as
  // duas fontes acima só produzem foto de filhote e capa de vídeo.
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    paginas
      .map(
        (p) =>
          `  <url><loc>${xmlEscape(p.loc)}</loc>` +
          p.imagens
            .map(
              (i) =>
                `<image:image><image:loc>${xmlEscape(i.loc)}</image:loc>` +
                `<image:title>${xmlEscape(i.title)}</image:title></image:image>`
            )
            .join("") +
          `</url>`
      )
      .join("\n") +
    `\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
