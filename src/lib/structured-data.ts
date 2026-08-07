import { FOUNDING_YEAR } from "@/domain/config";
import type { CatalogItem } from "@/lib/catalog-utils";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

/**
 * @id único do negócio no grafo de dados estruturados.
 *
 * Antes existiam três nós para a mesma empresa — `#business` (tipado como
 * AnimalShelter), `#dogbreeder` (tipado como PetStore) e `#localbusiness`
 * (em src/lib/tracking.ts) — e várias páginas emitiam dois deles ao mesmo
 * tempo. Para o Google isso é uma empresa duplicada, não uma empresa descrita
 * duas vezes. Todos os emissores agora usam este mesmo @id, então as
 * propriedades se fundem em um só nó.
 */
export const BUSINESS_ID = `${SITE_URL}/#business`;

/**
 * Área atendida — Brasil inteiro, com as praças prioritárias declaradas
 * explicitamente.
 *
 * O envio é nacional (transporte aéreo acompanhado ou por transportadora
 * especializada), então o país é a área real de atuação. As cidades e estados
 * listados abaixo não são "mais atendidos" que os demais: são as praças onde a
 * busca por Spitz Alemão Anão tem volume relevante e onde o negócio quer ser
 * encontrado. Declarar cada uma dá ao Google um sinal geográfico explícito,
 * sem criar página nem endereço em nenhuma delas.
 *
 * Regra ao editar: só entram cidades para as quais o canil de fato consegue
 * organizar o embarque. Nada aqui deve sugerir filial, loja ou endereço local.
 */
const PRIORITY_CITIES: Array<[city: string, state: string]> = [
  // São Paulo — capital, região metropolitana e interior de alta renda
  ["São Paulo", "São Paulo"],
  ["Campinas", "São Paulo"],
  ["Santo André", "São Paulo"],
  ["São Bernardo do Campo", "São Paulo"],
  ["Guarulhos", "São Paulo"],
  ["Osasco", "São Paulo"],
  ["Barueri", "São Paulo"],
  ["Santana de Parnaíba", "São Paulo"],
  ["Jundiaí", "São Paulo"],
  ["Bragança Paulista", "São Paulo"],
  ["Atibaia", "São Paulo"],
  ["Itatiba", "São Paulo"],
  ["Vinhedo", "São Paulo"],
  ["Valinhos", "São Paulo"],
  ["Indaiatuba", "São Paulo"],
  ["Sorocaba", "São Paulo"],
  ["São José dos Campos", "São Paulo"],
  ["Taubaté", "São Paulo"],
  ["Ribeirão Preto", "São Paulo"],
  ["São José do Rio Preto", "São Paulo"],
  ["Piracicaba", "São Paulo"],
  ["Bauru", "São Paulo"],
  ["Santos", "São Paulo"],
  ["Guarujá", "São Paulo"],
  // Rio de Janeiro
  ["Rio de Janeiro", "Rio de Janeiro"],
  ["Niterói", "Rio de Janeiro"],
  ["Petrópolis", "Rio de Janeiro"],
  ["Nova Friburgo", "Rio de Janeiro"],
  ["Búzios", "Rio de Janeiro"],
  ["Angra dos Reis", "Rio de Janeiro"],
  // Minas Gerais
  ["Belo Horizonte", "Minas Gerais"],
  ["Nova Lima", "Minas Gerais"],
  ["Uberlândia", "Minas Gerais"],
  ["Uberaba", "Minas Gerais"],
  ["Juiz de Fora", "Minas Gerais"],
  ["Poços de Caldas", "Minas Gerais"],
  // Sul
  ["Curitiba", "Paraná"],
  ["Londrina", "Paraná"],
  ["Maringá", "Paraná"],
  ["Florianópolis", "Santa Catarina"],
  ["Balneário Camboriú", "Santa Catarina"],
  ["Joinville", "Santa Catarina"],
  ["Blumenau", "Santa Catarina"],
  ["Porto Alegre", "Rio Grande do Sul"],
  ["Caxias do Sul", "Rio Grande do Sul"],
  ["Gramado", "Rio Grande do Sul"],
  // Centro-Oeste
  ["Brasília", "Distrito Federal"],
  ["Goiânia", "Goiás"],
  ["Campo Grande", "Mato Grosso do Sul"],
  ["Cuiabá", "Mato Grosso"],
  // Nordeste
  ["Salvador", "Bahia"],
  ["Recife", "Pernambuco"],
  ["Fortaleza", "Ceará"],
  ["Natal", "Rio Grande do Norte"],
  ["João Pessoa", "Paraíba"],
  ["Maceió", "Alagoas"],
  ["Aracaju", "Sergipe"],
  ["São Luís", "Maranhão"],
  ["Teresina", "Piauí"],
  // Norte
  ["Manaus", "Amazonas"],
  ["Belém", "Pará"],
  ["Porto Velho", "Rondônia"],
  ["Palmas", "Tocantins"],
  // Espírito Santo
  ["Vitória", "Espírito Santo"],
  ["Vila Velha", "Espírito Santo"],
];

const PRIORITY_STATES: Array<[name: string, uf: string]> = [
  ["São Paulo", "SP"],
  ["Rio de Janeiro", "RJ"],
  ["Minas Gerais", "MG"],
  ["Espírito Santo", "ES"],
  ["Paraná", "PR"],
  ["Santa Catarina", "SC"],
  ["Rio Grande do Sul", "RS"],
  ["Distrito Federal", "DF"],
  ["Goiás", "GO"],
  ["Mato Grosso", "MT"],
  ["Mato Grosso do Sul", "MS"],
  ["Bahia", "BA"],
  ["Pernambuco", "PE"],
  ["Ceará", "CE"],
];

export const SERVED_AREAS = [
  { "@type": "Country", name: "Brasil" },
  ...PRIORITY_STATES.map(([name, uf]) => ({
    "@type": "State",
    name,
    alternateName: uf,
    containedInPlace: { "@type": "Country", name: "Brasil" },
  })),
  ...PRIORITY_CITIES.map(([city, state]) => ({
    "@type": "City",
    name: city,
    containedInPlace: { "@type": "State", name: state },
  })),
];

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

/**
 * O buildDogBreederLD foi removido.
 *
 * Ele já usava o mesmo @id do buildLocalBusinessLD — a intenção era descrever
 * um único negócio — mas trazia name, url, description e priceRange próprios.
 * Dois nós com o mesmo @id e valores diferentes não se fundem: o Search Console
 * passa a reportar "campo duplicado" e o Google escolhe um valor sozinho.
 *
 * Tudo que era exclusivo dele (makesOffer, knowsAbout de raça, alternateName de
 * criador, Pinterest) foi incorporado ao buildLocalBusinessLD abaixo, que agora
 * é a única descrição da empresa no grafo.
 */
export function buildLocalBusinessLD() {
  return {
    "@context": "https://schema.org",
    // Era ["LocalBusiness", "AnimalShelter"]. AnimalShelter é abrigo que faz
    // rehoming/adoção — o oposto do que o canil faz, e contradiz a própria
    // regra do projeto que bane "adoção"/"adotar" do conteúdo.
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: "By Império Dog",
    alternateName: ["Canil By Império Dog", "Criador Spitz Alemão Anão", "Império Dog"],
    description:
      `Criação familiar e responsável de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP. Filhotes com registro oficial, laudos veterinários, protocolo vacinal em dia conforme a idade do filhote e mentoria vitalícia inclusos. Criação especializada desde ${FOUNDING_YEAR}, com envio acompanhado para todo o Brasil.`,
    url: SITE_URL,
    telephone: "+55-11-96863-3239",
    priceRange: "R$ 6.500 – R$ 8.500",
    currenciesAccepted: "BRL",
    paymentAccepted: "PIX, transferência bancária, cartão de crédito",
    foundingDate: String(FOUNDING_YEAR),
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
    areaServed: SERVED_AREAS,
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
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "22:00",
    },
    // Sem `aggregateRating`: a nota 5.0 com reviewCount 180 era fixa no código,
    // não vinha de nenhuma plataforma de avaliações verificadas. Marcação de
    // review sem avaliação real viola a política de dados estruturados do
    // Google e sujeita o domínio a ação manual. Os 180 são famílias atendidas,
    // não avaliações — e famílias atendidas não são AggregateRating.
    knowsAbout: [
      "Spitz Alemão Anão",
      "Lulu da Pomerânia",
      "Pomeranian",
      "Spitz Alemão Preto",
      "Spitz Alemão Creme",
      "Spitz Alemão Laranja",
      "Spitz Alemão Cinza-Lobo",
      "Spitz Alemão Baby Face",
      "criação responsável de cães",
      "registro oficial",
      "genética canina",
      "socialização de filhotes",
      "mentoria para tutores",
      "filhote Spitz Alemão",
      "canil Spitz Alemão interior de São Paulo",
      "envio de filhote para todo o Brasil",
    ],
    makesOffer: [
      {
        "@type": "Offer",
        name: "Filhote de Spitz Alemão Anão — Lulu da Pomerânia",
        description:
          "Filhote de Spitz Alemão Anão (Lulu da Pomerânia) com registro oficial, laudos veterinários, protocolo vacinal em dia conforme a idade do filhote e mentoria vitalícia. Entrega presencial em Bragança Paulista, SP, ou envio acompanhado para todo o Brasil.",
        priceCurrency: "BRL",
        url: `${SITE_URL}/filhotes`,
        areaServed: { "@type": "Country", name: "Brasil" },
      },
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
      "https://www.pinterest.com/byimperiodog",
    ],
  };
}
