import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import StaticCatalog from "@/components/catalog/StaticCatalog";
import { staticPuppies } from "@/content/puppies-static";
import { buildLocalBusinessLD, buildItemListLD, buildBreadcrumbLD, buildFAQLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

const CATALOG_FAQS = [
  {
    question: "Como funciona o processo de reserva de um filhote de Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      "O processo é simples: escolha o filhote pelo site, entre em contato via WhatsApp, conheça a história e os laudos do filhote, e confirme a reserva com sinal. A criadora acompanha você em todo o processo, desde a escolha até a entrega com todos os documentos (registro oficial, vacinação, laudo de saúde e microchip).",
  },
  {
    question: "Quais são as cores de Spitz Alemão Anão (Lulu da Pomerânia) disponíveis?",
    answer:
      "Na By Império Dog trabalhamos com quatro cores: Creme (mais valorizada, a partir de R$ 9.000), Laranja (a mais icônica da raça, a partir de R$ 7.000), Preto (cor rara e elegante, a partir de R$ 8.000) e Wolf Sable (padrão exótico reconhecido pela FCI, a partir de R$ 7.500). A disponibilidade varia conforme as ninhadas.",
  },
  {
    question: "Qual a diferença de preço entre Spitz Alemão (Lulu da Pomerânia) Fêmea e Macho?",
    answer:
      "As fêmeas de Spitz Alemão Anão (Lulu da Pomerânia) costumam custar mais do que os machos por conta da maior demanda. Fêmeas variam de R$ 10.000 a R$ 15.000 (dependendo da cor). Machos variam de R$ 7.000 a R$ 9.000. Todos os valores incluem registro oficial, laudos veterinários e mentoria vitalícia.",
  },
  {
    question: "Os filhotes são entregues com quais documentos?",
    answer:
      "Todos os filhotes saem com registro oficial registrado, laudo de saúde, carteira de vacinação completa, teste de patela, histórico de vermifugação, microchip implantado, nota fiscal e contrato. Além disso, o tutor recebe acesso à mentoria vitalícia direto com a criadora.",
  },
];

export const metadata: Metadata = {
  title:       "Filhotes de Spitz Alemão Anão (Lulu da Pomerânia) Disponíveis | By Império Dog",
  description: "Catálogo de filhotes de Spitz Alemão Anão (Lulu da Pomerânia) disponíveis. Cores: Creme, Laranja, Preto, Wolf Sable. Registro oficial, laudos e mentoria vitalícia. Bragança Paulista, SP — entrega em todo o Brasil.",
  keywords: [
    "filhotes Spitz Alemão Anão disponíveis", "Lulu da Pomerânia à venda",
    "comprar Spitz Alemão creme", "filhote Pomeranian SP",
    "canil Spitz Alemão Bragança Paulista", "Lulu da Pomerânia com registro oficial",
    "Spitz Alemão laranja preto wolf sable", "filhote cachorro pequeno SP",
  ],
  alternates: { canonical: "/filhotes" },
  openGraph: {
    title:       "Filhotes de Spitz Alemão Anão (Lulu da Pomerânia) — By Império Dog",
    description: "Catálogo de filhotes com registro oficial, laudos veterinários e mentoria vitalícia. Bragança Paulista, SP.",
    type:        "website",
    images:      [{ url: "/spitz-hero-desktop.webp", width: 1200, height: 630, alt: "Filhotes Spitz Alemão Anão (Lulu da Pomerânia) disponíveis — By Império Dog" }],
  },
};

export default function FilhotesPage() {
  const businessLd   = buildLocalBusinessLD();
  const itemListLd   = buildItemListLD(staticPuppies as any);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",   url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
  ]);
  const faqLd = buildFAQLD(CATALOG_FAQS);

  return (
    <>
      <Script id="ld-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-item-list"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <Script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <StaticCatalog puppies={staticPuppies as any[]} />

      {/* FAQ visível — indexável por Google/IAs e útil para featured snippets */}
      <section
        className="mx-auto max-w-3xl px-5 pb-16 sm:px-8"
        aria-labelledby="catalog-faq-heading"
        itemScope itemType="https://schema.org/FAQPage"
      >
        <h2
          id="catalog-faq-heading"
          className="mb-6 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
        >
          Perguntas frequentes sobre os filhotes
        </h2>
        <dl className="divide-y divide-zinc-100">
          {CATALOG_FAQS.map((item) => (
            <div key={item.question} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <details className="group py-4">
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                  itemProp="name"
                >
                  <span className="text-sm font-semibold text-zinc-900">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="mt-3 pr-7">
                  <p itemProp="text" className="text-sm leading-relaxed text-zinc-600">{item.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </dl>

        {/* Breadcrumb navegacional */}
        <nav aria-label="Navegação estrutural" className="mt-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
            <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-zinc-600" aria-current="page">Filhotes</li>
          </ol>
        </nav>
      </section>
    </>
  );
}
