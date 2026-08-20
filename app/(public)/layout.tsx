import type { Metadata } from "next";
import NextDynamic from "next/dynamic";
import Script from "next/script";

import "../globals.css";
import "../../design-system/tokens.css";

// Components
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import SkipLink from "@/components/common/SkipLink";
import ConsentModeDefault from "@/components/ConsentModeDefault";
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
} from "@/lib/tracking";

import { dmSans, inter } from "../fonts";

// Lazy load componentes nao-criticos para reduzir TBT
// RecentSalesPopup removido: exibia "Familia de X reservou ha 12 min" a partir
// de uma lista fixa de eventos inventados, sorteados aleatoriamente. Nao havia
// nenhuma venda real por tras do aviso.
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
  // Sem LocalBusiness aqui: cada página já emite o nó canônico de
  // src/lib/structured-data.ts. Emitir os dois duplicava a empresa no grafo.
  if (ids.siteUrl) {
    organizationLd = buildOrganizationLD(ids.siteUrl);
    websiteLd = buildWebsiteLD(ids.siteUrl);
    siteNavigationLd = buildSiteNavigationLD(ids.siteUrl);
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />

        {/*
          O site reabria no meio da página. A causa é o
          `history.scrollRestoration = "auto"` do navegador: ao recarregar, ele
          devolve a posição de rolagem da visita anterior. Numa home longa isso
          faz a página abrir na altura em que o visitante parou, não no topo.

          Só desligamos a restauração quando a navegação NÃO é back/forward —
          nesse caso voltar para a listagem e cair de novo no mesmo card é o
          comportamento esperado. Âncoras (#secao) também continuam funcionando,
          porque a checagem roda antes de qualquer scroll e não mexe no hash.

          Precisa rodar no <head>, antes da primeira pintura: em useEffect o
          navegador já teria restaurado a posição e o usuário veria o salto.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `try{if('scrollRestoration' in history){var n=performance.getEntriesByType('navigation')[0];if(!n||n.type!=='back_forward'){history.scrollRestoration='manual';if(!location.hash){window.scrollTo(0,0);}}}}catch(e){}`,
          }}
        />

        {/* ================================================================ */}
        {/* PERFORMANCE: Resource hints essenciais */}
        {/* ================================================================ */}
        <link rel="preconnect" href="https://npmnuihgydadihktglrd.supabase.co" crossOrigin="anonymous" />

        {/* Consentimento ANTES de qualquer tag. Enquanto o visitante nao aceita,
            analytics e publicidade ficam em "denied" -- que e exatamente o que a
            politica de privacidade promete e o que o site nao cumpria: o GTM
            abaixo subia sem nenhuma checagem. Precisa vir antes do GTM/GA4. */}
        <ConsentModeDefault />

        {/* Tracking settings from admin (only in prod) */}
        {/* GTM sai de `afterInteractive` para `lazyOnload`.
            No Lighthouse mobile o GTM aparece com 313 KiB, e em
            `afterInteractive` ele comeca a executar logo apos a hidratacao --
            ou seja, disputando a thread principal dentro da janela do LCP, num
            site em que 90% do trafego e celular e o Speed Index esta em 6,8 s.
            Com `lazyOnload` ele espera o evento `load` da pagina.
            Custo: eventos de quem sai do site em menos de ~2 s podem nao ser
            registrados. Cliques e conversoes nao mudam. Para reverter, basta
            trocar de volta para "afterInteractive". */}
        {isProd && useGTM && GTM_ID && (
          <Script id="gtm-init" strategy="lazyOnload">
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
        {/**
          * O LocalBusiness do layout e o DogBreeder foram removidos daqui.
          * Ambos usavam o mesmo @id do LocalBusiness que cada página já emite,
          * com name/url/description/priceRange diferentes — era essa colisão que
          * o Search Console reportava como "campo duplicado". As propriedades
          * exclusivas do DogBreeder (makesOffer, knowsAbout de raça) foram
          * incorporadas ao nó canônico em src/lib/structured-data.ts.
          */}

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
          {/* Este é o ÚNICO <main> do site público, e o alvo do skip link.
              As páginas abriam cada uma o seu, o que deixava dois landmarks
              "main" no mesmo documento (a home ainda repetia o id, HTML
              inválido); todas passaram a usar <div>. Página nova não deve
              reabrir <main> nem redeclarar id="conteudo-principal". */}
          <main className="flex-1" id="conteudo-principal" role="main">
            {children}
          </main>
          <Footer />
          <WhatsAppFloat />
          <ConsentBanner />
        </div>
        {isProd && (FACEBOOK_PIXEL_ID || TIKTOK_PIXEL_ID) && (
          <ConsentGatedPixels facebookPixelId={FACEBOOK_PIXEL_ID} tiktokPixelId={TIKTOK_PIXEL_ID} />
        )}
        <ToastContainer />
      </body>
    </html>
  );
}
