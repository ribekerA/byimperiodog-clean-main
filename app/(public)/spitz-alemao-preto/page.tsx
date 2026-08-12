import Link from "next/link";
import type { Metadata } from "next";

import { RelatedPages } from "@/components/common/RelatedPages";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/spitz-alemao-preto`;

export const metadata: Metadata = {
  title: "Spitz Alemão Preto — Preço, Disponibilidade e Filhotes",
  description:
    // 215 caracteres. Reescrita em 157.
    "O Spitz Alemão Anão Preto é a cor de menor disponibilidade nas ninhadas da By Império Dog. Veja preço, o que exigir do criador e filhotes com registro oficial.",
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
    images: [OG_DEFAULT_IMAGE],
    title: "Spitz Alemão Anão Preto — Preço e Disponibilidade | By Império Dog",
    description: "Por que o Spitz Alemão preto é difícil de encontrar? Preço, disponibilidade e como garantir um filhote com registro oficial.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "Por que o Spitz Alemão Anão preto é difícil de encontrar?",
    answer:
      "Produzir uma pelagem preta uniforme e brilhante dentro do padrão racial exige matrizes e padreadores específicos, e nem toda ninhada traz filhotes pretos com essa uniformidade. Por isso a disponibilidade do preto na By Império Dog é menor ao longo do ano do que a do laranja.",
  },
  {
    question: "Qual o preço do Spitz Alemão Anão preto?",
    answer:
      "Na By Império Dog, o Spitz Alemão preto custa R$ 7.500 (machos) e R$ 8.500 (fêmeas). Pela menor disponibilidade, o preço do macho é superior ao laranja e ao cinza-lobo (wolf sable), no mesmo patamar do creme. A fêmea custa o mesmo valor em todas as cores. Todos incluem registro oficial, laudos veterinários, protocolo vacinal em dia conforme a idade do filhote e mentoria vitalícia. O microchip é opcional, sob contratação.",
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
      <script id="ld-preto-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-preto-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-preto-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script id="ld-preto-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Disponibilidade limitada</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Spitz Alemão Anão Preto — por que é difícil de encontrar
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O Spitz Alemão Anão na cor preta aparece com menos frequência nas ninhadas da By Império Dog do que o laranja. Quando há filhote preto disponível, ele sai com registro oficial e a mesma documentação das demais cores.
        </p>
      </header>

      {/* Por que é raro */}
      <section aria-labelledby="raridade-heading" className="space-y-4">
        <h2 id="raridade-heading" className="text-2xl font-bold text-zinc-900">Por que o Spitz Alemão preto aparece com menos frequência?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Linhagem específica", b: "A cor preta uniforme depende das matrizes e dos padreadores usados no acasalamento — não é um resultado que se obtenha em qualquer combinação." },
            { t: "Disponibilidade menor", b: "Na By Império Dog, as ninhadas com filhotes pretos dentro do padrão são menos frequentes do que as de laranja — por isso a agenda do preto costuma abrir com menos regularidade." },
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
            <p className="text-2xl font-bold text-zinc-900">R$ 7.500</p>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 min-w-[160px] text-center shadow-sm">
            <p className="text-xs text-zinc-400 uppercase">Fêmea</p>
            <p className="text-2xl font-bold text-zinc-900">R$ 8.500</p>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm text-zinc-700">
          {["Registro oficial", "Laudo de saúde", "Hemograma", "Protocolo vacinal em dia", "Microchip (opcional, sob contratação)", "Contrato", "Mentoria vitalícia"].map((i) => (
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
        { label: "Tabela de Preços",                                        href: "/preco-spitz-anao",  desc: "Comparativo de preços por cor e sexo" },
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
