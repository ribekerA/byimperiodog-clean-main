export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import {
  validateFacebookPixelId,
  validateGoogleAnalyticsId,
  validateGTMId,
  validateTikTokPixelId,
  validateGoogleAdsId,
  validateHotjarId,
  validateClarityId,
  validatePinterestTagId,
  validateWeeklyPostGoal,
} from "@/lib/tracking/validators";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) {
    await logAdminAction({ route:'/api/admin/settings', method:'GET', action:'settings_get_error', payload:{ msg:error.message } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAdminAction({ route:'/api/admin/settings', method:'GET', action:'settings_get_success' });
  return NextResponse.json({ settings: data });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth; // 401

  const body = await req.json();

  // Validação: weekly_post_goal
  let goal = body.weekly_post_goal;
  if (goal !== undefined) {
    const goalValidation = validateWeeklyPostGoal(goal);
    if (!goalValidation.valid) {
      return NextResponse.json({ error: goalValidation.error }, { status: 400 });
    }
    goal = parseInt(goal, 10);
  }

  // Validação: Facebook Pixel ID (meta_pixel_id)
  if (body.meta_pixel_id !== undefined) {
    const fbPixelValidation = validateFacebookPixelId(body.meta_pixel_id);
    if (!fbPixelValidation.valid) {
      return NextResponse.json({ error: fbPixelValidation.error }, { status: 400 });
    }
  }

  // Validação: Google Analytics ID (ga4_id)
  if (body.ga4_id !== undefined) {
    const ga4Validation = validateGoogleAnalyticsId(body.ga4_id);
    if (!ga4Validation.valid) {
      return NextResponse.json({ error: ga4Validation.error }, { status: 400 });
    }
  }

  // Validação: Google Tag Manager ID
  if (body.gtm_id !== undefined) {
    const gtmValidation = validateGTMId(body.gtm_id);
    if (!gtmValidation.valid) {
      return NextResponse.json({ error: gtmValidation.error }, { status: 400 });
    }
  }

  // Validação: TikTok Pixel ID
  if (body.tiktok_pixel_id !== undefined) {
    const tiktokValidation = validateTikTokPixelId(body.tiktok_pixel_id);
    if (!tiktokValidation.valid) {
      return NextResponse.json({ error: tiktokValidation.error }, { status: 400 });
    }
  }

  // Validação: Google Ads ID
  if (body.google_ads_id !== undefined) {
    const adsValidation = validateGoogleAdsId(body.google_ads_id);
    if (!adsValidation.valid) {
      return NextResponse.json({ error: adsValidation.error }, { status: 400 });
    }
  }

  // Validação: Hotjar ID
  if (body.hotjar_id !== undefined) {
    const hotjarValidation = validateHotjarId(body.hotjar_id);
    if (!hotjarValidation.valid) {
      return NextResponse.json({ error: hotjarValidation.error }, { status: 400 });
    }
  }

  // Validação: Clarity ID
  if (body.clarity_id !== undefined) {
    const clarityValidation = validateClarityId(body.clarity_id);
    if (!clarityValidation.valid) {
      return NextResponse.json({ error: clarityValidation.error }, { status: 400 });
    }
  }

  // Validação: Pinterest Tag ID
  if (body.pinterest_tag_id !== undefined) {
    const pinterestValidation = validatePinterestTagId(body.pinterest_tag_id);
    if (!pinterestValidation.valid) {
      return NextResponse.json({ error: pinterestValidation.error }, { status: 400 });
    }
  }

  const payload: any = { id: 1, updated_at: new Date().toISOString() };
  if (goal) payload.weekly_post_goal = goal;

  const allowed = [
    'gtm_id',
    'ga4_id',
    'meta_pixel_id',
    'tiktok_pixel_id',
    'google_ads_id',
    'google_ads_label',
    'pinterest_tag_id',
    'hotjar_id',
    'clarity_id',
    'meta_domain_verify',
    'custom_pixels',
    'fb_capi_token',
    'tiktok_api_token',
  ];

  for (const k of allowed) {
    if (body[k] !== undefined) {
      // Normalizar strings vazias para null
      payload[k] = (typeof body[k] === 'string' && body[k].trim() === '') ? null : body[k];
    }
  }

  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    await logAdminAction({ route:'/api/admin/settings', method:'POST', action:'settings_update_error', payload:{ msg:error.message } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({ route:'/api/admin/settings', method:'POST', action:'settings_update_success', payload: payload });
  return NextResponse.json({ settings: data });
}
