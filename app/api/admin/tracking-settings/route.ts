import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { getTrackingConfig, updateTrackingConfig } from "@/lib/tracking/getTrackingConfig";

const ENVIRONMENTS = ["production", "staging", "development"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

type TrackingRequestPayload = {
  environment?: string | null;
  // Core platforms
  isGTMEnabled?: boolean;
  gtmContainerId?: string | null;
  isGAEnabled?: boolean;
  gaMeasurementId?: string | null;
  isFacebookEnabled?: boolean;
  facebookPixelId?: string | null;
  isTikTokEnabled?: boolean;
  tiktokPixelId?: string | null;
  metaDomainVerification?: string | null;
  googleSiteVerification?: string | null;
  // Extended platforms (stored in pixels_settings)
  googleAdsId?: string | null;
  hotjarId?: string | null;
  clarityId?: string | null;
  pinterestId?: string | null;
};

const ERROR_RESPONSES = {
  badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
  serverError: (message: string) => NextResponse.json({ error: message }, { status: 500 }),
};

function sanitizeEnvironment(env?: string | null): Environment {
  if (!env) return "production";
  const normalized = env.trim().toLowerCase();
  if (ENVIRONMENTS.includes(normalized as Environment)) return normalized as Environment;
  return "production";
}

function cleanId(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[<>]/.test(trimmed)) throw new Error("IDs não podem conter scripts ou caracteres HTML.");
  return trimmed;
}

function validateToggle(label: string, enabled?: boolean, id?: string | null, pattern?: RegExp): string | null {
  const cleaned = cleanId(id ?? null);
  if (enabled && !cleaned) throw new Error(`${label}: forneça o ID antes de ativar.`);
  if (cleaned && pattern && !pattern.test(cleaned)) throw new Error(`${label}: formato inválido.`);
  return cleaned;
}

function mapPayload(body: TrackingRequestPayload) {
  return {
    // Core (tracking_settings columns)
    is_gtm_enabled: Boolean(body.isGTMEnabled),
    gtm_container_id: validateToggle("Google Tag Manager", body.isGTMEnabled, body.gtmContainerId, /^GTM-[A-Z0-9]+$/i),
    is_ga4_enabled: Boolean(body.isGAEnabled),
    ga_measurement_id: validateToggle("Google Analytics 4", body.isGAEnabled, body.gaMeasurementId, /^G-[A-Z0-9]+$/i),
    is_facebook_enabled: Boolean(body.isFacebookEnabled),
    facebook_pixel_id: validateToggle("Meta Pixel", body.isFacebookEnabled, body.facebookPixelId, /^[0-9]{5,}$/),
    is_tiktok_enabled: Boolean(body.isTikTokEnabled),
    tiktok_pixel_id: validateToggle("TikTok Pixel", body.isTikTokEnabled, body.tiktokPixelId, /^(TT-)?[A-Z0-9]+$/i),
    meta_domain_verification: cleanId(body.metaDomainVerification),
    google_site_verification: cleanId(body.googleSiteVerification),
    // Extended (pixels_settings only — validated but not written to tracking_settings columns)
    googleAdsId: (() => {
      const id = cleanId(body.googleAdsId);
      if (id && !/^AW-[0-9]+$/i.test(id)) throw new Error("Google Ads: formato inválido (esperado AW-XXXXXXXXX).");
      return id;
    })(),
    hotjarId: (() => {
      const id = cleanId(body.hotjarId);
      if (id && !/^[0-9]{5,10}$/.test(id)) throw new Error("Hotjar: ID numérico de 5-10 dígitos.");
      return id;
    })(),
    clarityId: (() => {
      const id = cleanId(body.clarityId);
      if (id && !/^[a-z0-9]{5,20}$/i.test(id)) throw new Error("Microsoft Clarity: ID alfanumérico de 5-20 chars.");
      return id;
    })(),
    pinterestId: (() => {
      const id = cleanId(body.pinterestId);
      if (id && !/^[0-9]{10,16}$/.test(id)) throw new Error("Pinterest Tag: ID numérico de 10-16 dígitos.");
      return id;
    })(),
  } as const;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req, { permission: "settings:read" });
  if (guard) return guard;

  const env = sanitizeEnvironment(req.nextUrl.searchParams.get("environment"));
  try {
    const config = await getTrackingConfig(env);
    return NextResponse.json({ environment: env, config });
  } catch (error) {
    console.error("[tracking-settings] Falha ao carregar", error);
    return ERROR_RESPONSES.serverError("Não foi possível carregar as configurações de tracking.");
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req, { permission: "settings:write" });
  if (guard) return guard;

  let body: TrackingRequestPayload;
  try {
    body = (await req.json()) as TrackingRequestPayload;
  } catch {
    return ERROR_RESPONSES.badRequest("Payload inválido");
  }

  const env = sanitizeEnvironment(body.environment);
  try {
    const updates = mapPayload(body);
    const config = await updateTrackingConfig(env, updates, null);
    return NextResponse.json({ environment: env, config });
  } catch (error) {
    if (error instanceof Error) return ERROR_RESPONSES.badRequest(error.message);
    console.error("[tracking-settings] Falha ao salvar", error);
    return ERROR_RESPONSES.serverError("Não foi possível salvar as configurações.");
  }
}
