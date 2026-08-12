import type { Metadata } from "next";

import { canonical as resolveCanonical, SITE_ORIGIN } from "./seo.core";

type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type ImageLike = string | OgImage;

export interface PageMetadataInput {
  title: string | Metadata["title"];
  description?: string;
  path?: string;
  images?: ImageLike[];
  robots?: Metadata["robots"];
  keywords?: string[];
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
  alternates?: Metadata["alternates"];
  other?: Metadata["other"];
}

const PREVIEW_ENVS = new Set(["preview", "development", "test"]);

/**
 * Imagem padrão de compartilhamento (og:image / twitter:image).
 *
 * Era `/spitz-hero-desktop.webp`, que existe mas tem 1400x933 — as medidas
 * declaradas abaixo mentiam sobre o arquivo, e WhatsApp e Facebook ainda
 * tratam WebP de forma irregular na pré-visualização de link. Agora aponta
 * para um JPEG recortado em 1200x630 exatos, gerado a partir da própria foto
 * de capa do site.
 *
 * Exportada porque as páginas que declaram `openGraph` à mão precisam repetir
 * `images`: quando a página declara o objeto `openGraph` sem `images`, o
 * Next 14 não completa com o `opengraph-image.tsx` do segmento e a página sai
 * sem og:image nenhum.
 */
export const OG_DEFAULT_IMAGE: Required<OgImage> = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Spitz Alemão Anão (Lulu da Pomerânia) — By Império Dog",
};

const DEFAULT_IMAGE = OG_DEFAULT_IMAGE;

export function resolveRobots(overrides?: Metadata["robots"]) {
  if (overrides) return overrides;
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "";
  if (PREVIEW_ENVS.has(env)) {
    return { index: false, follow: false };
  }
  return { index: true, follow: true };
}

export function buildCanonical(path: string) {
  if (!path) return resolveCanonical("/");
  if (/^https?:\/\//i.test(path)) return path;
  return resolveCanonical(path);
}

export function baseMetaOverrides(pathname: string): Partial<Metadata> {
  const canonical = buildCanonical(pathname || "/");
  return {
    alternates: { canonical },
    openGraph: { url: canonical },
  };
}

export function pageMetadata(input: PageMetadataInput): Metadata {
  const path = input.path ?? "/";
  const canonical = buildCanonical(path);
  const images = normalizeImages(input.images);
  const robots = resolveRobots(input.robots);

  const openGraph = {
    type: "website" as const,
    url: canonical,
    title: typeof input.title === "string" ? input.title : undefined,
    description: input.description,
    images,
    ...input.openGraph,
  };

  const twitter = {
    card: "summary_large_image" as const,
    title: typeof input.title === "string" ? input.title : undefined,
    description: input.description,
    images: images.map((image) => image.url),
    ...input.twitter,
  };

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: input.title,
    description: input.description,
    robots,
    keywords: input.keywords,
    alternates: {
      canonical,
      ...input.alternates,
    },
    openGraph,
    twitter,
    other: input.other,
  };
}

function normalizeImages(images?: ImageLike[]): OgImage[] {
  if (!images || images.length === 0) {
    return [DEFAULT_IMAGE];
  }

  return images.map((image) => {
    if (typeof image === "string") {
      return {
        ...DEFAULT_IMAGE,
        url: image,
      };
    }

    return {
      url: image.url,
      width: image.width ?? DEFAULT_IMAGE.width,
      height: image.height ?? DEFAULT_IMAGE.height,
      alt: image.alt ?? DEFAULT_IMAGE.alt,
    };
  });
}
