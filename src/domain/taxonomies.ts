/**
 * @module domain/taxonomies
 * @description Taxonomias e enums centralizados do domínio
 */

/**
 * Cores oficiais do Spitz Alemão Anão (Lulu da Pomerânia)
 */
export const PUPPY_COLORS = {
  creme: {
    label: "Creme",
    hex: "#F5DEB3",
    seoKeywords: ["creme", "bege claro", "champagne"],
  },
  branco: {
    label: "Branco",
    hex: "#FFFFFF",
    seoKeywords: ["branco", "branco neve", "white"],
  },
  laranja: {
    label: "Laranja",
    hex: "#FF8C00",
    seoKeywords: ["laranja", "orange", "ruivo"],
  },
  preto: {
    label: "Preto",
    hex: "#000000",
    seoKeywords: ["preto", "black", "ébano"],
  },
  particolor: {
    label: "Particolor",
    hex: "#C8C8C8",
    seoKeywords: ["particolor", "bicolor", "malhado", "tricolor"],
  },
  chocolate: {
    label: "Chocolate",
    hex: "#7B3F00",
    seoKeywords: ["chocolate", "marrom", "brown"],
  },
  azul: {
    label: "Azul",
    hex: "#4A5568",
    seoKeywords: ["azul", "cinza azulado", "blue"],
  },
  sable: {
    label: "Sable",
    hex: "#D2691E",
    seoKeywords: ["sable", "zibelina", "dourado escuro"],
  },
} as const;

export type Color = keyof typeof PUPPY_COLORS;

/**
 * Status do filhote
 */
export const PUPPY_STATUS = {
  available: {
    label: "Disponível",
    color: "green",
    description: "Pronto para adoção",
  },
  reserved: {
    label: "Reservado",
    color: "yellow",
    description: "Reservado por um cliente",
  },
  sold: {
    label: "Vendido",
    color: "gray",
    description: "Já foi vendido",
  },
  pending: {
    label: "Pendente",
    color: "blue",
    description: "Aguardando aprovação ou documentação",
  },
  unavailable: {
    label: "Indisponível",
    color: "red",
    description: "Temporariamente indisponível",
  },
} as const;

export type PuppyStatus = keyof typeof PUPPY_STATUS;

/**
 * Cidades principais de atuação (SEO-optimized)
 */
export const CITIES = {
  // São Paulo
  "sao-paulo": {
    name: "São Paulo",
    slug: "sao-paulo",
    state: "SP",
    region: "Sudeste",
    metropolitanArea: "Grande São Paulo",
    population: 12_000_000,
    seoKeywords: [
      "spitz alemão são paulo",
      "lulu da pomerania sp capital",
      "filhote spitz zona sul",
      "comprar spitz alemão são paulo",
    ],
  },
  campinas: {
    name: "Campinas",
    slug: "campinas",
    state: "SP",
    region: "Sudeste",
    metropolitanArea: "Região Metropolitana de Campinas",
    population: 1_200_000,
    seoKeywords: ["spitz alemão campinas", "lulu pomerania campinas sp"],
  },
  "sao-jose-dos-campos": {
    name: "São José dos Campos",
    slug: "sao-jose-dos-campos",
    state: "SP",
    region: "Sudeste",
    population: 700_000,
    seoKeywords: ["spitz sjc", "lulu pomerania vale do paraíba"],
  },
  sorocaba: {
    name: "Sorocaba",
    slug: "sorocaba",
    state: "SP",
    region: "Sudeste",
    population: 680_000,
    seoKeywords: ["spitz alemão sorocaba"],
  },
  santos: {
    name: "Santos",
    slug: "santos",
    state: "SP",
    region: "Sudeste",
    metropolitanArea: "Baixada Santista",
    population: 430_000,
    seoKeywords: ["spitz alemão santos", "lulu pomerania litoral sp"],
  },
  "ribeirao-preto": {
    name: "Ribeirão Preto",
    slug: "ribeirao-preto",
    state: "SP",
    region: "Sudeste",
    population: 700_000,
    seoKeywords: ["spitz alemão ribeirão preto"],
  },

  // Rio de Janeiro
  "rio-de-janeiro": {
    name: "Rio de Janeiro",
    slug: "rio-de-janeiro",
    state: "RJ",
    region: "Sudeste",
    population: 6_700_000,
    seoKeywords: [
      "spitz alemão rio de janeiro",
      "lulu pomerania rj",
      "filhote spitz zona sul rio",
      "comprar spitz alemão rio",
    ],
  },
  niteroi: {
    name: "Niterói",
    slug: "niteroi",
    state: "RJ",
    region: "Sudeste",
    population: 500_000,
    seoKeywords: ["spitz alemão niterói"],
  },
  petropolis: {
    name: "Petrópolis",
    slug: "petropolis",
    state: "RJ",
    region: "Sudeste",
    population: 300_000,
    seoKeywords: ["spitz alemão petrópolis", "lulu pomerania serra fluminense"],
  },

  // Minas Gerais
  "belo-horizonte": {
    name: "Belo Horizonte",
    slug: "belo-horizonte",
    state: "MG",
    region: "Sudeste",
    population: 2_500_000,
    seoKeywords: ["spitz alemão belo horizonte", "lulu pomerania bh mg"],
  },
  uberlandia: {
    name: "Uberlândia",
    slug: "uberlandia",
    state: "MG",
    region: "Sudeste",
    population: 700_000,
    seoKeywords: ["spitz alemão uberlândia"],
  },
  "juiz-de-fora": {
    name: "Juiz de Fora",
    slug: "juiz-de-fora",
    state: "MG",
    region: "Sudeste",
    population: 570_000,
    seoKeywords: ["spitz alemão juiz de fora"],
  },

  // Paraná
  curitiba: {
    name: "Curitiba",
    slug: "curitiba",
    state: "PR",
    region: "Sul",
    population: 1_900_000,
    seoKeywords: ["spitz alemão curitiba", "lulu pomerania pr"],
  },

  // Sede do criatório
  "braganca-paulista": {
    name: "Bragança Paulista",
    slug: "braganca-paulista",
    state: "SP",
    region: "Sudeste",
    population: 170_000,
    isHeadquarters: true,
    seoKeywords: ["criador spitz bragança paulista", "criatório lulu pomerania bragança"],
  },
} as const;

export type City = keyof typeof CITIES;

/**
 * Intenções de busca (Search Intent) - Para SEO e conteúdo
 */
export const SEARCH_INTENTS = {
  // Intenção comercial (alta conversão)
  commercial: {
    keywords: [
      "comprar spitz alemão",
      "filhote spitz alemão à venda",
      "preço spitz alemão",
      "quanto custa lulu da pomerânia",
      "spitz alemão anão para comprar",
      "onde comprar spitz alemão",
      "filhote lulu pomerania preço",
      "spitz alemão barato",
      "spitz alemão promoção",
    ],
    intent: "commercial",
    priority: "high",
  },

  // Intenção informacional
  informational: {
    keywords: [
      "o que é spitz alemão",
      "lulu da pomerânia características",
      "spitz alemão tamanho adulto",
      "diferença spitz alemão lulu pomerania",
      "cuidados com spitz alemão",
      "spitz alemão temperamento",
      "quanto vive spitz alemão",
      "spitz alemão solta pelo",
      "alimentação spitz alemão",
    ],
    intent: "informational",
    priority: "medium",
  },

  // Intenção de pesquisa local
  local: {
    keywords: [
      "criador de spitz alemão perto de mim",
      "spitz alemão são paulo",
      "spitz alemão rio de janeiro",
      "canil spitz alemão sp",
      "criador confiável spitz alemão",
      "spitz alemão bragança paulista",
      "visitar filhotes spitz alemão",
    ],
    intent: "local",
    priority: "high",
  },

  // Intenção navegacional
  navigational: {
    keywords: [
      "by imperio dog",
      "imperio dog spitz",
      "criador by imperio dog",
      "instagram by imperio dog",
      "contato by imperio dog",
    ],
    intent: "navigational",
    priority: "medium",
  },

  // Long-tail específicos (alta intenção de compra)
  longTail: {
    keywords: [
      "spitz alemão macho laranja são paulo",
      "lulu pomerania fêmea branca filhote",
      "spitz alemão anão pedigree cbkc",
      "filhote spitz alemão 2 meses vacinado",
      "comprar spitz alemão parcelado",
      "spitz alemão mini toy",
      "lulu pomerania creme bebê",
    ],
    intent: "commercial",
    priority: "very-high",
  },
} as const;

/**
 * Regiões do Brasil para segmentação
 */
export const REGIONS = {
  sudeste: {
    name: "Sudeste",
    states: ["SP", "RJ", "MG", "ES"],
    priority: "high",
  },
  sul: {
    name: "Sul",
    states: ["PR", "SC", "RS"],
    priority: "medium",
  },
  nordeste: {
    name: "Nordeste",
    states: ["BA", "PE", "CE", "MA", "RN", "PB", "SE", "AL", "PI"],
    priority: "medium",
  },
  "centro-oeste": {
    name: "Centro-Oeste",
    states: ["DF", "GO", "MT", "MS"],
    priority: "medium",
  },
  norte: {
    name: "Norte",
    states: ["AM", "PA", "RO", "AC", "RR", "AP", "TO"],
    priority: "low",
  },
} as const;

export type Region = keyof typeof REGIONS;

/**
 * Helpers para taxonomias
 */
export const TaxonomyHelpers = {
  /**
   * Busca cidade por slug
   */
  getCityBySlug(slug: string): (typeof CITIES)[City] | undefined {
    return CITIES[slug as City];
  },

  /**
   * Lista cidades por estado
   */
  getCitiesByState(state: string): Array<{ slug: City; data: (typeof CITIES)[City] }> {
    return Object.entries(CITIES)
      .filter(([, data]) => data.state === state)
      .map(([slug, data]) => ({ slug: slug as City, data }));
  },

  /**
   * Lista cidades por região
   */
  getCitiesByRegion(region: Region): Array<{ slug: City; data: (typeof CITIES)[City] }> {
    const regionStates = REGIONS[region].states;
    return Object.entries(CITIES)
      .filter(([, cityData]) => {
        return regionStates.some((state) => state === cityData.state);
      })
      .map(([slug, data]) => ({ slug: slug as City, data }));
  },

  /**
   * Obtém cor por slug
   */
  getColorBySlug(slug: string): (typeof PUPPY_COLORS)[Color] | undefined {
    return PUPPY_COLORS[slug as Color];
  },

  /**
   * Gera keywords SEO para combinação cidade + cor + sexo
   */
  generateSeoKeywords(params: { city?: City; color?: Color; sex?: "male" | "female" }): string[] {
    const keywords: string[] = [];
    const cityData = params.city ? CITIES[params.city] : null;
    const colorData = params.color ? PUPPY_COLORS[params.color] : null;
    const sexLabel = params.sex === "male" ? "macho" : params.sex === "female" ? "fêmea" : null;

    // Keyword base
    keywords.push("spitz alemão anão", "lulu da pomerânia");

    // Com cor
    if (colorData) {
      keywords.push(`spitz alemão ${colorData.label.toLowerCase()}`);
      keywords.push(`lulu pomerania ${colorData.label.toLowerCase()}`);
    }

    // Com sexo
    if (sexLabel) {
      keywords.push(`spitz alemão ${sexLabel}`);
      if (colorData) {
        keywords.push(`spitz alemão ${colorData.label.toLowerCase()} ${sexLabel}`);
      }
    }

    // Com cidade
    if (cityData) {
      keywords.push(`spitz alemão ${cityData.name.toLowerCase()}`);
      keywords.push(`comprar spitz alemão ${cityData.name.toLowerCase()}`);
      if (colorData) {
        keywords.push(`spitz alemão ${colorData.label.toLowerCase()} ${cityData.name.toLowerCase()}`);
      }
    }

    return keywords;
  },

  /**
   * Valida se cidade existe
   */
  isValidCity(slug: string): slug is City {
    return slug in CITIES;
  },

  /**
   * Valida se cor existe
   */
  isValidColor(slug: string): slug is Color {
    return slug in PUPPY_COLORS;
  },
};
