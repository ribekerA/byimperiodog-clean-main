"use client";

import dynamic from "next/dynamic";

export const ClientOnlyConsentBanner = dynamic(
  () => import("@/components/ConsentBanner"),
  { ssr: false },
);

export const ClientOnlyTrackingScripts = dynamic(
  () => import("@/components/TrackingScripts"),
  { ssr: false },
);

export const ClientOnlyAttributionTracker = dynamic(
  () => import("@/components/AttributionTracker"),
  { ssr: false },
);

export const ClientOnlyWhatsAppClickTracker = dynamic(
  () => import("@/components/tracking/WhatsAppClickTracker"),
  { ssr: false },
);

export const ClientOnlyWhatsAppFloat = dynamic(
  () => import("@/components/WhatsAppFloat").then((module) => module.WhatsAppFloat),
  { ssr: false },
);
