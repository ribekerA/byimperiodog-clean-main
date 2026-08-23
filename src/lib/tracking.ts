import { BRAND, FOUNDING_YEAR } from "@/domain/config";
import type { PixelEnvironmentConfig } from "@/lib/pixels";

type TrackingEvent = "page_view" | "view_form" | "submit_start" | "submit_success" | "submit_error";

/**
 * Checks if a pathname belongs to the admin panel
 * Prevents tracking of admin routes in analytics
 */
export function isAdminRoute(pathname?: string): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/admin");
}

/**
 * Exportada para que src/lib/conversions.ts publique `generate_lead` pelo mesmo
 * caminho dos demais eventos, em vez de reescrever o push e os try/catch de
 * fbq/ttq. Continua sendo o único lugar do projeto que fala com o dataLayer.
 */
export function safePushToDataLayer(event: string, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  try {
    // GTM/GA4 via dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...payload });
  } catch {
    // Pixels podem estar bloqueados pelo navegador sem impedir a navegação.
  }
  try {
    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq("trackCustom", event, payload);
    }
  } catch {
    // Pixels podem estar bloqueados pelo navegador sem impedir a navegação.
  }
  try {
    // TikTok Pixel
    if ((window as any).ttq) {
      (window as any).ttq.track(event, payload);
    }
  } catch {
    // Pixels podem estar bloqueados pelo navegador sem impedir a navegação.
  }
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
    siteUrl: BRAND.urls.site,
    custom,
  };
}

/**
 * Organização e negócio local compartilham o mesmo @id e os mesmos fatos.
 */
export function buildOrganizationLD(_siteUrl: string) {
  const base = BRAND.urls.site;
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${base}/#business`,
    name: BRAND.name,
    alternateName: BRAND.schema.alternateNames,
    description: BRAND.schema.description,
    url: `${base}/`,
    logo: `${base}/byimperiologo.png`,
    image: `${base}/spitz-hero-desktop.webp`,
    telephone: BRAND.contact.phone,
    email: BRAND.contact.email,
    publishingPrinciples: `${base}/politica-editorial`,
    knowsAbout: BRAND.schema.knowsAbout,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: BRAND.contact.phone,
        contactType: "customer service",
        areaServed: "BR",
        availableLanguage: ["pt-BR"],
      },
    ],
    sameAs: BRAND.schema.sameAs,
    foundingDate: String(FOUNDING_YEAR),
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.headquarters.city,
      addressRegion: BRAND.headquarters.state,
      addressCountry: BRAND.headquarters.country,
    },
    areaServed: { "@type": "Country", name: "Brasil" },
  };
}

export function buildWebsiteLD(_siteUrl: string) {
  const clean = BRAND.urls.site;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${clean}/#website`,
    name: "By Império Dog",
    alternateName: "Canil By Império Dog — Spitz Alemão Anão",
    description:
      "Site da By Império Dog com conteúdos e filhotes de Spitz Alemão Anão.",
    url: `${clean}/`,
    inLanguage: "pt-BR",
    publisher: { "@id": `${clean}/#business` },
    // /search existe (app/(public)/search/page.tsx). O alvo anterior era
    // /blog?q=, que não é o buscador do site.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${clean}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#hero-heading", "#featured-heading", "#diff-heading", "#faq-heading"],
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
export function buildSiteNavigationLD(_siteUrl: string) {
  const base = BRAND.urls.site;
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

/**
 * O LocalBusiness que existia aqui foi removido.
 *
 * Ele era emitido pelo layout em TODAS as paginas com @id
 * `...com.br#business`, enquanto cada pagina ja emitia o no canonico de
 * src/lib/structured-data.ts com @id `...com.br/#business`. Para o Google
 * eram duas empresas concorrentes com horarios e priceRange conflitantes,
 * e era essa a origem dos avisos de campo duplicado no Search Console.
 *
 * A área atendida fica reduzida ao país no nó canônico do negócio.
 */
