import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import NextDynamic from "next/dynamic";
import Script from "next/script";

import "../globals.css";
import "../../design-system/tokens.css";

// Components
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import SkipLink from "@/components/common/SkipLink";
import Pixels from "@/components/Pixels";
import ToastContainer from "@/components/Toast";
import { getSiteSettings } from "@/lib/getSettings";
import { getPixelsSettings, resolveActiveEnvironment } from "@/lib/pixels";
import { resolveRobots } from "@/lib/seo";
import { baseSiteMetadata } from "@/lib/seo.core";
import {
  resolveTracking,
  buildOrganizationLD,
  buildWebsiteLD,
  buildSiteNavigationLD,
  buildLocalBusinessLD,
} from "@/lib/tracking";
import { buildDogBreederLD } from "@/lib/structured-data";

import { dmSans, inter } from "../fonts";

// Lazy load componentes nao-criticos para reduzir TBT
const RecentSalesPopup = NextDynamic(() => import("@/components/RecentSalesPopup"), { ssr: false });
const ConsentBanner = NextDynamic(() => import("@/components/ConsentBanner"), { ssr: false });
const ConsentGatedPixels = NextDynamic(() => import("@/components/ConsentGatedPixels"), { ssr: false });
const TrackingScripts = NextDynamic(() => import("@/components/TrackingScripts"), { ssr: false });
const AttributionTracker = NextDynamic(() => import("@/components/AttributionTracker"), { ssr: false });
// Botão fixo de WhatsApp — carregado após hidratação para não bloquear LCP
const WhatsAppFloat = NextDynamic(
  () => import("@/components/WhatsAppFloat").then((m) => ({ default: m.WhatsAppFloat })),
  { ssr: false }
);

export const metadata: Metadata = baseSiteMetadata({
  robots: resolveRobots(),
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#052e2b",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === "production";

  const [siteSettings, pixelSettings] = await Promise.all([
    getSiteSettings(),
    getPixelsSettings(),
  ]);
  const { config } = resolveActiveEnvironment(pixelSettings);
  const ids = resolveTracking(siteSettings, config);
  const GTM_ID = ids.gtm;
  const GA4_ID = ids.ga4;
  const META_VERIFY = ids.metaVerify;
  const GOOGLE_VERIFY = ids.googleVerify;
  const PINTEREST_VERIFY = ids.pinterestVerify;
  const useGTM = Boolean(ids.gtm);

  // Em produção, usar IDs dos pixels se disponíveis
  const FACEBOOK_PIXEL_ID = isProd ? ids.fb || null : null;
  const TIKTOK_PIXEL_ID = isProd ? ids.tiktok || null : null;

  let organizationLd: Record<string, unknown> | null = null;
  let websiteLd: Record<string, unknown> | null = null;
  let siteNavigationLd: Record<string, unknown> | null = null;
  let localBusinessLd: Record<string, unknown> | null = null;
  if (ids.siteUrl) {
    organizationLd = buildOrganizationLD(ids.siteUrl);
    websiteLd = buildWebsiteLD(ids.siteUrl);
    siteNavigationLd = buildSiteNavigationLD(ids.siteUrl);
    localBusinessLd = buildLocalBusinessLD(ids.siteUrl);
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />

        {/* ================================================================ */}
        {/* PERFORMANCE: Resource hints essenciais */}
        {/* ================================================================ */}
        <link rel="preconnect" href="https://npmnuihgydadihktglrd.supabase.co" crossOrigin="anonymous" />

        {/* Tracking settings from admin (only in prod) */}
        {isProd && useGTM && GTM_ID && (
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

        {isProd && !useGTM && GA4_ID && (
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

        {/* Verificacao de dominio Meta (se houver) */}
        {META_VERIFY && (
          <meta name="facebook-domain-verification" content={META_VERIFY} />
        )}
        {/* Verificacao do Google Search Console (se houver) */}
        {GOOGLE_VERIFY && (
          <meta name="google-site-verification" content={GOOGLE_VERIFY} />
        )}
        {/* Verificacao do Pinterest Business Hub (se houver) */}
        {PINTEREST_VERIFY && (
          <meta name="p:domain_verify" content={PINTEREST_VERIFY} />
        )}

        {/* Preconnect condicional para analytics: evita custo em paginas sem tags */}
        {useGTM && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {!useGTM && GA4_ID && (
          <>
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
        {FACEBOOK_PIXEL_ID && (
          <link rel="dns-prefetch" href="https://connect.facebook.net" />
        )}
        {TIKTOK_PIXEL_ID && (
          <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        )}

        {/* JSON-LD inline para renderizacao imediata (melhor SEO) */}
        {organizationLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
          />
        )}
        {websiteLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
          />
        )}
        {siteNavigationLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationLd) }}
          />
        )}
        {localBusinessLd && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
          />
        )}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDogBreederLD()) }}
        />

        {/** Pixels custom HTML removidos por seguranca. Apenas modelos oficiais via <Pixels />. */}
      </head>

      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        {isProd && useGTM && GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <SkipLink />
        <Pixels isAdminRoute={false} settings={pixelSettings ?? undefined} />

        {/* Dispara page_view em navegacoes SPA (somente quando os pixels existem) */}
        <TrackingScripts />
        {/* Captura UTM params para atribuição first/last touch */}
        <AttributionTracker />

        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1" id="conteudo-principal" role="main">
            {children}
          </main>
          <Footer />
          <WhatsAppFloat />
          <RecentSalesPopup />
          <ConsentBanner />
        </div>
        {isProd && (FACEBOOK_PIXEL_ID || TIKTOK_PIXEL_ID) && (
          <ConsentGatedPixels facebookPixelId={FACEBOOK_PIXEL_ID} tiktokPixelId={TIKTOK_PIXEL_ID} />
        )}
        <SpeedInsights />
        <ToastContainer />
      </body>
    </html>
  );
}
