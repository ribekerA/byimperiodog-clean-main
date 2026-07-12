"use client";

import { useEffect, useState } from "react";

import type { TrackingConfig } from "@/lib/tracking/getTrackingConfig";

import { TrackingSettingsPage } from "./TrackingSettingsPage";

export default function TrackingConfigPage() {
  const [config, setConfig] = useState<TrackingConfig | null>(null);

  useEffect(() => {
    fetch("/api/admin/tracking-settings?environment=production", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setConfig(d.config ?? null))
      .catch(() => setConfig(null));
  }, []);

  if (!config) return null;

  return (
    <div className="space-y-6">
      <TrackingSettingsPage initialEnvironment="production" initialConfig={config} />
    </div>
  );
}
