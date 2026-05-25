import { supabasePublic } from "@/lib/supabasePublic";

export type DbPost = {
  slug: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  excerpt: string | null;
  content_mdx: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
};

export async function fetchPublishedPosts(): Promise<DbPost[]> {
  const supa = supabasePublic();
  const { data, error } = await supa
    .from("blog_posts")
    .select(
      "slug,title,subtitle,cover_url,excerpt,content_mdx,published_at,seo_title,seo_description,og_image_url"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (error) {
    console.error("Erro ao buscar posts:", error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchPostBySlug(slug: string): Promise<DbPost | null> {
  const supa = supabasePublic();
  const { data, error } = await supa
    .from("blog_posts")
    .select(
      "slug,title,subtitle,cover_url,excerpt,content_mdx,published_at,seo_title,seo_description,og_image_url"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    console.error("Erro ao buscar post:", error.message);
    return null;
  }
  return data ?? null;
}

