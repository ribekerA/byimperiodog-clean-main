"use client";

import { useEffect } from "react";

import { initWebVitals, logEvent } from "@/lib/analytics";
import { isAdminRoute } from "@/lib/tracking";

export default function TrackingScripts() {
  useEffect(() => {
    const waitFor = <T,>(opts: {
      getter: () => T | undefined;
      onReady: (value: T) => void;
      onFail?: () => void;
      label: string;
      maxAttempts?: number;
      intervalMs?: number;
    }): number => {
      const { getter, onReady, onFail, label, maxAttempts = 20, intervalMs = 300 } = opts;
      let attempts = 0;
      const timer = setInterval(() => {
        const target = getter();
        if (target) {
          clearInterval(timer);
          onReady(target);
        } else if (attempts++ > maxAttempts) {
          clearInterval(timer);
          onFail?.();
          // eslint-disable-next-line no-console
          console.warn(`[pixel-test] ${label} não carregou para teste`);
        }
      }, intervalMs);
      return timer as unknown as number;
    };

    const sendPageView = () => {
      const url = window.location.href;
      const pathname = window.location.pathname;
      const search = window.location.search ? window.location.search.replace(/^\?/, "") : "";

      // Don't track pageviews from admin routes
      if (isAdminRoute(pathname)) {
        return;
      }

      // GA4 / Ads (gtag)
      // @ts-ignore
      const gtag = (window as any).gtag;
      if (typeof gtag === "function") {
        gtag("event", "page_view", {
          page_location: url,
          page_path: pathname + (search ? `?${search}` : ""),
        });
      }

      // Meta Pixel
      // @ts-ignore
      const fbq = (window as any).fbq;
      if (typeof fbq === "function") {
        fbq("track", "PageView");
      }

      // TikTok
      // @ts-ignore
      const ttq = (window as any).ttq;
      if (ttq && typeof ttq.page === "function") {
        ttq.page();
      }

      // Pinterest
      // @ts-ignore
      const pintrk = (window as any).pintrk;
      if (typeof pintrk === "function") {
        pintrk("page");
      }
    };

    // Defer tracking para não bloquear main thread
    // RequestIdleCallback para melhor TBT/INP
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        sendPageView();
        initWebVitals();
      }, { timeout: 2000 });
    } else {
      // Fallback para navegadores sem suporte
      setTimeout(() => {
        sendPageView();
        initWebVitals();
      }, 1);
    }

    // Delegated clicks for CTR (cards, toc, share)
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest('[data-evt]') as HTMLElement | null;
      if (!el) return;
      const name = el.getAttribute('data-evt');
      if (!name) return;
      const meta: Record<string, any> = {};
      const id = el.getAttribute('data-id'); if (id) meta.id = id;
      const label = el.getAttribute('aria-label') || el.textContent?.trim()?.slice(0,80) || undefined;
      if (label) meta.label = label;
      if (name === 'card_click' || name === 'toc_click' || name === 'share_click') {
        logEvent(name, meta);
      }
    };
    document.addEventListener('click', onClick, true);

    // Teste disparado via querystring para uso pelo admin (/admin/pixels -> nova aba pública)
    const params = new URLSearchParams(window.location.search);
    const pixelTest = params.get("pixel_test");
    const pixelId = params.get("pixel_id");
    let waitHandle: number | undefined;

    if (pixelTest && pixelId) {
      if (pixelTest === "meta") {
        waitHandle = waitFor(
          {
            getter: () => (window as any).fbq as ((...args: any[]) => void) | undefined,
            onReady: (fbq) => {
              fbq("track", "TestEvent", { source: "public_test", pixel_id: pixelId });
              window.opener?.postMessage(
                { source: "pixel_test", ok: true, pixel: "meta" },
                window.location.origin
              );
            },
            onFail: () => window.opener?.postMessage({ source: "pixel_test", ok: false, pixel: "meta" }, window.location.origin),
            label: "fbq",
          }
        );
      } else if (pixelTest === "ga4") {
        waitHandle = waitFor(
          {
            getter: () => (window as any).gtag as ((...args: any[]) => void) | undefined,
            onReady: (gtag) => {
              gtag("event", "test_event", {
                event_category: "admin_test",
                event_label: "GA4 public test",
                value: 1,
                send_to: pixelId,
              });
              window.opener?.postMessage(
                { source: "pixel_test", ok: true, pixel: "ga4" },
                window.location.origin
              );
            },
            onFail: () => window.opener?.postMessage({ source: "pixel_test", ok: false, pixel: "ga4" }, window.location.origin),
            label: "gtag",
          }
        );
      } else if (pixelTest === "gtm") {
        waitHandle = waitFor(
          {
            getter: () => (window as any).dataLayer as Array<any> | undefined,
            onReady: (dl) => {
              dl.push({
                event: "test_event",
                event_category: "admin_test",
                event_label: "GTM public test",
              });
              window.opener?.postMessage(
                { source: "pixel_test", ok: true, pixel: "gtm" },
                window.location.origin
              );
            },
            onFail: () => window.opener?.postMessage({ source: "pixel_test", ok: false, pixel: "gtm" }, window.location.origin),
            label: "dataLayer",
          }
        );
      } else if (pixelTest === "tiktok") {
        waitHandle = waitFor(
          {
            getter: () => (window as any).ttq as { track?: (...args: any[]) => void } | undefined,
            onReady: (ttq) => {
              ttq.track?.("TestEvent", { source: "admin_test" });
              window.opener?.postMessage(
                { source: "pixel_test", ok: true, pixel: "tiktok" },
                window.location.origin
              );
            },
            onFail: () =>
              window.opener?.postMessage({ source: "pixel_test", ok: false, pixel: "tiktok" }, window.location.origin),
            label: "ttq",
          }
        );
      }
    }

    // listen for SPA navigation
    const onPop = () => sendPageView();
    window.addEventListener("popstate", onPop);
    window.addEventListener("pushstate" as any, onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pushstate" as any, onPop);
      document.removeEventListener('click', onClick, true);
      if (waitHandle) {
        clearInterval(waitHandle);
      }
    };
  }, []);

  return null;
}
