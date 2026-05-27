import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/canil-spitz-alemao-interior-sp`;

export const metadata: Metadata = {
  title: "Canil Spitz Alemão Anão no Interior de SP | By Império Dog — Bragança Paulista",
  description:
    "O melhor canil de Spitz Alemão Anão (Lulu da Pomerânia) no interior de São Paulo fica em Bragança Paulista. 13 anos de criação, registro oficial, laudos e mentoria vitalícia. Atende Campinas, Sorocaba, São José dos Campos e todo SP.",
  keywords: [
    "canil Spitz Alemão interior SP",
    "canil Lulu da Pomerânia interior São Paulo",
    "Spitz Alemão Bragança Paulista SP",
    "melhor canil Spitz Alemão SP",
    "filhote Lulu da Pomerânia interior SP",
    "criador Spitz Alemão Campinas SP",
  ],
  alternates: { canonical: "/canil-spitz-alemao-interior-sp" },
  openGraph: {
    title: "Canil Spitz Alemão Anão — Interior de SP | By Império Dog",
    description: "Referência no interior de SP: 13 anos de criação responsável de Spitz Alemão Anão em Bragança Paulista.",
    type: "website",
  },
};

const CITIES = [
  "Bragança Paulista (sede)",
  "Atibaia",
  "Jundiaí",
  "Campinas e Região",
  "Sorocaba",
  "São José dos Campos",
  "Taubaté",
  "Americana",
  "Ribeirão Preto",
  "Franca",
  "Bauru",
  "Todo o interior de SP",
] as const;

const FAQS = [
  {
    question: "Qual o melhor canil de Spitz Alemão Anão no interior de SP?",
    answer:
      "A By Império Dog é reconhecida como referência no interior de São Paulo com 13 anos de especialização exclusiva em Spitz Alemão Anão. Localizada em Bragança Paulista, conta com mais de 180 famílias atendidas, registro oficial em 100% dos filhotes, laudos veterinários completos e mentoria vitalícia — um conjunto de diferenciais que poucos criadores da região oferecem.",
  },
  {
    question: "Vocês entregam em Campinas, Sorocaba e outras cidades do interior?",
    answer:
      "Sim. Atendemos famílias de todo o interior de SP. Para cidades próximas, é possível fazer a entrega pessoalmente ou o tutor vir buscar em Bragança Paulista. Para cidades mais distantes, o filhote pode ser transportado por transportadora especializada ou pelo próprio tutor após visita.",
  },
  {
    question: "Bragança Paulista é perto de Campinas?",
    answer:
      "Bragança Paulista fica a aproximadamente 90 km de Campinas (cerca de 1h de carro). É facilmente acessível pela Rodovia D. Pedro I (SP-065). Para tutores de Campinas, Jundiaí, Atibaia, Itatiba e cidades vizinhas, é uma opção próxima.",
  },
  {
    question: "Existe algum canil de Spitz Alemão Anão em Campinas?",
    answer:
      "Há criadores na região de Campinas, mas a recomendação é sempre verificar procedência, registro oficial, laudos veterinários e suporte pós-venda antes de qualquer decisão. A By Império Dog em Bragança Paulista é a referência mais próxima com todo esse conjunto de garantias documentado.",
  },
  {
    question: "Como agendar uma visita ao canil?",
    answer:
      "Visitas são bem-vindas por agendamento via WhatsApp. Também realizamos videochamadas para quem não pode se deslocar. O processo de conhecer o canil, os pais e os filhotes é parte fundamental antes da decisão de compra.",
  },
];

export default function CanilInteriorSPPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi que vocês são referência de canil de Spitz Alemão no interior de SP. Pode me informar sobre disponibilidade de filhotes?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Canil Spitz Alemão — Interior SP", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-isp-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-isp-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-isp-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-isp-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Referência no interior de São Paulo</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Canil Spitz Alemão Anão no Interior de SP — By Império Dog
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Se você mora no interior de São Paulo e procura um criador responsável de Spitz Alemão Anão (Lulu da Pomerânia), a By Império Dog em Bragança Paulista é referência na região há 13 anos.
        </p>
      </header>

      {/* Credenciais */}
      <section aria-labelledby="cred-isp-heading">
        <h2 id="cred-isp-heading" className="sr-only">Credenciais</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { v: "2012", l: "Fundação" },
            { v: "13+", l: "Anos de criação" },
            { v: "180+", l: "Famílias atendidas" },
            { v: "100%", l: "Com registro oficial" },
          ].map((c) => (
            <div key={c.l} className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{c.v}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cidades atendidas */}
      <section aria-labelledby="cidades-heading" className="space-y-4">
        <h2 id="cidades-heading" className="text-2xl font-bold text-zinc-900">Cidades atendidas no interior de SP</h2>
        <p className="text-sm text-zinc-600">Atendemos diretamente ou com envio por transportadora especializada:</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CITIES.map((city) => (
            <li key={city} className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 text-sm text-zinc-700">
              <span className="text-emerald-500">✓</span>
              {city}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-isp-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-isp-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
        <dl className="divide-y divide-zinc-100">
          {FAQS.map((item, i) => (
            <div key={item.question} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <details className="group py-4" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm" itemProp="name">
                  <span className="text-sm font-semibold text-zinc-900 sm:text-base leading-snug">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="mt-3 pr-7">
                  <p itemProp="text" className="text-sm leading-relaxed text-zinc-600">{item.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes ou agendar visita</h2>
        <p className="mt-2 text-sm text-zinc-600">Atendemos famílias de todo o interior de SP — pessoalmente ou com entrega.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver filhotes disponíveis
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar no WhatsApp
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Lulu da Pomerânia em Bragança Paulista", href: "/lulu-da-pomerania-braganca-paulista", desc: "Localização, visitas e como chegar" },
        { label: "Spitz Alemão Anão — A Raça",            href: "/spitz-alemao",                        desc: "Características, temperamento e cuidados" },
        { label: "Ver Filhotes Disponíveis",              href: "/filhotes",                            desc: "Catálogo atualizado com fotos e valores" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Canil Spitz Alemão — Interior SP</li>
        </ol>
      </nav>
    </main>
  );
}
