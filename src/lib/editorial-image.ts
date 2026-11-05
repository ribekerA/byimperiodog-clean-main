import { getImageSize } from "./_generated-image-sizes";

const SITE = "https://byimperiodog.com.br";

/** Um contrato para capa real, metadata, Article e sitemap. Não cria imagens. */
export function editorialImage(source: string | null | undefined, alt: string, pageUrl: string) {
  if (!source) return undefined;
  let url: URL;
  try { url = new URL(source, SITE); } catch { return undefined; }
  if (url.protocol !== "https:" || url.username || url.password) return undefined;
  const local = ["byimperiodog.com.br", "www.byimperiodog.com.br"].includes(url.hostname);
  const dimensions = local ? getImageSize(url.pathname) : undefined;
  // O manifesto comprova existência e dimensões do arquivo original.
  if (local && !dimensions) return undefined;
  if (local) url.hostname = "byimperiodog.com.br";
  if (/\.svg$/i.test(url.pathname) || /(?:logo|favicon|apple-touch-icon)/i.test(url.pathname)) return undefined;
  const [width, height] = dimensions ?? [];
  const absolute = url.toString();
  return {
    url: absolute, width, height, alt,
    largeImage: width != null ? width >= 1200 : undefined,
    schema: {
      "@type": "ImageObject",
      "@id": `${pageUrl}#primaryimage`,
      url: absolute,
      contentUrl: absolute,
      width, height,
      caption: alt,
    },
  };
}
