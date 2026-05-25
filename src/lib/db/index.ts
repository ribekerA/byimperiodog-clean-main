import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  bulkActionSchema,
  commentModerationSchema,
  postContentSchema,
  scheduleInputSchema,
  type BulkActionInput,
  type CommentModerationInput,
  type ScheduleInput,
} from "./schemas/blog";
import type {
  AnalyticsEvent,
  BlogBulkResult,
  Comment,
  Experiment,
  ListParams,
  ListResult,
  MediaAsset,
  Post,
  PostStatus,
  Schedule,
  PostRevision,
  PostMetrics,
  PixelEnvironment,
  ScheduleEvent,
  SeoSettings,
  SiteSettings,
  Tag,
  PixelSettings,
} from "./types";

type SupabaseClient = ReturnType<typeof supabaseAdmin> | null;

const logger = createLogger("db");

function getClient(): SupabaseClient {
  try {
    return supabaseAdmin();
  } catch (error) {
    logger.warn("Supabase client unavailable", { error: String(error) });
    return null;
  }
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(row: any): Post {
  return {
    id: row?.id ?? "",
    slug: row?.slug ?? "",
    title: row?.title ?? null,
    subtitle: row?.subtitle ?? null,
    excerpt: row?.excerpt ?? null,
    content: row?.content_mdx ?? row?.content ?? null,
    status: (row?.status as PostStatus) ?? "draft",
    coverUrl: row?.cover_url ?? null,
    coverAlt: row?.cover_alt ?? null,
    category: row?.category
      ? {
          id: row.category ?? "",
          slug: row.category ?? "",
          title: row.category ?? "",
          description: null,
          createdAt: null,
          updatedAt: null,
        }
      : null,
    tags: Array.isArray(row?.tags)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (row.tags as any[]).map(
          (tag) =>
            (typeof tag === "string"
              ? { id: tag, slug: tag, name: tag, createdAt: null }
              : {
                  id: (tag as Record<string, unknown>)?.id ?? (tag as Record<string, unknown>)?.slug ?? "",
                  slug: (tag as Record<string, unknown>)?.slug ?? (tag as Record<string, unknown>)?.id ?? "",
                  name: (tag as Record<string, unknown>)?.name ?? (tag as Record<string, unknown>)?.slug ?? "",
                  createdAt: normalizeDate((tag as Record<string, unknown>)?.created_at),
                }) as Tag,
        )
      : [],
    seo: {
      title: row?.seo_title ?? null,
      description: row?.seo_description ?? null,
      ogImageUrl: row?.og_image_url ?? null,
      score: typeof row?.seo_score === "number" ? row?.seo_score : null,
    },
    scheduledAt: normalizeDate(row?.scheduled_at),
    publishedAt: normalizeDate(row?.published_at),
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapComment(row: any): Comment {
  return {
    id: row?.id ?? "",
    postId: row?.post_id ?? "",
    parentId: row?.parent_id ?? null,
    authorName: row?.author_name ?? null,
    authorEmail: row?.author_email ?? null,
    body: row?.body ?? "",
    status: (row?.status as Comment["status"]) ?? (row?.approved ? "approved" : "pending"),
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMedia(row: any): MediaAsset {
  return {
    id: row?.id ?? "",
    filePath: row?.file_path ?? "",
    url: row?.url ?? row?.public_url ?? row?.file_path ?? "",
    alt: row?.alt ?? null,
    caption: row?.caption ?? null,
    tags: Array.isArray(row?.tags) ? (row.tags as string[]) : [],
    width: typeof row?.width === "number" ? row?.width : null,
    height: typeof row?.height === "number" ? row?.height : null,
    mimeType: row?.mime_type ?? row?.content_type ?? null,
    sizeInBytes: typeof row?.size_in_bytes === "number" ? row?.size_in_bytes : null,
    createdAt: normalizeDate(row?.created_at),
  };
}

// Note: mapSchedule not currently used, kept for future reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function mapSchedule(row: any): Schedule {
  return {
    id: row?.id ?? "",
    postId: row?.post_id ?? "",
    runAt: normalizeDate(row?.run_at) ?? normalizeDate(row?.scheduled_at) ?? "",
    status: (row?.status as Schedule["status"]) ?? "pending",
    repeatInterval: typeof row?.repeat_interval === "number" ? row?.repeat_interval : null,
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScheduleEvent(row: any): ScheduleEvent {
  return {
    id: row?.id ?? "",
    postId: row?.post_id ?? "",
    status: (row?.status as ScheduleEvent["status"]) ?? "pending",
    runAt: normalizeDate(row?.run_at),
    finishedAt: normalizeDate(row?.finished_at),
    attempts: typeof row?.attempts === "number" ? row.attempts : 0,
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRevision(row: any): PostRevision {
  return {
    id: row?.id ?? "",
    postId: row?.post_id ?? "",
    snapshot: (row?.snapshot as Record<string, unknown>) ?? {},
    reason: row?.reason ?? null,
    createdBy: row?.created_by ?? null,
    createdAt: normalizeDate(row?.created_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSeoSettings(row: any): SeoSettings {
  return {
    defaultTitle: row?.default_title ?? null,
    defaultDescription: row?.default_description ?? null,
    defaultCanonical: row?.default_canonical ?? null,
    defaultOgImage: row?.default_og_image ?? null,
    twitterHandle: row?.twitter_handle ?? null,
    jsonLdEnabled: Boolean(row?.json_ld_enabled ?? row?.jsonld_enabled ?? false),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExperiment(row: any): Experiment {
  return {
    id: row?.id ?? "",
    key: row?.key ?? "",
    name: row?.name ?? "",
    description: row?.description ?? null,
    status: (row?.status as Experiment["status"]) ?? "draft",
    audience: row?.audience ?? null,
    variants: Array.isArray(row?.variants)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? row.variants.map((entry: any) => ({
          key: entry?.key ?? "",
          label: entry?.label ?? entry?.key ?? "",
          weight: typeof entry?.weight === "number" ? entry.weight : 0,
        }))
      : [],
    startsAt: normalizeDate(row?.starts_at),
    endsAt: normalizeDate(row?.ends_at),
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(row: any): AnalyticsEvent {
  return {
    id: row?.id ?? "",
    name: row?.name ?? "",
    value: typeof row?.value === "number" ? row.value : null,
    path: row?.path ?? null,
    ts: normalizeDate(row?.ts) ?? new Date().toISOString(),
    meta: (typeof row?.meta === "object" && row?.meta !== null ? row.meta : null) as Record<string, unknown> | null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPostMetrics(row: any): PostMetrics {
  return {
    postId: row?.post_id ?? "",
    views: typeof row?.views === "number" ? row.views : 0,
    leads: typeof row?.leads === "number" ? row.leads : 0,
    ctr: typeof row?.ctr === "number" ? row.ctr : null,
    conversions: typeof row?.conversions === "number" ? row.conversions : null,
    lastEventAt: normalizeDate(row?.last_event_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSiteSettings(row: any): SiteSettings {
  return {
    id: row?.id ?? "",
    brandName: row?.brand_name ?? null,
    supportEmail: row?.support_email ?? null,
    supportPhone: row?.support_phone ?? null,
    whatsappNumber: row?.whatsapp_number ?? null,
    privacyContactEmail: row?.privacy_contact_email ?? null,
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPixelEnvironment(value: any): PixelEnvironment {
  return {
    gtmId: value?.gtmId ?? value?.gtm_id ?? null,
    ga4Id: value?.ga4Id ?? value?.ga4_id ?? null,
    metaPixelId: value?.metaPixelId ?? value?.meta_pixel_id ?? null,
    tiktokPixelId: value?.tiktokPixelId ?? value?.tiktok_pixel_id ?? null,
    googleAdsId: value?.googleAdsId ?? value?.google_ads_id ?? null,
    googleAdsConversionLabel: value?.googleAdsConversionLabel ?? value?.google_ads_label ?? null,
    pinterestId: value?.pinterestId ?? value?.pinterest_tag_id ?? null,
    hotjarId: value?.hotjarId ?? value?.hotjar_id ?? null,
    clarityId: value?.clarityId ?? value?.clarity_id ?? null,
    metaDomainVerification: value?.metaDomainVerification ?? value?.meta_domain_verify ?? null,
    analyticsConsent: value?.analyticsConsent ?? value?.analytics_consent ?? true,
    marketingConsent: value?.marketingConsent ?? value?.marketing_consent ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPixelSettings(row: any): PixelSettings {
  return {
    id: row?.id ?? "pixels",
    updatedAt: normalizeDate(row?.updated_at),
    production: mapPixelEnvironment(row?.production ?? {}),
    staging: mapPixelEnvironment(row?.staging ?? {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyListFilters(query: any, params?: ListParams) {
  if (!params) return query;
  const { search, status, tag, category } = params;
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (tag) query = query.contains?.("tags", [tag]) ?? query.or?.(`tags.cs.{${tag}}`);
  if (search) {
    query =
      query.or?.(
        `slug.ilike.%${search}%` +
          `,title.ilike.%${search}%` +
          `,excerpt.ilike.%${search}%`,
      ) ?? query;
  }
  return query;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPagination(query: any, params?: ListParams) {
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const offset = Math.max(0, params?.offset ?? 0);
  return query.range(offset, offset + limit - 1);
}

async function fetchPostMetrics(client: SupabaseClient, postIds: string[]): Promise<Record<string, PostMetrics>> {
  if (!client || postIds.length === 0) return {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcFunc = (client as any).rpc;
    if (!rpcFunc) return {};
    const { data, error } = await rpcFunc("blog_post_metrics", { post_ids: postIds });
    if (error || !Array.isArray(data)) return {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.reduce((acc: Record<string, PostMetrics>, row: any) => {
      const metrics = mapPostMetrics(row);
      if (metrics.postId) acc[metrics.postId] = metrics;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

async function fetchPendingComments(client: SupabaseClient, postIds: string[]): Promise<Record<string, number>> {
  if (!client || postIds.length === 0) return {};
  try {
    const { data, error } = await client
      .from("blog_comments")
      .select("post_id", { count: "exact" })
      .eq("status", "pending")
      .in("post_id", postIds);
    if (error || !Array.isArray(data)) return {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.reduce((acc: Record<string, number>, row: any) => {
      const key = row?.post_id ?? "";
      if (!key || typeof key !== "string") return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execList<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapper: (row: any) => T,
  fallback: ListResult<T> = { items: [], total: 0 },
): Promise<ListResult<T>> {
  try {
    const { data, error, count } = (await query) as {
      data: unknown[] | null;
      error: { message?: string } | null;
      count?: number | null;
    };
    if (error) {
      logger.warn("Supabase list error", { error: error.message });
      return fallback;
    }
    const items = Array.isArray(data) ? data.map(mapper) : [];
    return { items, total: typeof count === "number" ? count : items.length };
  } catch (error) {
    logger.warn("Supabase list exception", { error: String(error) });
    return fallback;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execSingle<T>(query: any, mapper: (row: any) => T | null): Promise<T | null> {
  try {
    const { data, error } = (await query) as { data: unknown | null; error: { message?: string } | null };
    if (error) {
      logger.warn("Supabase single error", { error: error.message });
      return null;
    }
    return data ? mapper(data as Record<string, unknown>) : null;
  } catch (error) {
    logger.warn("Supabase single exception", { error: String(error) });
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execWrite<T>(operation: Promise<{ data: unknown; error: { message?: string } | null }>, mapper: (row: any) => T): Promise<T | null> {
  try {
    const { data, error } = await operation;
    if (error) {
      logger.warn("Supabase write error", { error: error.message });
      return null;
    }
    if (Array.isArray(data)) {
      const first = data[0];
      return first ? mapper(first as Record<string, unknown>) : null;
    }
    return data ? mapper(data as Record<string, unknown>) : null;
  } catch (error) {
    logger.warn("Supabase write exception", { error: String(error) });
    return null;
  }
}

export interface ListPostsParams extends ListParams {
  status?: PostStatus | "all";
}

export const blogRepo = {
  async listPosts(params?: ListPostsParams): Promise<ListResult<Post>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client.from("blog_posts").select(
      "id,slug,title,subtitle,excerpt,content_mdx,status,cover_url,cover_alt,tags,category,seo_title,seo_description,og_image_url,seo_score,scheduled_at,published_at,created_at,updated_at",
      { count: "exact" },
    );
    query = applyListFilters(query, params);
    query = query.order("created_at", { ascending: false });
    query = applyPagination(query, params);
    return execList(query, mapPost);
  },

  async getPostById(id: string): Promise<Post | null> {
    const client = getClient();
    if (!client) return null;
    const query = client
      .from("blog_posts")
      .select(
        "id,slug,title,subtitle,excerpt,content_mdx,status,cover_url,cover_alt,tags,category,seo_title,seo_description,og_image_url,seo_score,scheduled_at,published_at,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();
    return execSingle(query, mapPost);
  },

  async getPostBySlug(slug: string): Promise<Post | null> {
    const client = getClient();
    if (!client) return null;
    const query = client
      .from("blog_posts")
      .select(
        "id,slug,title,subtitle,excerpt,content_mdx,status,cover_url,cover_alt,tags,category,seo_title,seo_description,og_image_url,seo_score,scheduled_at,published_at,created_at,updated_at",
      )
      .eq("slug", slug)
      .maybeSingle();
    return execSingle(query, mapPost);
  },

  async upsertPost(payload: Partial<Post> & { id?: string }): Promise<Post | null> {
    const client = getClient();
    if (!client) return null;
    const parsed = postContentSchema.safeParse({
      id: payload.id,
      title: payload.title ?? "",
      subtitle: payload.subtitle ?? null,
      slug: payload.slug ?? "",
      excerpt: payload.excerpt ?? null,
      content: payload.content ?? "",
      status: payload.status ?? "draft",
      category: payload.category?.slug ?? null,
      tags: payload.tags?.map((tag) => tag.slug) ?? [],
      coverUrl: payload.coverUrl ?? null,
      coverAlt: payload.coverAlt ?? null,
      seoTitle: payload.seo?.title ?? null,
      seoDescription: payload.seo?.description ?? null,
      ogImageUrl: payload.seo?.ogImageUrl ?? null,
      scheduledAt: payload.scheduledAt ?? null,
      publishedAt: payload.publishedAt ?? null,
    });
    if (!parsed.success) {
      logger.warn("upsertPost validation failed", { issues: parsed.error.flatten() });
      return null;
    }
    const base = parsed.data;
    const operation = client
      .from("blog_posts")
      .upsert(
        {
          id: base.id,
          slug: base.slug,
          title: base.title,
          subtitle: base.subtitle ?? null,
          excerpt: base.excerpt ?? null,
          content_mdx: base.content,
          status: base.status,
          cover_url: base.coverUrl ?? null,
          cover_alt: base.coverAlt ?? null,
          tags: base.tags ?? [],
          category: base.category ?? null,
          seo_title: base.seoTitle ?? null,
          seo_description: base.seoDescription ?? null,
          og_image_url: base.ogImageUrl ?? null,
          scheduled_at: base.scheduledAt ?? null,
          published_at: base.publishedAt ?? null,
        },
        { onConflict: "id" },
      )
      .select()
      .limit(1);
    const saved = await execWrite(operation, mapPost);
    if (saved && base.status === "published" && !saved.publishedAt) {
      // ensure published_at persisted
      const now = new Date().toISOString();
      await client.from("blog_posts").update({ published_at: now, status: "published" }).eq("id", saved.id);
      saved.publishedAt = now;
      saved.status = "published";
    }
    return saved;
  },

  async deletePost(id: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("blog_posts").delete().eq("id", id);
      if (error) {
        logger.warn("deletePost error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("deletePost exception", { error: String(error) });
      return false;
    }
  },

  async bulkAction(raw: BulkActionInput): Promise<BlogBulkResult> {
    const parsed = bulkActionSchema.safeParse(raw);
    if (!parsed.success) {
      const failed = raw.postIds?.map((id) => ({
        id,
        reason: parsed.error.issues.map((issue) => issue.message).join("; "),
      })) ?? [];
      return { processed: [], failed };
    }
    const client = getClient();
    if (!client) return { processed: [], failed: parsed.data.postIds.map((id) => ({ id, reason: "Supabase indisponível" })) };

    const { action, postIds, scheduleAt } = parsed.data;
    const processed: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    const run = async (id: string) => {
      try {
        if (action === "delete") {
          const { error } = await client.from("blog_posts").delete().eq("id", id);
          if (error) throw new Error(error.message);
        } else if (action === "publish") {
          const now = new Date().toISOString();
          const { error } = await client
            .from("blog_posts")
            .update({ status: "published", published_at: now, scheduled_at: null })
            .eq("id", id);
          if (error) throw new Error(error.message);
        } else if (action === "archive") {
          const { error } = await client.from("blog_posts").update({ status: "archived" }).eq("id", id);
          if (error) throw new Error(error.message);
        } else if (action === "schedule") {
          if (!scheduleAt) throw new Error("Data de agendamento obrigatória.");
          const payload = {
            post_id: id,
            run_at: scheduleAt,
            status: "pending",
          };
          const { error } = await client.from("blog_post_schedule_events").insert(payload);
          if (error) throw new Error(error.message);
          await client.from("blog_posts").update({ status: "scheduled", scheduled_at: scheduleAt }).eq("id", id);
        }
        processed.push(id);
      } catch (error) {
        failed.push({ id, reason: error instanceof Error ? error.message : String(error) });
      }
    };

    await Promise.all(postIds.map(run));
    return { processed, failed };
  },

  async duplicatePost(id: string): Promise<Post | null> {
    const original = await this.getPostById(id);
    if (!original) return null;
    const suffix = `copy-${Date.now().toString(36)}`;
    const clone: Partial<Post> = {
      title: original.title ? `${original.title} (Cópia)` : "Post copiado",
      subtitle: original.subtitle,
      slug: `${original.slug}-${suffix}`,
      excerpt: original.excerpt,
      content: original.content,
      status: "draft",
      coverUrl: original.coverUrl,
      coverAlt: original.coverAlt,
      category: original.category,
      tags: original.tags,
      seo: original.seo,
    };
    return this.upsertPost(clone);
  },

  async recordRevision(postId: string, snapshot: Record<string, unknown>, reason?: string, createdBy?: string | null): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("blog_post_revisions").insert({
        post_id: postId,
        snapshot,
        reason: reason ?? null,
        created_by: createdBy ?? null,
      });
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      logger.warn("recordRevision error", { error: String(error), postId });
      return false;
    }
  },

  async listRevisions(postId: string, limit = 20): Promise<PostRevision[]> {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from("blog_post_revisions")
        .select("id,post_id,snapshot,reason,created_by,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error || !Array.isArray(data)) return [];
      return data.map(mapRevision);
    } catch (error) {
      logger.warn("listRevisions error", { error: String(error), postId });
      return [];
    }
  },

  async listSummaries(params?: ListPostsParams & { includeMetrics?: boolean; includePendingComments?: boolean }): Promise<ListResult<Post & { metrics?: PostMetrics | null; pendingComments?: number }>> {
    const base = await this.listPosts(params);
    const client = getClient();
    if (!client || base.items.length === 0 || (!params?.includeMetrics && !params?.includePendingComments)) {
      return base;
    }
    const ids = base.items.map((post) => post.id).filter(Boolean);
    const [metricsMap, commentsMap] = await Promise.all([
      params?.includeMetrics ? fetchPostMetrics(client, ids) : Promise.resolve({} as Record<string, PostMetrics>),
      params?.includePendingComments ? fetchPendingComments(client, ids) : Promise.resolve({} as Record<string, number>),
    ]);
    const items = base.items.map((post) => ({
      ...post,
      metrics: params?.includeMetrics ? metricsMap[post.id] ?? null : undefined,
      pendingComments: params?.includePendingComments ? commentsMap[post.id] ?? 0 : undefined,
    }));
    return { items, total: base.total };
  },
};

export const commentRepo = {
  async listComments(params?: { postId?: string; status?: string; limit?: number }): Promise<ListResult<Comment>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client
      .from("blog_comments")
      .select("id,post_id,parent_id,author_name,author_email,body,approved,status,created_at,updated_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (params?.postId) query = query.eq("post_id", params.postId);
    if (params?.status) query = query.eq("status", params.status);
    if (typeof params?.limit === "number") query = query.limit(params.limit);
    return execList(query, mapComment);
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from("blog_comments")
        .update({ status, approved: status === "approved" })
        .eq("id", id);
      if (error) {
        logger.warn("updateStatus error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("updateStatus exception", { error: String(error) });
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("blog_comments").delete().eq("id", id);
      if (error) {
        logger.warn("delete comment error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("delete comment exception", { error: String(error) });
      return false;
    }
  },

  async moderateMany(raw: CommentModerationInput): Promise<boolean> {
    const parsed = commentModerationSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn("moderateMany validation failed", { issues: parsed.error.flatten() });
      return false;
    }
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from("blog_comments")
        .update({ status: parsed.data.status, approved: parsed.data.status === "approved" })
        .in("id", parsed.data.commentIds);
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      logger.warn("moderateMany error", { error: String(error) });
      return false;
    }
  },
};

export const scheduleRepo = {
  async listEvents(params?: { postId?: string; limit?: number }): Promise<ScheduleEvent[]> {
    const client = getClient();
    if (!client) return [];
    try {
      let query = client
        .from("blog_post_schedule_events")
        .select("id,post_id,status,run_at,finished_at,attempts,created_at,updated_at")
        .order("run_at", { ascending: true });
      if (params?.postId) query = query.eq("post_id", params.postId);
      if (typeof params?.limit === "number") query = query.limit(params.limit);
      const { data, error } = await query;
      if (error || !Array.isArray(data)) return [];
      return data.map(mapScheduleEvent);
    } catch (error) {
      logger.warn("schedule list error", { error: String(error) });
      return [];
    }
  },

  async createEvent(raw: ScheduleInput): Promise<ScheduleEvent | null> {
    const parsed = scheduleInputSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn("createEvent validation failed", { issues: parsed.error.flatten() });
      return null;
    }
    const client = getClient();
    if (!client) return null;
    const { postId, runAt, repeatInterval } = parsed.data;
    try {
      const { data, error } = await client
        .from("blog_post_schedule_events")
        .insert({
          post_id: postId,
          run_at: runAt,
          repeat_interval: repeatInterval ?? null,
          status: "pending",
        })
        .select()
        .limit(1);
      if (error || !Array.isArray(data) || !data[0]) return null;
      return mapScheduleEvent(data[0]);
    } catch (error) {
      logger.warn("createEvent error", { error: String(error) });
      return null;
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("blog_post_schedule_events").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      logger.warn("deleteEvent error", { error: String(error) });
      return false;
    }
  },

  async updateStatus(id: string, status: ScheduleEvent["status"], finishedAt?: string | null): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from("blog_post_schedule_events")
        .update({ status, finished_at: finishedAt ?? null })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      logger.warn("update schedule status error", { error: String(error) });
      return false;
    }
  },
};

export const mediaRepo = {
  async listAssets(params?: { tag?: string; limit?: number; role?: string }): Promise<ListResult<MediaAsset>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client
      .from("media_assets")
      .select("id,file_path,url,public_url,alt,caption,tags,width,height,mime_type,size_in_bytes,created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });
    if (params?.tag) query = query.contains?.("tags", [params.tag]) ?? query;
    if (typeof params?.limit === "number") query = query.limit(params.limit);
    if (params?.role) {
      const pivot = await client.from("post_media").select("media_id").eq("role", params.role);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allowed = pivot?.data?.map((row: any) => row.media_id);
      if (Array.isArray(allowed) && allowed.length > 0) {
        query = query.in("id", allowed);
      }
    }
    return execList(query, mapMedia);
  },

  async getAsset(id: string): Promise<MediaAsset | null> {
    const client = getClient();
    if (!client) return null;
    const query = client
      .from("media_assets")
      .select("id,file_path,url,public_url,alt,caption,tags,width,height,mime_type,size_in_bytes,created_at")
      .eq("id", id)
      .maybeSingle();
    return execSingle(query, mapMedia);

  },
};

export const seoRepo = {
  async getSettings(): Promise<SeoSettings> {
    const client = getClient();
    if (!client) {
      return {
        defaultTitle: null,
        defaultDescription: null,
        defaultCanonical: null,
        defaultOgImage: null,
        twitterHandle: null,
        jsonLdEnabled: false,
        updatedAt: null,
      };
    }
    const query = client.from("seo_settings").select("*").limit(1).maybeSingle();
    const record = await execSingle(query, mapSeoSettings);
    return (
      record ?? {
        defaultTitle: null,
        defaultDescription: null,
        defaultCanonical: null,
        defaultOgImage: null,
        twitterHandle: null,
        jsonLdEnabled: false,
        updatedAt: null,
      }
    );
  },

  async updateSettings(payload: Partial<SeoSettings>): Promise<SeoSettings | null> {
    const client = getClient();
    if (!client) return null;
    const body = {
      default_title: payload.defaultTitle ?? null,
      default_description: payload.defaultDescription ?? null,
      default_canonical: payload.defaultCanonical ?? null,
      default_og_image: payload.defaultOgImage ?? null,
      twitter_handle: payload.twitterHandle ?? null,
      json_ld_enabled: payload.jsonLdEnabled ?? false,
    };
    const operation = client.from("seo_settings").upsert(body, { onConflict: "singleton_key" }).select().limit(1);
    return execWrite(operation, mapSeoSettings);
  },
};

export const expRepo = {
  async listExperiments(params?: ListParams): Promise<ListResult<Experiment>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client.from("experiments").select("*", { count: "exact" }).order("created_at", { ascending: false });
    query = applyListFilters(query, params);
    query = applyPagination(query, params);
    return execList(query, mapExperiment);
  },

  async getExperiment(id: string): Promise<Experiment | null> {
    const client = getClient();
    if (!client) return null;
    const query = client.from("experiments").select("*").eq("id", id).maybeSingle();
    return execSingle(query, mapExperiment);
  },

  async saveExperiment(payload: Partial<Experiment> & { id?: string }): Promise<Experiment | null> {
    const client = getClient();
    if (!client) return null;
    const body = {
      id: payload.id,
      key: payload.key,
      name: payload.name,
      description: payload.description ?? null,
      status: payload.status ?? "draft",
      audience: payload.audience ?? null,
      variants: payload.variants ?? [],
      starts_at: payload.startsAt ?? null,
      ends_at: payload.endsAt ?? null,
    };
    const operation = client.from("experiments").upsert(body, { onConflict: "id" }).select().limit(1);
    return execWrite(operation, mapExperiment);
  },
};

export const analyticsRepo = {
  async listEvents(params?: { name?: string; since?: string; limit?: number }): Promise<ListResult<AnalyticsEvent>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client
      .from("analytics_events")
      .select("id,name,value,path,ts,meta", { count: "exact" })
      .order("ts", { ascending: false });
    if (params?.name) query = query.eq("name", params.name);
    if (params?.since) query = query.gte("ts", params.since);
    if (typeof params?.limit === "number") query = query.limit(params.limit);
    return execList(query, mapEvent);
  },

  async record(event: Omit<AnalyticsEvent, "id" | "ts"> & { ts?: string }): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("analytics_events").insert({
        name: event.name,
        value: event.value ?? null,
        path: event.path ?? null,
        ts: event.ts ?? new Date().toISOString(),
        meta: event.meta ?? null,
      });
      if (error) {
        logger.warn("analytics record error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("analytics record exception", { error: String(error) });
      return false;
    }
  },
};

export const settingsRepo = {
  async getSettings(): Promise<SiteSettings | null> {
    const client = getClient();
    if (!client) return null;
    const query = client.from("site_settings").select("*").limit(1).maybeSingle();
    return execSingle(query, mapSiteSettings);
  },

  async upsertSettings(payload: Partial<SiteSettings>): Promise<SiteSettings | null> {
    const client = getClient();
    if (!client) return null;
    const body = {
      brand_name: payload.brandName ?? null,
      support_email: payload.supportEmail ?? null,
      support_phone: payload.supportPhone ?? null,
      whatsapp_number: payload.whatsappNumber ?? null,
      privacy_contact_email: payload.privacyContactEmail ?? null,
    };
    const operation = client.from("site_settings").upsert(body, { onConflict: "singleton_key" }).select().limit(1);
    return execWrite(operation, mapSiteSettings);
  },
};

export const pixelsRepo = {
  async getSettings(): Promise<PixelSettings> {
    const client = getClient();
    if (!client) {
      return {
        id: "pixels",
        updatedAt: null,
        production: mapPixelEnvironment({}),
        staging: mapPixelEnvironment({}),
      };
    }
    try {
      const { data, error } = await client.from("pixels_settings").select("*").eq("id", "pixels").maybeSingle();
      if (error || !data) {
        return {
          id: "pixels",
          updatedAt: null,
          production: mapPixelEnvironment({}),
          staging: mapPixelEnvironment({}),
        };
      }
      return mapPixelSettings(data);
    } catch (error) {
      logger.warn("pixels getSettings error", { error: String(error) });
      return {
        id: "pixels",
        updatedAt: null,
        production: mapPixelEnvironment({}),
        staging: mapPixelEnvironment({}),
      };
    }
  },

  async saveSettings(settings: PixelSettings): Promise<PixelSettings | null> {
    const client = getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from("pixels_settings")
        .upsert(
          {
            id: "pixels",
            production: settings.production,
            staging: settings.staging,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select()
        .limit(1);
      if (error || !Array.isArray(data) || !data[0]) return null;
      return mapPixelSettings(data[0]);
    } catch (error) {
      logger.warn("pixels saveSettings error", { error: String(error) });
      return null;
    }
  },

  async restoreDefaults(): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("pixels_settings").delete().eq("id", "pixels");
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      logger.warn("pixels restore error", { error: String(error) });
      return false;
    }
  },
};

export type {
  AnalyticsEvent,
  BlogBulkResult,
  Comment,
  Experiment,
  ListParams,
  ListResult,
  MediaAsset,
  Post,
  PostStatus,
  Schedule,
  ScheduleEvent,
  PostRevision,
  PostMetrics,
  SeoSettings,
  SiteSettings,
  Tag,
  PixelSettings,
  PixelEnvironment,
} from "./types";

export {
  postContentSchema,
  bulkActionSchema,
  scheduleInputSchema,
  commentModerationSchema,
} from "./schemas/blog";

export type {
  PostContentInput,
  BulkActionInput,
  ScheduleInput,
  CommentModerationInput,
} from "./schemas/blog";
