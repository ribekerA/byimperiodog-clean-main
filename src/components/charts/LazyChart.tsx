"use client";
import React, { useEffect, useRef, useState } from "react";

// Minimal props for initial stub. Can be extended later.
export interface LazyChartProps {
  height?: number;
  // Data generic kept simple for now
  data?: any;
  // Render function receiving Recharts exports once loaded
  render?: (Recharts: typeof import("recharts")) => React.ReactNode;
  fallback?: React.ReactNode;
  // Threshold de pontos para usar sparkline inline ao invés de carregar Recharts imediatamente
  sparklineThreshold?: number;
}

// Internal cache so multiple LazyCharts don't duplicate dynamic import.
let rechartsPromise: Promise<typeof import("recharts")> | null = null;
function loadRecharts() {
  if (!rechartsPromise) {
    rechartsPromise = import("recharts");
  }
  return rechartsPromise;
}

export function LazyChart({ height = 240, data, render, fallback, sparklineThreshold = 16 }: LazyChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [Recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let observer: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (observer) {
              observer.disconnect();
              observer = null;
            }
          }
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  const smallSeriesValues: number[] | null = (() => {
    try {
      if (!data) return null;
      // Permit formats a) { labels, datasets } b) simple array
      if (Array.isArray(data) && data.every(v => typeof v === 'number')) return data as number[];
      if (data?.datasets && Array.isArray(data.datasets) && data.datasets[0]?.data) {
        const arr = data.datasets[0].data;
        if (Array.isArray(arr) && arr.every((v:any)=> typeof v === 'number')) return arr as number[];
      }
      return null;
    } catch { return null; }
  })();

  const shouldSparkline = !!smallSeriesValues && smallSeriesValues.length > 1 && smallSeriesValues.length <= sparklineThreshold;

  useEffect(() => {
    if (!visible || Recharts || shouldSparkline) return;
    let cancelled = false;
    // Schedule in idle time to keep main thread free for LCP
    const run = () => {
      loadRecharts().then((mod) => {
        if (!cancelled) setRecharts(mod);
      });
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 150);
    }
    return () => {
      cancelled = true;
    };
  }, [visible, Recharts, shouldSparkline]);

  const skeleton = (
    <div className="flex items-center justify-center text-xs text-muted-foreground h-full select-none">
      Carregando gráfico…
    </div>
  );

  // Sparkline SVG (inline): line + área preenchida leve
  let sparkline: React.ReactNode = null;
  if (shouldSparkline && smallSeriesValues) {
    const w = 200; // largura base responsiva via scale transform
    const h = Math.min(height, 60);
    const min = Math.min(...smallSeriesValues);
    const max = Math.max(...smallSeriesValues);
    const range = (max - min) || 1;
    const points = smallSeriesValues.map((v, i) => {
      const x = (i / (smallSeriesValues.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2; // padding
      return { x, y };
    });
    const path = points.map((p,i)=> `${i===0? 'M':'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const area = `${path} L ${w},${h} L 0,${h} Z`;
    sparkline = (
      <div className="w-full overflow-hidden" style={{ height: h }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
          <path d={area} fill="url(#sparkFill)" opacity={0.15} />
          <path d={path} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" />
          <defs>
            <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ minHeight: height }} className="w-full">
      {!visible && (fallback || skeleton)}
      {visible && shouldSparkline && sparkline}
      {visible && !shouldSparkline && !Recharts && (fallback || skeleton)}
      {visible && !shouldSparkline && Recharts && (
        <div style={{ height }} className="w-full overflow-hidden">
          {render ? render(Recharts) : skeleton}
        </div>
      )}
    </div>
  );
}

export default LazyChart;