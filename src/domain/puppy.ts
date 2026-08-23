/**
 * @module domain/puppy
 * @description Entidade central do domínio: Filhote de Spitz Alemão (By Império Dog)
 *
 * REGRA DE NEGÓCIO:
 * - Todos os filhotes são comercializados sob a marca "By Império Dog"
 * - A origem (própria ou externa) é APENAS para controle interno
 * - NUNCA expor "criador parceiro" ao cliente final
 */

import type { City, Color, PuppyStatus } from "./taxonomies";

/**
 * Origem interna do filhote (NÃO EXIBIR AO PÚBLICO)
 */
export type PuppySource = "own-breeding" | "external-breeder";

/**
 * Entidade Puppy - Filhote de Spitz Alemão Anão
 * Comercializado 100% sob a marca "By Império Dog"
 */
export interface Puppy {
  // ==========================================
  // IDENTIFICAÇÃO
  // ==========================================
  id: string;
  slug: string; // URL-friendly (ex: "thor-spitz-alemao-macho-laranja")
  name: string; // Nome do filhote (ex: "Thor")

  // ==========================================
  // CARACTERÍSTICAS FÍSICAS
  // ==========================================
  breed: "Spitz Alemão Anão" | "Lulu da Pomerânia"; // Raça oficial
  color: Color; // Cor da pelagem
  sex: "male" | "female";
  birthDate: Date; // Data de nascimento

  // Medidas e porte
  currentWeight?: number; // Peso atual em kg
  expectedAdultWeight?: number; // Estimativa individual; o padrão FCI exige peso proporcional ao tamanho
  currentHeight?: number; // Altura atual em cm
  expectedAdultHeight?: number; // Altura adulta esperada na cernelha (padrão FCI nº 97: 21 cm ± 3 cm)
  size: "toy" | "mini" | "standard"; // Classificação de porte

  // ==========================================
  // COMERCIAL (BY IMPÉRIO DOG)
  // ==========================================
  title: string; // Título comercial SEO (ex: "Spitz Alemão Anão Macho Laranja - Thor")
  description: string; // Descrição voltada à venda
  priceCents: number; // Preço em centavos (ex: 350000 = R$ 3.500,00)
  currency: "BRL"; // Moeda (sempre BRL)
  status: PuppyStatus; // Disponível, reservado, vendido, em breve

  // Destaque e promoção
  isHighlighted: boolean; // Destaque no catálogo
  isFeatured: boolean; // Vitrine principal (homepage)
  isBestSeller: boolean; // Mais vendido
  isNewArrival: boolean; // Recém-chegado
  discountPercentage?: number; // Desconto percentual (ex: 10 = 10% off)
  originalPriceCents?: number; // Preço original se houver desconto

  // ==========================================
  // LOCALIZAÇÃO E ENTREGA
  // ==========================================
  city: City; // Cidade de anúncio/entrega principal
  state: string; // UF (SP, RJ, MG, etc)
  availableForShipping: boolean; // Aceita envio para outras cidades
  shippingCities?: City[]; // Cidades específicas que atende
  shippingNotes?: string; // Ex: "Entrega gratuita na Grande SP"

  // ==========================================
  // MÍDIA E CONTEÚDO
  // ==========================================
  images: string[]; // URLs das imagens (primeira = thumbnail principal)
  videoUrl?: string; // URL do vídeo de apresentação (YouTube, Vimeo)
  galleryImages?: string[]; // Galeria adicional de imagens
  thumbnailUrl?: string; // Thumbnail customizado (se diferente da primeira image)

  // SEO e ranqueamento
  seoTitle?: string; // Meta title customizado
  seoDescription?: string; // Meta description customizada
  seoKeywords: string[]; // ["spitz alemão macho", "lulu pomerania creme sp", etc]
  canonicalUrl?: string; // URL canônica (se houver duplicatas)

  // ==========================================
  // SAÚDE E DOCUMENTAÇÃO
  // ==========================================
  hasPedigree: boolean; // Tem pedigree oficial
  pedigreeNumber?: string; // Número do pedigree oficial
  pedigreeUrl?: string; // URL do PDF do pedigree

  vaccinationStatus: "up-to-date" | "partial" | "pending"; // Status de vacinação
  vaccinationDates?: Date[]; // Datas das vacinas aplicadas
  nextVaccinationDate?: Date; // Próxima vacina programada

  hasMicrochip: boolean; // Tem microchip
  microchipId?: string; // ID do microchip

  healthCertificateUrl?: string; // Atestado de saúde veterinário
  healthNotes?: string; // Observações de saúde (alergias, cuidados especiais)

  // Linhagem
  parentsMale?: string; // Nome do pai
  parentsFemale?: string; // Nome da mãe
  parentsImages?: { male?: string; female?: string }; // Fotos dos pais

  // ==========================================
  // SOCIAL PROOF E ENGAJAMENTO
  // ==========================================
  reviewCount: number; // Total de avaliações
  averageRating: number; // Média de avaliação (0-5)
  viewCount: number; // Visualizações da página
  favoriteCount: number; // Favoritações
  shareCount: number; // Compartilhamentos
  inquiryCount: number; // Consultas via formulário

  // ==========================================
  // CONTROLE INTERNO (NÃO EXIBIR AO PÚBLICO)
  // ==========================================
  source: PuppySource; // Origem: criação própria ou externa
  internalSourceId?: string; // ID do criador externo (se aplicável) - APENAS INTERNO
  internalNotes?: string; // Notas administrativas internas
  costCents?: number; // Custo de aquisição (se externo) - APENAS INTERNO
  profitMarginPercentage?: number; // Margem de lucro - APENAS INTERNO

  // ==========================================
  // METADATA E TIMESTAMPS
  // ==========================================
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date; // Data de publicação no site
  soldAt?: Date; // Data da venda
  reservedAt?: Date; // Data da reserva
  reservedBy?: string; // ID ou email do cliente que reservou
  reservationExpiresAt?: Date; // Validade da reserva

  // Auditoria
  createdBy?: string; // ID do admin que criou
  updatedBy?: string; // ID do admin da última atualização
}

// ==========================================
// VALUE OBJECTS
// ==========================================
// VALUE OBJECTS (definidos mais abaixo após interfaces auxiliares)

/**
 * Value Object: Idade do filhote
 * Encapsula cálculos de idade e validações
 */
export class PuppyAge {
  constructor(private readonly birthDate: Date) {}

  static fromDate(date: Date): PuppyAge {
    return new PuppyAge(date);
  }

  getDays(referenceDate: Date = new Date()): number {
    const diff = referenceDate.getTime() - this.birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getWeeks(referenceDate: Date = new Date()): number {
    return Math.floor(this.getDays(referenceDate) / 7);
  }

  getMonths(referenceDate: Date = new Date()): number {
    const diff = referenceDate.getTime() - this.birthDate.getTime();
    const monthsDiff = diff / (1000 * 60 * 60 * 24 * 30.44);
    return Math.floor(monthsDiff);
  }

  isPuppy(maxMonths: number = 12): boolean {
    return this.getMonths() <= maxMonths;
  }

  formatAge(): string {
    const months = this.getMonths();
    const weeks = this.getWeeks();

    if (months >= 1) {
      return months === 1 ? "1 mês" : `${months} meses`;
    }
    return weeks === 1 ? "1 semana" : `${weeks} semanas`;
  }

}

// ==========================================
// DTOs (Data Transfer Objects)
// ==========================================

/**
 * DTO para criação de novo filhote
 */
export interface CreatePuppyDTO {
  name: string;
  color: Color;
  sex: "male" | "female";
  birthDate: Date;
  priceCents: number;
  city: City;
  state: string;
  title: string;
  description: string;
  images: string[];
  source: PuppySource; // próprio ou externo (interno)
  internalSourceId?: string; // ID do criador externo (se aplicável)
}

/**
 * DTO para atualização de filhote
 */
export type UpdatePuppyDTO = Partial<CreatePuppyDTO> & {
  id: string;
  status?: PuppyStatus;
  isHighlighted?: boolean;
  isFeatured?: boolean;
  discountPercentage?: number;
};

/**
 * DTO para filtros de busca
 */
export interface PuppyFilters {
  status?: PuppyStatus | PuppyStatus[];
  colors?: Color[];
  sex?: "male" | "female";
  cities?: City[];
  minPrice?: number;
  maxPrice?: number;
  hasPedigree?: boolean;
  minRating?: number;
  source?: PuppySource; // Filtro interno (admin)
  isHighlighted?: boolean;
  isFeatured?: boolean;
  search?: string; // Busca textual (nome, descrição)
}

/**
 * DTO para ordenação
 */
export type PuppySortBy =
  | "recent" // Mais recentes primeiro
  | "price-asc" // Menor preço
  | "price-desc" // Maior preço
  | "popular" // Mais visualizados
  | "rating" // Melhor avaliados
  | "name-asc" // A-Z
  | "name-desc"; // Z-A

// ==========================================
// HELPERS E UTILITÁRIOS
// ==========================================

export const PuppyHelpers = {
  /**
   * Gera slug amigável para URL
   */
  generateSlug(name: string, color: Color, sex: "male" | "female"): string {
    const sexLabel = sex === "male" ? "macho" : "femea";
    const normalized = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]+/g, "-") // Remove caracteres especiais
      .replace(/^-+|-+$/g, ""); // Remove hífens nas pontas

    return `${normalized}-spitz-alemao-${sexLabel}-${color}`;
  },
};

/**
 * DTO para criação de filhote (campos obrigatórios mínimos)
 */
export interface CreatePuppyDTO {
  name: string;
  color: Color;
  sex: "male" | "female";
  birthDate: Date;
  priceCents: number;
  city: City;
  state: string;
  description: string;
  images: string[];
}

/**
 * Resultado paginado de busca de filhotes
 */
export interface PuppySearchResult {
  puppies: Puppy[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  filters: PuppyFilters;
  sortBy: PuppySortBy;
}

/**
 * Eventos de ciclo de vida do filhote
 */
export type PuppyEvent =
  | { type: "created"; timestamp: Date; by: string }
  | { type: "published"; timestamp: Date; by: string }
  | { type: "reserved"; timestamp: Date; by: string; customerId: string }
  | { type: "sold"; timestamp: Date; by: string; customerId: string; salePrice: number }
  | { type: "cancelled"; timestamp: Date; by: string; reason: string }
  | { type: "updated"; timestamp: Date; by: string; fields: string[] }
  | { type: "reviewed"; timestamp: Date; by: string; rating: number };

/**
 * Value Objects
 */

/**
 * Preço com formatação e validação
 */
export class PuppyPrice {
  private constructor(private readonly cents: number) {
    if (cents < 0) throw new Error("Price cannot be negative");
    if (!Number.isInteger(cents)) throw new Error("Price must be in cents (integer)");
  }

  static fromCents(cents: number): PuppyPrice {
    return new PuppyPrice(cents);
  }

  static fromReais(reais: number): PuppyPrice {
    return new PuppyPrice(Math.round(reais * 100));
  }

  toCents(): number {
    return this.cents;
  }

  toReais(): number {
    return this.cents / 100;
  }

  format(locale = "pt-BR", currency = "BRL"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(this.toReais());
  }

  isInRange(min: PuppyPrice, max: PuppyPrice): boolean {
    return this.cents >= min.cents && this.cents <= max.cents;
  }
}
