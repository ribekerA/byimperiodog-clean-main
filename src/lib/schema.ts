import { lastmodFor } from "@/lib/_generated-lastmod";

type JsonLd = Record<string, unknown>;

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br";

export function organizationSchema(siteUrl: string = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "By Império Dog",
    url: baseUrl,
    logo: `${baseUrl}/byimperiologo.svg`,
    sameAs: [
      "https://www.instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+55 11 96863-3239",
        contactType: "customer service",
        availableLanguage: ["pt-BR"],
        areaServed: ["BR"],
      },
    ],
  };
}

export function websiteSchema(siteUrl: string = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "By Império Dog",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productSchema(
  siteUrl: string,
  puppy: {
    id: string;
    name: string;
    price_cents?: number | null;
    gender?: string | null;
    color?: string | null;
  }
): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const price =
    typeof puppy.price_cents === "number"
      ? (puppy.price_cents / 100).toFixed(2)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/filhotes/${puppy.id}#product`,
    name: puppy.name,
    description:
      "Spitz Alemão Anão (Lulu da Pomerânia) dentro do padrão FCI nº 97 — altura na cernelha de 21 cm ± 3 cm —, com acompanhamento vitalício e suporte personalizado.",
    brand: {
      "@type": "Brand",
      name: "By Império Dog",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price,
      availability: "https://schema.org/LimitedAvailability",
      url: `${baseUrl}/filhotes`,
    },
    additionalProperty: [
      puppy.gender
        ? { "@type": "PropertyValue", name: "Sexo", value: puppy.gender }
        : null,
      puppy.color
        ? { "@type": "PropertyValue", name: "Cor", value: puppy.color }
        : null,
    ].filter(Boolean),
  };
}

export function faqSchema(
  siteUrl: string,
  faqs: Array<{ question: string; answer: string }>
): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${baseUrl}/faq#faq`,
    mainEntity: buildFaqEntities(faqs),
  };
}

export function faqPageSchema(
  faqs: Array<{ question: string; answer: string }>,
  canonicalUrl: string
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: canonicalUrl,
    mainEntity: buildFaqEntities(faqs),
  };
}

export function blogPostingSchema(
  siteUrl: string,
  post: {
    slug: string;
    title: string;
    description: string;
    publishedAt: string;
    modifiedAt?: string | null;
    image?: { url: string; alt?: string | null };
    author?: { name: string; url?: string | null };
    keywords?: string[];
    articleSection?: string | null;
  }
): JsonLd {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt ?? post.publishedAt,
    image: post.image?.url ? [post.image.url] : undefined,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
          url: post.author.url ?? undefined,
        }
      : {
          "@type": "Organization",
          name: "By Império Dog",
        },
    publisher: {
      "@type": "Organization",
      name: "By Império Dog",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/byimperiologo.svg`,
      },
    },
    keywords: post.keywords && post.keywords.length > 0 ? post.keywords : undefined,
    articleSection: post.articleSection ?? undefined,
  };
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, "");
}

function buildFaqEntities(
  faqs: Array<{ question: string; answer: string }>
) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));
}

/** Product JSON-LD with richer details for individual puppy pages. */
export function buildProductLD(opts: {
  siteUrl: string;
  id: string;
  name: string;
  description?: string;
  image?: string;
  priceCents?: number | null;
  gender?: string | null;
  color?: string | null;
  birthDate?: string | null;
  aggregateRating?: { ratingValue: number; reviewCount: number } | null;
}): JsonLd {
  const base = normalizeSiteUrl(opts.siteUrl);
  const url = `${base}/filhotes/${opts.id}`;
  const price =
    typeof opts.priceCents === "number" && opts.priceCents > 0
      ? (opts.priceCents / 100).toFixed(2)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: opts.name,
    description:
      opts.description ||
      "Spitz Alemão Anão (Lulu da Pomerânia) com acompanhamento vitalício e suporte personalizado pela By Império Dog.",
    image: opts.image ? [opts.image] : undefined,
    brand: {
      "@type": "Brand",
      name: "By Império Dog",
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price,
      availability: price
        ? "https://schema.org/InStock"
        : "https://schema.org/LimitedAvailability",
      seller: {
        "@type": "Organization",
        name: "By Império Dog",
      },
    },
    aggregateRating: opts.aggregateRating
      ? {
          "@type": "AggregateRating",
          ratingValue: opts.aggregateRating.ratingValue,
          reviewCount: opts.aggregateRating.reviewCount,
        }
      : undefined,
    additionalProperty: [
      opts.gender
        ? { "@type": "PropertyValue", name: "Sexo", value: opts.gender }
        : null,
      opts.color
        ? { "@type": "PropertyValue", name: "Cor", value: opts.color }
        : null,
      opts.birthDate
        ? {
            "@type": "PropertyValue",
            name: "Data de nascimento",
            value: opts.birthDate,
          }
        : null,
    ].filter(Boolean),
  };
}

/** OfferCatalog (ItemList of Offers) for listing pages like /filhotes. */
export function buildOfferCatalogLD(opts: {
  siteUrl: string;
  puppies: Array<{
    id: string;
    name: string;
    priceCents?: number | null;
    image?: string | null;
  }>;
}): JsonLd {
  const base = normalizeSiteUrl(opts.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${base}/filhotes#offercatalog`,
    name: "Filhotes de Spitz Alemão Anão disponíveis",
    itemListElement: opts.puppies.map((puppy, idx) => {
      const price =
        typeof puppy.priceCents === "number" && puppy.priceCents > 0
          ? (puppy.priceCents / 100).toFixed(2)
          : undefined;
      return {
        "@type": "Offer",
        position: idx + 1,
        itemOffered: {
          "@type": "Product",
          name: puppy.name,
          image: puppy.image ? [puppy.image] : undefined,
        },
        priceCurrency: "BRL",
        price,
        availability: price
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
        url: `${base}/filhotes/${puppy.id}`,
      };
    }),
  };
}

/**
 * Resolve a data de modificacao REAL de uma pagina.
 *
 * O `dateModified` declarado a mao envelhece: nove paginas anunciavam
 * `datePublished: "2025-01-01"` sem `dateModified`, entao o schema afirmava
 * que nada mudou desde entao — enquanto o git mostra revisao em 2026. O
 * resultado e o oposto do pretendido: a pagina revisada parece velha.
 *
 * A fonte da verdade e o historico do git, compilado por
 * scripts/gen-lastmod.mjs em src/lib/_generated-lastmod.ts. Aqui pegamos a
 * MAIOR entre (dateModified declarado, lastmod do git, datePublished), para
 * que uma data declarada a mao nunca seja rebaixada e nunca fique atras da
 * alteracao real.
 */
function dataDeModificacaoReal(
  url: string,
  datePublished: string,
  dateModified?: string
): string {
  const rota = url.startsWith("http") ? new URL(url).pathname : url;
  const candidatas = [dateModified, lastmodFor(rota), datePublished].filter(
    Boolean
  ) as string[];
  return candidatas.reduce((maior, d) =>
    Date.parse(d) > Date.parse(maior) ? d : maior
  );
}

/**
 * Build Article JSON-LD schema
 */
export function buildArticleLD(opts: {
  url: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  /**
   * Entidade sobre a qual a pagina fala. Existe para que o no de sinonimos
   * (Spitz Alemao Anao = Lulu da Pomerania = Pomeranian) pendure no proprio
   * Article, em vez de virar um segundo Article solto e sem data na mesma
   * pagina — que era o caso em /spitz-alemao e /lulu-da-pomerania.
   */
  about?: JsonLd;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: dataDeModificacaoReal(
      opts.url,
      opts.datePublished,
      opts.dateModified
    ),
    image: opts.image,
    about: opts.about,
    author: {
      "@type": "Organization",
      name: "By Império Dog",
    },
  };
}

/**
 * Build FAQ Page JSON-LD schema
 */
export function buildFAQPageLD(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Build Breadcrumb JSON-LD schema
 */
export function buildBreadcrumbLD(items: Array<{ name: string; url: string }>) {
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
