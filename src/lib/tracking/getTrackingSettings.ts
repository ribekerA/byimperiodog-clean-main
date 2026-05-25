import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type TrackingSettingsDTO = {
  facebookPixelId: string | null;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  tiktokPixelId: string | null;
  isFacebookPixelEnabled: boolean;
  isGAEnabled: boolean;
  isGTMEnabled: boolean;
  isTikTokEnabled: boolean;
};

const DEFAULT_USER_ID = process.env.INTEGRATIONS_DEFAULT_USER_ID;

export async function getTrackingSettingsForRequest(userId?: string): Promise<TrackingSettingsDTO> {
  const uid = userId || DEFAULT_USER_ID;
  if (!uid) {
    return {
      facebookPixelId: null,
      gaMeasurementId: null,
      gtmContainerId: null,
      tiktokPixelId: null,
      isFacebookPixelEnabled: false,
      isGAEnabled: false,
      isGTMEnabled: false,
      isTikTokEnabled: false,
    };
  }

  try {
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("tracking_settings")
      .select(
        "facebook_pixel_id, ga_measurement_id, gtm_container_id, tiktok_pixel_id, is_facebook_pixel_enabled, is_ga_enabled, is_gtm_enabled, is_tiktok_enabled"
      )
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      console.warn("getTrackingSettingsForRequest error:", error.message);
      throw error;
    }

    return {
      facebookPixelId: data?.facebook_pixel_id ?? null,
      gaMeasurementId: data?.ga_measurement_id ?? null,
      gtmContainerId: data?.gtm_container_id ?? null,
      tiktokPixelId: data?.tiktok_pixel_id ?? null,
      isFacebookPixelEnabled: Boolean(data?.is_facebook_pixel_enabled),
      isGAEnabled: Boolean(data?.is_ga_enabled),
      isGTMEnabled: Boolean(data?.is_gtm_enabled),
      isTikTokEnabled: Boolean(data?.is_tiktok_enabled),
    };
  } catch {
    return {
      facebookPixelId: null,
      gaMeasurementId: null,
      gtmContainerId: null,
      tiktokPixelId: null,
      isFacebookPixelEnabled: false,
      isGAEnabled: false,
      isGTMEnabled: false,
      isTikTokEnabled: false,
    };
  }
}
