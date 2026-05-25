export type PostStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export interface Tag {
  id: string;
  slug: string;
  name: string;
  createdAt: string | null;
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PostSEO {
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  score: number | null;
}

export interface Post {
  id: string;
  slug: string;
  title: string | null;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  status: PostStatus;
  coverUrl: string | null;
  coverAlt: string | null;
  category: Category | null;
  tags: Tag[];
  seo: PostSEO;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type CommentStatus = "pending" | "approved" | "rejected" | "spam";

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ScheduleStatus = "pending" | "running" | "completed" | "failed";

export interface Schedule {
  id: string;
  postId: string;
  runAt: string;
  status: ScheduleStatus;
  repeatInterval: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ScheduleEvent {
  id: string;
  postId: string;
  status: ScheduleStatus;
  runAt: string | null;
  finishedAt: string | null;
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PostRevision {
  id: string;
  postId: string;
  snapshot: Record<string, unknown>;
  reason: string | null;
  createdBy: string | null;
  createdAt: string | null;
}

export interface PostMetrics {
  postId: string;
  views: number;
  leads: number;
  ctr: number | null;
  conversions: number | null;
  lastEventAt: string | null;
}

export interface MediaAsset {
  id: string;
  filePath: string;
  url: string;
  alt: string | null;
  caption: string | null;
  tags: string[];
  width: number | null;
  height: number | null;
  mimeType: string | null;
  sizeInBytes: number | null;
  createdAt: string | null;
}

export interface SeoSettings {
  defaultTitle: string | null;
  defaultDescription: string | null;
  defaultCanonical: string | null;
  defaultOgImage: string | null;
  twitterHandle: string | null;
  jsonLdEnabled: boolean;
  updatedAt: string | null;
}

export type ExperimentStatus = "draft" | "running" | "paused" | "completed";

export interface ExperimentVariant {
  key: string;
  label: string;
  weight: number;
}

export interface Experiment {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  audience: string | null;
  variants: ExperimentVariant[];
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  value: number | null;
  path: string | null;
  ts: string;
  meta: Record<string, unknown> | null;
}

export interface SiteSettings {
  id: string;
  brandName: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  whatsappNumber: string | null;
  privacyContactEmail: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ListParams {
  search?: string;
  status?: string;
  tag?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface PixelEnvironment {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  googleAdsId: string | null;
  googleAdsConversionLabel: string | null;
  pinterestId: string | null;
  hotjarId: string | null;
  clarityId: string | null;
  metaDomainVerification: string | null;
  analyticsConsent: boolean;
  marketingConsent: boolean;
}

export interface PixelSettings {
  id: string;
  updatedAt: string | null;
  production: PixelEnvironment;
  staging: PixelEnvironment;
}

export type BlogBulkAction = "publish" | "archive" | "delete" | "schedule";

export interface BlogBulkResult {
  processed: string[];
  failed: Array<{ id: string; reason: string }>;
}
