"use client";

import { useEffect } from "react";

import { getAttributionParams } from "@/lib/attribution";
import { sendGA4 } from "@/lib/track";

interface Props {
  eventName: string;
  params?: Record<string, string | number | undefined>;
}

/**
 * Dispara um evento GA4 customizado no mount do componente.
 * Inclui automaticamente os parâmetros de atribuição UTM (first/last touch).
 *
 * Uso:
 *   <LeadEventTracker eventName="lead_contato" />
 *   <LeadEventTracker eventName="lead_filhote" params={{ puppy_slug: "nome" }} />
 */
export default function LeadEventTracker({ eventName, params }: Props) {
  useEffect(() => {
    const attribution = getAttributionParams();
    sendGA4(eventName, { ...attribution, ...params });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
