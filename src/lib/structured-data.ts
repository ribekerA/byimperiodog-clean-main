import type { CatalogItem } from "@/lib/catalog-utils";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

export function buildPuppyProductLD(
  puppy: CatalogItem,
  aggregateRating?: { ratingValue: number; reviewCount: number }
) {
  const images = puppy.images
    .filter((img: string) => !img.endsWith(".mp4"))
    .map((img: string) => `${SITE_URL}${img}`);

  const availability =
    puppy.status === "available"
      ? "https://schema.org/InStock"
      : puppy.status === "reserved"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/OutOfStock";

  const priceValidUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const priceCents =
    (puppy as unknown as Record<string, number>).priceCents ??
    (puppy as unknown as Record<string, number>).price_cents ??
    0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/filhotes/${puppy.slug}#product`,
    name: puppy.name,
    description: (puppy as unknown as Record<string, string>).description,
    image: images.length > 0 ? images : undefined,
    url: `${SITE_URL}/filhotes/${puppy.slug}`,
    brand: { "@type": "Brand", name: "By Império Dog" },
    ...(aggregateRating && aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            "@type":      "AggregateRating",
            ratingValue:  aggregateRating.ratingValue.toFixed(1),
            reviewCount:  aggregateRating.reviewCount,
            bestRating:   5,
            worstRating:  1,
          },
        }
      : {}),
    offers: {
      "@type":          "Offer",
      priceCurrency:    "BRL",
      price:            (priceCents / 100).toFixed(2),
      priceValidUntil,
      availability,
      url:              `${SITE_URL}/filhotes/${puppy.slug}`,
      seller: {
        "@type": "LocalBusiness",
        name:    "By Império Dog",
        address: {
          "@type":          "PostalAddress",
          addressLocality:  "Bragança Paulista",
          addressRegion:    "SP",
          addressCountry:   "BR",
        },
      },
    },
  };
}

// ─── ItemList para página de catálogo ────────────────────────────────────────

export function buildItemListLD(puppies: CatalogItem[]) {
  return {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    name:       "Filhotes de Spitz Alemão Anão disponíveis — By Império Dog",
    url:        `${SITE_URL}/filhotes`,
    numberOfItems: puppies.length,
    itemListElement: puppies.map((p, i) => ({
      "@type":    "ListItem",
      position:   i + 1,
      name:       p.name,
      url:        `${SITE_URL}/filhotes/${p.slug}`,
      image:      p.images.find((img: string) => !img.endsWith(".mp4"))
        ? `${SITE_URL}${p.images.find((img: string) => !img.endsWith(".mp4"))}`
        : undefined,
    })),
  };
}

export function buildBreadcrumbLD(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function buildFAQLD(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function buildArticleLD(opts: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: opts.url.startsWith("http") ? opts.url : `${SITE_URL}${opts.url}`,
    datePublished: opts.publishedAt,
    dateModified: opts.updatedAt ?? opts.publishedAt,
    author: { "@type": "Organization", name: "By Império Dog" },
    publisher: {
      "@type": "Organization",
      name: "By Império Dog",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
  };
}

export function buildLocalBusinessLD() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "AnimalShelter"],
    "@id": `${SITE_URL}/#business`,
    name: "By Império Dog",
    alternateName: ["By Imperio Dog", "Canil By Império Dog"],
    description:
      "Criação familiar e responsável de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP. Filhotes com registro oficial, laudos veterinários, vacinação completa e mentoria vitalícia inclusos. Mais de 10 anos de criação especializada e 180+ famílias atendidas em todo o Brasil.",
    url: SITE_URL,
    telephone: "+55-11-96863-3239",
    priceRange: "R$ 7.000 – R$ 15.000",
    currenciesAccepted: "BRL",
    paymentAccepted: "PIX, transferência bancária, cartão de crédito",
    foundingDate: "2012",
    image: [
      `${SITE_URL}/og/home.jpg`,
      `${SITE_URL}/filhotes/creme/creme-femea-01.jpg`,
      `${SITE_URL}/filhotes/laranja/laranja-femea-01.jpg`,
    ],
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/byimperiologo.svg`,
      width: 120,
      height: 120,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Bragança Paulista",
      addressLocality: "Bragança Paulista",
      addressRegion: "SP",
      postalCode: "12900-000",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -22.9538,
      longitude: -46.5429,
    },
    hasMap: "https://maps.google.com/?q=Bragan%C3%A7a+Paulista+SP",
    areaServed: {
      "@type": "Country",
      name: "Brasil",
    },
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: -22.9538,
        longitude: -46.5429,
      },
      geoRadius: "2000000",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "180",
      bestRating: "5",
      worstRating: "1",
    },
    knowsAbout: [
      "Spitz Alemão Anão",
      "Lulu da Pomerânia",
      "Pomeranian",
      "criação responsável de cães",
      "registro oficial",
      "genética canina",
      "socialização de filhotes",
      "mentoria para tutores",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Filhotes de Spitz Alemão Anão disponíveis",
      url: `${SITE_URL}/filhotes`,
    },
    sameAs: [
      "https://www.instagram.com/byimperiodog",
      "https://www.facebook.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodogs",
    ],
  };
}
