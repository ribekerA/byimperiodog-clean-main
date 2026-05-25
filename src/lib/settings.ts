// src/lib/settings.ts
export type SiteSettings = {
  id: number;
  gtm_id: string | null;
  ga4_id: string | null;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  pinterest_tag_id: string | null;
  hotjar_id: string | null;
  clarity_id: string | null;
  meta_domain_verify: string | null;
  updated_at?: string | null;
};
