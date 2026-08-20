"use client";

import { useEffect, useMemo, useState } from "react";

import { captureClickId, getClickId } from "@/lib/gclid";

export function appendClickIdToWhatsAppLink(
  baseLink: string,
  clickId: string | null,
): string {
  if (!clickId) return baseLink;

  try {
    const url = new URL(baseLink);
    const reference = clickId.slice(-8);
    const suffix = `\n\n[ref: ${reference}]`;
    const currentText = url.searchParams.get("text") ?? "";

    if (!currentText.endsWith(suffix)) {
      url.searchParams.set("text", `${currentText}${suffix}`);
    }

    return url.toString();
  } catch {
    return baseLink;
  }
}

/**
 * Mantém o HTML inicial igual ao do servidor e acrescenta a referência somente
 * depois da hidratação, quando o localStorage pode ser consultado com segurança.
 */
export function useWhatsAppLink(baseLink: string): string {
  const [clickId, setClickId] = useState<string | null>(null);

  useEffect(() => {
    // O CTA pode hidratar antes do tracker global; capturar aqui também evita
    // perder o primeiro clique sem criar outro componente no layout.
    captureClickId();
    setClickId(getClickId());
  }, []);

  return useMemo(
    () => appendClickIdToWhatsAppLink(baseLink, clickId),
    [baseLink, clickId],
  );
}

export function useWhatsAppLinks(baseLinks: string[]): string[] {
  const [clickId, setClickId] = useState<string | null>(null);

  useEffect(() => {
    captureClickId();
    setClickId(getClickId());
  }, []);

  return useMemo(
    () => baseLinks.map((link) => appendClickIdToWhatsAppLink(link, clickId)),
    [baseLinks, clickId],
  );
}
