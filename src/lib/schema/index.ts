/**
 * @module lib/schema
 * @description Módulo central para geração de JSON-LD (Schema.org) do site By Império Dog
 *
 * Regras:
 * - Desacoplado da UI (funções puras)
 * - Usa camada de domínio (config, taxonomias)
 * - Marca vendedora/autor sempre "By Império Dog"
 * - Nunca expõe origem externa
 */

import { BRAND } from "@/domain/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || BRAND.urls.site;
const CURRENCY = "BRL";

// Tipos mínimos para entrada nas funções
export type SexLabel = "macho" | "fêmea" | "male" | "female";

export type PuppyForSchema = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceCents: number; // centavos
  color: string;
  sex: SexLabel;
  birthDate?: string; // YYYY-MM-DD
  images: string[];
  city: string;
  state: string;
  status: "available" | "reserved" | "sold" | "disponivel" | "reservado" | "vendido" | "coming-soon";
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
};

export type FAQItem = { question: string; answer: string };

export type ArticleInput = {
  url: string;
  title: string;
  description: string;
  image?: string;
  datePublished: string; // YYYY-MM-DD
  dateModified?: string; // YYYY-MM-DD
  authorName?: string; // default BRAND.name
};

function availabilityFromStatus(status: PuppyForSchema["status"]): string {
  const map: Record<string, string> = {
    available: "https://schema.org/InStock",
    disponivel: "https://schema.org/InStock",
    reserved: "https://schema.org/PreOrder",
    reservado: "https://schema.org/PreOrder",
    sold: "https://schema.org/SoldOut",
    vendido: "https://schema.org/SoldOut",
    "coming-soon": "https://schema.org/PreOrder",
  };
  return map[status] ?? "https://schema.org/InStock";
}

function formatPriceBRL(cents: number): string {
  return (cents / 100).toFixed(2);
}

function sexLabel(sex: SexLabel): string {
  return sex === "male" || sex === "macho" ? "Macho" : "Fêmea";
}

// 1) Product (filhote individual)
export function buildProductLD(puppy: PuppyForSchema): Record<string, unknown> {
  const url = `${SITE_URL}/filhotes/${puppy.slug}`;
  const availability = availabilityFromStatus(puppy.status);
  const price = formatPriceBRL(puppy.priceCents);

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: puppy.title,
    description: puppy.description,
    url,
    image: puppy.images.length ? puppy.images : undefined,
    brand: { "@type": "Brand", name: BRAND.name },
    category: "Filhotes de Cachorro",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: CURRENCY,
      price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND.name },
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR", addressRegion: puppy.state },
      },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Raça", value: "Spitz Alemão Anão (Lulu da Pomerânia)" },
      { "@type": "PropertyValue", name: "Sexo", value: sexLabel(puppy.sex) },
      { "@type": "PropertyValue", name: "Cor", value: puppy.color.charAt(0).toUpperCase() + puppy.color.slice(1) },
      { "@type": "PropertyValue", name: "Cidade", value: puppy.city },
      { "@type": "PropertyValue", name: "Estado", value: puppy.state },
    ],
  };

  if (puppy.birthDate) {
    (ld.additionalProperty as Array<Record<string, unknown>>).push({
      "@type": "PropertyValue",
      name: "Data de Nascimento",
      value: puppy.birthDate,
    });
  }

  if (puppy.aggregateRating && puppy.aggregateRating.reviewCount > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: puppy.aggregateRating.ratingValue.toFixed(1),
      reviewCount: puppy.aggregateRating.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return ld;
}

// 2) OfferCatalog (lista de filhotes)
export function buildOfferCatalogLD(puppies: PuppyForSchema[]): Record<string, unknown> {
  const itemListElement = puppies.map((p, i) => {
    const url = `${SITE_URL}/filhotes/${p.slug}`;
    return {
      "@type": "Offer",
      position: i + 1,
      url,
      name: p.title,
      description: p.description.substring(0, 200),
      priceCurrency: CURRENCY,
      price: formatPriceBRL(p.priceCents),
      availability: availabilityFromStatus(p.status),
      image: p.images[0],
      seller: { "@type": "Organization", name: BRAND.name },
      itemOffered: {
        "@type": "Product",
        "@id": `${url}#product`,
        name: p.title,
        category: "Filhotes de Cachorro",
        brand: { "@type": "Brand", name: BRAND.name },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Sexo", value: sexLabel(p.sex) },
          { "@type": "PropertyValue", name: "Cor", value: p.color.charAt(0).toUpperCase() + p.color.slice(1) },
        ],
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${SITE_URL}/filhotes#offercatalog`,
    name: "Filhotes de Spitz Alemão Disponíveis",
    description: "Catálogo completo de filhotes de Spitz Alemão Anão disponíveis para venda",
    url: `${SITE_URL}/filhotes`,
    numberOfItems: puppies.length,
    itemListElement,
  };
}

// 3) LocalBusiness (By Império Dog)
export function buildLocalBusinessLD(options?: {
  city?: { name: string; state: string };
  areasServed?: Array<{ name: string; state: string }>;
}): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND.name,
    url: SITE_URL,
    telephone: BRAND.contact.phone,
    areaServed: (options?.areasServed || []).map((c) => ({ "@type": "City", name: c.name, address: { addressRegion: c.state, addressCountry: "BR" } })),
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.headquarters.city,
      addressRegion: BRAND.headquarters.state,
      addressCountry: "BR",
    },
    sameAs: [
      `https://instagram.com/${BRAND.social.instagram.replace(/^@/, "")}`,
      `https://facebook.com/${BRAND.social.facebook}`,
      `https://youtube.com/${BRAND.social.youtube.replace(/^@/, "")}`,
    ],
  } as Record<string, unknown>;

  if (options?.city) {
    base.areaServed = [
      { "@type": "City", name: options.city.name, address: { addressRegion: options.city.state, addressCountry: "BR" } },
    ];
  }

  return base;
}

// 4) Página de COR (collection focada em uma cor)
export function buildColorCollectionLD(color: string, puppies: PuppyForSchema[]): Record<string, unknown> {
  const name = `Filhotes de Spitz Alemão ${color.charAt(0).toUpperCase() + color.slice(1)}`;
  const url = `${SITE_URL}/filhotes/${color}`;
  const offerCatalog = buildOfferCatalogLD(puppies);

  return {
    "@context": "https://schema.org",
    "@type": "Collection",
    name,
    url,
    hasPart: offerCatalog,
  };
}

// 5) FAQPage
export function buildFAQPageLD(items: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

// 6) Article (Blog)
export function buildArticleLD(article: ArticleInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image ? [article.image] : undefined,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: { "@type": "Organization", name: article.authorName || BRAND.name },
    publisher: { "@type": "Organization", name: BRAND.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
  };
}

// 7) Breadcrumb (comum)
export function buildBreadcrumbLD(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
