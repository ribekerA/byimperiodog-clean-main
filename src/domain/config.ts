/**
 * @module domain/config
 * @description Configurações e constantes de negócio centralizadas
 */
import { FAIXA_PUBLICA } from "@/domain/pricing";

/**
 * Ano de início da criação — FONTE ÚNICA.
 *
 * Todo texto do site que fale em "desde X", "X anos de experiência" ou no
 * copyright do rodapé deve derivar daqui. Não escrever o número na mão.
 */
export const FOUNDING_YEAR = 2013;

/**
 * Identidade pública confirmada no Perfil da Empresa do Google.
 *
 * `GOOGLE_BUSINESS_PROFILE_URL` usa o Knowledge Graph id exibido pelo próprio
 * Google. Diferente de uma busca por cidade, ele sempre resolve para esta
 * empresa. `GOOGLE_REVIEW_URL` foi copiado de "Solicitar avaliações" no perfil
 * administrado — não é uma URL montada ou inferida pelo site.
 */
export const GOOGLE_BUSINESS_PROFILE_URL =
  "https://www.google.com/search?kgmid=/g/11gpnjwc18";
export const GOOGLE_REVIEW_URL = "https://g.page/r/CT2ftXTDDxpAEAI/review";

/**
 * Não existe constante de "famílias atendidas" — e não deve passar a existir.
 *
 * O site publicava "180+ famílias atendidas" em vinte arquivos. O número nasceu
 * do aggregateRating fixo no código (nota 5.0, reviewCount 180) que uma rodada
 * anterior removeu por ser avaliação inventada: o campo saiu, o 180 ficou com
 * outro rótulo. Nenhuma planilha, CRM ou plataforma pública sustenta o valor.
 *
 * Prova social do canil hoje é o que se verifica: o ano de fundação daqui de
 * cima, o pedigree, o contrato de compra e venda, a consulta veterinária, o
 * hemograma e as fotos das famílias que autorizaram a publicação. Se um dia houver contagem real e
 * auditável, ela entra aqui — como dado, com fonte, e não escrita à mão em
 * cada componente.
 */

/** Anos completos de criação, calculados a partir de {@link FOUNDING_YEAR}. */
export function yearsOfExperience(now: Date = new Date()): number {
  return Math.max(0, now.getFullYear() - FOUNDING_YEAR);
}

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

  // URLs
  urls: {
    site: "https://byimperiodog.com.br",
    whatsappLink: "https://wa.me/5511968633239",
    googleBusinessProfile: GOOGLE_BUSINESS_PROFILE_URL,
    googleReview: GOOGLE_REVIEW_URL,
  },

  /**
   * Fatos compartilhados pelos emissores de dados estruturados.
   *
   * `sameAs` inclui apenas perfil confirmado pelo canal publico vigente. As
   * demais redes devem voltar somente depois da confirmacao das URLs oficiais.
   */
  schema: {
    alternateNames: ["Canil By Império Dog", "Império Dog"],
    description:
      `By Império Dog, em Bragança Paulista, SP, com criação de Spitz Alemão Anão (Lulu da Pomerânia) desde ${FOUNDING_YEAR}. Filhotes vacinados e vermifugados, com consulta veterinária, hemograma completo e pedigree.`,
    knowsAbout: [
      "Spitz Alemão Anão",
      "Lulu da Pomerânia",
      "Pomeranian",
      "socialização de filhotes",
    ],
    sameAs: [
      "https://www.instagram.com/byimperiodog",
      GOOGLE_BUSINESS_PROFILE_URL,
    ],
  },
} as const;

/**
 * Configurações de produto (Spitz Alemão)
 */
export const PRODUCT_CONFIG = {
  breed: {
    official: "Spitz Alemão Anão",
    alternative: "Lulu da Pomerânia",
  },

  // Padrão oficial FCI nº 97 para Zwergspitz/Pomeranian.
  specs: {
    officialAdultHeight: "21 cm ± 3 cm",
    officialAdultWeight: "proporcional ao tamanho",
    lifeExpectancy: "12-16 anos",
    temperament: ["Alegre", "Inteligente", "Sociável", "Protetor", "Ativo"],
  },

  // Faixas de preço (em centavos).
  //
  // Derivadas de domain/pricing, não escritas na mão: estes três números são
  // consequência aritmética da tabela comercial, e mantê-los soltos aqui já
  // fez o /llms.txt anunciar uma faixa que a tabela do site não praticava.
  pricing: {
    minPriceCents: FAIXA_PUBLICA.minCents,
    maxPriceCents: FAIXA_PUBLICA.maxCents,
    averagePriceCents: FAIXA_PUBLICA.mediaCents,
  },
} as const;
