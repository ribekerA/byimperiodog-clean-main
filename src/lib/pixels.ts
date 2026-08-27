import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TABLE = "pixels_settings";
const SINGLETON_ID = "pixels";

export type PixelEnvironmentConfig = {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  googleAdsId: string | null;
  /**
   * Label da conversao de LEAD (formulario enviado). O nome antigo foi mantido
   * porque a coluna ja existe no banco com esse nome; renomear invalidaria a
   * configuracao que ja esta gravada em pixels_settings.
   */
  googleAdsConversionLabel: string | null;
  /**
   * Label da conversao "Clique WhatsApp". E OUTRA conversao, com outro label
   * gerado no Google Ads. NUNCA reaproveitar o label de lead aqui: os dois
   * disparos cairiam na mesma conversao e o Ads perderia a distincao entre
   * "mandou mensagem" e "preencheu formulario".
   */
  googleAdsWhatsAppLabel: string | null;
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
  googleAdsWhatsAppLabel: null,
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
    googleAdsWhatsAppLabel: make<string | null>(
      raw?.googleAdsWhatsAppLabel ?? raw?.google_ads_whatsapp_label,
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
  const storedConfig = name === "production" ? settings.production : settings.staging;
  const envGtmId = sanitizePixelId(env.GTM_ID ?? env.NEXT_PUBLIC_GTM_ID);
  const envAdsId = env.GOOGLE_ADS_ID?.trim() || null;
  const envLeadLabel = env.GOOGLE_ADS_CONVERSION_LABEL?.trim() || null;
  const envWhatsAppLabel = env.GOOGLE_ADS_WHATSAPP_LABEL?.trim() || null;

  return {
    name,
    config: {
      ...storedConfig,
      gtmId: storedConfig.gtmId ?? envGtmId,
      // O admin continua sendo a fonte principal. As variáveis são fallback
      // para ambientes sem pixels_settings, sem expor o label no bundle.
      googleAdsId: storedConfig.googleAdsId ?? envAdsId,
      googleAdsConversionLabel:
        storedConfig.googleAdsConversionLabel ?? envLeadLabel,
      // Sem fallback para o label de lead de proposito: um label ausente faz o
      // clique de WhatsApp nao virar conversao no Ads (e ficar visivel no GA4
      // mesmo assim); reaproveitar o de lead faria o Ads contar duas coisas
      // diferentes como se fossem a mesma.
      googleAdsWhatsAppLabel:
        storedConfig.googleAdsWhatsAppLabel ?? envWhatsAppLabel,
    },
  };
}

export function sanitizePixelId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isValid = /^[A-Za-z0-9._:-]{3,64}$/.test(trimmed);
  return isValid ? trimmed : null;
}
