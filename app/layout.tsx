import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import NextDynamic from "next/dynamic";
import { headers } from "next/headers";
import Script from "next/script";

import "./globals.css";
import "../design-system/tokens.css";

// Components
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import SkipLink from "@/components/common/SkipLink";
import Pixels from "@/components/Pixels";
import ToastContainer from "@/components/Toast";
import { SeoHeadServer } from "@/components/SeoHeadServer";
import { getSiteSettings } from "@/lib/getSettings";
import { getPixelsSettings, resolveActiveEnvironment, type PixelsSettings } from "@/lib/pixels";
import { resolveRobots, baseMetaOverrides } from "@/lib/seo";
import { baseSiteMetadata } from "@/lib/seo.core";
import {
  resolveTracking,
  buildOrganizationLD,
  buildWebsiteLD,
  buildSiteNavigationLD,
  buildLocalBusinessLD,
} from "@/lib/tracking";
import { getTrackingConfig } from "@/lib/tracking/getTrackingConfig";

import { ThemeProvider } from "../design-system/theme-provider";

import { dmSans, inter } from "./fonts";

// Lazy load componentes nao-criticos para reduzir TBT
const RecentSalesPopup = NextDynamic(() => import("@/components/RecentSalesPopup"), { ssr: false });
const ConsentBanner = NextDynamic(() => import("@/components/ConsentBanner"), { ssr: false });
const TrackingScripts = NextDynamic(() => import("@/components/TrackingScripts"), { ssr: false });
// Botão fixo de WhatsApp — carregado após hidratação para não bloquear LCP
const WhatsAppFloat = NextDynamic(
  () => import("@/components/WhatsAppFloat").then((m) => ({ default: m.WhatsAppFloat })),
  { ssr: false }
);

// Cursor personalizado com rastro de patinhas — apenas desktop, sem SSR
const CustomCursor = NextDynamic(
  () => import("@/components/motion/CustomCursor").then((m) => ({ default: m.CustomCursor })),
  { ssr: false }
);

export const metadata: Metadata = baseSiteMetadata({
  // Garantir template consistente; se ja definido em baseSiteMetadata mantem.
  // Robots default (podem ser sobrescritos dinamicamente em headers runtime se necessario)
  robots: resolveRobots(),
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#052e2b",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolvePathname() {
  const reqHeaders = headers();

  // Tenta primeiro os headers customizados
  const candidates = [
    "x-invoke-path",
    "x-matched-path",
    "x-rewrite-url",
    "x-original-url",
    "x-original-uri",
    "x-forwarded-url",
    "x-forwarded-uri",
    "x-next-url",
    "next-url",
  ];

  for (const key of candidates) {
    const raw = reqHeaders.get(key);
    if (!raw) continue;
    const value = raw.trim();
    if (!value) continue;
    try {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return new URL(value).pathname;
      }
      if (value.startsWith("/")) return value;
      // Algumas plataformas enviam apenas path + query sem barra inicial.
      if (/^[a-zA-Z0-9\-_.~%]+(\/.+)?$/.test(value)) {
        return `/${value}`;
      }
    } catch {
      // ignora erros de parsing e tenta o proximo header
    }
  }

  // Fallback: tenta pegar do referer
  const referer = reqHeaders.get("referer");
  if (referer) {
    try {
      return new URL(referer).pathname;
    } catch {
      // ignore
    }
  }

  return "";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = resolvePathname();
  // Considera admin apenas se for exatamente /admin ou começar com /admin/
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  // Ajustes dinamicos de canonical/OG URL. Em SSR inicial temos path disponivel.
  const metaRuntime = baseMetaOverrides(pathname);

  let GTM_ID: string | undefined;
  let GA4_ID: string | undefined;
  let META_VERIFY: string | undefined;
  let GOOGLE_VERIFY: string | undefined;
  let PINTEREST_VERIFY: string | undefined;
  let organizationLd: Record<string, unknown> | null = null;
  let websiteLd: Record<string, unknown> | null = null;
  let siteNavigationLd: Record<string, unknown> | null = null;
  let localBusinessLd: Record<string, unknown> | null = null;
  let useGTM = false;
  let pixelSettings: PixelsSettings | null = null;
  let FACEBOOK_PIXEL_ID: string | null = null;
  let TIKTOK_PIXEL_ID: string | null = null;
  const isProd = process.env.NODE_ENV === "production";

  if (!isAdminRoute) {
    const [siteSettings, fetchedPixelSettings] = await Promise.all([
      getSiteSettings(),
      getPixelsSettings(),
    ]);
    pixelSettings = fetchedPixelSettings;
    const { config } = resolveActiveEnvironment(fetchedPixelSettings);
    const ids = resolveTracking(siteSettings, config);
    GTM_ID = ids.gtm;
    GA4_ID = ids.ga4;
    META_VERIFY = ids.metaVerify;
    GOOGLE_VERIFY = ids.googleVerify;
    PINTEREST_VERIFY = ids.pinterestVerify;
    useGTM = Boolean(ids.gtm);
    
    // Em produção, usar IDs dos pixels se disponíveis
    if (isProd) {
      FACEBOOK_PIXEL_ID = ids.fb || null;
      TIKTOK_PIXEL_ID = ids.tiktok || null;
    }

    if (ids.siteUrl) {
      organizationLd = buildOrganizationLD(ids.siteUrl);
      websiteLd = buildWebsiteLD(ids.siteUrl);
      siteNavigationLd = buildSiteNavigationLD(ids.siteUrl);
      localBusinessLd = buildLocalBusinessLD(ids.siteUrl);
    }
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
        
        {/* ================================================================ */}
        {/* SEO: Canonical tags e alternates (app router, metadata-based) */}
        {/* ================================================================ */}
        <SeoHeadServer pathname={pathname} skipCanonical={isAdminRoute} />
        
        {/* ================================================================ */}
        {/* PERFORMANCE: Resource hints essenciais */}
        {/* ================================================================ */}
        <link rel="preconnect" href="https://npmnuihgydadihktglrd.supabase.co" crossOrigin="anonymous" />
        {/* Tracking preconnects são adicionados condicionalmente abaixo baseado em useGTM/GA4_ID */}

        {/* Tracking settings from admin (only in prod) */}
        {!isAdminRoute && isProd && useGTM && GTM_ID && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        )}

        {!isAdminRoute && isProd && !useGTM && GA4_ID && (
          <>
            <Script
              id="ga4-lib"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga4-init" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}');
              `}
            </Script>
          </>
        )}

        {!isAdminRoute && isProd && FACEBOOK_PIXEL_ID && (
          <Script id="fb-pixel" strategy="lazyOnload">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FACEBOOK_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        {!isAdminRoute && isProd && TIKTOK_PIXEL_ID && (
          <Script id="tiktok-pixel" strategy="lazyOnload">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject = t;
                var ttq = w[t] = w[t] || [];
                ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "setUserProperties", "setUserIdentity", "reset"];
                ttq.setAndDefer = function (t, e) {
                  t[e] = function () {
                    t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
                  }
                };
                for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
                ttq.instance = function (t) {
                  var e = ttq._i[t] || [];
                  for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
                  return e
                };
                ttq.load = function (e, n) {
                  var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                  ttq._i = ttq._i || {};
                  ttq._i[e] = [];
                  ttq._i[e]._u = i;
                  ttq._t = ttq._t || {};
                  ttq._t[e] = +new Date;
                  ttq._o = ttq._o || {};
                  ttq._o[e] = n || {};
                  var o = document.createElement("script");
                  o.type = "text/javascript";
                  o.async = !0;
                  o.src = i + "?sdkid=" + e + "&lib=" + t;
                  var a = document.getElementsByTagName("script")[0];
                  a.parentNode.insertBefore(o, a)
                };
                ttq.load('${TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}

        {/* Preload da imagem de LCP para reduzir waterfall */}
        {/* AVIF tem melhor compressão que WebP (30-50% menor) */}
        {!isAdminRoute && (
          <link
            rel="preload"
            as="image"
            href="/spitz-hero-desktop.avif"
            type="image/avif"
            fetchPriority="high"
          />
        )}

        {/* Canonical dinamico (reforco; alternates via metadata) */}
        {metaRuntime.alternates?.canonical && (
          <link rel="canonical" href={metaRuntime.alternates.canonical as string} />
        )}
        {/* Verificacao de dominio Meta (se houver) */}
        {!isAdminRoute && META_VERIFY && (
          <meta name="facebook-domain-verification" content={META_VERIFY} />
        )}
        {/* Verificacao do Google Search Console (se houver) */}
        {!isAdminRoute && GOOGLE_VERIFY && (
          <meta name="google-site-verification" content={GOOGLE_VERIFY} />
        )}
        {/* Verificacao do Pinterest Business Hub (se houver) */}
        {!isAdminRoute && PINTEREST_VERIFY && (
          <meta name="p:domain_verify" content={PINTEREST_VERIFY} />
        )}

        {/* Preconnect condicional para analytics: evita custo em paginas sem tags */}
        {!isAdminRoute && useGTM && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {!isAdminRoute && !useGTM && GA4_ID && (
          <>
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {!isAdminRoute && FACEBOOK_PIXEL_ID && (
          <link rel="dns-prefetch" href="https://connect.facebook.net" />
        )}
        {!isAdminRoute && TIKTOK_PIXEL_ID && (
          <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        )}

        {/* JSON-LD inline para renderizacao imediata (melhor SEO) */}
        {!isAdminRoute && organizationLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
          />
        )}
        {!isAdminRoute && websiteLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
          />
        )}
        {!isAdminRoute && siteNavigationLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationLd) }}
          />
        )}
        {!isAdminRoute && localBusinessLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
          />
        )}

        {/** Pixels custom HTML removidos por seguranca. Apenas modelos oficiais via <Pixels />. */}
      </head>

      <body
        className={`min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased ${
          isAdminRoute ? "admin-shell" : ""
        }`}
      >
        {!isAdminRoute && isProd && useGTM && GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {!isAdminRoute && <SkipLink />}
        {!isAdminRoute && (
          <Pixels isAdminRoute={isAdminRoute} settings={pixelSettings ?? undefined} />
        )}

        {/* Dispara page_view em navegacoes SPA (somente quando os pixels existem) */}
        {!isAdminRoute && <TrackingScripts />}

        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            {!isAdminRoute && <Header />}
            <main className="flex-1" id="conteudo-principal" role="main">
              {children}
            </main>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <WhatsAppFloat />}
            {!isAdminRoute && <RecentSalesPopup />}
            {!isAdminRoute && <ConsentBanner />}
            {!isAdminRoute && <CustomCursor />}
          </div>
        </ThemeProvider>
        <SpeedInsights />
        <ToastContainer />
      </body>
    </html>
  );
}

