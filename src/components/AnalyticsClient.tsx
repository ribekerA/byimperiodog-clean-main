"use client";

import { useEffect } from "react";

import track from "@/lib/track"; // seu helper track.ts

export default function AnalyticsClient() {
  useEffect(() => {
    track.bindClicks();
    track.page(); // page_view inicial
  }, []);
  return null;
}
