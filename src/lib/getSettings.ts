import { supabaseAdmin } from "@/lib/supabaseAdmin";

import "server-only";

export type SiteSettings = {
  gtm_id?: string | null;
  ga4_id?: string | null;
  google_ads_id?: string | null;       // Ex.: AW-XXXXXXX
  google_ads_label?: string | null;    // (para conversões específicas)
  meta_pixel_id?: string | null;       // Ex.: 1234567890
  pinterest_tag_id?: string | null;    // Ex.: 2612345678901
  tiktok_pixel_id?: string | null;     // Ex.: ABCDEF1234567890
  hotjar_id?: string | null;           // Ex.: 1234567
  clarity_id?: string | null;          // Ex.: a1b2c3d4e5
  meta_domain_verify?: string | null;  // meta code p/ verificação de domínio
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("site_settings")
    .select("gtm_id,ga4_id,google_ads_id,google_ads_label,meta_pixel_id,pinterest_tag_id,tiktok_pixel_id,hotjar_id,clarity_id,meta_domain_verify")
    .eq("id", 1)
    .single();

  if (error) {
    // Em produção, logue no seu provedor de logs (Sentry etc.)
    console.warn("site_settings read error:", error.message);
  }
  return (data ?? {}) as SiteSettings;
}
