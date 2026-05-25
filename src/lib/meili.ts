// MeiliSearch client (blog scoped). No new env vars; use internal fallbacks.
// Stubbed meilisearch client (dependency removida / opcional). Mantido shape mínimo para chamadas existentes.
// Caso reative Meili, reinstale pacote e restaure implementação anterior.
interface MeiliSearchClient { getIndex: (name:string)=> any; createIndex: (name:string, opts:any)=> any }
let _client: MeiliSearchClient | null = null;
export function getMeili(): MeiliSearchClient | null { return _client; }

export type BlogSearchDoc = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  tags?: string[];
  categories?: string[];
  author?: string | null;
  published_at?: string | null;
};

export const BLOG_INDEX = 'blog_posts';

export async function ensureBlogIndex(){
  // Stub: sempre retorna false (índice não disponível)
  return false;
}

export async function meiliSearchBlog(q: string, limit = 10){
  // Stub: sem resultados
  return { hits: [], estimatedTotalHits: 0 };
}
