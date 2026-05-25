"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

import { getCurrentConsent } from "@/lib/consent";

export interface PixelsProps {
  isAdminRoute: boolean;
  useGTM: boolean;
  GTM_ID?: string;
  GA4_ID?: string;
  FB_ID?: string;
  TT_ID?: string;
  PIN_ID?: string;
  HOTJAR_ID?: string;
  CLARITY_ID?: string;
  ADS_ID?: string;
  ADS_LABEL?: string;
  analyticsConsentRequired?: boolean;
  marketingConsentRequired?: boolean;
}

/**
 * Carrega pixels apenas após consentimento.
 * - Analytics: GA4 (ou GTM), Hotjar, Clarity
 * - Marketing: Facebook, TikTok, Pinterest
 * Evita carregar scripts desnecessários antes do consentimento → melhora TTI/TBT.
 */
export default function PixelsByConsent(props: PixelsProps) {
  const {
    isAdminRoute,
    analyticsConsentRequired = true,
    marketingConsentRequired = true,
  } = props;
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(() => (typeof window !== 'undefined' ? getCurrentConsent() : { necessary: true, analytics: false, marketing: false, functional: true }));

  // Flags para prevenir injeções duplicadas por re-render
  const flags = useMemo(
    () => ({
      gtm: false,
      ga: false,
      ads: false,
      fb: false,
      tt: false,
      pin: false,
      hj: false,
      cl: false,
    }),
    []
  );

  useEffect(() => {
    if (isAdminRoute) return;
    // Estado inicial
    setConsent(getCurrentConsent());
    setReady(true);

    const onUpdate = (e: Event) => {
      try {
        // detail: ConsentPreferences
        // @ts-expect-error: CustomEvent detail comes untyped here
        const detail = e?.detail;
        if (detail) setConsent(detail);
      } catch {
        // ignore parsing errors
      }
    };
    window.addEventListener('consentUpdated', onUpdate as EventListener);
    return () => window.removeEventListener('consentUpdated', onUpdate as EventListener);
  }, [isAdminRoute]);

  if (isAdminRoute) return null;
  if (!ready) return null;

  const { analytics, marketing } = consent;
  const allowAnalytics = analyticsConsentRequired ? analytics : true;
  const allowMarketing = marketingConsentRequired ? marketing : true;
  const { useGTM, GTM_ID, GA4_ID, FB_ID, TT_ID, PIN_ID, HOTJAR_ID, CLARITY_ID, ADS_ID, ADS_LABEL } = props;

  return (
    <>
      {/* Analytics: GTM (preferencial) ou GA4 direto, somente com consent.analytics */}
      {/* strategy="lazyOnload" para evitar bloqueio de TBT/TTI (carrega após onLoad) */}
      {allowAnalytics && useGTM && GTM_ID && !flags.gtm && (
        <Script id="gtm-consent" strategy="lazyOnload" onLoad={() => { flags.gtm = true; }}>
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      )}

      {allowAnalytics && !useGTM && GA4_ID && !flags.ga && (
        <>
          <Script id="ga4-src-consent" src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="lazyOnload" onLoad={() => { /* noop */ }} />
          <Script id="ga4-init-consent" strategy="lazyOnload" onLoad={() => { flags.ga = true; }}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} window.gtag = gtag;
              gtag('js', new Date()); gtag('config', '${GA4_ID}', { send_page_view: true });
            `}
          </Script>
        </>
      )}

      {/* Analytics auxiliares: Hotjar e Clarity */}
      {allowAnalytics && HOTJAR_ID && !isNaN(Number(HOTJAR_ID)) && !flags.hj && (
        <Script id="hotjar-consent" strategy="lazyOnload" onLoad={() => { flags.hj = true; }}>
          {`
            (function(h,o,t,j,a,r){ h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${Number(HOTJAR_ID)},hjsv:6}; a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1; r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv; a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {allowAnalytics && CLARITY_ID && !flags.cl && (
        <Script id="clarity-consent" strategy="lazyOnload" onLoad={() => { flags.cl = true; }}>
          {`
            (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i; y=l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}

      {/* Marketing: Facebook, TikTok, Pinterest */}
      {/* strategy="lazyOnload" para minimizar impacto no TBT */}
      {allowMarketing && ADS_ID && (
        <>
          {!useGTM && !flags.ga && !flags.ads && (
            <Script
              id="google-ads-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
              strategy="lazyOnload"
              onLoad={() => {
                flags.ads = true;
              }}
            />
          )}
          <Script
            id="google-ads-init"
            strategy="lazyOnload"
            onLoad={() => {
              flags.ads = true;
            }}
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${ADS_ID}');
              ${ADS_LABEL ? `gtag('event','conversion',{'send_to':'${ADS_ID}/${ADS_LABEL}'});` : ""}
            `}
          </Script>
        </>
      )}

      {allowMarketing && FB_ID && !flags.fb && (
        <>
          <Script id="fb-pixel-consent" strategy="lazyOnload" onLoad={() => { flags.fb = true; }}>
            {`
              !(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
              s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${FB_ID}'); fbq('track','PageView');
            `}
          </Script>
          {/* noscript opcional omitido para evitar custo antes do consent */}
        </>
      )}

      {allowMarketing && TT_ID && !flags.tt && (
        <Script id="tiktok-consent" strategy="lazyOnload" onLoad={() => { flags.tt = true; }}>
          {`
            !function (w, d, t) {w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
            ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
            ttq.setAndDefer = function(t, e) { t[e] = function() { t.push([e].concat(Array.prototype.slice.call(arguments,0))) } };
            for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
            ttq.instance = function(t) { var e = ttq._i[t] || []; for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e };
            ttq.load = function(e, n) {
              var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
              var o = d.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = i + "?sdkid=" + e + "&lib=" + t;
              var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a);
            }
            ttq.load("${TT_ID}"); ttq.page();
          }(window, document, 'ttq');
          `}
        </Script>
      )}

      {allowMarketing && PIN_ID && !flags.pin && (
        <Script id="pinterest-consent" strategy="lazyOnload" onLoad={() => { flags.pin = true; }}>
          {`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '${PIN_ID}'); pintrk('page');
          `}
        </Script>
      )}
    </>
  );
}
