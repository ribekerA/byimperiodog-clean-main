"use client";

import { useEffect } from "react";

import { captureClickId } from "@/lib/gclid";

/**
 * Garante que o identificador de clique de anúncio seja capturado em qualquer
 * página que tenha um CTA de WhatsApp.
 *
 * O que este hook FAZIA e não faz mais: colava um sufixo `[ref: 12345678]` no
 * fim da mensagem pré-preenchida do WhatsApp, com os últimos oito caracteres do
 * gclid. Uma busca no repositório inteiro não achou um único leitor daquele
 * código — nem o admin, nem /api/leads, nem o banco. Ou seja: o cliente abria o
 * WhatsApp com um código estranho colado no fim da própria mensagem, e ninguém
 * do outro lado tinha como usá-lo para nada. Atribuição de verdade quem faz é o
 * auto-tagging do Google (gclid na URL de entrada) somado ao gclid que vai, esse
 * sim, gravado no lead pelo formulário. Sistema caseiro paralelo, ainda por cima
 * sem consumidor, só piorava a mensagem que o cliente manda.
 *
 * O hook continua existindo porque a captura precoce continua valendo: o CTA
 * pode hidratar antes do <AttributionTracker /> do layout, e perder o gclid da
 * primeira visita significa perder a origem do lead. O link volta intocado.
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
