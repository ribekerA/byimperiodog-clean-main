type TrackingEvent = "page_view" | "view_form" | "submit_start" | "submit_success" | "submit_error";

/**
 * Checks if a pathname belongs to the admin panel
 * Prevents tracking of admin routes in analytics
 */
export function isAdminRoute(pathname?: string): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/admin");
}

function safePushToDataLayer(event: string, payload: Record<string, any> = {}) {
  try {
    // GTM/GA4 via dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...payload });
  } catch (_) {}
  try {
    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq("trackCustom", event, payload);
    }
  } catch (_) {}
  try {
    // TikTok Pixel
    if ((window as any).ttq) {
      (window as any).ttq.track(event, payload);
    }
  } catch (_) {}
}

export function track(event: TrackingEvent, payload: Record<string, any> = {}) {
  safePushToDataLayer(event, payload);
}

export function trackPageView(context: Record<string, any>) {
  // Don't track pageviews from admin routes
  if (isAdminRoute(context?.pathname)) {
    return;
  }
  track("page_view", context);
}

export function trackFormView(context: Record<string, any>) {
  track("view_form", context);
}

export function trackSubmitStart(context: Record<string, any>) {
  track("submit_start", context);
}

export function trackSubmitSuccess(context: Record<string, any>) {
  track("submit_success", context);
}

export function trackSubmitError(context: Record<string, any>) {
  track("submit_error", context);
}

import type { PixelEnvironmentConfig } from "@/lib/pixels";

export interface CustomPixelConfig {
  id: string;
  label: string;
  slot: 'head' | 'body';
  enabled: boolean;
  code: string;
  noscript?: string;
}

export interface TrackingIDs {
  gtm: string;
  ga4: string;
  fb: string;
  tiktok: string;
  pinterest: string;
  hotjar: string;
  clarity: string;
  metaVerify: string;
  googleVerify: string;
  /** Pinterest domain verification — rendered as <meta name="p:domain_verify" content="..."> */
  pinterestVerify: string;
  siteUrl: string;
  custom: CustomPixelConfig[];
}

function norm(v: unknown): string {
  if (!v) return "";
  const str = String(v).trim();
  // Rejeita placeholders comuns
  if (/^(GTM-X+|G-X+|UA-X+|X+|xxx+|NaN|undefined|null)$/i.test(str)) return "";
  return str;
}

export function resolveTracking(
  settings: Record<string, unknown> | null | undefined,
  pixelConfig: PixelEnvironmentConfig | null | undefined = null,
  env = process.env,
): TrackingIDs {
  const config = pixelConfig ?? null;

  const rawCustom = Array.isArray(settings?.custom_pixels) ? settings?.custom_pixels : [];
  const custom: CustomPixelConfig[] = rawCustom
    .map((item: Record<string, unknown>, index: number): CustomPixelConfig | undefined => {
      if (!item) return undefined;
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `custom-${index + 1}`;
      const label = typeof item.label === 'string' ? item.label.trim() : `Pixel ${index + 1}`;
      const slot = item.slot === 'body' ? 'body' as const : 'head' as const;
      const enabled = item.enabled === false ? false : true;
      const code = typeof item.code === 'string' ? item.code.trim() : '';
      const noscript = typeof item.noscript === 'string' ? item.noscript.trim() : undefined;
      if (!enabled || !code || !label) return undefined;
      return { id, label, slot, enabled, code, noscript } as CustomPixelConfig;
    })
    .filter((item): item is CustomPixelConfig => item !== undefined);

  return {
    gtm: norm(config?.gtmId ?? settings?.gtm_id ?? env.NEXT_PUBLIC_GTM_ID),
    ga4: norm(config?.ga4Id ?? settings?.ga4_id ?? env.NEXT_PUBLIC_GA4_ID),
    fb: norm(config?.metaPixelId ?? settings?.meta_pixel_id ?? env.NEXT_PUBLIC_META_PIXEL_ID),
    tiktok: norm(config?.tiktokPixelId ?? settings?.tiktok_pixel_id ?? env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
    pinterest: norm(config?.pinterestId ?? settings?.pinterest_tag_id ?? env.NEXT_PUBLIC_PINTEREST_TAG_ID),
    hotjar: norm(config?.hotjarId ?? settings?.hotjar_id ?? env.NEXT_PUBLIC_HOTJAR_ID),
    clarity: norm(config?.clarityId ?? settings?.clarity_id ?? env.NEXT_PUBLIC_CLARITY_ID),
    metaVerify: norm(config?.metaDomainVerification ?? settings?.meta_domain_verify ?? env.NEXT_PUBLIC_META_DOMAIN_VERIFY),
    googleVerify: norm((settings as any)?.google_site_verify ?? env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
    pinterestVerify: norm((settings as any)?.pinterest_domain_verify ?? env.NEXT_PUBLIC_PINTEREST_DOMAIN_VERIFY),
    siteUrl: norm(env.NEXT_PUBLIC_SITE_URL) || "https://www.byimperiodog.com.br",
    custom,
  };
}

export function buildOrganizationLD(siteUrl: string) {
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}#organization`,
    name: "By Imperio Dog",
    alternateName: "Imperio Dog",
    description: "Criatorio especializado em Spitz Alemao Anao com suporte dedicado para tutores.",
    url: `${base}/`,
    logo: `${base}/byimperiologo.png`,
    image: `${base}/spitz-hero-desktop.webp`,
    telephone: "+55 11 96863-3239",
    publishingPrinciples: `${base}/politica-editorial`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+55 11 96863-3239",
        contactType: "customer service",
        areaServed: "BR",
        availableLanguage: ["pt-BR"],
      },
    ],
    sameAs: [
      "https://instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog"
    ],
    foundingDate: "2023-01-01",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
      addressRegion: "SP",
      addressLocality: "Sao Paulo",
      postalCode: "01000-000",
    }
  };
}

export function buildWebsiteLD(siteUrl: string) {
  const clean = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${clean}#website`,
    name: "By Imperio Dog",
    alternateName: "Imperio Dog",
    description: "Site da By Imperio Dog com conteudos e filhotes de Spitz Alemao Anao.",
    url: `${clean}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${clean}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

// (Opcional) util para decidir se deve carregar trackers antes de consentimento.
export function shouldLoadImmediate(ids: TrackingIDs) {
  const hasImmediateScript = [
    ids.gtm,
    ids.ga4,
    ids.fb,
    ids.tiktok,
    ids.pinterest,
    ids.hotjar,
    ids.clarity,
  ].some(Boolean);

  const hasHeadCustom = ids.custom.some((pixel) => pixel.enabled && pixel.slot === "head");
  return hasImmediateScript || hasHeadCustom;
}

/** SiteNavigationElement: ajuda o Google a entender os principais links do site. */
export function buildSiteNavigationLD(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  const items = [
    { name: "Inicio", path: "/" },
    { name: "Filhotes", path: "/filhotes" },
    { name: "Processo", path: "/sobre" },
    { name: "Blog", path: "/blog" },
    { name: "FAQ do tutor", path: "/faq-do-tutor" },
    { name: "Contato", path: "/contato" },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: items.map((i) => i.name),
    url: items.map((i) => `${base}${i.path}`),
  };
}

/** LocalBusiness: reforca presenca local e area de atuacao. */
export function buildLocalBusinessLD(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base}#localbusiness`,
    name: "By Imperio Dog",
    url: `${base}/`,
    image: `${base}/spitz-hero-desktop.webp`,
    logo: `${base}/byimperiologo.png`,
    telephone: "+55 11 96863-3239",
    email: "contato@byimperiodog.com.br",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Braganca Paulista",
      addressLocality: "Braganca Paulista",
      addressRegion: "SP",
      postalCode: "12900-000",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-22.952258",
      longitude: "-46.541658",
    },
    areaServed: [
      // Estados principais
      { "@type": "State", "name": "São Paulo", "alternateName": "SP" },
      { "@type": "State", "name": "Rio de Janeiro", "alternateName": "RJ" },
      { "@type": "State", "name": "Minas Gerais", "alternateName": "MG" },
      { "@type": "State", "name": "Paraná", "alternateName": "PR" },
      // Capitais e grandes cidades SP
      { "@type": "City", "name": "São Paulo", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Campinas", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "São José dos Campos", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Sorocaba", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Ribeirão Preto", "containedIn": { "@type": "State", "name": "São Paulo" } },
      { "@type": "City", "name": "Santos", "containedIn": { "@type": "State", "name": "São Paulo" } },
      // RJ
      { "@type": "City", "name": "Rio de Janeiro", "containedIn": { "@type": "State", "name": "Rio de Janeiro" } },
      { "@type": "City", "name": "Niterói", "containedIn": { "@type": "State", "name": "Rio de Janeiro" } },
      { "@type": "City", "name": "Petrópolis", "containedIn": { "@type": "State", "name": "Rio de Janeiro" } },
      // MG
      { "@type": "City", "name": "Belo Horizonte", "containedIn": { "@type": "State", "name": "Minas Gerais" } },
      { "@type": "City", "name": "Uberlândia", "containedIn": { "@type": "State", "name": "Minas Gerais" } },
      { "@type": "City", "name": "Juiz de Fora", "containedIn": { "@type": "State", "name": "Minas Gerais" } },
      // Nacional
      { "@type": "Country", "name": "Brasil" },
    ],
    priceRange: "$$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      "https://instagram.com/byimperiodog",
      "https://www.youtube.com/@byimperiodog",
      "https://www.tiktok.com/@byimperiodog",
      "https://www.facebook.com/byimperiodog",
    ],
  };
}
