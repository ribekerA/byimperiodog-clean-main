/**
 * @module lib/schema/puppy
 * @description Geração de JSON-LD Schema.org para filhotes de Spitz Alemão
 * 
 * REGRA DE NEGÓCIO:
 * Todos os filhotes são comercializados sob a marca "By Império Dog"
 * Não expomos informações de criadores parceiros ao público
 */

import { BRAND } from "@/domain/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || BRAND.urls.site;
const BUSINESS_NAME = BRAND.name;
const CURRENCY = "BRL";

/**
 * Tipo para dados de filhote no schema (pode vir do DB)
 */
export type PuppyForSchema = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number; // Preço em centavos (ex: 350000 = R$ 3.500,00)
  color: string;
  sex: "macho" | "fêmea" | "male" | "female";
  birthDate?: string; // ISO 8601 format (YYYY-MM-DD)
  images: string[];
  city: string;
  state: string;
  status: "available" | "reserved" | "sold" | "disponivel" | "reservado" | "vendido";
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
};

/**
 * Mapeia status do filhote para Schema.org ItemAvailability
 */
function resolveAvailability(status: PuppyForSchema["status"]): string {
  const map: Record<string, string> = {
    available: "https://schema.org/InStock",
    disponivel: "https://schema.org/InStock",
    reserved: "https://schema.org/PreOrder",
    reservado: "https://schema.org/PreOrder",
    sold: "https://schema.org/SoldOut",
    vendido: "https://schema.org/SoldOut",
  };
  return map[status] || "https://schema.org/InStock";
}

/**
 * Mapeia sexo para português legível
 */
function resolveSexLabel(sex: PuppyForSchema["sex"]): string {
  return sex === "macho" || sex === "male" ? "Macho" : "Fêmea";
}

/**
 * Formata preço de centavos para BRL com 2 casas decimais
 */
function formatPrice(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}

/**
 * Gera JSON-LD do tipo Product para um filhote individual
 * 
 * IMPORTANTE: Sempre usa "By Império Dog" como seller, nunca criador parceiro
 *
 * @param puppy - Dados do filhote
 * @returns JSON-LD Product schema
 *
 * @example
 * ```tsx
 * const productLd = buildPuppyProductLD(puppy);
 * <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(productLd)}} />
 * ```
 */
export function buildPuppyProductLD(puppy: PuppyForSchema): Record<string, unknown> {
  const url = `${SITE_URL}/filhotes/${puppy.slug}`;
  const availability = resolveAvailability(puppy.status);
  const sexLabel = resolveSexLabel(puppy.sex);
  const price = formatPrice(puppy.price);

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: puppy.title,
    description: puppy.description,
    url,
    image: puppy.images.length > 0 ? puppy.images : undefined,
    brand: {
      "@type": "Brand",
      name: BUSINESS_NAME,
    },
    category: "Filhotes de Cachorro",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: CURRENCY,
      price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: BUSINESS_NAME, // SEMPRE By Império Dog
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BR",
          addressRegion: puppy.state,
        },
      },
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Raça",
        value: "Spitz Alemão Anão (Lulu da Pomerânia)",
      },
      {
        "@type": "PropertyValue",
        name: "Sexo",
        value: sexLabel,
      },
      {
        "@type": "PropertyValue",
        name: "Cor",
        value: puppy.color.charAt(0).toUpperCase() + puppy.color.slice(1),
      },
      {
        "@type": "PropertyValue",
        name: "Cidade",
        value: puppy.city,
      },
      {
        "@type": "PropertyValue",
        name: "Estado",
        value: puppy.state,
      },
    ],
  };

  // Adiciona data de nascimento se disponível
  if (puppy.birthDate) {
    (product.additionalProperty as Array<Record<string, unknown>>).push({
      "@type": "PropertyValue",
      name: "Data de Nascimento",
      value: puppy.birthDate,
    });
  }

  // Adiciona AggregateRating se houver avaliações
  if (puppy.aggregateRating && puppy.aggregateRating.reviewCount > 0) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: puppy.aggregateRating.ratingValue.toFixed(1),
      reviewCount: puppy.aggregateRating.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return product;
}

/**
 * Gera JSON-LD do tipo OfferCatalog para uma lista de filhotes
 *
 * @param puppies - Array de filhotes
 * @returns JSON-LD OfferCatalog schema
 *
 * @example
 * ```tsx
 * const catalogLd = buildPuppyOfferCatalogLD(puppies);
 * <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(catalogLd)}} />
 * ```
 */
export function buildPuppyOfferCatalogLD(puppies: PuppyForSchema[]): Record<string, unknown> {
  const itemListElement = puppies.map((puppy, index) => {
    const url = `${SITE_URL}/filhotes/${puppy.slug}`;
    const availability = resolveAvailability(puppy.status);
    const price = formatPrice(puppy.price);
    const sexLabel = resolveSexLabel(puppy.sex);

    return {
      "@type": "Offer",
      position: index + 1,
      url,
      name: puppy.title,
      description: puppy.description.substring(0, 200),
      priceCurrency: CURRENCY,
      price,
      availability,
      image: puppy.images[0],
      seller: {
        "@type": "Organization",
        name: BUSINESS_NAME, // SEMPRE By Império Dog
      },
      itemOffered: {
        "@type": "Product",
        "@id": `${url}#product`,
        name: puppy.title,
        category: "Filhotes de Cachorro",
        brand: {
          "@type": "Brand",
          name: BUSINESS_NAME,
        },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Sexo",
            value: sexLabel,
          },
          {
            "@type": "PropertyValue",
            name: "Cor",
            value: puppy.color.charAt(0).toUpperCase() + puppy.color.slice(1),
          },
        ],
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${SITE_URL}/filhotes#offercatalog`,
    name: "Filhotes de Spitz Alemão Disponíveis",
    description: "Catálogo completo de filhotes de Spitz Alemão Anão (Lulu da Pomerânia) disponíveis para venda",
    url: `${SITE_URL}/filhotes`,
    numberOfItems: puppies.length,
    itemListElement,
  };
}

/**
 * Gera JSON-LD do tipo BreadcrumbList para navegação do filhote
 *
 * @param puppy - Dados do filhote
 * @returns JSON-LD BreadcrumbList schema
 *
 * @example
 * ```tsx
 * const breadcrumbLd = buildPuppyBreadcrumbLD(puppy);
 * <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbLd)}} />
 * ```
 */
export function buildPuppyBreadcrumbLD(puppy: PuppyForSchema): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Filhotes",
        item: `${SITE_URL}/filhotes`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: puppy.title,
        item: `${SITE_URL}/filhotes/${puppy.slug}`,
      },
    ],
  };
}

/**
 * Helper para converter dados do Supabase para o tipo PuppyForSchema
 * 
 * IMPORTANTE: Remove campos internos como is_partner_breeder, breeder_name
 * Esses dados são apenas para controle administrativo interno
 *
 * @param dbPuppy - Dados do filhote vindos do Supabase
 * @returns Objeto PuppyForSchema formatado (sem informações de parceiro)
 */
export function normalizePuppyFromDB(dbPuppy: {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  price_cents: number;
  color?: string;
  gender?: string;
  sex?: string;
  birth_date?: string;
  images?: string[];
  city?: string;
  state?: string;
  status?: string;
  aggregate_rating?: number;
  review_count?: number;
  // Campos internos (não expostos):
  is_partner_breeder?: boolean;
  breeder_name?: string;
  source?: string;
  internal_source_id?: string;
}): PuppyForSchema {
  const slug = dbPuppy.slug || dbPuppy.name.toLowerCase().replace(/\s+/g, "-");
  
  // Normaliza sex/gender
  let sex: "macho" | "fêmea" = "macho";
  if (dbPuppy.sex === "female" || dbPuppy.gender === "female") {
    sex = "fêmea";
  } else if (dbPuppy.sex === "fêmea" || dbPuppy.gender === "fêmea") {
    sex = "fêmea";
  }

  return {
    id: dbPuppy.id,
    slug,
    title: dbPuppy.name,
    description: dbPuppy.description || `Filhote de Spitz Alemão Anão - ${dbPuppy.name}`,
    price: dbPuppy.price_cents,
    color: dbPuppy.color || "creme",
    sex,
    birthDate: dbPuppy.birth_date,
    images: dbPuppy.images || [],
    city: dbPuppy.city || "Bragança Paulista",
    state: dbPuppy.state || "SP",
    status: (dbPuppy.status || "available") as PuppyForSchema["status"],
    aggregateRating:
      dbPuppy.aggregate_rating && dbPuppy.review_count
        ? {
            ratingValue: dbPuppy.aggregate_rating,
            reviewCount: dbPuppy.review_count,
          }
        : undefined,
  };
}

/**
 * Re-export do tipo Puppy como PuppySchema para compatibilidade
 * @deprecated Use PuppyForSchema
 */
export type Puppy = PuppyForSchema;
