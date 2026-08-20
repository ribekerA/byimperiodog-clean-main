"use client";

import { useEffect, useRef } from "react";

import { getCurrentConsent } from "@/lib/consent";
import {
  clearPendingLeadConversion,
  GOOGLE_ADS_READY_EVENT,
  readPendingLeadConversion,
  registerAdsAccount,
  trackAdsConversion,
  trackGenerateLead,
} from "@/lib/conversions";

type ObrigadoConversionTrackerProps = {
  adsId?: string | null;
  leadLabel?: string | null;
};

/**
 * Conversão da página de obrigado.
 *
 * Nenhum link do site leva até aqui — o formulário confirma na própria página
 * e abre o WhatsApp. Por isso a página NÃO dispara por ser aberta: ela só
 * converte quando encontra a marca deixada pelo envio do formulário nesta
 * mesma visita. Sem essa trava, um acesso direto ou um favorito viraria lead
 * falso, que é o mesmo defeito que acabou de ser removido do PixelsByConsent.
 *
 * O id do lead vai como transaction_id nos dois disparos (formulário e aqui),
 * então o Ads reconhece que é a mesma conversão e conta uma vez só.
 */
export function ObrigadoConversionTracker({
  adsId,
  leadLabel,
}: ObrigadoConversionTrackerProps) {
  const adsTrackedRef = useRef(false);
  const leadTrackedRef = useRef(false);

  useEffect(() => {
    registerAdsAccount({ adsId, leadLabel });

    const tryTrack = () => {
      if (typeof window === "undefined") return;

      const pendente = readPendingLeadConversion();
      if (!pendente) return;
      if (!getCurrentConsent().marketing) return;

      const transactionId = pendente.id ?? undefined;
      const temConfigDoAds = Boolean(adsId?.trim() && leadLabel?.trim());

      // GA4/GTM não deve depender de o label do Ads já ter sido cadastrado.
      // O ref separado permite publicar generate_lead agora e ainda aguardar o
      // script do Ads sem duplicar o primeiro evento.
      if (!leadTrackedRef.current) {
        leadTrackedRef.current = trackGenerateLead({
          transactionId,
          contexto: { lead_source: "formulario" },
        });
      }

      if (!adsTrackedRef.current && temConfigDoAds) {
        const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
        // O helper só devolve true quando o Ads recebeu o evento; assim uma
        // falha real ainda pode ser tentada de novo quando o script sinalizar
        // que terminou de carregar.
        if (typeof gtag === "function") {
          adsTrackedRef.current = trackAdsConversion(
            leadLabel as string,
            undefined,
            transactionId,
          );
        }
      }

      // Consome a marca só depois que não há mais nada pendente, para que um
      // recarregamento da página não conte o mesmo lead outra vez.
      if (leadTrackedRef.current && (adsTrackedRef.current || !temConfigDoAds)) {
        clearPendingLeadConversion();
      }
    };

    tryTrack();
    window.addEventListener("consentUpdated", tryTrack);
    window.addEventListener(GOOGLE_ADS_READY_EVENT, tryTrack);

    return () => {
      window.removeEventListener("consentUpdated", tryTrack);
      window.removeEventListener(GOOGLE_ADS_READY_EVENT, tryTrack);
    };
  }, [adsId, leadLabel]);

  return null;
}
