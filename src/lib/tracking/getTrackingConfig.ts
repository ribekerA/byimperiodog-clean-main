import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type TrackingConfig = {
  isGTMEnabled: boolean;
  gtmContainerId: string | null;
  isGAEnabled: boolean;
  gaMeasurementId: string | null;
  isFacebookEnabled: boolean;
  facebookPixelId: string | null;
  isTikTokEnabled: boolean;
  tiktokPixelId: string | null;
  metaDomainVerification: string | null;
  googleSiteVerification: string | null;
};

type TrackingRow = {
  is_gtm_enabled?: boolean | null;
  gtm_container_id?: string | null;
  is_ga4_enabled?: boolean | null;
  ga_measurement_id?: string | null;
  is_facebook_enabled?: boolean | null;
  facebook_pixel_id?: string | null;
  is_tiktok_enabled?: boolean | null;
  tiktok_pixel_id?: string | null;
  meta_domain_verification?: string | null;
  google_site_verification?: string | null;
};

function fallbackFromEnv(): TrackingConfig {
  return {
    isGTMEnabled: Boolean(process.env.GTM_ID),
    gtmContainerId: process.env.GTM_ID || null,
    isGAEnabled: Boolean(process.env.GA4_ID),
    gaMeasurementId: process.env.GA4_ID || null,
    isFacebookEnabled: Boolean(process.env.FACEBOOK_PIXEL_ID),
    facebookPixelId: process.env.FACEBOOK_PIXEL_ID || null,
    isTikTokEnabled: Boolean(process.env.TIKTOK_PIXEL_ID),
    tiktokPixelId: process.env.TIKTOK_PIXEL_ID || null,
    metaDomainVerification: process.env.META_VERIFY || null,
    googleSiteVerification: process.env.GOOGLE_VERIFY || null,
  };
}

function mapRow(row: TrackingRow | null | undefined): TrackingConfig {
  if (!row) return fallbackFromEnv();
  const fbId = row.facebook_pixel_id || process.env.FACEBOOK_PIXEL_ID || null;
  const gaId = row.ga_measurement_id || process.env.GA4_ID || null;
  const gtmId = row.gtm_container_id || process.env.GTM_ID || null;
  const ttId = row.tiktok_pixel_id || process.env.TIKTOK_PIXEL_ID || null;
  return {
    isGTMEnabled: Boolean(row.is_gtm_enabled) && Boolean(gtmId),
    gtmContainerId: gtmId,
    isGAEnabled: Boolean(row.is_ga4_enabled) && Boolean(gaId),
    gaMeasurementId: gaId,
    isFacebookEnabled: Boolean(row.is_facebook_enabled) && Boolean(fbId),
    facebookPixelId: fbId,
    isTikTokEnabled: Boolean(row.is_tiktok_enabled) && Boolean(ttId),
    tiktokPixelId: ttId,
    metaDomainVerification: row.meta_domain_verification || process.env.META_VERIFY || null,
    googleSiteVerification: row.google_site_verification || process.env.GOOGLE_VERIFY || null,
  };
}

function resolveEnvironment(env?: string | null) {
  if (env) return env;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV;
  if (appEnv) return appEnv;
  return process.env.NODE_ENV === "production" ? "production" : "staging";
}

/**
 * Server-side helper to load the trackingConfig singleton used to drive tag injection.
 * Reads from tracking_settings by environment; falls back to env vars when missing.
 */
export async function getTrackingConfig(environment?: string): Promise<TrackingConfig> {
  const env = resolveEnvironment(environment);
  try {
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("tracking_settings")
      .select(
        "is_gtm_enabled,gtm_container_id,is_ga4_enabled,ga_measurement_id,is_facebook_enabled,facebook_pixel_id,is_tiktok_enabled,tiktok_pixel_id,meta_domain_verification,google_site_verification",
      )
      .eq("environment", env)
      .maybeSingle();
    if (error) {
      console.warn("[getTrackingConfig] error:", error.message);
      return fallbackFromEnv();
    }
    return mapRow(data as TrackingRow);
  } catch (err) {
    console.error("[getTrackingConfig] unexpected error", err);
    return fallbackFromEnv();
  }
}

/**
 * Admin-side helper to update a tracking config row with audit.
 */
export async function updateTrackingConfig(
  environment: string,
  payload: Partial<TrackingRow>,
  adminUserId?: string | null,
): Promise<TrackingConfig> {
  const env = resolveEnvironment(environment);
  const supa = supabaseAdmin();
  // Captura estado anterior para auditoria
  const { data: before } = await supa
    .from("tracking_settings")
    .select("*")
    .eq("environment", env)
    .maybeSingle();

  const { error, data } = await supa
    .from("tracking_settings")
    .upsert(
      {
        environment: env,
        ...payload,
        updated_by: adminUserId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "environment" },
    )
    .select(
      "is_gtm_enabled,gtm_container_id,is_ga4_enabled,ga_measurement_id,is_facebook_enabled,facebook_pixel_id,is_tiktok_enabled,tiktok_pixel_id,meta_domain_verification,google_site_verification",
    )
    .maybeSingle();

  if (error) {
    throw new Error(`updateTrackingConfig failed: ${error.message}`);
  }

  // Auditoria opcional
  try {
    await supa.from("tracking_audit_log").insert({
      admin_id: adminUserId ?? null,
      environment: env,
      before,
      after: data,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[updateTrackingConfig] audit log skipped:", (e as Error).message);
  }

  return mapRow(data as TrackingRow);
}
