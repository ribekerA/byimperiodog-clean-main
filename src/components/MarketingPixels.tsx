import Script from "next/script";

import type { SiteSettings } from "@/lib/getSettings";

type Props = { settings: SiteSettings };

export default function MarketingPixels({ settings }: Props) {
  const GTM_ID = (settings.gtm_id || "").trim();
  const GA4_ID = (settings.ga4_id || "").trim();
  const ADS_ID = (settings.google_ads_id || "").trim();
  const FB_ID  = (settings.meta_pixel_id || "").trim();
  const TT_ID  = (settings.tiktok_pixel_id || "").trim();
  const PIN_ID = (settings.pinterest_tag_id || "").trim();
  const HJ_ID  = (settings.hotjar_id || "").trim();
  const CL_ID  = (settings.clarity_id || "").trim();

  // Se GTM estiver presente, **preferimos** que você gerencie GA4/Ads/FB/TikTok/Pinterest no GTM
  const useGTM = Boolean(GTM_ID);

  return (
    <>
      {/* ================= Google Tag Manager (preferencial) ================= */}
      {useGTM && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
          {/* noscript (fallback) */}
          <noscript
            dangerouslySetInnerHTML={{
              __html: `
                <iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
                        height="0" width="0" style="display:none;visibility:hidden"></iframe>
              `,
            }}
          />
        </>
      )}

      {/* ================= GA4 + Google Ads (se NÃO usar GTM) =============== */}
      {!useGTM && (GA4_ID || ADS_ID) && (
        <>
          <Script
            id="gtag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID || ADS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              ${GA4_ID ? `gtag('config', '${GA4_ID}', { send_page_view: true });` : ""}
              ${ADS_ID ? `gtag('config', '${ADS_ID}');` : ""}
            `}
          </Script>
        </>
      )}

      {/* ================= Meta Pixel (Facebook) ============================ */}
      {FB_ID && (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !(function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)})(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${FB_ID}');
              fbq('track','PageView');
            `}
          </Script>
          {/* noscript fallback */}
          <noscript
            dangerouslySetInnerHTML={{
              __html: `
                <img height="1" width="1" style="display:none"
                     src="https://www.facebook.com/tr?id=${FB_ID}&ev=PageView&noscript=1"/>
              `,
            }}
          />
        </>
      )}

      {/* ================= TikTok Pixel ==================================== */}
      {TT_ID && (
        <Script id="ttq" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
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

      {/* ================= Pinterest Tag =================================== */}
      {PIN_ID && (
        <Script id="pinterest" strategy="afterInteractive">
          {`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '${PIN_ID}');
            pintrk('page');
          `}
        </Script>
      )}

      {/* ================= Hotjar ========================================== */}
      {HJ_ID && !isNaN(Number(HJ_ID)) && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${Number(HJ_ID)},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {/* ================= Microsoft Clarity =============================== */}
      {CL_ID && (
        <Script id="clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CL_ID}");
          `}
        </Script>
      )}
    </>
  );
}
