"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";

interface Props {
  whatsappUrl: string;
}

const SESSION_KEY = "floating-cta-dismissed";

export default function FloatingReadCTA({ whatsappUrl }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const trackedWhatsappUrl = useWhatsAppLink(whatsappUrl);

  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }

    let triggered = false;
    const handleScroll = () => {
      if (triggered) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      if (window.scrollY / total > 0.45) {
        triggered = true;
        setVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // O CTA ainda pode ser fechado quando o navegador bloqueia o storage.
    }
  }

  if (dismissed || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Fale com a criadora"
      className="fixed bottom-5 right-4 z-50 w-[268px] rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-bottom-4 duration-300"
    >
      <button
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-600"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>

      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
        Gostou do conteúdo?
      </p>
      <p className="mt-1.5 text-sm leading-snug text-zinc-700">
        Fale com a criadora e descubra a disponibilidade de filhotes.
      </p>

      <a
        href={trackedWhatsappUrl}
        data-wa-placement="floating_button"
        target="_blank"
        rel="noopener noreferrer"
        onClick={dismiss}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        data-track-event="blog_floating_cta"
      >
        <MessageCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
        Conversar no WhatsApp
      </a>

      <p className="mt-2 text-center text-[10px] text-zinc-500">
        ⚡ Atendimento das 8h às 22h · Sem compromisso
      </p>
    </div>
  );
}
