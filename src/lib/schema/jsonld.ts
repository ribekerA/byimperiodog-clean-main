// src/lib/schema/jsonld.ts
// Módulo centralizado de geração de JSON-LD (Schema.org) para o site By Império Dog.
// Não depende de componentes React; recebe apenas dados de domínio.

import { buildPuppyOfferCatalogLD, buildPuppyProductLD, type Puppy } from "./puppy";

const SITE_URL_DEFAULT = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";
const BRAND_NAME = "By Império Dog";
const BRAND_URL = SITE_URL_DEFAULT;
const BRAND_LOGO = `${SITE_URL_DEFAULT}/logo.png`;

type LocalBusinessInput = {
  city?: string;
  state?: string;
  areaServed?: string | string[];
  phone?: string;
  whatsapp?: string;
  sameAs?: string[];
  url?: string;
  image?: string;
  addressLine1?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

type FAQItem = { question: string; answer: string };

type ArticleInput = {
  title: string;
  description: string;
  slug: string;
  image?: string;
  datePublished: string; // ISO
  dateModified?: string;
  authorName?: string;
  tags?: string[];
  urlBase?: string; // opcional; default SITE_URL_DEFAULT
};

type ColorCollectionInput = {
  color: string;
  puppies: Puppy[];
};

type CatalogInput = {
  puppies: Puppy[];
};

export function buildPuppyProductSchema(puppy: Puppy) {
  return buildPuppyProductLD(puppy);
}

export function buildOfferCatalogSchema({ puppies }: CatalogInput) {
  return buildPuppyOfferCatalogLD(puppies);
}

export function buildColorCollectionSchema({
  color,
  puppies,
}: ColorCollectionInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Spitz Alemão Anão cor ${color} | ${BRAND_NAME}`,
    description: `Catálogo de filhotes de Spitz Alemão Anão na cor ${color}, selecionados pela ${BRAND_NAME}.`,
    url: `${SITE_URL_DEFAULT}/spitz/cor/${encodeURIComponent(color.toLowerCase())}`,
    mainEntity: buildPuppyOfferCatalogLD(puppies),
  };
}

export function buildLocalBusinessSchema(input: LocalBusinessInput): Record<string, unknown> {
  const {
    city,
    state,
    areaServed,
    phone,
    whatsapp,
    sameAs,
    url = SITE_URL_DEFAULT,
    image = BRAND_LOGO,
    addressLine1,
    postalCode,
    latitude,
    longitude,
  } = input;

  const area = Array.isArray(areaServed)
    ? areaServed
    : areaServed
      ? [areaServed]
      : city
        ? [`${city}${state ? `, ${state}` : ""}`]
        : [];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND_NAME,
    url,
    image,
    logo: BRAND_LOGO,
    telephone: phone ?? undefined,
    areaServed: area,
    address: city || state || addressLine1
      ? {
          "@type": "PostalAddress",
          addressLocality: city ?? undefined,
          addressRegion: state ?? undefined,
          streetAddress: addressLine1 ?? undefined,
          postalCode: postalCode ?? undefined,
          addressCountry: "BR",
        }
      : undefined,
    geo:
      latitude !== undefined && longitude !== undefined
        ? {
            "@type": "GeoCoordinates",
            latitude,
            longitude,
          }
        : undefined,
    sameAs,
    contactPoint:
      phone || whatsapp
        ? [
            {
              "@type": "ContactPoint",
              telephone: whatsapp ?? phone,
              contactType: "customer service",
              areaServed: area.length ? area : undefined,
              availableLanguage: ["Portuguese"],
            },
          ]
        : undefined,
  };
}

export function buildFAQPageSchema(faq: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildArticleSchema({
  title,
  description,
  slug,
  image,
  datePublished,
  dateModified,
  authorName,
  tags,
  urlBase = SITE_URL_DEFAULT,
}: ArticleInput): Record<string, unknown> {
  const url = `${urlBase.replace(/\/$/, "")}/guia-spitz/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: url,
    url,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      "@type": "Organization",
      name: authorName ?? BRAND_NAME,
      url: BRAND_URL,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: BRAND_URL,
      logo: {
        "@type": "ImageObject",
        url: BRAND_LOGO,
      },
    },
    image: image ? [image] : undefined,
    articleSection: tags,
    keywords: tags,
  };
}
