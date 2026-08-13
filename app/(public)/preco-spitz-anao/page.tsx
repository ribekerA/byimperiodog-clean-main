import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD, buildFAQPageLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildLocalBusinessLD } from "@/lib/structured-data";
import { whatsappLeadUrl } from "@/lib/utm";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/preco-spitz-anao`;

export const metadata: Metadata = {
  title: "Preço do Spitz Alemão Anão — Tabela Atualizada",
  description:
    // 250 caracteres: o Google mostra ~160 e cortava antes de "por que o valor
    // varia", que é justamente a intenção de busca da página. Reescrita em 156.
    "Tabela de preços do Spitz Alemão Anão (Lulu da Pomerânia) por cor e sexo: Creme, Laranja, Preto e Cinza-Lobo. Veja o que está incluso e por que o valor varia.",
  keywords: [
    "preço Spitz Alemão Anão",
    "quanto custa Lulu da Pomerânia",
    "preço filhote Spitz Alemão",
    "Spitz Alemão Anão creme valor",
    "Lulu da Pomerânia preço fêmea macho",
    "custo Spitz Alemão com registro oficial",
    "por que Spitz Alemão é caro",
    "Pomeranian",
    "Pomeranian Brasil",
  ],
  alternates: { canonical: "/preco-spitz-anao" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Tabela de Preços Atualizada do Spitz Alemão Anão | By Império Dog",
    description:
      "Machos de R$ 6.500 a R$ 7.500 e fêmeas R$ 8.500 (valor único para todas as cores) — inclui registro oficial, laudos veterinários e mentoria vitalícia.",
    type: "article",
  },
};

const PRICE_TABLE = [
  { color: "Laranja",                    male: "R$ 6.500", female: "R$ 8.500", note: "A cor mais icônica da raça" },
  { color: "Cinza-Lobo (Wolf Sable)",    male: "R$ 6.500", female: "R$ 8.500", note: "Bicolor reconhecida pela FCI" },
  { color: "Preto",                      male: "R$ 7.500", female: "R$ 8.500", note: "Faixa superior entre os machos" },
  { color: "Creme",                      male: "R$ 7.500", female: "R$ 8.500", note: "Faixa superior entre os machos" },
] as const;

const INCLUDED_ITEMS = [
  "Registro oficial e legalizado",
  "Laudo de saúde veterinário",
  "Hemograma",
  "Carteira de vacinação assinada pelo médico-veterinário, com protocolo em dia conforme a idade",
  "Histórico de vermifugação",
  "Microchip (opcional, sob contratação)",
  "Contrato de responsabilidade compartilhada",
  "Mentoria vitalícia direta com a criadora",
] as const;

const PAGE_FAQS = [
  {
    question: "Quanto custa um Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      "Na By Império Dog, os filhotes de Spitz Alemão Anão custam entre R$ 6.500 e R$ 8.500. Machos variam de R$ 6.500 (laranja e cinza-lobo) a R$ 7.500 (creme e preto). Fêmeas custam R$ 8.500, valor único para todas as cores, por conta da maior demanda. Todos os valores incluem registro oficial, laudo de saúde, protocolo vacinal em dia conforme a idade do filhote e mentoria vitalícia. O microchip é opcional, sob contratação.",
  },
  {
    question: "Por que o Spitz Alemão Anão é tão caro?",
    answer:
      // "maternidade monitorada" saiu da lista: nao existe estrutura desse tipo
      // aqui. O resto da resposta continua valendo.
      "O custo elevado reflete investimentos reais: acompanhamento veterinário das matrizes e dos padreadores, exames de saúde, registro oficial, socialização em ambiente familiar e mentoria pós-venda vitalícia. Criadores sérios não vendem 'baratos' — o preço cobre cuidado real, não apenas o filhote.",
  },
  {
    question: "A fêmea de Spitz Alemão Anão é mais cara que o macho?",
    answer:
      "Sim. Na tabela atual da By Império Dog, a fêmea custa R$ 8.500, valor único para todas as cores. Em relação ao macho da mesma cor, a diferença fica entre R$ 1.000 e R$ 2.000. É a política comercial praticada hoje pela criadora, e não uma regra da raça.",
  },
  {
    question: "Qual a cor mais cara do Spitz Alemão Anão?",
    answer:
      "Nas fêmeas, o valor é o mesmo para todas as cores: R$ 8.500. Entre os machos, creme e preto ficam na faixa superior da tabela atual, empatados em R$ 7.500 — são também as cores de menor disponibilidade nas ninhadas. O laranja e o cinza-lobo (wolf sable) são os mais acessíveis, a R$ 6.500 para machos.",
  },
  {
    question: "O que está incluso no preço da By Império Dog?",
    answer:
      "Todo filhote da By Império Dog sai com: registro oficial, laudo de saúde, hemograma, carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade do filhote, histórico de vermifugação, contrato e mentoria vitalícia. Microchip é opcional, sob contratação. Fora esse item, o valor anunciado é o valor final.",
  },
  {
    question: "Existe parcelamento ou condições especiais?",
    answer:
      "Sim, eventualmente trabalhamos com parcelamento no cartão de crédito. Consulte a criadora diretamente no WhatsApp para verificar condições vigentes. A reserva do filhote é confirmada com sinal, e o saldo pode ser pago na entrega.",
  },
  {
    question: "Posso encontrar Spitz Alemão Anão mais barato em outros lugares?",
    answer:
      "Existem filhotes sendo anunciados por preços menores — geralmente sem documentação, sem laudos, sem garantia e com histórico veterinário duvidoso. Evite comprá-los: o risco de problemas cardíacos (colapso de traqueia, MVP), displasia de patela e outras condições genéticas é alto em linhagens sem controle. O investimento inicial num criador responsável evita custos veterinários muito maiores no futuro.",
  },
] as const;

export default function PrecoSpitzPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? whatsappLeadUrl(phone, { pageType: "intent", url: PAGE_URL, intent: "preco-spitz-anao" })
    : "#";

  const articleLd   = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01", dateModified: "2025-05-01" });
  const faqLd       = buildFAQPageLD([...PAGE_FAQS]);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",           url: `${SITE_URL}/` },
    { name: "Preço Spitz Anão", url: PAGE_URL },
  ]);
  const businessLd  = buildLocalBusinessLD();

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <PageViewPing pageType="intent" intent="preco-spitz-anao" />
      <script id="ld-preco-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script id="ld-preco-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-preco-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-preco-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      {/* ── HERO ── */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Tabela de preços atualizada</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Preço do Spitz Alemão Anão (Lulu da Pomerânia)
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Valores reais, sem surpresas. Saiba quanto custa um filhote de Spitz Alemão Anão na By Império Dog, o que está incluso e por que o preço varia por cor e sexo.
        </p>
      </header>

      {/* ── TABELA DE PREÇOS ── */}
      <section aria-labelledby="tabela-heading">
        <h2 id="tabela-heading" className="mb-4 text-2xl font-bold text-zinc-900">
          Tabela de preços por cor e sexo
        </h2>
        <p className="mb-6 text-sm text-zinc-600">
          Todos os filhotes da By Império Dog são entregues com registro oficial, laudos veterinários e mentoria vitalícia inclusos no valor abaixo. Não há custos ocultos.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Cor</th>
                <th className="px-4 py-3">Macho</th>
                <th className="px-4 py-3">Fêmea</th>
                <th className="hidden px-4 py-3 sm:table-cell">Observação</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_TABLE.map((row, i) => (
                <tr key={row.color} className={`border-b border-zinc-100 ${i % 2 === 0 ? "" : "bg-zinc-50/50"}`}>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{row.color}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.male}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{row.female}</td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-400 sm:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          * Valores sujeitos a alteração conforme disponibilidade. Consulte filhotes disponíveis no catálogo.
        </p>
      </section>

      {/* ── O QUE ESTÁ INCLUSO ── */}
      <section aria-labelledby="incluso-heading" className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 sm:p-8">
        <h2 id="incluso-heading" className="mb-1 text-xl font-bold text-zinc-900">
          O que está incluso no preço?
        </h2>
        <p className="mb-5 text-sm text-zinc-600">
          Não cobramos por documentação separada. Tudo abaixo está incluso no valor do filhote:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {INCLUDED_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-800">
              <span className="mt-0.5 text-emerald-500" aria-hidden>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── POR QUE O PREÇO VARIA ── */}
      <section aria-labelledby="variacao-heading" className="space-y-4">
        <h2 id="variacao-heading" className="text-2xl font-bold text-zinc-900">
          Por que o preço do Spitz Alemão Anão varia?
        </h2>
        <p className="text-sm text-zinc-600 sm:text-base">
          O valor de um filhote de Spitz Alemão Anão (Lulu da Pomerânia) de canil responsável reflete custos reais de criação — não é especulação de mercado. Os principais fatores são:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Cor e disponibilidade", body: "Creme e preto aparecem com menos frequência nas ninhadas da By Império Dog do que o laranja. Por isso ficam na faixa superior da tabela atual entre os machos." },
            { title: "Sexo", body: "Fêmeas têm demanda 2–3× maior que machos, o que eleva naturalmente o preço de mercado." },
            { title: "Linhagem e genética", body: "Matrizes e reprodutores com títulos de exposição, laudos de saúde e histórico de filhotes saudáveis valem mais — e produzem filhotes mais seguros." },
            { title: "Documentação completa", body: "Registro oficial, laudo de saúde e exames laboratoriais têm custo. Criadores que os incluem precisam cobrar mais — e devem." },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">{card.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        aria-labelledby="faq-preco-heading"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        <h2 id="faq-preco-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Perguntas frequentes sobre preço
        </h2>
        <dl className="divide-y divide-zinc-100">
          {PAGE_FAQS.map((item, i) => (
            <div key={item.question} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <details className="group py-4" open={i === 0}>
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                  itemProp="name"
                >
                  <span className="text-sm font-semibold text-zinc-900 sm:text-base leading-snug">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden>
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
      </section>

      {/* ── CTA ── */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900">
          Ver filhotes disponíveis com preço atualizado
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Consulte o catálogo completo com fotos, sexo, cor e valor de cada filhote da ninhada atual.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/filhotes"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Ver catálogo de filhotes
          </Link>
          {phone && (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Perguntar no WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* Breadcrumb navegacional */}
      <RelatedPages links={[
        { label: "Como Comprar com Segurança",           href: "/comprar-spitz-anao",        desc: "Guia passo a passo para não errar" },
        { label: "Criador Confiável — Como Identificar", href: "/criador-spitz-confiavel",   desc: "Documentação, laudos e red flags" },
        { label: "Filhote de Spitz Alemão",              href: "/filhote-de-spitz-alemao",   desc: "Como escolher e os primeiros cuidados" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Preço Spitz Anão</li>
        </ol>
      </nav>
    </main>
  );
}
