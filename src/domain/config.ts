/**
 * @module domain/config
 * @description Configurações e constantes de negócio centralizadas
 */

/**
 * Informações da marca By Império Dog
 */
export const BRAND = {
  name: "By Império Dog",
  legalName: "By Império Dog Criação de Spitz Alemão",
  slogan: "Criadora especializada em Spitz Alemão Anão (Lulu da Pomerânia)",
  
  // Localização sede
  headquarters: {
    city: "Bragança Paulista",
    state: "SP",
    country: "BR",
  },

  // Contato
  contact: {
    phone: "+55 11 96863-3239",
    whatsapp: "+55 11 96863-3239",
    email: "contato@byimperiodog.com.br",
  },

  // Redes sociais
  social: {
    instagram: "@byimperiodog",
    facebook: "byimperiodog",
    youtube: "@byimperiodog",
  },

  // URLs
  urls: {
    site: "https://www.byimperiodog.com.br",
    whatsappLink: "https://wa.me/5511968633239",
  },
} as const;

/**
 * Configurações de produto (Spitz Alemão)
 */
export const PRODUCT_CONFIG = {
  breed: {
    official: "Spitz Alemão Anão",
    alternative: "Lulu da Pomerânia",
    variation: "Spitz Alemão Toy",
  },

  // Especificações técnicas da raça
  specs: {
    adultHeightMin: 18, // cm
    adultHeightMax: 22, // cm
    adultWeightMin: 1.5, // kg
    adultWeightMax: 3.5, // kg
    lifeExpectancy: "12-16 anos",
    temperament: ["Alegre", "Inteligente", "Sociável", "Protetor", "Ativo"],
  },

  // Idades importantes
  ages: {
    minWeeksForAdoption: 8, // 8 semanas = 56 dias (mínimo legal)
    idealWeeksForAdoption: 10, // 10 semanas (ideal)
    maxMonthsForPuppy: 12, // Até 12 meses é considerado filhote
  },

  // Faixas de preço (em centavos)
  pricing: {
    minPriceCents: 200000, // R$ 2.000,00
    maxPriceCents: 800000, // R$ 8.000,00
    averagePriceCents: 350000, // R$ 3.500,00
  },
} as const;

/**
 * Regras de negócio para vendas
 */
export const BUSINESS_RULES = {
  // Reserva
  reservation: {
    durationDays: 7, // Reserva válida por 7 dias
    depositPercentage: 30, // Sinal de 30%
    requiresDeposit: true,
  },

  // Entrega
  shipping: {
    freeShippingCities: ["sao-paulo", "campinas", "braganca-paulista"] as const,
    maxShippingDistanceKm: 500,
    shippingPartners: ["Gollog", "Voe Pet", "Amigo Pet Express"],
  },

  // Garantias
  warranties: {
    healthGuaranteeDays: 90, // 90 dias de garantia de saúde
    pedigreeIncluded: true,
    lifetimeSupport: true, // Suporte vitalício
  },

  // Documentação obrigatória
  requiredDocuments: [
    "Registro oficial",
    "Carteira de vacinação",
    "Atestado de saúde veterinário",
    "Contrato de compra e venda",
    "Termo de garantia",
  ] as const,
} as const;

/**
 * Metas de negócio
 */
export const BUSINESS_GOALS = {
  daily: {
    targetSales: 10, // Meta: 10 vendas/dia
    minLeads: 50, // Mínimo 50 leads/dia
    conversionRate: 0.2, // 20% de conversão lead → venda
  },

  monthly: {
    targetRevenueCents: 10500000, // R$ 105.000/mês (10 vendas/dia * R$ 3.500 * 30 dias)
    targetPuppiesListed: 100, // Manter 100 filhotes ativos
  },

  seo: {
    targetKeywords: [
      "comprar spitz alemão",
      "lulu da pomerânia preço",
      "spitz alemão anão filhote",
      "criador de spitz alemão",
    ],
    targetCities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba"],
    targetPositions: 3, // Top 3 no Google
  },
} as const;

/**
 * Configurações de SEO e conteúdo
 */
export const SEO_CONFIG = {
  // Templates de título
  titleTemplates: {
    puppy: "{name} • {color} • {sex} | Spitz Alemão Anão | By Império Dog",
    category: "Filhotes de Spitz Alemão {category} | By Império Dog",
    city: "Spitz Alemão em {city} | Entrega Segura | By Império Dog",
    color: "Spitz Alemão {color} | Filhotes Disponíveis | By Império Dog",
  },

  // Descrições padrão
  defaultDescriptions: {
    puppy:
      "Conheça {name}, filhote de Spitz Alemão Anão {color} {sex}. Registro oficial, suporte vitalício e entrega segura. By Império Dog - criadora especializada.",
    catalog:
      "Filhotes de Spitz Alemão Anão (Lulu da Pomerânia) com registro oficial, garantia de saúde e suporte vitalício. Entrega em todo Brasil. By Império Dog.",
  },

  // Schema.org types usados
  schemaTypes: [
    "Organization",
    "LocalBusiness",
    "Product",
    "OfferCatalog",
    "WebSite",
    "BreadcrumbList",
    "FAQPage",
    "Article",
  ] as const,
} as const;

/**
 * Helpers de configuração
 */
export const ConfigHelpers = {
  /**
   * Verifica se uma cidade tem entrega gratuita
   */
  hasFreeShipping(city: string): boolean {
    return (BUSINESS_RULES.shipping.freeShippingCities as readonly string[]).includes(city);
  },

  /**
   * Calcula valor do sinal (30%)
   */
  calculateDeposit(priceCents: number): number {
    return Math.round(priceCents * (BUSINESS_RULES.reservation.depositPercentage / 100));
  },

  /**
   * Calcula data de expiração da reserva
   */
  calculateReservationExpiry(reservedAt: Date): Date {
    const expiry = new Date(reservedAt);
    expiry.setDate(expiry.getDate() + BUSINESS_RULES.reservation.durationDays);
    return expiry;
  },

  /**
   * Verifica se filhote está pronto para adoção (8+ semanas)
   */
  isReadyForAdoption(birthDate: Date): boolean {
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    return ageInDays >= PRODUCT_CONFIG.ages.minWeeksForAdoption * 7;
  },

  /**
   * Formata telefone para link WhatsApp
   */
  getWhatsAppLink(message?: string): string {
    const phone = BRAND.contact.whatsapp.replace(/\D/g, "");
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${phone}${encodedMessage}`;
  },

  /**
   * Gera título SEO para filhote
   */
  generatePuppyTitle(data: { name: string; color: string; sex: "male" | "female" }): string {
    const sexLabel = data.sex === "male" ? "Macho" : "Fêmea";
    return SEO_CONFIG.titleTemplates.puppy
      .replace("{name}", data.name)
      .replace("{color}", data.color)
      .replace("{sex}", sexLabel);
  },
};
