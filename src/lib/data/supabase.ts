import type { PuppyFilters, PuppySearchResult, PuppySortBy } from "@/domain/puppy";
import type { City, Color, PuppyStatus } from "@/domain/taxonomies";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseAnon } from "@/lib/supabaseAnon";
import type { Database } from "@/types/supabase";

type LeadsRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadsInsert = Database["public"]["Tables"]["leads"]["Insert"];
type PuppiesRow = Database["public"]["Tables"]["puppies"]["Row"];

// Observação: Nosso banco usa campos em PT-BR (ex.: nome, cor, sexo, nascimento, preco, midia).
// Para evitar erros de coluna inexistente quando o schema variar, usamos select("*") e normalizamos depois.
const PUBLIC_COLUMNS = "*";

export async function saveLead(payload: Omit<LeadsInsert, "id" | "created_at">) {
  const sb = supabaseAnon();
  const { data, error } = await sb
    .from("leads")
    .insert(payload as any)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listLeadsAdmin(limit = 100, offset = 0) {
  const sb = supabaseAdmin();
  const { data, error, count } = await sb
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? 0 };
}

export async function listPuppiesCatalog(
  filters: PuppyFilters = {},
  sortBy: PuppySortBy = "recent",
  options: { limit?: number; offset?: number } = {}
): Promise<PuppySearchResult> {
  const sb = supabaseAnon();
  let query = sb.from("puppies").select(PUBLIC_COLUMNS, { count: "exact" });

  // Se não especificar status, busca apenas disponíveis e reservados
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    if (statuses.length === 1) query = query.eq("status", statuses[0] as PuppiesRow["status"]);
    else query = query.in("status", statuses as any);
  } else {
    query = query.in("status", ["disponivel", "reservado"]);
  }
  
  // Não filtra por sexo no servidor pois a coluna pode ser 'sexo' (PT-BR).
  // O filtro por sexo será aplicado client-side após normalização.

  const { data, error } = await query;
  if (error) {
    // Retorna vazio para evitar quebra em páginas
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

  let puppies = (data || []).map(normalizePuppyFromDB);

  // Filtros client-side
  if (filters.colors?.length) {
    puppies = puppies.filter((p: ReturnType<typeof normalizePuppyFromDB>) => filters.colors!.includes(p.color as Color));
  }
  if (filters.cities?.length) {
    puppies = puppies.filter((p: ReturnType<typeof normalizePuppyFromDB>) => filters.cities!.includes(p.city as City));
  }
  if (filters.minPrice !== undefined) {
    puppies = puppies.filter((p: ReturnType<typeof normalizePuppyFromDB>) => p.priceCents >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    puppies = puppies.filter((p: ReturnType<typeof normalizePuppyFromDB>) => p.priceCents <= filters.maxPrice!);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    puppies = puppies.filter(
      (p: ReturnType<typeof normalizePuppyFromDB>) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.color as string).includes(q)
    );
  }

  // Ordenação
  const sorted = [...puppies];
  switch (sortBy) {
    case "recent":
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case "price-asc":
      sorted.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "popular":
      sorted.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case "rating":
      sorted.sort((a, b) => b.averageRating - a.averageRating);
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
      break;
    default:
      break;
  }

  const limit = options.limit || 20;
  const offset = options.offset || 0;
  const paginated = sorted.slice(offset, offset + limit);
  const page = Math.floor(offset / limit) + 1;

  return {
    puppies: paginated,
    total: sorted.length,
    page,
    pageSize: limit,
    hasNext: offset + limit < sorted.length,
    filters,
    sortBy,
  };
}

export async function updatePuppyStatus(id: string, nextStatus: PuppyStatus) {
  const sb = supabaseAdmin();
  // Mapeia status de domínio para enum do banco (PT-BR)
  const dbStatusMap: Record<PuppyStatus, PuppiesRow["status"]> = {
    available: "disponivel",
    reserved: "reservado",
    sold: "vendido",
    pending: "indisponivel",
    unavailable: "indisponivel",
  } as const;
  const dbStatus = dbStatusMap[nextStatus] ?? "disponivel";
  const { data, error } = await sb
    .from("puppies")
    .update({ status: dbStatus } as Partial<PuppiesRow>)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
