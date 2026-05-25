export const dynamic = "force-dynamic";
/**
 * API Route: GET/POST /api/settings/tracking
 *
 * GET: retorna configurações públicas de tracking (pixels/analytics)
 * POST: atualiza Pixel/GA no admin (campos públicos), com validação básica
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  validateFacebookPixelId,
  validateGoogleAnalyticsId,
} from "@/lib/tracking/validators";
import type {
  PublicTrackingSettings,
  TrackingAPIError,
  TrackingAPIResponse,
} from "@/types/tracking";

type TrackingPostBody = {
  facebookPixelId?: string | null;
  googleAnalyticsId?: string | null;
};

const publicFields = `
  gtm_id,
  ga4_id,
  meta_pixel_id,
  tiktok_pixel_id,
  google_ads_id,
  google_ads_label,
  pinterest_tag_id,
  hotjar_id,
  clarity_id,
  meta_domain_verify,
  custom_pixels
`;

const normalize = (value: string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("site_settings")
      .select(publicFields)
      .eq("id", 1)
      .single();

    if (error) {
      console.error("[GET /api/settings/tracking] Erro ao buscar configurações:", error);
      return NextResponse.json<TrackingAPIError>(
        { error: "Erro ao carregar configurações de tracking" },
        { status: 500 }
      );
    }

    if (!data) {
      const emptySettings: PublicTrackingSettings = {
        gtm_id: null,
        ga4_id: null,
        meta_pixel_id: null,
        tiktok_pixel_id: null,
        google_ads_id: null,
        google_ads_label: null,
        pinterest_tag_id: null,
        hotjar_id: null,
        clarity_id: null,
        meta_domain_verify: null,
        custom_pixels: null,
      };

      return NextResponse.json<TrackingAPIResponse>(
        { settings: emptySettings },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    const publicSettings: PublicTrackingSettings = {
      gtm_id: data.gtm_id || null,
      ga4_id: data.ga4_id || null,
      meta_pixel_id: data.meta_pixel_id || null,
      tiktok_pixel_id: data.tiktok_pixel_id || null,
      google_ads_id: data.google_ads_id || null,
      google_ads_label: data.google_ads_label || null,
      pinterest_tag_id: data.pinterest_tag_id || null,
      hotjar_id: data.hotjar_id || null,
      clarity_id: data.clarity_id || null,
      meta_domain_verify: data.meta_domain_verify || null,
      custom_pixels: data.custom_pixels || null,
    };

    return NextResponse.json<TrackingAPIResponse>(
      { settings: publicSettings },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/settings/tracking] Erro inesperado:", err);
    return NextResponse.json<TrackingAPIError>(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth) return auth; // 401/403 de adminAuth

    const body = (await req.json().catch(() => ({}))) as TrackingPostBody;

    const fbValidation = validateFacebookPixelId(body.facebookPixelId);
    if (!fbValidation.valid) {
      return NextResponse.json<TrackingAPIError>(
        { error: fbValidation.error || "Facebook Pixel ID inválido" },
        { status: 400 }
      );
    }

    const gaValidation = validateGoogleAnalyticsId(body.googleAnalyticsId);
    if (!gaValidation.valid) {
      return NextResponse.json<TrackingAPIError>(
        { error: gaValidation.error || "Google Analytics ID inválido" },
        { status: 400 }
      );
    }

    const meta_pixel_id = normalize(body.facebookPixelId);
    const ga4_id = normalize(body.googleAnalyticsId);

    const { data, error } = await supabaseAdmin()
      .from("site_settings")
      .upsert(
        {
          id: 1,
          meta_pixel_id,
          ga4_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select(publicFields)
      .single();

    if (error) {
      console.error("[POST /api/settings/tracking] Erro ao salvar configurações:", error);
      return NextResponse.json<TrackingAPIError>(
        { error: "Erro ao salvar configurações de tracking" },
        { status: 500 }
      );
    }

    const publicSettings: PublicTrackingSettings = {
      gtm_id: data.gtm_id || null,
      ga4_id: data.ga4_id || null,
      meta_pixel_id: data.meta_pixel_id || null,
      tiktok_pixel_id: data.tiktok_pixel_id || null,
      google_ads_id: data.google_ads_id || null,
      google_ads_label: data.google_ads_label || null,
      pinterest_tag_id: data.pinterest_tag_id || null,
      hotjar_id: data.hotjar_id || null,
      clarity_id: data.clarity_id || null,
      meta_domain_verify: data.meta_domain_verify || null,
      custom_pixels: data.custom_pixels || null,
    };

    return NextResponse.json<TrackingAPIResponse>(
      { settings: publicSettings },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/settings/tracking] Erro inesperado:", err);
    return NextResponse.json<TrackingAPIError>(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
