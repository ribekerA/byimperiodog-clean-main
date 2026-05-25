import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { getTrackingConfig, updateTrackingConfig } from "@/lib/tracking/getTrackingConfig";

const ENVIRONMENTS = ["production", "staging", "development"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

type TrackingRequestPayload = {
  environment?: string | null;
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
};

const ERROR_RESPONSES = {
  badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
  serverError: (message: string) => NextResponse.json({ error: message }, { status: 500 }),
};

function sanitizeEnvironment(env?: string | null): Environment {
  if (!env) return "production";
  const normalized = env.trim().toLowerCase();
  if (ENVIRONMENTS.includes(normalized as Environment)) {
    return normalized as Environment;
  }
  return "production";
}

function cleanId(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[<>]/.test(trimmed)) {
    throw new Error("IDs não podem conter scripts ou caracteres HTML.");
  }
  return trimmed;
}

function validateToggle(label: string, enabled?: boolean, id?: string | null, pattern?: RegExp): string | null {
  const cleaned = cleanId(id ?? null);
  if (enabled && !cleaned) {
    throw new Error(`${label}: forneça o ID antes de ativar.`);
  }
  if (cleaned && pattern && !pattern.test(cleaned)) {
    throw new Error(`${label}: formato inválido.`);
  }
  return cleaned;
}

function mapPayload(body: TrackingRequestPayload) {
  const payload = {
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
  } as const;

  return payload;
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
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
  const guard = requireAdmin(req);
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
    if (error instanceof Error) {
      return ERROR_RESPONSES.badRequest(error.message);
    }
    console.error("[tracking-settings] Falha ao salvar", error);
    return ERROR_RESPONSES.serverError("Não foi possível salvar as configurações.");
  }
}
