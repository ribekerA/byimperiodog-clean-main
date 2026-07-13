'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import { getCurrentConsent, type ConsentPreferences } from '@/lib/consent';

interface ConsentGatedPixelsProps {
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
}

// Meta e TikTok não têm um "Consent Mode" nativo como o Google: o script,
// uma vez carregado, dispara direto. Por isso só montamos os <Script> depois
// de confirmar consentimento de marketing (salvo ou recém-concedido via
// o evento "consentUpdated" disparado por saveConsent() em lib/consent.ts).
export default function ConsentGatedPixels({ facebookPixelId, tiktokPixelId }: ConsentGatedPixelsProps) {
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    setMarketingConsent(getCurrentConsent().marketing);

    const handleConsentUpdated = (e: Event) => {
      const detail = (e as CustomEvent<ConsentPreferences>).detail;
      setMarketingConsent(Boolean(detail?.marketing));
    };
    window.addEventListener('consentUpdated', handleConsentUpdated);
    return () => window.removeEventListener('consentUpdated', handleConsentUpdated);
  }, []);

  if (!marketingConsent) return null;

  return (
    <>
      {facebookPixelId && (
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
            fbq('init', '${facebookPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {tiktokPixelId && (
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
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}
    </>
  );
}
