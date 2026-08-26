import { BRAND, FOUNDING_YEAR } from "@/domain/config";
import { FAIXA_PUBLICA, formatarPreco } from "@/domain/pricing";
import { lastmodFor } from "@/lib/_generated-lastmod";
import type { CatalogItem } from "@/lib/catalog-utils";

const SITE_URL = BRAND.urls.site;

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

/** Área efetivamente atendida, sem cidades escolhidas por volume de busca. */
export const SERVED_AREAS = [{ "@type": "Country", name: "Brasil" }] as const;

export function buildPuppyProductLD(
  puppy: CatalogItem,
  aggregateRating?: { ratingValue: number; reviewCount: number }
) {
  const images = puppy.images
    .filter((img: string) => !img.endsWith(".mp4"))
    .map((img: string) => `${SITE_URL}${img}`);

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
    ...(puppy.status === "available"
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: (priceCents / 100).toFixed(2),
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/filhotes/${puppy.slug}`,
            seller: { "@id": BUSINESS_ID },
          },
        }
      : {}),
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

/**
 * `dateModified` valia `updatedAt ?? publishedAt`. Como quase nenhuma página
 * institucional passa `updatedAt`, o schema declarava que a página não era
 * tocada desde a data de publicação — várias com "2025-01-01" fixo — enquanto o
 * texto tinha sido revisado de fato em 2026. O sinal existia e apontava para o
 * lado errado: revisão real invisível para o Google e para os sistemas de IA,
 * que usam dateModified para decidir qual fonte citar quando duas discordam.
 *
 * `lastmodFor` resolve a rota no mapa gerado do histórico do git
 * (scripts/gen-lastmod.mjs). Pega-se a MAIOR das datas conhecidas: se o commit
 * é mais novo que o `updatedAt` declarado à mão, o arquivo mudou depois — isso
 * é fato verificável, não estimativa. O caminho inverso nunca acontece por
 * acidente, porque o mapa só sobe quando existe commit.
 */
function dataDeModificacaoReal(url: string, publishedAt: string, updatedAt?: string) {
  const rota = url.startsWith("http") ? new URL(url).pathname : url;
  const candidatas = [updatedAt, lastmodFor(rota), publishedAt].filter(Boolean) as string[];
  return candidatas.reduce((maior, d) => (Date.parse(d) > Date.parse(maior) ? d : maior));
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
    dateModified: dataDeModificacaoReal(opts.url, opts.publishedAt, opts.updatedAt),
    author: { "@id": BUSINESS_ID },
    publisher: { "@id": BUSINESS_ID },
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
/**
 * O nó único da empresa no grafo — não existe outro.
 *
 * Havia dois. Este, e um buildOrganizationLD() em src/lib/tracking.ts que o
 * layout emitia em toda página pública. Os dois declaravam o mesmo
 * `@id` (#business) com fatos diferentes: `@type` ["Organization","LocalBusiness"]
 * contra "LocalBusiness", `image` string contra array, `logo` string contra
 * ImageObject, e priceRange/makesOffer só aqui. Nó com mesmo @id e campo
 * divergente não funde: vira aviso de campo duplicado no Search Console, e a
 * empresa aparecia descrita de um jeito nas quinze páginas que chamavam esta
 * função e de outro nas demais.
 *
 * Agora o layout público emite este nó, uma vez, em toda página. As chamadas
 * página a página saíram.
 */
export function buildLocalBusinessLD() {
  return {
    "@context": "https://schema.org",
    // Era ["LocalBusiness", "AnimalShelter"]. AnimalShelter é abrigo que faz
    // rehoming/adoção — o oposto do que o canil faz, e contradiz a própria
    // regra do projeto que bane "adoção"/"adotar" do conteúdo.
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: BRAND.name,
    alternateName: BRAND.schema.alternateNames,
    description: BRAND.schema.description,
    url: SITE_URL,
    telephone: BRAND.contact.phone,
    email: BRAND.contact.email,
    // Derivado da tabela: o JSON-LD é lido pelo Google e não pode continuar
    // anunciando uma faixa que a página já desmentiu.
    priceRange: `${formatarPreco(FAIXA_PUBLICA.minCents)} – ${formatarPreco(FAIXA_PUBLICA.maxCents)}`,
    currenciesAccepted: "BRL",
    paymentAccepted: "PIX, transferência bancária, cartão de crédito",
    foundingDate: String(FOUNDING_YEAR),
    image: [
      // Era /og/home.jpg, que respondia 404 — o Google descarta a imagem do
      // rich result quando a URL não resolve. As outras duas existem.
      `${SITE_URL}/og-default.jpg`,
      `${SITE_URL}/filhotes/creme/creme-femea-01.jpg`,
      `${SITE_URL}/filhotes/laranja/laranja-femea-01.jpg`,
    ],
    logo: {
      "@type": "ImageObject",
      // PNG em vez do SVG: é o mesmo formato já usado no publisher.logo do
      // blog, e evita depender do suporte a SVG na leitura do logo.
      url: `${SITE_URL}/byimperiologo.png`,
      width: 150,
      height: 150,
    },
    // Sem rua, CEP ou coordenadas: somente a localidade que se pode comprovar.
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bragança Paulista",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    areaServed: SERVED_AREAS,
    // Vinham do buildOrganizationLD que este nó substituiu.
    publishingPrinciples: `${SITE_URL}/politica-editorial`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: BRAND.contact.phone,
        contactType: "customer service",
        areaServed: "BR",
        availableLanguage: ["pt-BR"],
      },
    ],
    // Sem `aggregateRating`: a nota 5.0 com reviewCount 180 era fixa no código,
    // não vinha de nenhuma plataforma de avaliações verificadas. Marcação de
    // review sem avaliação real viola a política de dados estruturados do
    // Google e sujeita o domínio a ação manual. O mesmo 180, que o site depois
    // repetia como "famílias atendidas", também saiu — não havia como conferir
    // a contagem. Volta aqui, como AggregateRating, apenas se um dia vier de
    // plataforma pública de avaliações verificadas.
    knowsAbout: BRAND.schema.knowsAbout,
    makesOffer: [
      {
        "@type": "Offer",
        name: "Filhote de Spitz Alemão Anão — Lulu da Pomerânia",
        description:
          "Filhote de Spitz Alemão Anão vacinado e vermifugado, com consulta veterinária, hemograma completo e pedigree. Atendimento com base em Bragança Paulista, SP.",
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
    sameAs: BRAND.schema.sameAs,
  };
}
