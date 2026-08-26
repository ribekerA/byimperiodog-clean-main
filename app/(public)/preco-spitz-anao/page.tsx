import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import PageViewPing from "@/components/PageViewPing";
import {
  type CorDivulgada,
  FAIXA_PUBLICA,
  formatarPreco,
  LINHAS_FORMATADAS,
  RESPOSTA_QUANTO_CUSTA,
} from "@/domain/pricing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/preco-spitz-anao`;

export const metadata: Metadata = {
  title: "Preço do Spitz Alemão Anão por Cor e Sexo",
  description:
    // 250 caracteres: o Google mostra ~160 e cortava antes de "por que o valor
    // varia", que é justamente a intenção de busca da página. Reescrita em 156.
    "Tabela do Spitz Alemão Anão por cor e sexo: Particolor, Laranja, Creme, Preto e Branco, a partir de R$ 5.500. Veja o que está incluso no valor.",
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
      "Machos a partir de R$ 5.500 e fêmeas a partir de R$ 6.500, conforme a cor — com registro oficial, contrato e mentoria pós-venda inclusos.",
    type: "article",
  },
};

// A observação de cada linha é editorial e fica aqui; os números não. Esta era
// a tabela em que a fêmea laranja aparecia por R$ 8.500 enquanto o card da
// home já dizia outra coisa — agora as duas colunas de valor saem de
// domain/pricing e não têm como divergir.
const NOTAS_DA_LINHA: Record<CorDivulgada, string> = {
  particolor: "Menor valor da tabela atual",
  laranja: "A cor mais icônica da raça",
  creme: "Acima do laranja, junto com o preto",
  preto: "Acima do laranja, junto com o creme",
  branco: "Maior valor da tabela atual",
};

const PRICE_TABLE = LINHAS_FORMATADAS.map((linha) => ({
  color: linha.label,
  male: linha.macho,
  female: linha.femea,
  note: NOTAS_DA_LINHA[linha.cor],
}));

const INCLUDED_ITEMS = [
  "Registro oficial e legalizado",
  "Consulta veterinária",
  "Hemograma completo",
  "Carteira de vacinação assinada pelo médico-veterinário, com protocolo em dia conforme a idade",
  "Histórico de vermifugação",
  "Identificação conforme a legislação aplicável",
  "Contrato de compra e venda",
  "Mentoria pós-venda direta com a criadora",
] as const;

const PAGE_FAQS = [
  {
    question: "Quanto custa um Spitz Alemão Anão?",
    // Resposta oficial, importada em vez de reescrita: esta mesma pergunta
    // aparece na home, em /filhotes e no agente do WhatsApp, e cada cópia
    // manual era uma chance de divergir.
    answer: RESPOSTA_QUANTO_CUSTA,
  },
  {
    question: "Por que o Spitz Alemão Anão é tão caro?",
    answer:
      // "maternidade monitorada" saiu da lista: nao existe estrutura desse tipo
      // aqui. As matrizes e os padreadores tambem sairam — o preço se explica
      // pelo que acompanha o filhote, sem descrever estrutura de criação.
      "O valor reflete custos reais: acompanhamento veterinário, exames laboratoriais, registro oficial e mentoria pós-venda. Antes de comparar valores, confira item a item o que cada criador entrega junto com o filhote.",
  },
  {
    question: "A fêmea de Spitz Alemão Anão é mais cara que o macho?",
    answer:
      "Sim. Na tabela atual da By Império Dog, a fêmea parte de R$ 6.500 no particolor, R$ 7.500 no laranja, R$ 8.500 em creme e preto e R$ 9.500 no branco. Em relação ao macho da mesma cor, a diferença é de R$ 1.000. É a política comercial praticada hoje, e não uma regra da raça.",
  },
  {
    question: "Qual a cor mais cara do Spitz Alemão Anão?",
    answer:
      "O branco. Na tabela atual, o macho branco parte de R$ 8.500 e a fêmea branca, de R$ 9.500 — o maior valor nos dois sexos. Creme e preto ficam em R$ 7.500 para macho e R$ 8.500 para fêmea, e o laranja em R$ 6.500 e R$ 7.500. Quem abre a tabela é o particolor, com R$ 5.500 para macho e R$ 6.500 para fêmea.",
  },
  {
    question: "O que está incluso no preço da By Império Dog?",
    answer:
      "Todo filhote da By Império Dog sai com: registro oficial, consulta veterinária, hemograma completo, carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade do filhote, histórico de vermifugação, contrato e mentoria pós-venda. A identificação do animal segue os requisitos exigidos pela legislação aplicável. Fora esse item, o valor anunciado é o valor final.",
  },
  {
    question: "Existe parcelamento ou condições especiais?",
    answer:
      "Sim, eventualmente trabalhamos com parcelamento no cartão de crédito. Consulte a criadora diretamente no WhatsApp para verificar condições vigentes. A reserva do filhote é confirmada com sinal, e o saldo pode ser pago na entrega.",
  },
  {
    question: "Posso encontrar Spitz Alemão Anão mais barato em outros lugares?",
    answer:
      // A versão anterior listava diagnósticos (colapso de traqueia, MVP,
      // displasia de patela) para justificar o preço. Diagnóstico é assunto do
      // médico-veterinário, não de uma FAQ de preço.
      "Existem anúncios com valores menores. Antes de comparar preços, compare o que está incluso: documentação, acompanhamento veterinário e contrato mudam o que se está comprando.",
  },
] as const;

export default function PrecoSpitzPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? whatsappLeadUrl(phone, { pageType: "intent", url: PAGE_URL, intent: "preco-spitz-anao" })
    : "#";

  const articleLd   = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",           url: `${SITE_URL}/` },
    { name: "Preço Spitz Anão", url: PAGE_URL },
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <PageViewPing pageType="intent" intent="preco-spitz-anao" />
      <script id="ld-preco-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script id="ld-preco-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* ── HERO ── */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Tabela de preços atualizada</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Preço do Spitz Alemão Anão
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          A partir de {formatarPreco(FAIXA_PUBLICA.minCents)}, chegando a {formatarPreco(FAIXA_PUBLICA.maxCents)} conforme cor e sexo. Veja abaixo o que está incluso e por que o preço varia.
        </p>
      </header>

      {/* ── TABELA DE PREÇOS ── */}
      <section aria-labelledby="tabela-heading">
        <h2 id="tabela-heading" className="mb-4 text-2xl font-bold text-zinc-900">
          Tabela de preços por cor e sexo
        </h2>
        <p className="mb-6 text-sm text-zinc-600">
          Cada linha traz o valor <strong className="font-semibold text-zinc-900">a partir de</strong> daquela combinação de cor e sexo — é o ponto de partida, e o valor de um filhote específico é confirmado no atendimento. Todos são entregues com registro oficial, contrato e mentoria pós-venda inclusos.
        </p>
        {/* A tabela tem min-w-[480px]: abaixo disso a caixa rola de lado e nao
            ha link nem botao dentro dela. Sem um ponto de foco, quem navega por
            teclado nao chegava as colunas da direita — as duas colunas de preco
            no celular. Com tabIndex a propria caixa recebe foco e as setas
            rolam; role+aria-label fazem o leitor de tela anunciar a regiao e
            avisar que ela rola. O rotulo e proprio, e nao um aria-labelledby
            apontando para o h2 da secao: dois landmarks com o mesmo nome
            acessivel dentro da mesma pagina viram um so na lista de regioes.
            Mesma solucao aplicada ao carrossel de depoimentos. */}
        <div
          className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          // A regra abaixo so conhece a lista de roles interativas e nao enxerga
          // rolagem; area rolavel precisa de foco por teclado (WCAG 2.1.1).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role="region"
          aria-label="Tabela de preços — role para o lado para ver todas as colunas"
        >
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Cor</th>
                <th className="px-4 py-3">Macho — a partir de</th>
                <th className="px-4 py-3">Fêmea — a partir de</th>
                <th className="hidden px-4 py-3 sm:table-cell">Observação</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_TABLE.map((row, i) => (
                <tr key={row.color} className={`border-b border-zinc-100 ${i % 2 === 0 ? "" : "bg-zinc-50/50"}`}>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{row.color}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.male}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{row.female}</td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-500 sm:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
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
            { title: "Cor e disponibilidade", body: "Creme e preto aparecem com menos frequência entre os filhotes disponíveis do que o laranja. Por isso ficam acima do laranja na tabela atual, nos dois sexos." },
            { title: "Sexo", body: "A fêmea tem procura maior que o macho, e custa R$ 1.000 a mais na mesma cor." },
            { title: "Padrão da raça", body: "Filhotes dentro do padrão FCI nº 97 — porte, pelagem e estrutura — são menos frequentes e têm valor maior no mercado." },
            { title: "Documentação completa", body: "Registro oficial, consulta veterinária e exames laboratoriais têm custo, e já estão inclusos no valor anunciado." },
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
      >
        <h2 id="faq-preco-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Perguntas frequentes sobre preço
        </h2>
        {/* <div> e nao <dl>: esta secao e um acordeao de <details>, nao uma lista
            de descricao. Sem <dt>/<dd> dentro, o <dl> reprovava a regra
            definition-list do axe e o leitor de tela anunciava uma lista que
            nao existe. A marcacao schema.org da FAQ foi removida em 26/08/2026: o
            Google encerrou o rich result de FAQ em 07/05/2026 e o markup
            deixou de render qualquer resultado na busca. A FAQ visivel
            continua igual — ela e para o leitor, nao para o SERP. */}
        <div className="divide-y divide-zinc-100">
          {PAGE_FAQS.map((item, i) => (
            <div key={item.question}>
              <details className="group py-4" open={i === 0}>
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                >
                  <span className="text-sm font-semibold text-zinc-900 sm:text-base leading-snug">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
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
        { label: "Criador Confiável — Como Identificar", href: "/criador-spitz-confiavel",   desc: "Documentação, exames e red flags" },
        { label: "Filhote de Spitz Alemão",              href: "/filhote-de-spitz-alemao",   desc: "Como escolher e os primeiros cuidados" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Preço Spitz Anão</li>
        </ol>
      </nav>
    </div>
  );
}
