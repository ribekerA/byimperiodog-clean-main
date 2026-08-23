"use client";

import dynamic from "next/dynamic";

export const ClientOnlyNotifyMeButton = dynamic(
  () => import("@/components/NotifyMeButton"),
  { ssr: false },
);

export const ClientOnlyPuppyReviews = dynamic(
  () => import("@/components/reviews/PuppyReviews"),
  { ssr: false, loading: () => null },
);

export const ClientOnlyPuppyStickyFloatingCTA = dynamic(
  () => import("@/components/catalog/PuppyStickyFloatingCTA"),
  { ssr: false },
);
