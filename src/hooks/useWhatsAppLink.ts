"use client";

import { useEffect } from "react";

import { captureClickId } from "@/lib/gclid";

/**
 * Captura cedo o identificador do anúncio sem modificar a mensagem do
 * WhatsApp. A atribuição fica nos mecanismos próprios de tracking e o link
 * sempre volta intacto para o visitante.
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
