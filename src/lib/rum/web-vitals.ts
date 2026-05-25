// PATH: src/lib/rum/web-vitals.ts
// Coleta básica de Web Vitals (LCP, INP, CLS, FID, TTFB, FCP)
// Pode ser expandido para enviar a endpoint /api/rum futuramente.
import { onCLS, onLCP, onINP, onFCP, onTTFB } from 'web-vitals';

export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  rating?: string;
}

let initialized = false;

export function initWebVitals(logger: (m: WebVitalMetric) => void = console.log) {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  const wrap = (cb: any) => (metric: any) => {
    try { cb(metric); } catch { /* noop */ }
  };
  onCLS(wrap(logger));
  onLCP(wrap(logger));
  onINP(wrap(logger));
  onFCP(wrap(logger));
  onTTFB(wrap(logger));
}
