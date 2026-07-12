import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/lulu-da-pomerania`;
const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: "Lulu da Pomerânia — Raça, Preço, Cuidados e Filhotes | By Império Dog",
  description:
    `Guia completo sobre o Lulu da Pomerânia (Spitz Alemão Anão): características, personalidade, preços em ${CURRENT_YEAR}, cuidados, cores e onde comprar com segurança. Criadora responsável em Bragança Paulista, SP.`,
  keywords: [
    "Lulu da Pomerânia",
    "Lulu da Pomerânia preço",
    "Lulu da Pomerânia filhotes",
    "Lulu da Pomerânia cuidados",
    "Lulu da Pomerânia características",
    "comprar Lulu da Pomerânia",
    "Lulu da Pomerânia SP",
  ],
  alternates: { canonical: "/lulu-da-pomerania" },
  openGraph: {
    title: "Lulu da Pomerânia — Guia Completo da Raça | By Império Dog",
    description: "Características, preços, cuidados e onde comprar Lulu da Pomerânia com segurança.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "Lulu da Pomerânia e Spitz Alemão Anão são a mesma raça?",
    answer:
      "Sim, são nomes para exatamente o mesmo cão. 'Lulu da Pomerânia' é o apelido popular no Brasil; 'Spitz Alemão Anão' é a denominação oficial reconhecida pela FCI. Em inglês, a raça é chamada 'Pomeranian'. Qualquer uma dessas buscas refere-se ao mesmo animal fofo, compacto e de pelagem densa.",
  },
  {
    question: "Quanto custa um Lulu da Pomerânia?",
    answer:
      "Na By Império Dog, os preços variam de R$ 7.000 a R$ 15.000 dependendo da cor e do sexo. Machos a partir de R$ 7.000 (laranja) e fêmeas a partir de R$ 10.000. O valor inclui registro oficial, laudos veterinários, vacinação completa, microchip e mentoria vitalícia — sem cobranças extras.",
  },
  {
    question: "O Lulu da Pomerânia é bom com crianças?",
    answer:
      "Sim, desde que a interação seja supervisionada e a socialização seja feita corretamente desde filhote. O Lulu da Pomerânia é afetivo e brincalhão, mas por ser de porte muito pequeno, crianças muito novas podem machucar o animal sem querer. Recomendamos famílias com crianças acima de 6 anos.",
  },
  {
    question: "Lulu da Pomerânia perde muito pelo?",
    answer:
      "Sim. A pelagem dupla e densa solta pelos, especialmente em duas épocas de muda por ano. Escovação frequente (3–4× por semana) reduz significativamente a quantidade de pelos pelo apartamento ou casa.",
  },
  {
    question: "Qual a expectativa de vida do Lulu da Pomerânia?",
    answer:
      "Entre 12 e 16 anos. Raças pequenas geralmente vivem mais do que raças grandes. Com criação responsável (sem problemas genéticos hereditários), alimentação adequada e acompanhamento veterinário regular, muitos chegam ao meio da faixa ou além.",
  },
  {
    question: "O Lulu da Pomerânia precisa de banho frequente?",
    answer:
      "A cada 15–21 dias é o ideal. A pelagem densa pode reter odores e sujeira se o intervalo for muito longo. A secagem completa após o banho é obrigatória — pelo úmido por horas favorece fungos e dermatites.",
  },
];

export default function LuluDaPomeraniaPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi a página sobre Lulu da Pomerânia no site da By Império Dog e gostaria de informações sobre filhotes.")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Lulu da Pomerânia", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-lulu-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-lulu-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-lulu-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-lulu-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="ld-breed-synonyms"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "about": {
          "@type": "Thing",
          "name": "Spitz Alemão Anão",
          "alternateName": ["Lulu da Pomerânia", "Pomeranian", "Pomerânio", "Spitz Alemão", "Spitz Anão", "Mini Spitz"],
          "description": "Raça de cão de pequeno porte originária da Pomerânia, conhecido como Lulu da Pomerânia no Brasil e Pomeranian em inglês.",
          "sameAs": "https://www.fci.be/en/nomenclature/SPITZ-ALLEMAND-NAIN-97.html"
        }
      }) }} />

      {/* HERO */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Guia completo da raça</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Lulu da Pomerânia — tudo que você precisa saber
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O Lulu da Pomerânia é um dos cães de companhia mais amados do Brasil — pequeno, fofo, inteligente e cheio de personalidade. Aqui você encontra tudo: o que é a raça, quanto custa, como cuidar e onde encontrar filhotes com procedência.
        </p>
      </header>

      {/* Três nomes */}
      <section aria-labelledby="nomes-lulu-heading" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
        <h2 id="nomes-lulu-heading" className="text-base font-bold text-emerald-900">
          Lulu da Pomerânia, Spitz Alemão Anão e Pomeranian — são o mesmo cão
        </h2>
        <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
          O <strong>Lulu da Pomerânia</strong> é o nome mais popular no Brasil para esta raça. Oficialmente, pela FCI, a raça se chama <strong>Spitz Alemão Anão</strong>. No mundo inteiro é conhecido como <strong>Pomeranian</strong> (em inglês). Outros nomes usados: <em>Spitz Anão</em>, <em>Mini Spitz</em>, <em>Pomerânio</em>. Todos referem-se ao mesmo cão compacto, fofo e cheio de personalidade.
        </p>
      </section>

      {/* O que é */}
      <section aria-labelledby="oque-heading" className="space-y-3">
        <h2 id="oque-heading" className="text-2xl font-bold text-zinc-900">O que é o Lulu da Pomerânia?</h2>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          O Lulu da Pomerânia é o nome popular no Brasil para o <strong>Spitz Alemão Anão</strong> — uma raça de pequeno porte originária da região da Pomerânia (atual norte da Alemanha e Polônia). No mundo, é conhecido como <strong>Pomeranian</strong>. Todos esses nomes se referem ao mesmo cão compacto, com pelagem dupla densa, orelhas eretas pontudas e rabo enrolado sobre o dorso.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          Pesa entre 1,5 e 3,5 kg na fase adulta e atinge no máximo 22 cm de altura na cernelha. Apesar do tamanho diminuto, tem <em>personalidade gigante</em>: é curioso, expressivo, adora atenção e aprende comandos com facilidade.
        </p>
      </section>

      {/* Personalidade */}
      <section aria-labelledby="personalidade-heading" className="space-y-4">
        <h2 id="personalidade-heading" className="text-2xl font-bold text-zinc-900">Personalidade e comportamento</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "🧠", t: "Muito inteligente", b: "Aprende comandos rápido. Ideal para treino positivo." },
            { emoji: "💛", t: "Afetivo", b: "Cria laços fortes com a família. Gosta de colo e atenção." },
            { emoji: "🏠", t: "Ótimo para apto", b: "Adapta-se muito bem a apartamentos com espaço limitado." },
            { emoji: "🎭", t: "Expressivo", b: "Demonstra humor, alegria e curiosidade visivelmente." },
            { emoji: "🔔", t: "Alerta", b: "Bom 'vigia' natural. Avisa sobre movimentos externos." },
            { emoji: "👶", t: "Sociável", b: "Quando bem socializado, convive bem com crianças e outros pets." },
          ].map((card) => (
            <article key={card.t} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <span className="text-2xl">{card.emoji}</span>
              <h3 className="mt-2 text-sm font-semibold text-zinc-900">{card.t}</h3>
              <p className="mt-1 text-xs text-zinc-500">{card.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section aria-labelledby="precos-heading" className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-8 space-y-4">
        <h2 id="precos-heading" className="text-2xl font-bold text-zinc-900">Quanto custa um Lulu da Pomerânia?</h2>
        <p className="text-sm text-zinc-700">
          Na By Império Dog os preços são:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { cor: "Laranja Macho",    valor: "R$ 7.000", tag: "a partir de" },
            { cor: "Laranja Fêmea",    valor: "R$ 10.000", tag: "a partir de" },
            { cor: "Wolf Sable Macho", valor: "R$ 7.500", tag: "a partir de" },
            { cor: "Creme Fêmea",      valor: "R$ 15.000", tag: "mais valorizado" },
          ].map((p) => (
            <div key={p.cor} className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">{p.tag}</p>
              <p className="text-xl font-bold text-emerald-700">{p.valor}</p>
              <p className="text-sm text-zinc-600">{p.cor}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">Inclui registro oficial, laudos, vacinação, microchip e mentoria vitalícia. <Link href="/preco-spitz-anao" className="underline hover:text-emerald-700">Ver tabela completa →</Link></p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-lulu-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-lulu-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes sobre o Lulu da Pomerânia</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Pronto para conhecer os filhotes?</h2>
        <p className="mt-2 text-sm text-zinc-600">Acesse o catálogo atualizado ou fale com a criadora diretamente.</p>
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
        { label: "Spitz Alemão Anão",       href: "/spitz-alemao",         desc: "Ficha técnica, origem e temperamento" },
        { label: "Tabela de Preços 2025",   href: "/preco-spitz-anao",     desc: "Valores por cor e sexo em detalhe" },
        { label: "Como Comprar com Segurança", href: "/comprar-spitz-anao", desc: "Guia passo a passo para não cair em golpes" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Lulu da Pomerânia</li>
        </ol>
      </nav>
    </main>
  );
}
