import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/spitz-alemao`;

export const metadata: Metadata = {
  title: "Spitz Alemão Anão — Raça, Características, Preço e Cuidados | By Império Dog",
  description:
    "Tudo sobre o Spitz Alemão Anão: origem, características, temperamento, cores, tamanho adulto, cuidados com pelagem e preço. Criadora especializada em Bragança Paulista, SP, desde 2012.",
  keywords: [
    "Spitz Alemão Anão",
    "Spitz Alemão características",
    "Spitz Alemão temperamento",
    "Spitz Alemão tamanho",
    "raça Spitz Alemão Anão",
    "Spitz Alemão bom para apartamento",
    "Spitz Alemão pelagem",
  ],
  alternates: { canonical: "/spitz-alemao" },
  openGraph: {
    title: "Spitz Alemão Anão — Tudo Sobre a Raça | By Império Dog",
    description: "Origem, características, temperamento, cores, cuidados e preços do Spitz Alemão Anão.",
    type: "article",
  },
};

const CHARACTERISTICS = [
  { label: "Altura adulta",    value: "até 22 cm" },
  { label: "Peso adulto",      value: "1,5 – 3,5 kg" },
  { label: "Expectativa de vida", value: "12 – 16 anos" },
  { label: "Pelagem",          value: "Dupla, densa, fluffy" },
  { label: "Cores reconhecidas", value: "Creme, Laranja, Preto, Wolf Sable" },
  { label: "Origem",           value: "Pomerânia (Alemanha/Polônia)" },
  { label: "Registro oficial", value: "CBKC / FCI — Grupo V" },
  { label: "Apartamento",      value: "Excelente adaptação" },
];

const FAQS = [
  {
    question: "O Spitz Alemão Anão é bom para apartamento?",
    answer:
      "Sim, é uma das raças mais adaptadas à vida em apartamento. Com até 22 cm de altura, o Spitz Alemão Anão ocupa pouco espaço, não precisa de grandes áreas para se exercitar e adapta-se bem à rotina de apartamento desde que tenha passeios diários e estimulação mental.",
  },
  {
    question: "Quanto tempo de vida tem o Spitz Alemão Anão?",
    answer:
      "O Spitz Alemão Anão tem expectativa de vida de 12 a 16 anos, o que é alta para cães de pequeno porte. Com alimentação adequada, acompanhamento veterinário regular e criação responsável (sem problemas genéticos), muitos chegam aos 15 anos.",
  },
  {
    question: "O Spitz Alemão late muito?",
    answer:
      "O Spitz Alemão Anão tem instinto de alerta — tende a latir para estímulos externos. Porém, com socialização adequada desde filhote (como fazemos na By Império Dog), o latido excessivo é muito reduzido. Filhotes criados em ambiente familiar e com estimulação correta têm comportamento tranquilo.",
  },
  {
    question: "Quais são as cores do Spitz Alemão Anão?",
    answer:
      "As cores reconhecidas pela CBKC e FCI são: Laranja (a mais icônica), Creme (a mais valorizada), Preto (rara no Brasil) e Wolf Sable (padrão exótico com pelos tricolores). Cada cor tem particularidades no preço e na disponibilidade.",
  },
  {
    question: "O Spitz Alemão Anão é hipoalergênico?",
    answer:
      "Não. O Spitz Alemão Anão tem pelagem densa e dupla, e solta pelos — especialmente em épocas de muda. Não é indicado para pessoas com alergias graves a pelos de cachorro. A escovação frequente (3–4 vezes por semana) minimiza a dispersão de pelos pelo ambiente.",
  },
  {
    question: "Qual a diferença entre Spitz Alemão e Lulu da Pomerânia?",
    answer:
      "São nomes para a mesma raça. 'Lulu da Pomerânia' é o nome popular no Brasil; 'Spitz Alemão Anão' é a denominação oficial da CBKC e FCI. Em inglês, a raça é chamada de 'Pomeranian'.",
  },
];

export default function SpitzAlemaoPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi a página sobre Spitz Alemão Anão e gostaria de saber mais sobre filhotes disponíveis.")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Spitz Alemão Anão", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-spitz-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-spitz-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-spitz-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-spitz-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      {/* HERO */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Raça completa</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Spitz Alemão Anão — tudo sobre a raça
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O Spitz Alemão Anão (também chamado de Lulu da Pomerânia ou Pomeranian) é uma das raças de cães de pequeno porte mais procuradas do Brasil. Nesta página você encontra tudo: origem, características, temperamento, cuidados e o que esperar da criação responsável.
        </p>
      </header>

      {/* Ficha técnica */}
      <section aria-labelledby="ficha-heading">
        <h2 id="ficha-heading" className="mb-4 text-2xl font-bold text-zinc-900">Ficha técnica da raça</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
          <table className="w-full text-sm">
            <tbody>
              {CHARACTERISTICS.map((c, i) => (
                <tr key={c.label} className={`border-b border-zinc-100 ${i % 2 === 0 ? "bg-white" : "bg-zinc-50/60"}`}>
                  <td className="px-4 py-3 font-semibold text-zinc-600 w-2/5">{c.label}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Origem */}
      <section aria-labelledby="origem-heading" className="space-y-3">
        <h2 id="origem-heading" className="text-2xl font-bold text-zinc-900">Origem do Spitz Alemão Anão</h2>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          O Spitz Alemão Anão descende dos <strong>Spitz nórdicos</strong>, cães utilizados como pastores e companheiros na região da Pomerânia (atual fronteira entre Alemanha e Polônia). No século XIX, a raça foi refinada na Inglaterra, onde a Rainha Vitória criou exemplares — o que contribuiu para a redução do porte para o que conhecemos hoje como "Anão". O nome popular "Lulu da Pomerânia" vem exatamente desta região histórica.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          Hoje, a raça é reconhecida pela <strong>FCI (Fédération Cynologique Internationale)</strong> como Spitz Alemão Anão e pela <strong>CBKC (Confederação Brasileira de Cinofilia)</strong> no Brasil, sendo criada e registrada com padrão racial definido — pelagem, estrutura, temperamento e cores reconhecidas.
        </p>
      </section>

      {/* Temperamento */}
      <section aria-labelledby="temperamento-heading" className="space-y-4">
        <h2 id="temperamento-heading" className="text-2xl font-bold text-zinc-900">Temperamento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Alegre e extrovertido", body: "O Spitz Alemão Anão tem personalidade forte e expressiva. É comunicativo, gosta de interação com pessoas e não é um cão indiferente — demonstra afeto ativamente." },
            { title: "Inteligente e treinável", body: "Aprende comandos rapidamente. Responde muito bem ao treino positivo e consegue aprender truques complexos, o que o torna estimulante de se treinar." },
            { title: "Alerta e curioso", body: "Tem instinto de alerta herdado dos ancestrais. Presta atenção em tudo ao redor — sons, movimentos, novidades. Com socialização, não se torna ansioso." },
            { title: "Vínculo forte com a família", body: "Cria laços profundos com seu núcleo familiar. Tende a preferir um ou dois membros da família, mas é afetuoso com todos." },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Cuidados */}
      <section aria-labelledby="cuidados-heading" className="space-y-4">
        <h2 id="cuidados-heading" className="text-2xl font-bold text-zinc-900">Cuidados essenciais</h2>
        <ul className="space-y-3">
          {[
            { t: "Escovação", b: "Pelo menos 3–4 vezes por semana. Evita nós, controla a muda e mantém a pelagem fluffy saudável. Em época de muda (2× ao ano), aumente para diário." },
            { t: "Banho", b: "A cada 15–21 dias, com shampoo específico para pelagem dupla. Secagem completa é obrigatória — pelo úmido favorece fungos." },
            { t: "Alimentação", b: "Ração premium para raças pequenas ou miniaturas, com ajuste por fase de vida (filhote, adulto, sênior). A By Império Dog fornece plano alimentar personalizado." },
            { t: "Exercício", b: "2 passeios curtos por dia (15–20 min cada) são suficientes. Não suporta calor intenso — evite saídas no pico do calor." },
            { t: "Dentes", b: "Raças pequenas são propensas a tartaro. Escovação 2–3× por semana + petiscos dentais. Consulta veterinária anual para limpeza profissional." },
            { t: "Veterinário", b: "Consulta anual de rotina, vacinação em dia (V8/V10 + antirrábica) e exame cardiológico a partir dos 3 anos (raça com predisposição a sopro cardíaco)." },
          ].map((item) => (
            <li key={item.t} className="flex items-start gap-3">
              <span className="mt-0.5 flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{item.t}</span>
              <p className="text-sm text-zinc-700">{item.b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Cores */}
      <section aria-labelledby="cores-heading" className="space-y-4">
        <h2 id="cores-heading" className="text-2xl font-bold text-zinc-900">Cores reconhecidas pela CBKC</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { cor: "Laranja",    slug: "laranja",    desc: "A cor mais icônica e tradicional da raça. Tonalidades que vão do dourado ao alaranjado intenso." },
            { cor: "Creme",      slug: "creme",      desc: "A mais valorizada. Pelagem cor de marfim com contraste de olhos e focinho escuros." },
            { cor: "Preto",      slug: "preto",      desc: "Cor rara com poucos criadores especializados no Brasil. Pelagem preta brilhante uniforme." },
            { cor: "Wolf Sable", slug: "wolf-sable", desc: "Padrão exótico com pelos tricolores (ponta escura, corpo acinzentado) — reconhecido pela FCI." },
          ].map((c) => (
            <Link
              key={c.cor}
              href={`/filhotes/cor/${c.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">{c.cor}</h3>
              <p className="mt-1.5 text-xs text-zinc-500">{c.desc}</p>
              <span className="mt-2 inline-block text-xs font-medium text-emerald-700">Ver filhotes →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-spitz-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-spitz-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes de Spitz Alemão Anão disponíveis</h2>
        <p className="mt-2 text-sm text-zinc-600">Catálogo atualizado com fotos, sexo, cor e valor de cada filhote.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver catálogo
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar com a criadora
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Lulu da Pomerânia",         href: "/lulu-da-pomerania",        desc: "Guia completo + preços 2025" },
        { label: "Filhote de Spitz Alemão",   href: "/filhote-de-spitz-alemao",  desc: "Como escolher e cuidar do filhote" },
        { label: "Tabela de Preços",          href: "/preco-spitz-anao",         desc: "Valores por cor e sexo — 2025" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Spitz Alemão Anão</li>
        </ol>
      </nav>
    </main>
  );
}
