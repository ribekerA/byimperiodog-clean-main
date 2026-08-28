import { NextResponse } from "next/server";

import { GALLERY_VIDEOS, medidaDoVideo } from "@/domain/gallery-videos";
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

/** "PT57S" → 57. O protocolo de sitemap de vídeo quer segundos inteiros. */
function segundos(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const n = Number(iso.replace(/[^0-9]/g, ""));
  // O Google recusa duração fora de 1..28800 s — nesse caso o campo sai fora,
  // que é melhor do que o item inteiro ser rejeitado.
  return Number.isFinite(n) && n >= 1 && n <= 28800 ? n : undefined;
}

export async function GET() {
  // Cada vídeo tem uma watch page própria. Isso dá ao Google uma URL em que o
  // player é o conteúdo principal, em vez de apontar treze vídeos diferentes
  // para a mesma grade /galeria.
  const itens = GALLERY_VIDEOS.filter((v) => getImageSize(v.poster) !== undefined).map((v) => {
    const dur = segundos(medidaDoVideo(v.slug)?.duration);
    return (
      `  <url>\n` +
      `    <loc>${xmlEscape(`${site}/galeria/${v.slug}`)}</loc>\n` +
      `    <video:video>` +
      `<video:thumbnail_loc>${xmlEscape(site + v.poster)}</video:thumbnail_loc>` +
      `<video:title>${xmlEscape(v.title)}</video:title>` +
      `<video:description>${xmlEscape(v.description)}</video:description>` +
      `<video:content_loc>${xmlEscape(site + v.src)}</video:content_loc>` +
      (dur ? `<video:duration>${dur}</video:duration>` : "") +
      `<video:publication_date>${v.uploadDate}</video:publication_date>` +
      `<video:family_friendly>yes</video:family_friendly>` +
      `<video:live>no</video:live>` +
      `</video:video>\n` +
      `  </url>`
    );
  });

  // Sem capa gerada não há vídeo declarável: thumbnail_loc é obrigatório no
  // protocolo, e apontar para arquivo inexistente reprova o sitemap inteiro.
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n` +
    (itens.length > 0 ? `${itens.join("\n")}\n` : "") +
    `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
