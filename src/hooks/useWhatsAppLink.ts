"use client";

import { useEffect } from "react";

import { captureClickId } from "@/lib/gclid";

/**
 * Captura cedo o identificador do anúncio. O link volta intacto daqui; quem
 * acrescenta o código curto na mensagem, no momento do clique e só para quem
 * veio de anúncio com aceite de marketing, é o WhatsAppClickTracker
 * (src/lib/whatsapp-ref.ts).
 */
export function useWhatsAppLink(baseLink: string): string {
  useEffect(() => {
    captureClickId();
  }, []);

  return baseLink;
}

export function useWhatsAppLinks(baseLinks: string[]): string[] {
  useEffect(() => {
    captureClickId();
  }, []);

  return baseLinks;
}
