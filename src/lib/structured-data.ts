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

/**
 * No `WebPage` de uma pagina institucional ou de destino.
 *
 * O que ele resolve e `primaryImageOfPage`: nenhuma pagina do site declarava
 * qual imagem a representa, entao o Google escolhia sozinho entre tudo que
 * estivesse no HTML — logo, icone, foto de rodape — e o resultado da busca
 * as vezes vinha com uma imagem que nao era a da pagina. Aqui a escolha e
 * declarada, e por padrao ela e a mesma do og:image, para que o cartao no
 * WhatsApp e o resultado no Google mostrem a mesma foto.
 *
 * `about` aponta para o no unico da empresa em vez de repetir os dados dela.
 */
export function buildWebPageLD(input: {
  path: string;
  name: string;
  description?: string;
  /** Caminho relativo ou URL absoluta. Padrao: a mesma imagem do og:image. */
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
}) {
  const caminho = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = `${SITE_URL}${caminho === "/" ? "" : caminho}`;
  const imagem = input.image ?? "/og-default.jpg";
  const largura = input.imageWidth ?? (input.image ? undefined : 1200);
  const altura = input.imageHeight ?? (input.image ? undefined : 630);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: BRAND.name },
    about: { "@id": BUSINESS_ID },
    primaryImageOfPage: {
      "@type": "ImageObject",
      "@id": `${url}#primaryimage`,
      url: imagem.startsWith("http") ? imagem : `${SITE_URL}${imagem}`,
      ...(largura ? { width: largura } : {}),
      ...(altura ? { height: altura } : {}),
    },
  };
}

/**
 * Página de um item da vitrine: `WebPage` + `ImageObject`, sem `Offer`.
 *
 * Isto substituiu `buildPuppyProductLD` em 26/08/2026. O que saiu:
 *
 *  • `"@type": "Product"` com `offers.availability: InStock` e `offers.price`.
 *    A oferta era emitida quando `isAvailable(puppy.status)` dava verdadeiro, e
 *    `status` vinha de um arquivo estático que só mudava em deploy. Traduzido:
 *    o site declarava ao Google, em dado estruturado, que um animal específico
 *    estava em estoque por um preço fechado — depois de ele ter saído. Rich
 *    result de produto com estoque errado é motivo de ação manual, e a página
 *    não é uma ficha de produto: é a foto permanente de uma combinação de cor e
 *    sexo. Preço exato depende de linhagem, idade e do que existir no
 *    atendimento; o que o HTML mostra é "a partir de".
 *
 *  • `aggregateRating`. Vinha de `reviewCount`/`averageRating` do próprio
 *    arquivo, zerados em todas as entradas. Nota agregada sem fonte verificável
 *    não se publica.
 *
 * O que entrou é o que o HTML realmente mostra: uma página, as fotos reais
 * dela e a empresa a que ela pertence. Sem licença, autor ou detentor de
 * direitos declarados — esses campos só entram quando houver registro
 * confirmado de quem fotografou, e não há.
 */
export function buildVitrinePageLD(puppy: CatalogItem) {
  const url = `${SITE_URL}/filhotes/${puppy.slug}`;
  const registro = puppy as unknown as Record<string, string>;
  const corLabel = registro.cor ?? puppy.color ?? "";
  const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";

  const fotos = puppy.images.filter((img: string) => !img.endsWith(".mp4"));

  // A legenda repete o `alt` publicado na galeria. Dado estruturado que
  // descreve a imagem de um jeito e o HTML de outro é divergência, não reforço.
  const imagens = fotos.map((img: string, i: number) => ({
    "@type": "ImageObject",
    "@id": i === 0 ? `${url}#primaryimage` : `${url}#image-${i + 1}`,
    url: `${SITE_URL}${img}`,
    contentUrl: `${SITE_URL}${img}`,
    caption: `${puppy.name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`,
    ...(i === 0 ? { representativeOfPage: true } : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: puppy.name,
    ...(registro.description ? { description: registro.description } : {}),
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: BRAND.name },
    about: { "@id": BUSINESS_ID },
    ...(imagens.length > 0
      ? {
          primaryImageOfPage: { "@id": `${url}#primaryimage` },
          image: imagens,
        }
      : {}),
  };
}

// ─── CollectionPage + ItemList da vitrine ────────────────────────────────────

/**
 * A lista de /filhotes.
 *
 * O `name` dizia "Filhotes de Spitz Alemão Anão disponíveis". Era a mesma
 * afirmação de estoque do resto da página, só que em dado estruturado, e a
 * `numberOfItems` a completava com um número: "12 filhotes disponíveis". A
 * lista enumera as fotos da vitrine, não o que existe hoje no canil.
 */
export function buildItemListLD(puppies: CatalogItem[]) {
  return {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    "@id":      `${SITE_URL}/filhotes#itemlist`,
    name:       "Vitrine de filhotes de Spitz Alemão Anão — By Império Dog",
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

/**
 * `CollectionPage` de /filhotes, apontando para o `ItemList` acima.
 *
 * `WebPage` genérico descrevia a URL mas não dizia que ela é uma coleção; o
 * `ItemList` descrevia a coleção mas ficava solto, sem página dona. Os dois nós
 * agora se referenciam pelo `@id`.
 */
export function buildCollectionPageLD(input: {
  path: string;
  name: string;
  description?: string;
  image?: string;
  itemListId?: string;
}) {
  const caminho = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = `${SITE_URL}${caminho}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: BRAND.name },
    about: { "@id": BUSINESS_ID },
    ...(input.itemListId ? { mainEntity: { "@id": input.itemListId } } : {}),
    ...(input.image
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            "@id": `${url}#primaryimage`,
            url: input.image.startsWith("http") ? input.image : `${SITE_URL}${input.image}`,
          },
        }
      : {}),
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

// FAQPage saiu do projeto em 26/08/2026. O Google encerrou o rich result de
// FAQ em 07/05/2026 para todos os sites: o markup continuava valido, mas nao
// produzia mais nenhum resultado na busca. Manter um gerador de JSON-LD que
// ninguem consome so convida a religa-lo por engano. As FAQ visiveis ficaram
// como estavam -- elas existem para o leitor.

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
      // Sem "disponíveis" no nome: o catálogo é a vitrine permanente por cor e
      // sexo, não uma lista de estoque. O adjetivo transformava um nó fixo do
      // grafo numa afirmação de disponibilidade que ninguém atualiza.
      name: "Filhotes de Spitz Alemão Anão — Lulu da Pomerânia",
      url: `${SITE_URL}/filhotes`,
    },
    sameAs: BRAND.schema.sameAs,
  };
}
