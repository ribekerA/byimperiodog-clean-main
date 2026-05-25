import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type TrackingConfig = {
  facebookPixelId: string | null;
  googleAnalyticsId: string | null;
};

/**
 * Busca a configuração única de tracking (Pixel/GA) no banco.
 * Executa apenas no servidor.
 */
export async function getTrackingSettings(): Promise<TrackingConfig> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("site_settings")
      .select("meta_pixel_id, ga4_id")
      .eq("id", 1)
      .single();

    if (error) {
      console.warn("[getTrackingSettings] erro ao ler site_settings:", error.message);
      return { facebookPixelId: null, googleAnalyticsId: null };
    }

    return {
      facebookPixelId: data?.meta_pixel_id ?? null,
      googleAnalyticsId: data?.ga4_id ?? null,
    };
  } catch (err) {
    console.error("[getTrackingSettings] erro inesperado:", err);
    return { facebookPixelId: null, googleAnalyticsId: null };
  }
}
