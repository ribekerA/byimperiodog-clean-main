/**
 * Catálogo: ponto único de exportação.
 * Mantém a regra de não acessar Supabase direto em componentes e evita duplicação de lógica.
 */
export {
  listPuppies,
  getPuppyBySlug,
  getPuppyById,
  getPuppiesByColor,
  getPuppiesByCity,
  getRelatedPuppies,
  getAvailableColors,
  getCatalogStats,
} from "./service";

// Exponha tipos do domínio para consumo em componentes/rotas
export type { PuppySearchResult, PuppyFilters, PuppySortBy } from "@/domain/puppy";
export type { RawPuppyFromDB } from "./normalize";
