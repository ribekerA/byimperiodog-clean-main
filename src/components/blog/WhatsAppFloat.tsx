"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "@/lib/whatsapp";

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const whatsappUrl = buildWhatsAppLink({
    message: WHATSAPP_MESSAGES.default,
    utmSource: "blog",
    utmMedium: "widget",
    utmCampaign: "blog_post",
    utmContent: open ? "float_open" : "float_closed",
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-contrast shadow-elevated transition hover:scale-110 focus-ring"
        aria-label={open ? "Fechar atalho WhatsApp" : "Abrir atalho WhatsApp"}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-50 w-80 animate-in slide-in-from-bottom-5 fade-in">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-elevated">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text">By Imperio Dog</h3>
                <p className="text-xs text-text-soft">Resposta humana em ate 30 minutos.</p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl bg-surface-subtle p-3 text-sm text-text">
              <p>
                Ola! Temos Spitz Alemao Anao sob consulta com mentoria vitalicia. Deseja falar agora pelo WhatsApp?
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition hover:bg-brand-600 focus-ring"
              onClick={() => setOpen(false)}
              data-track-event="blog_whatsapp_float"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Iniciar conversa
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
