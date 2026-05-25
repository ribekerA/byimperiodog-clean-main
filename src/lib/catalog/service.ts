/**
 * CATALOG SERVICE - Camada de serviço centralizada
 * 
 * REGRA: NUNCA acesse Supabase diretamente de componentes.
 */

import type { Puppy, PuppyFilters, PuppySearchResult, PuppySortBy } from "@/domain/puppy";
import type { City, Color, PuppyStatus } from "@/domain/taxonomies";
import { supabaseAnon } from "@/lib/supabaseAnon";

import { normalizePuppyFromDB } from "./normalize";

// Cache simples em memória para reduzir round-trips ao Supabase
const cache = new Map<string, { value: any; expiresAt: number }>();
const DEFAULT_TTL_MS = 60_000; // 60s

function getCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.value as T;
}

function setCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Seleciona tudo e normaliza depois para evitar erros de coluna ausente
 * em schemas com nomes PT-BR (ex: cidade/estado). Nunca exponha campos sensíveis na UI.
 */
const PUBLIC_COLUMNS = "*" as const;

// Normalização agora é importada de ./normalize (com validação/saneamento)

/**
 * Aplica filtros à lista de puppies
 */
function applyFilters(puppies: Puppy[], filters: PuppyFilters): Puppy[] {
  let result = puppies;
  
  // Filtro de texto (busca em nome, descrição, cor)
  if (filters.search) {
    const q = filters.search.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    result = result.filter(p => {
      const name = (p.name || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const desc = (p.description || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const color = (p.color || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return name.includes(q) || desc.includes(q) || color.includes(q);
    });
  }
  
  // Filtro de cor
  if (filters.colors && filters.colors.length > 0) {
    result = result.filter(p => 
      filters.colors!.includes(p.color as Color)
    );
  }
  
  // Filtro de sexo
  if (filters.sex) {
    result = result.filter(p => p.sex === filters.sex);
  }
  
  // Filtro de status
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    result = result.filter(p => statuses.includes(p.status));
  }
  
  // Filtro de cidade
  if (filters.cities && filters.cities.length > 0) {
    result = result.filter(p => 
      filters.cities!.includes(p.city)
    );
  }
  
  // Filtro de preço mínimo
  if (filters.minPrice !== undefined) {
    result = result.filter(p => p.priceCents >= filters.minPrice!);
  }
  
  // Filtro de preço máximo
  if (filters.maxPrice !== undefined) {
    result = result.filter(p => p.priceCents <= filters.maxPrice!);
  }
  
  return result;
}

/**
 * Aplica ordenação à lista de puppies
 */
function applySorting(puppies: Puppy[], sortBy: PuppySortBy): Puppy[] {
  const sorted = [...puppies];
  
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    case 'price-asc':
      return sorted.sort((a, b) => a.priceCents - b.priceCents);
    
    case 'price-desc':
      return sorted.sort((a, b) => b.priceCents - a.priceCents);
    
    case 'popular':
      return sorted.sort((a, b) => b.viewCount - a.viewCount);
    
    case 'rating':
      return sorted.sort((a, b) => b.averageRating - a.averageRating);
    
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
    
    default:
      return sorted;
  }
}

/**
 * Lista puppies com filtros, ordenação e paginação
 */
export async function listPuppies(
  filters: PuppyFilters = {},
  sortBy: PuppySortBy = 'recent',
  options: { limit?: number; offset?: number } = {}
): Promise<PuppySearchResult> {
  try {
    const cacheKey = `list:${JSON.stringify(filters)}:${sortBy}:${options.limit ?? "all"}:${options.offset ?? 0}`;
    const cached = getCache<PuppySearchResult>(cacheKey);
    if (cached) return cached;

    const sb = supabaseAnon();
    
    // Query base (usa wildcard e normaliza depois)
    let query = sb
      .from('puppies')
      .select(PUBLIC_COLUMNS, { count: 'exact' });
    
    // Aplicar filtros no DB quando possível (performance)
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }
    if (filters.sex) {
      query = query.eq('gender', filters.sex);
    }
    
    // Buscar dados
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar puppies: ${error.message}`);
    }
    
    // Normalizar e aplicar filtros client-side (para filtros complexos)
    let puppies = (data || []).map(normalizePuppyFromDB);
    puppies = applyFilters(puppies, filters);
    puppies = applySorting(puppies, sortBy);
    
    // Paginação
    const total = puppies.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paginated = puppies.slice(offset, offset + limit);
    const page = Math.floor(offset / limit) + 1;
    
    const result = {
      puppies: paginated,
      total,
      page,
      pageSize: limit,
      hasNext: offset + limit < total,
      filters,
      sortBy,
    };
    setCache(cacheKey, result);
    return result;
    
  } catch (error) {
    console.error('[CatalogService] Error listing puppies:', error);
    return {
      puppies: [],
      total: 0,
      page: 1,
      pageSize: options.limit || 20,
      hasNext: false,
      filters,
      sortBy,
    };
  }
}

/**
 * Busca puppy por slug
 */
export async function getPuppyBySlug(slug: string): Promise<Puppy | null> {
  try {
    const cacheKey = `puppy-slug:${slug}`;
    const cached = getCache<Puppy | null>(cacheKey);
    if (cached !== null) return cached;

    const sb = supabaseAnon();
    
    const { data, error } = await sb
      .from('puppies')
      .select(PUBLIC_COLUMNS)
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    const normalized = normalizePuppyFromDB(data);
    setCache(cacheKey, normalized);
    return normalized;
    
  } catch (error) {
    console.error('[CatalogService] Error fetching puppy by slug:', error);
    return null;
  }
}

/**
 * Busca puppy por ID
 */
export async function getPuppyById(id: string): Promise<Puppy | null> {
  try {
    const cacheKey = `puppy-id:${id}`;
    const cached = getCache<Puppy | null>(cacheKey);
    if (cached !== null) return cached;

    const sb = supabaseAnon();
    
    const { data, error } = await sb
      .from('puppies')
      .select(PUBLIC_COLUMNS)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    const normalized = normalizePuppyFromDB(data);
    setCache(cacheKey, normalized);
    return normalized;
    
  } catch (error) {
    console.error('[CatalogService] Error fetching puppy by id:', error);
    return null;
  }
}

/**
 * Busca puppies por cor
 */
export async function getPuppiesByColor(color: Color): Promise<Puppy[]> {
  const result = await listPuppies({ colors: [color], status: 'available' }, 'recent');
  return result.puppies;
}

/**
 * Busca puppies por cidade
 */
export async function getPuppiesByCity(city: City): Promise<Puppy[]> {
  const result = await listPuppies({ cities: [city], status: 'available' }, 'recent');
  return result.puppies;
}

/**
 * Busca puppies relacionados (mesma cor ou cidade, excluindo o atual)
 */
export async function getRelatedPuppies(puppy: Puppy, limit: number = 3): Promise<Puppy[]> {
  try {
    const sb = supabaseAnon();
    
    // Buscar candidatos e filtrar client-side por mesma cor/cidade, evitando dependência de coluna 'city'
    const { data, error } = await sb
      .from('puppies')
      .select(PUBLIC_COLUMNS)
      .neq('id', puppy.id)
      .limit(50);

    if (error || !data) return [];

    const normalized = data.map(normalizePuppyFromDB);
    const filtered = normalized
      .filter((p: any) => p.status === 'available')
      .filter((p: any) => p.color === puppy.color || (puppy.city && p.city === puppy.city));
    return filtered.slice(0, limit);
    
  } catch (error) {
    console.error('[CatalogService] Error fetching related puppies:', error);
    return [];
  }
}

/**
 * Busca cores disponíveis (distinct)
 */
export async function getAvailableColors(): Promise<string[]> {
  try {
    const sb = supabaseAnon();
    
    const { data, error } = await sb
      .from('puppies')
      .select('color')
      .eq('status', 'available');
    
    if (error || !data) {
      return [];
    }
    
    const colors = new Set<string>();
    data.forEach((p: { color?: string }) => {
      if (p.color) colors.add(p.color);
    });
    
    return Array.from(colors).sort();
    
  } catch (error) {
    console.error('[CatalogService] Error fetching available colors:', error);
    return [];
  }
}

/**
 * Estatísticas do catálogo
 */
export async function getCatalogStats() {
  try {
    const sb = supabaseAnon();
    
    const { data, error } = await sb
      .from('puppies')
      .select('status, price_cents');
    
    if (error || !data) {
      return {
        total: 0,
        available: 0,
        reserved: 0,
        sold: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
      };
    }
    
    const total = data.length;
    const available = data.filter((p: { status?: string }) => p.status === 'available').length;
    const reserved = data.filter((p: { status?: string }) => p.status === 'reserved').length;
    const sold = data.filter((p: { status?: string }) => p.status === 'sold').length;
    
    const prices = data.map((p: { price_cents?: number }) => p.price_cents || 0).filter((p: number) => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    return {
      total,
      available,
      reserved,
      sold,
      avgPrice: Math.round(avgPrice),
      minPrice,
      maxPrice,
    };
    
  } catch (error) {
    console.error('[CatalogService] Error fetching catalog stats:', error);
    return {
      total: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };
  }
}

