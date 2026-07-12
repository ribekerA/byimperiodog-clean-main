"use client";

/**
 * ReviewRequestPrompt — aparece após o usuário converter (clicou no WhatsApp
 * ou preencheu o formulário). Pede review no Google para amplificar prova social.
 *
 * Loop de crescimento: cliente satisfeito → review Google → mais visibilidade local
 * → mais tráfego → mais conversões.
 */

import { useEffect, useState } from "react";

const GOOGLE_REVIEW_URL =
  "https://g.page/r/byimperiodog/review"; // substituir pelo link real do GBP

const SEEN_KEY = "bid_review_prompt_seen";

interface Props {
  /** Se true, exibe imediatamente sem delay */
  immediate?: boolean;
  /** Contexto: foi chamado após formulário ou click no WhatsApp */
  trigger?: "form" | "whatsapp";
}

export default function ReviewRequestPrompt({ immediate = false, trigger = "whatsapp" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostra apenas uma vez por sessão
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // sessionStorage indisponível — mostra normalmente
    }

    const delay = immediate ? 800 : 4000;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [immediate]);

  const handleDismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
  };

  const handleReview = () => {
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
    handleDismiss();
  };

  if (!visible) return null;

  const isExistingClient = trigger === "whatsapp";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Deixar avaliação no Google"
      className="fixed bottom-24 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 animate-slide-up rounded-2xl border border-zinc-100 bg-white p-4 shadow-2xl lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <div className="flex items-start gap-3">
        {/* Ícone Google */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-xl" aria-hidden="true">
          ⭐
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">
            {isExistingClient ? "Já é cliente? Nos ajude!" : "Gostou do atendimento?"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Sua avaliação no Google ajuda outras famílias a encontrar um criador de confiança.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleReview}
              className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Deixar avaliação ★★★★★
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Fechar sugestão de avaliação"
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Fechar"
          className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
