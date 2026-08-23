"use client";

import dynamic from "next/dynamic";

export const RecentPostsListClientOnly = dynamic(
  () => import("./RecentPostsListAnimated"),
  { ssr: false, loading: () => null },
);
