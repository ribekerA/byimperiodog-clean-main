import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import { formatarPreco, precoDe, RESPOSTA_PRETO } from "@/domain/pricing";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/spitz-alemao-preto`;

// A página inteira era construída sobre escassez: "menor disponibilidade nas
// ninhadas da By Império Dog", "raro", "difícil de encontrar". Nada disso é
// verificável e o site não publica estoque. O que sobra é verdadeiro e continua
// respondendo à mesma busca: o que o padrão exige de uma pelagem preta, quanto
// custa e o que cobrar do criador. O array `keywords` saiu junto — o Google
// ignora meta keywords desde 2009 e ele carregava "Spitz Alemão preto raro".
export const metadata: Metadata = {
  title: "Spitz Alemão Anão Preto — Preço e Filhotes",
  description:
    "O preto do Spitz Alemão Anão no padrão da raça: pelagem uniforme e brilhante, sem manchas. Veja o preço, o que exigir do criador e o registro oficial.",
  alternates: { canonical: "/spitz-alemao-preto" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Spitz Alemão Anão Preto — Preço e Características | By Império Dog",
    description: "O que define o preto no padrão do Spitz Alemão Anão, quanto custa e como garantir um filhote com registro oficial.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "O que o padrão da raça exige da pelagem preta?",
    answer:
      "O padrão descreve o preto como uma cor sólida: pelagem, subpelo e pele escuros, sem manchas brancas e sem tons esmaecidos. Marcações ou irregularidades de tom são critério de julgamento em exposição — não dizem nada sobre a saúde nem sobre o temperamento do cão.",
  },
  {
    question: "Qual o preço do Spitz Alemão Anão preto?",
    // Resposta oficial de preço do preto, importada de domain/pricing. A versão
    // anterior comparava a cor com o cinza-lobo e emendava documentação,
    // vacina e mentoria dentro da resposta de "quanto custa".
    answer: RESPOSTA_PRETO,
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
    question: "Como saber quais filhotes pretos existem hoje?",
    answer:
      "As fotos publicadas no site são referência visual da cor e do sexo — elas continuam no ar depois que aquele filhote encontra a família dele. As opções atuais são confirmadas no atendimento pelo WhatsApp.",
  },
];

export default function SpitzAlemaoPretoPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi a página sobre Spitz Alemão Preto no site da By Império Dog. Gostaria de conhecer as opções atuais e os valores.")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: "Spitz Alemão Preto", url: PAGE_URL },
  ]);
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <script id="ld-preto-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-preto-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        {/* O sobretítulo era "Disponibilidade limitada" e o H1 prometia explicar
            por que o preto "é difícil de encontrar". Escassez declarada em cima
            de uma página que não tem estoque para mostrar. O tema real da busca
            é a cor, e é sobre ela que a página fala agora. */}
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Cor preta</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Spitz Alemão Anão Preto — características, padrão e preço
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O preto é uma das cores reconhecidas no padrão do Spitz Alemão Anão e uma das cinco com que a By Império Dog trabalha. Sai com registro oficial e a mesma documentação das demais cores. Consulte as opções atuais pelo WhatsApp.
        </p>
      </header>

      {/* O que define o preto */}
      <section aria-labelledby="raridade-heading" className="space-y-4">
        <h2 id="raridade-heading" className="text-2xl font-bold text-zinc-900">O que define o preto no padrão da raça</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Cor sólida", b: "O preto do padrão é uniforme e brilhante, sem manchas brancas e sem tons esmaecidos ao longo do corpo." },
            { t: "Pele e subpelo escuros", b: "Não é só o pelo de cobertura: no preto do padrão, o subpelo e a pele acompanham o tom escuro." },
            { t: "Avaliação em exposição", b: "Manchas ou tons irregulares desclassificam o cão para exposição — critério de julgamento, não de saúde nem de temperamento." },
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
            <p className="text-xs text-zinc-500 uppercase">Macho</p>
            <p className="text-2xl font-bold text-zinc-900">{formatarPreco(precoDe("preto", "macho"))}</p>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 min-w-[160px] text-center shadow-sm">
            <p className="text-xs text-zinc-500 uppercase">Fêmea</p>
            <p className="text-2xl font-bold text-zinc-900">{formatarPreco(precoDe("preto", "femea"))}</p>
          </div>
        </div>
        {/* Valores de partida: a tabela de src/domain/pricing e a unica fonte. */}
        <p className="text-sm text-zinc-600">Valores de partida para a cor preta. A combinação exata é confirmada no atendimento.</p>
        {/* "Mentoria pós-venda" saiu da lista do que acompanha o filhote: o que
            existe é suporte pelo WhatsApp depois da entrega, e isso não é um
            item de contrato. A lista agora repete exatamente o que o contrato
            descreve. */}
        <ul className="space-y-1.5 text-sm text-zinc-700">
          {["Registro oficial", "Consulta veterinária", "Hemograma completo", "Protocolo vacinal em dia", "Vermifugação", "Identificação conforme a legislação aplicável", "Contrato"].map((i) => (
            <li key={i} className="flex items-center gap-2"><span className="text-emerald-600">✓</span>{i}</li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-preto-heading">
        <h2 id="faq-preto-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
        {/* <div> e nao <dl>: esta secao e um acordeao de <details>, nao uma lista
            de descricao. Sem <dt>/<dd> dentro, o <dl> reprovava a regra
            definition-list do axe e o leitor de tela anunciava uma lista que
            nao existe. A marcacao schema.org da FAQ foi removida em 26/08/2026: o
            Google encerrou o rich result de FAQ em 07/05/2026 e o markup
            deixou de render qualquer resultado na busca. A FAQ visivel
            continua igual — ela e para o leitor, nao para o SERP. */}
        <div className="divide-y divide-zinc-100">
          {FAQS.map((item, i) => (
            <div key={item.question}>
              <details className="group py-4" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm">
                  <span className="text-sm font-semibold text-zinc-900 sm:text-base leading-snug">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </summary>
                <div className="mt-3 pr-7">
                  <p className="text-sm leading-relaxed text-zinc-600">{item.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        {/* "A disponibilidade é limitada" + "lista de interesse" era escassez
            fabricada emendada numa fila que não existe. */}
        <h2 className="text-xl font-bold text-zinc-900">Consultar opções atuais de Spitz Alemão preto</h2>
        <p className="mt-2 text-sm text-zinc-600">Veja as fotos reais da cor na vitrine e fale com a equipe para saber o que existe hoje no atendimento.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes/cor/preto" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver a vitrine de filhotes pretos
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar pelo WhatsApp
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
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/filhotes" className="hover:text-emerald-700">Filhotes</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Spitz Alemão Preto</li>
        </ol>
      </nav>
    </div>
  );
}
