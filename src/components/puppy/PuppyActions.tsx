/**
 * PuppyActions v2.0 - Design System Refactor
 * CTAs de ação (WhatsApp, agendar visita, mais fotos)
 * UX: Hierarquia clara de ações primárias e secundárias
 * A11y: Botões/links com labels descritivos
 * 
 * Migrado para usar componentes do Design System:
 * - Button para CTAs
 * - Card para blocos de informação
 */

"use client";

import { Calendar, Camera, MessageCircle } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button, Card, CardContent } from "@/components/ui";

type Props = {
  whatsappLink: string;
  puppyName: string;
  onRequestPhotos?: () => void;
  onScheduleVisit?: () => void;
};

export function PuppyActions({ whatsappLink, puppyName, onRequestPhotos, onScheduleVisit }: Props) {
  return (
    <section aria-labelledby="actions-heading" className="space-y-6">
      <h2 id="actions-heading" className="sr-only">
        Ações disponíveis
      </h2>

      {/* CTA primário fixo no mobile */}
      <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-zinc-200 bg-white p-4 shadow-lg sm:relative sm:border-0 sm:p-0 sm:shadow-none">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Quero o ${puppyName} - Falar no WhatsApp`}
          className="w-full"
        >
          <Button
            variant="solid"
            size="lg"
            className="w-full gap-2 rounded-full"
          >
            <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
            Quero esse filhote
          </Button>
        </a>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Resposta em até 1 hora • Atendimento 7 dias por semana
        </p>
      </div>

      {/* CTAs secundárias */}
      <div className="grid gap-3 sm:grid-cols-2">
        {onRequestPhotos && (
          <Button
            variant="outline"
            size="lg"
            onClick={onRequestPhotos}
            className="gap-2 rounded-full"
            aria-label="Solicitar mais fotos e vídeos"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Quero mais fotos/vídeos
          </Button>
        )}

        {onScheduleVisit && (
          <Button
            variant="outline"
            size="lg"
            onClick={onScheduleVisit}
            className="gap-2 rounded-full"
            aria-label="Agendar visita online ou presencial"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Agendar visita
          </Button>
        )}
      </div>

      {/* CTA terciário: tirar dúvidas */}
      <Card variant="outline" className="bg-zinc-50">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium text-zinc-900">Ainda tem dúvidas?</p>
          <p className="mt-1 text-sm text-zinc-600">
            Nossa equipe está pronta para ajudar você a tomar a melhor decisão
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:rounded"
            aria-label="Tirar dúvidas no WhatsApp"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Conversar no WhatsApp
          </a>
        </CardContent>
      </Card>
    </section>
  );
}
