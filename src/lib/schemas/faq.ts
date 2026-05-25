/**
 * Gera JSON-LD de FAQPage para páginas de perguntas frequentes
 * Melhora aparência nos resultados de busca com rich snippets
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQPageLD(faqs: FAQItem[]) {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
