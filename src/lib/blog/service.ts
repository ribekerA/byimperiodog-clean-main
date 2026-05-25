import { supabaseAnon } from "@/lib/supabaseAnon";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content_mdx?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  category?: string | null;
  tags?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type ListParams = {
  page?: number;
  pageSize?: number;
  tag?: string;
  category?: string;
  status?: "published" | "draft" | "review";
  sort?: "recentes" | "antigos";
};

export type ListResult = {
  posts: BlogPost[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export async function listPosts(params: ListParams = {}): Promise<BlogPost[]> {
  const sb = supabaseAnon();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  let query = sb
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_url,cover_alt,published_at,updated_at,status,category,tags,seo_title,seo_description")
    .order("published_at", { ascending: params.sort === "antigos" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (params.status) query = query.eq("status", params.status);
  else query = query.eq("status", "published");
  if (params.category) query = query.eq("category", params.category);
  if (params.tag) query = query.contains("tags", [params.tag]);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export async function listPostsWithMeta(params: ListParams = {}): Promise<ListResult> {
  const sb = supabaseAnon();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 12));
  let query = sb
    .from("blog_posts")
    .select(
      "id,slug,title,excerpt,cover_url,cover_alt,published_at,updated_at,status,category,tags,seo_title,seo_description",
      { count: "exact" }
    )
    .order("published_at", { ascending: params.sort === "antigos" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (params.status) query = query.eq("status", params.status);
  else query = query.eq("status", "published");
  if (params.category) query = query.eq("category", params.category);
  if (params.tag) query = query.contains("tags", [params.tag]);

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  const posts = (data ?? []) as BlogPost[];
  const hasNext = page * pageSize < total;
  const hasPrev = page > 1;
  return { posts, page, pageSize, total, hasNext, hasPrev };
}

export async function getPostBySlug(slug: string, opts?: { includeDraft?: boolean }): Promise<BlogPost | null> {
  const sb = supabaseAnon();
  let query = sb
    .from("blog_posts")
    .select("id,slug,title,excerpt,content_mdx,cover_url,cover_alt,published_at,updated_at,status,category,tags,seo_title,seo_description")
    .eq("slug", slug)
    .maybeSingle();
  const { data, error } = await query;
  if (error) throw error;
  if (!data) return null;
  if (!opts?.includeDraft && data.status !== "published") return null;
  return data as BlogPost;
}

export function buildSeoTitle(post: BlogPost) {
  return post.seo_title || `${post.title} | Blog By Império Dog`;
}

export function buildSeoDescription(post: BlogPost) {
  return post.seo_description || post.excerpt || "Conhecimento premium para tutores de Spitz Alemão Anão.";
}

export function extractContextFromTags(tags?: string[] | null) {
  const context: { color?: string; city?: string; intent?: string } = {};
  (tags || []).forEach((t) => {
    const lower = String(t).toLowerCase();
    if (lower.startsWith("cor:")) context.color = lower.split(":")[1];
    if (lower.startsWith("cidade:")) context.city = lower.split(":")[1];
    if (lower.startsWith("intent:")) context.intent = lower.split(":")[1];
  });
  return context;
}
