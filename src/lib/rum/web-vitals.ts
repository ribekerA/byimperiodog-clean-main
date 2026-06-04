import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  rating?: string;
}

let initialized = false;

function sendVital(metric: WebVitalMetric) {
  try {
    const page = window.location.pathname;
    const body = JSON.stringify({ name: metric.name, value: metric.value, id: metric.id, page });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/rum", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/rum", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // never block
  }
}

export function initWebVitals(logger: (m: WebVitalMetric) => void = sendVital) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const wrap = (cb: (m: WebVitalMetric) => void) => (metric: WebVitalMetric) => {
    try { cb(metric); } catch { /* noop */ }
  };
  onCLS(wrap(logger));
  onLCP(wrap(logger));
  onINP(wrap(logger));
  onFCP(wrap(logger));
  onTTFB(wrap(logger));
}
