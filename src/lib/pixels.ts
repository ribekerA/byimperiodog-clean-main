import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TABLE = "pixels_settings";
const SINGLETON_ID = "pixels";

export type PixelEnvironmentConfig = {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  googleAdsId: string | null;
  googleAdsConversionLabel: string | null;
  pinterestId: string | null;
  hotjarId: string | null;
  clarityId: string | null;
  metaDomainVerification: string | null;
  analyticsConsent: boolean;
  marketingConsent: boolean;
};

export type PixelsSettings = {
  id: string;
  updated_at: string | null;
  production: PixelEnvironmentConfig;
  staging: PixelEnvironmentConfig;
};

const DEFAULT_ENVIRONMENT: PixelEnvironmentConfig = {
  gtmId: null,
  ga4Id: null,
  metaPixelId: null,
  tiktokPixelId: null,
  googleAdsId: null,
  googleAdsConversionLabel: null,
  pinterestId: null,
  hotjarId: null,
  clarityId: null,
  metaDomainVerification: null,
  analyticsConsent: true,
  marketingConsent: true,
};

const DEFAULT_SETTINGS: PixelsSettings = {
  id: SINGLETON_ID,
  updated_at: null,
  production: { ...DEFAULT_ENVIRONMENT },
  staging: { ...DEFAULT_ENVIRONMENT },
};

function normalizeEnvironment(raw: Record<string, unknown> | null | undefined): PixelEnvironmentConfig {
  const make = <T extends string | boolean | null>(
    value: unknown,
    fallback: T
  ): T => {
    if (typeof fallback === "boolean") {
      return (typeof value === "boolean" ? value : fallback) as T;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return (trimmed.length > 0 ? trimmed : null) as T;
    }
    return fallback;
  };

  return {
    gtmId: make<string | null>(raw?.gtmId ?? raw?.gtm_id, null),
    ga4Id: make<string | null>(raw?.ga4Id ?? raw?.ga4_id, null),
    metaPixelId: make<string | null>(raw?.metaPixelId ?? raw?.meta_pixel_id, null),
    tiktokPixelId: make<string | null>(raw?.tiktokPixelId ?? raw?.tiktok_pixel_id, null),
    googleAdsId: make<string | null>(raw?.googleAdsId ?? raw?.google_ads_id, null),
    googleAdsConversionLabel: make<string | null>(
      raw?.googleAdsConversionLabel ?? raw?.google_ads_label,
      null
    ),
    pinterestId: make<string | null>(raw?.pinterestId ?? raw?.pinterest_tag_id, null),
    hotjarId: make<string | null>(raw?.hotjarId ?? raw?.hotjar_id, null),
    clarityId: make<string | null>(raw?.clarityId ?? raw?.clarity_id, null),
    metaDomainVerification: make<string | null>(
      raw?.metaDomainVerification ?? raw?.meta_domain_verify,
      null
    ),
    analyticsConsent: make<boolean>(raw?.analyticsConsent, true),
    marketingConsent: make<boolean>(raw?.marketingConsent, true),
  };
}

export async function getPixelsSettings(): Promise<PixelsSettings> {
  try {
    const supa = supabaseAdmin();
    const { data } = await supa
      .from(TABLE)
      .select("*")
      .eq("id", SINGLETON_ID)
      .maybeSingle();

    if (!data) {
      return {
        ...DEFAULT_SETTINGS,
        production: { ...DEFAULT_ENVIRONMENT },
        staging: { ...DEFAULT_ENVIRONMENT },
      };
    }

    return {
      id: typeof data.id === "string" ? data.id : SINGLETON_ID,
      updated_at: typeof data.updated_at === "string" ? data.updated_at : null,
      production: normalizeEnvironment(
        (data.production as Record<string, unknown> | null | undefined) ?? null
      ),
      staging: normalizeEnvironment(
        (data.staging as Record<string, unknown> | null | undefined) ?? null
      ),
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      production: { ...DEFAULT_ENVIRONMENT },
      staging: { ...DEFAULT_ENVIRONMENT },
    };
  }
}

export async function upsertPixelsSettings(settings: {
  production: PixelEnvironmentConfig;
  staging: PixelEnvironmentConfig;
}) {
  const supa = supabaseAdmin();
  await supa
    .from(TABLE)
    .upsert(
      {
        id: SINGLETON_ID,
        production: settings.production,
        staging: settings.staging,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
}

export function resolveActiveEnvironment(
  settings: PixelsSettings,
  env: NodeJS.ProcessEnv = process.env
): { name: "production" | "staging"; config: PixelEnvironmentConfig } {
  const vercelEnv = env.VERCEL_ENV || env.NODE_ENV || "development";
  const name = vercelEnv === "production" ? "production" : "staging";
  return {
    name,
    config: name === "production" ? settings.production : settings.staging,
  };
}

export function sanitizePixelId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isValid = /^[A-Za-z0-9._:-]{3,64}$/.test(trimmed);
  return isValid ? trimmed : null;
}
