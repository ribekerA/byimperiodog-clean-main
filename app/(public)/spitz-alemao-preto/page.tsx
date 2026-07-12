import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/spitz-alemao-preto`;

export const metadata: Metadata = {
  title: "Spitz Alemão Preto — Raça Rara, Preço e Filhotes | By Império Dog",
  description:
    "O Spitz Alemão Anão Preto é uma das cores mais raras da raça no Brasil. Saiba por que é raro, qual o preço, o que exigir de um criador e como encontrar filhotes com registro oficial. Criadora em Bragança Paulista, SP.",
  keywords: [
    "Spitz Alemão preto",
    "Lulu da Pomerânia preto",
    "Spitz Alemão preto raro",
    "Spitz Alemão preto preço",
    "filhote Spitz Alemão preto com documentação",
    "Spitz Alemão preto SP",
    "Pomeranian",
    "Pomeranian Brasil",
  ],
  alternates: { canonical: "/spitz-alemao-preto" },
  openGraph: {
    title: "Spitz Alemão Anão Preto — Cor Rara | By Império Dog",
    description: "Por que o Spitz Alemão preto é raro? Preço, disponibilidade e como garantir um filhote com registro oficial.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "Por que o Spitz Alemão Anão preto é considerado raro?",
    answer:
      "O preto é considerado raro porque produzir uma pelagem preta uniforme e brilhante com padrão racial correto exige matrizes e padreadores específicos — e poucos criadores brasileiros têm linhagem preta consolidada. Além disso, a genética da cor preta é recessiva em algumas combinações, o que reduz a probabilidade por ninhada.",
  },
  {
    question: "Qual o preço do Spitz Alemão Anão preto?",
    answer:
      "Na By Império Dog, o Spitz Alemão preto custa R$ 8.000 (machos) e R$ 13.000 (fêmeas). Por ser uma cor rara, o preço é superior ao laranja e ao wolf sable, mas abaixo do creme. Todos incluem registro oficial, laudos veterinários, vacinação completa, microchip e mentoria vitalícia.",
  },
  {
    question: "Como saber se o Spitz Alemão preto tem registro oficial legítimo?",
    answer:
      "Exija o número de registro do registro oficial e confirme com o criador. Um registro legítimo tem número verificável, nome dos pais e avós, e dados do criador. Desconfie de 'documentação em andamento' ou documentos não verificáveis.",
  },
  {
    question: "O Spitz Alemão preto muda de cor com o tempo?",
    answer:
      "Sim, é possível. Filhotes de Spitz Alemão preto podem clarear levemente com o crescimento — tornando-se preto com nuances de cinza (chamado 'sable'). Criadores responsáveis conseguem prever com mais precisão pelo histórico da linhagem, mas pequenas variações são normais.",
  },
  {
    question: "Tem disponibilidade de Spitz Alemão preto no Brasil?",
    answer:
      "A disponibilidade é limitada em comparação com o laranja e o creme. A By Império Dog trabalha com matrizes na cor preta e tem ninhadas periódicas. O ideal é entrar em contato para verificar a agenda atual e, se necessário, entrar em lista de interesse para a próxima ninhada.",
  },
];

export default function SpitzAlemaoPretoPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi a página sobre Spitz Alemão Preto no site da By Império Dog. Pode me informar disponibilidade de filhotes?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: "Spitz Alemão Preto", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-preto-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-preto-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-preto-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-preto-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Cor rara — disponibilidade limitada</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Spitz Alemão Anão Preto — a cor mais rara da raça
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O Spitz Alemão Anão na cor preta é o mais difícil de encontrar com registro oficial no Brasil. Poucos criadores especializados trabalham com esta linhagem — e a By Império Dog é um deles.
        </p>
      </header>

      {/* Por que é raro */}
      <section aria-labelledby="raridade-heading" className="space-y-4">
        <h2 id="raridade-heading" className="text-2xl font-bold text-zinc-900">Por que o Spitz Alemão preto é tão raro?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Genética complexa", b: "A cor preta uniforme exige linhagem específica. É geneticamente recessiva em muitas combinações, reduzindo a frequência por ninhada." },
            { t: "Poucos criadores", b: "No Brasil, a maioria dos criadores foca em laranja e creme, que têm maior demanda. Criadores especializados em preto são escassos." },
            { t: "Padrão rigoroso", b: "Um preto verdadeiro deve ser uniforme, brilhante e sem manchas. Qualquer desvio desclassifica o cão para exposição." },
          ].map((c) => (
            <article key={c.t} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">{c.t}</h3>
              <p className="mt-2 text-sm text-zinc-600">{c.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Preço */}
      <section aria-labelledby="preco-preto-heading" className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8 space-y-4">
        <h2 id="preco-preto-heading" className="text-xl font-bold text-zinc-900">Preço do Spitz Alemão Anão Preto — By Império Dog</h2>
        <div className="flex flex-wrap gap-4">
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 min-w-[160px] text-center shadow-sm">
            <p className="text-xs text-zinc-400 uppercase">Macho</p>
            <p className="text-2xl font-bold text-zinc-900">R$ 8.000</p>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 min-w-[160px] text-center shadow-sm">
            <p className="text-xs text-zinc-400 uppercase">Fêmea</p>
            <p className="text-2xl font-bold text-zinc-900">R$ 13.000</p>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm text-zinc-700">
          {["Registro oficial", "Laudo de saúde", "Teste de patela", "Vacinação completa", "Microchip", "Nota fiscal", "Mentoria vitalícia"].map((i) => (
            <li key={i} className="flex items-center gap-2"><span className="text-emerald-600">✓</span>{i}</li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-preto-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-preto-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Verificar disponibilidade de Spitz Alemão preto</h2>
        <p className="mt-2 text-sm text-zinc-600">A disponibilidade é limitada. Consulte a agenda de ninhadas ou entre na lista de interesse.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes/cor/preto" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver filhotes pretos disponíveis
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Entrar na lista de interesse
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Spitz Alemão Anão — Raça Completa", href: "/spitz-alemao",     desc: "Todas as cores, temperamento e cuidados" },
        { label: `Tabela de Preços ${new Date().getFullYear()}`,            href: "/preco-spitz-anao",  desc: "Comparativo de preços por cor e sexo" },
        { label: "Como Comprar com Segurança",       href: "/comprar-spitz-anao", desc: "Evite golpes — guia passo a passo" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/filhotes" className="hover:text-emerald-700">Filhotes</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Spitz Alemão Preto</li>
        </ol>
      </nav>
    </main>
  );
}
