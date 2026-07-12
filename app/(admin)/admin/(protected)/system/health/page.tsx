"use client";

import { useEffect, useState } from "react";

import type { HealthData, Range } from "./SystemHealthUI";
import { SystemHealthUI } from "./SystemHealthUI";

const EMPTY: HealthData = {
  generatedAt: new Date().toISOString(),
  range: "24h",
  overallStatus: "healthy",
  services: {
    database: { status: "ok", latencyMs: 0 },
    analytics: { status: "no_data", eventsInRange: 0 },
    storage: { status: "ok" },
    ai: { status: "not_configured" },
    whatsapp: { status: "not_configured" },
  },
  metrics: { responseTimeP50: 0, responseTimeP95: 0, errorRate: 0, activeUsers: 0, totalEvents: 0 },
  webVitals: { lcp: 0, inp: 0, cls: 0, samples: 0 },
  tableStats: { blog_posts: 0, puppies: 0, leads: 0 },
  recentErrors: [],
  errorByPath: {},
};

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [range] = useState<Range>("24h");

  useEffect(() => {
    fetch(`/api/admin/system/health?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d && d.generatedAt ? d : EMPTY))
      .catch(() => setData(EMPTY));
  }, [range]);

  if (!data) return null;

  return <SystemHealthUI initialData={data} initialRange={range} />;
}
