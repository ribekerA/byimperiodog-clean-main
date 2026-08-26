"use client";

import { useEffect } from "react";

import { trackContactPageView, trackPuppyPageView } from "@/lib/events";

/**
 * Mede a VISUALIZAÇÃO de uma página, no mount, e nada além disso.
 *
 * Substitui o antigo `LeadEventTracker`, que aceitava qualquer nome de evento
 * por prop e era usado para disparar `lead_filhote` e `lead_contato` no
 * carregamento da página. Nome de evento vindo por string livre foi o que
 * permitiu chamar de "lead" o que era apenas um pageview: qualquer página
 * podia inventar um nome e nenhum lugar do código dizia o que aquele nome
 * significava. Aqui as duas views possíveis são funções nomeadas em
 * `src/lib/events.ts`, com a regra escrita junto — não há como um caller novo
 * batizar uma view de conversão sem passar por lá.
 *
 * Lead continua sendo `whatsapp_click` e `generate_lead`, disparados por ação
 * real do visitante.
 */
type Props =
  | { tipo: "filhote"; puppySlug: string; puppyColor?: string | null; puppySex?: string | null }
  | { tipo: "contato" };

export default function ViewEventTracker(props: Props) {
  const tipo = props.tipo;
  const puppySlug = props.tipo === "filhote" ? props.puppySlug : undefined;
  const puppyColor = props.tipo === "filhote" ? props.puppyColor : undefined;
  const puppySex = props.tipo === "filhote" ? props.puppySex : undefined;

  useEffect(() => {
    if (tipo === "contato") {
      trackContactPageView();
      return;
    }
    if (puppySlug) {
      trackPuppyPageView({ puppySlug, puppyColor, puppySex });
    }
  }, [tipo, puppySlug, puppyColor, puppySex]);

  return null;
}
