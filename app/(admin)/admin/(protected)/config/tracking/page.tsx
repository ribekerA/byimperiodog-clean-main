import "server-only";
import type { Metadata } from "next";

import { getTrackingConfig } from "@/lib/tracking/getTrackingConfig";
import { TrackingSettingsPage } from "./TrackingSettingsPage";

export const metadata: Metadata = {
  title: "Tracking & Pixels | Admin",
  description: "Configuração centralizada de tags, pixels e verificações",
  robots: { index: false, follow: false },
};

const DEFAULT_ENVIRONMENT = "production";

export default async function TrackingConfigPage() {
  const config = await getTrackingConfig(DEFAULT_ENVIRONMENT);

  return (
    <main className="space-y-6">
      <TrackingSettingsPage initialEnvironment={DEFAULT_ENVIRONMENT} initialConfig={config} />
    </main>
  );
}
