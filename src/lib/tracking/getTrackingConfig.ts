import { getPixelsSettings, upsertPixelsSettings } from "@/lib/pixels";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type TrackingConfig = {
  // Core platforms — stored in tracking_settings (dedicated columns)
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
  // Extended platforms — stored in pixels_settings JSON
  googleAdsId: string | null;
  hotjarId: string | null;
  clarityId: string | null;
  pinterestId: string | null;
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
    googleAdsId: process.env.GOOGLE_ADS_ID || null,
    hotjarId: process.env.HOTJAR_ID || null,
    clarityId: process.env.CLARITY_ID || null,
    pinterestId: process.env.PINTEREST_ID || null,
  };
}

function mapRow(
  row: TrackingRow | null | undefined,
  extras?: { googleAdsId?: string | null; hotjarId?: string | null; clarityId?: string | null; pinterestId?: string | null },
): TrackingConfig {
  if (!row) return { ...fallbackFromEnv(), ...(extras ?? {}) };
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
    googleAdsId: extras?.googleAdsId ?? process.env.GOOGLE_ADS_ID ?? null,
    hotjarId: extras?.hotjarId ?? process.env.HOTJAR_ID ?? null,
    clarityId: extras?.clarityId ?? process.env.CLARITY_ID ?? null,
    pinterestId: extras?.pinterestId ?? process.env.PINTEREST_ID ?? null,
  };
}

function resolveEnvironment(env?: string | null) {
  if (env) return env;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV;
  if (appEnv) return appEnv;
  return process.env.NODE_ENV === "production" ? "production" : "staging";
}

export async function getTrackingConfig(environment?: string): Promise<TrackingConfig> {
  const env = resolveEnvironment(environment);
  try {
    const supa = supabaseAdmin();
    const [{ data, error }, pixelsSettings] = await Promise.all([
      supa
        .from("tracking_settings")
        .select(
          "is_gtm_enabled,gtm_container_id,is_ga4_enabled,ga_measurement_id,is_facebook_enabled,facebook_pixel_id,is_tiktok_enabled,tiktok_pixel_id,meta_domain_verification,google_site_verification",
        )
        .eq("environment", env)
        .maybeSingle(),
      getPixelsSettings().catch(() => null),
    ]);

    if (error) {
      console.warn("[getTrackingConfig] error:", error.message);
    }

    const envKey = env === "production" ? "production" : "staging";
    const pixelEnv = pixelsSettings?.[envKey] ?? null;

    return mapRow(data as TrackingRow, {
      googleAdsId: pixelEnv?.googleAdsId ?? null,
      hotjarId: pixelEnv?.hotjarId ?? null,
      clarityId: pixelEnv?.clarityId ?? null,
      pinterestId: pixelEnv?.pinterestId ?? null,
    });
  } catch (err) {
    console.error("[getTrackingConfig] unexpected error", err);
    return fallbackFromEnv();
  }
}

export type TrackingUpdatePayload = Partial<TrackingRow> & {
  googleAdsId?: string | null;
  hotjarId?: string | null;
  clarityId?: string | null;
  pinterestId?: string | null;
};

export async function updateTrackingConfig(
  environment: string,
  payload: TrackingUpdatePayload,
  adminUserId?: string | null,
): Promise<TrackingConfig> {
  const env = resolveEnvironment(environment);
  const supa = supabaseAdmin();
  const envKey = env === "production" ? "production" : "staging";

  // Capture state before for audit
  const { data: before } = await supa
    .from("tracking_settings")
    .select("*")
    .eq("environment", env)
    .maybeSingle();

  // Extract core fields (existing tracking_settings columns)
  const { googleAdsId, hotjarId, clarityId, pinterestId, ...corePayload } = payload;

  const { error, data } = await supa
    .from("tracking_settings")
    .upsert(
      {
        environment: env,
        ...corePayload,
        updated_by: adminUserId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "environment" },
    )
    .select(
      "is_gtm_enabled,gtm_container_id,is_ga4_enabled,ga_measurement_id,is_facebook_enabled,facebook_pixel_id,is_tiktok_enabled,tiktok_pixel_id,meta_domain_verification,google_site_verification",
    )
    .maybeSingle();

  if (error) throw new Error(`updateTrackingConfig failed: ${error.message}`);

  // Sync ALL IDs to pixels_settings (source of truth for public site)
  try {
    const currentPixels = await getPixelsSettings();
    const currentEnvConfig = currentPixels[envKey];
    const otherKey = envKey === "production" ? "staging" : "production";

    await upsertPixelsSettings({
      [envKey]: {
        ...currentEnvConfig,
        gtmId: (data as TrackingRow | null)?.gtm_container_id ?? currentEnvConfig.gtmId,
        ga4Id: (data as TrackingRow | null)?.ga_measurement_id ?? currentEnvConfig.ga4Id,
        metaPixelId: (data as TrackingRow | null)?.facebook_pixel_id ?? currentEnvConfig.metaPixelId,
        tiktokPixelId: (data as TrackingRow | null)?.tiktok_pixel_id ?? currentEnvConfig.tiktokPixelId,
        metaDomainVerification:
          (data as TrackingRow | null)?.meta_domain_verification ?? currentEnvConfig.metaDomainVerification,
        ...(googleAdsId !== undefined && { googleAdsId }),
        ...(hotjarId !== undefined && { hotjarId }),
        ...(clarityId !== undefined && { clarityId }),
        ...(pinterestId !== undefined && { pinterestId }),
      },
      [otherKey]: currentPixels[otherKey],
    } as Parameters<typeof upsertPixelsSettings>[0]);
  } catch (syncErr) {
    console.warn("[updateTrackingConfig] pixels_settings sync skipped:", (syncErr as Error).message);
  }

  // Audit log
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

  const pixelsSettings = await getPixelsSettings().catch(() => null);
  const pixelEnv = pixelsSettings?.[envKey] ?? null;

  return mapRow(data as TrackingRow, {
    googleAdsId: googleAdsId ?? pixelEnv?.googleAdsId ?? null,
    hotjarId: hotjarId ?? pixelEnv?.hotjarId ?? null,
    clarityId: clarityId ?? pixelEnv?.clarityId ?? null,
    pinterestId: pinterestId ?? pixelEnv?.pinterestId ?? null,
  });
}
