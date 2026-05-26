import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/spitz-alemao-baby-face`;

export const metadata: Metadata = {
  title: "Spitz Alemão Baby Face — O que é, Características e Preço | By Império Dog",
  description:
    "O Spitz Alemão Baby Face tem focinho mais curto e aparência infantil. Saiba o que é, se é reconhecido pela FCI, preço, cuidados especiais e como encontrar filhotes legítimos.",
  keywords: [
    "Spitz Alemão Baby Face",
    "Lulu da Pomerânia Baby Face",
    "Spitz Baby Face o que é",
    "Spitz Alemão focinho curto",
    "Pomeranian Baby Face",
    "Spitz Alemão Baby Face preço",
  ],
  alternates: { canonical: "/spitz-alemao-baby-face" },
  openGraph: {
    title: "Spitz Alemão Baby Face — O que é e Como Identificar | By Império Dog",
    description: "O que é o Baby Face, por que não é reconhecido pela FCI, cuidados especiais e preço.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "O que é o Spitz Alemão Baby Face?",
    answer:
      "O 'Baby Face' é um tipo de Spitz Alemão Anão com focinho visivelmente mais curto e achatado, olhos maiores e aparência facial mais infantil ('cara de bebê'). Não é uma raça separada — é uma variação fenotípica dentro do Spitz Alemão Anão. Em inglês, também chamado de 'Extreme Bear Face' ou 'Teddy Face'.",
  },
  {
    question: "O Baby Face é reconhecido pela FCI?",
    answer:
      "Não. O padrão oficial da FCI prevê focinho proporcional ao crânio, com perfil de 'raposa'. O Baby Face com focinho muito curto foge do padrão oficial e cães com essa conformação não devem ser usados para reprodução por criadores responsáveis registrados. A demanda é alta por conta do apelo estético, mas a conformação achatada pode causar problemas respiratórios (BOAS).",
  },
  {
    question: "O Spitz Alemão Baby Face tem problemas de saúde?",
    answer:
      "Sim, existe risco aumentado de Síndrome Obstrutiva das Vias Aéreas Braquicefálicas (BOAS) — problemas respiratórios decorrentes da compressão das estruturas do focinho. Cães com focinho muito curto podem roncar, ter dificuldade de respirar em exercício e calor. Criadores responsáveis não priorizam o Baby Face excessivo exatamente por esses riscos.",
  },
  {
    question: "O Baby Face é mais caro?",
    answer:
      "Alguns criadores cobram mais pelo apelo estético. Porém, a By Império Dog não seleciona reprodutores com base em conformação achatada extrema — priorizamos saúde, temperamento e padrão FCI. Nossos filhotes têm o perfil 'foxface' saudável, com faces arredondadas naturais que vêm da linha genética, sem exageros estruturais.",
  },
  {
    question: "Como identificar um Baby Face legítimo vs marketing enganoso?",
    answer:
      "Muitos criadores usam o termo 'Baby Face' como argumento de venda sem critério técnico. Um critério básico: o focinho deve ser pelo menos 1/3 do comprimento do crânio. Crânios com focinho menor que isso indicam braquicefalia estrutural e risco de saúde. Sempre exija laudo veterinário e observe se o filhote respira normalmente sem esforço.",
  },
];

export default function SpitzAlemaobabyFacePage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi a página sobre Spitz Alemão Baby Face no site da By Império Dog. Pode me dar mais informações sobre os filhotes disponíveis?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Spitz Alemão Baby Face", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-bf-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-bf-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-bf-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-bf-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Entenda antes de comprar</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Spitz Alemão Baby Face — o que é, riscos e o que saber antes de comprar
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O termo "Baby Face" virou marketing popular no mercado de Spitz Alemão Anão. Mas o que significa de verdade, quais os riscos de saúde envolvidos e o que buscar para ter um cão bonito <em>e</em> saudável?
        </p>
      </header>

      {/* O que é */}
      <section aria-labelledby="oque-bf-heading" className="space-y-4">
        <h2 id="oque-bf-heading" className="text-2xl font-bold text-zinc-900">O que é o Baby Face?</h2>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          O "Baby Face" ou "Bear Face" refere-se a Spitz Alemão Anão com focinho mais curto que o padrão oficial, criando uma aparência facial mais arredondada e "infantil". Surgiu como tendência estética — especialmente no Japão — e se popularizou nas redes sociais pelo visual fofo exagerado.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          Importante: <strong>não é uma variedade racial reconhecida</strong> pela FCI. O padrão oficial prevê focinho de "raposa" (foxface), proporcional ao crânio. Cães com conformação achatada demais fogem do padrão e têm maior predisposição a problemas respiratórios.
        </p>
      </section>

      {/* Saúde */}
      <section aria-labelledby="saude-bf-heading" className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 sm:p-8 space-y-4">
        <h2 id="saude-bf-heading" className="text-xl font-bold text-zinc-900">⚠️ Cuidados de saúde importantes</h2>
        <p className="text-sm text-zinc-700">
          Cães com braquicefalia estrutural (focinho muito curto) podem desenvolver <strong>BOAS — Síndrome Obstrutiva das Vias Aéreas Braquicefálicas</strong>:
        </p>
        <ul className="space-y-2 text-sm text-zinc-700">
          {[
            "Ronco e respiração ruidosa em repouso",
            "Dificuldade para respirar durante exercícios",
            "Intolerância ao calor (risco de golpe de calor)",
            "Regurgitação frequente",
            "Em casos graves, necessidade de cirurgia corretiva",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-600">⚠</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500">
          A By Império Dog prioriza saúde e padrão racial. Nossos filhotes têm conformação facial saudável com aparência naturalmente arredondada sem os riscos da braquicefalia extrema.
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-bf-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-bf-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes sobre Baby Face</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes saudáveis da By Império Dog</h2>
        <p className="mt-2 text-sm text-zinc-600">Filhotes com aparência naturalmente arredondada, saúde documentada e criação responsável.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver catálogo de filhotes
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar com a criadora
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Spitz Alemão Anão — Raça Completa", href: "/spitz-alemao",             desc: "Padrão oficial, temperamento e cuidados" },
        { label: "Filhote de Spitz Alemão",           href: "/filhote-de-spitz-alemao",  desc: "Como escolher um filhote saudável" },
        { label: "Criador Confiável — Como Identificar", href: "/criador-spitz-confiavel", desc: "O que exigir antes de comprar" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Spitz Alemão Baby Face</li>
        </ol>
      </nav>
    </main>
  );
}
