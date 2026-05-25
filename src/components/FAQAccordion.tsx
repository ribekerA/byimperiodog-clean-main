"use client";

import { useState } from "react";

type Item = { question: string; answer: string };

type Props = {
  items: Item[];
};

export function FAQAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3" role="list">
      {items.map((faq, idx) => {
        const isOpen = openIndex === idx;
        const contentId = `faq-content-${idx}`;
        const buttonId = `faq-button-${idx}`;
        return (
          <div
            key={faq.question}
            role="listitem"
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/50 focus-visible:ring-offset-2"
            >
              <span>{faq.question}</span>
              <span aria-hidden className="text-[var(--text-muted)]">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {/* CSS grid-rows trick: animates to exact content height — no max-height snap */}
            <div
              id={contentId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="mt-3 text-sm text-[var(--text-muted)]">{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FAQAccordion;
