"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Captura UTM params da URL no carregamento de cada página e persiste
 * first-touch e last-touch no localStorage para atribuição de canal.
 *
 * Renderiza null — sem impacto visual ou de performance.
 */
export default function AttributionTracker() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
