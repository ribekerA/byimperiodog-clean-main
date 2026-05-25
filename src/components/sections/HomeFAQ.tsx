"use client";

/**
 * HomeFAQ — Seção de perguntas frequentes para a home page.
 *
 * Otimizada para:
 *  • Google Featured Snippets (conteúdo visível, não bloqueado por JS)
 *  • AI Overviews (Google SGE) — perguntas conversacionais e naturais
 *  • Voice Search (Alexa, Siri, Google Assistant) — respostas curtas e diretas
 *  • Schema.org FAQPage injetado pelo page.tsx pai
 *
 * Accordion nativo com <details>/<summary> — funciona sem JS e é indexável.
 *
 * IMPORTANTE: os dados estão em @/content/home-faq-items (sem "use client")
 * para que Server Components possam importá-los e gerar JSON-LD no servidor.
 */

// Import local (para o componente usar) + re-export (para Server Components que
// ainda importam de cá — mantém compatibilidade sem criar Client Reference)
import { HOME_FAQ_ITEMS } from "@/content/home-faq-items";
export { HOME_FAQ_ITEMS };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HomeFAQ() {
  return (
    <section
      className="bg-white py-14 sm:py-20 overflow-hidden"
      aria-labelledby="faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
            Dúvidas frequentes
          </p>
          <h2
            id="faq-heading"
            className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
          >
            Tudo que você precisa saber antes de escolher
          </h2>
          <p className="mt-3 text-sm text-zinc-600">
            Respostas diretas para as perguntas mais comuns sobre o Spitz Alemão Anão (Lulu da Pomerânia) e nosso processo de criação.
          </p>
        </div>

        {/* FAQ accordion — usa <details>/<summary> nativo para SSR e indexabilidade */}
        <dl className="divide-y divide-zinc-100">
          {HOME_FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <details className="group py-4" open={i === 0}>
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-sm"
                  itemProp="name"
                >
                  <span className="text-sm font-semibold text-zinc-900 sm:text-base leading-snug">
                    {item.question}
                  </span>
                  {/* Chevron animado via CSS group-open */}
                  <span
                    className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>

                <div
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                  className="mt-3 pr-7"
                >
                  <p
                    itemProp="text"
                    className="text-sm leading-relaxed text-zinc-600"
                  >
                    {item.answer}
                  </p>
                </div>
              </details>
            </div>
          ))}
        </dl>

        {/* CTA de conversação */}
        <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-zinc-800">
            Não encontrou sua dúvida?
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Nossa criadora responde pessoalmente no WhatsApp, de segunda a sábado das 9h às 18h.
          </p>
          <a
            href="https://wa.me/5511968633239?text=Ol%C3%A1!+Tenho+uma+d%C3%BAvida+sobre+o+Spitz+Alem%C3%A3o+An%C3%A3o."
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
          >
            Perguntar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
