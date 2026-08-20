import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD } from "@/lib/schema";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/spitz-alemao-branco`;
const WHITE_FEMALE_IMAGE = "/filhotes/branco/branco-femea-jardim-01.jpg";

export const metadata: Metadata = {
  title: "Spitz Alemão Branco — Diferença do Creme e Filhotes",
  description:
    "Entenda a diferença entre Spitz Alemão Anão Branco e creme claro, como comparar a pelagem e onde consultar filhotes, preços e disponibilidade.",
  keywords: [
    "Spitz Alemão branco",
    "Spitz Alemão Anão branco",
    "Lulu da Pomerânia branco",
    "Spitz branco ou creme",
    "filhote de Spitz branco",
    "Spitz branco preço",
    "Pomeranian branco",
  ],
  alternates: { canonical: "/spitz-alemao-branco" },
  openGraph: {
    title: "Spitz Alemão Anão Branco: diferenças do creme claro",
    description:
      "Veja como comparar branco e creme claro e consulte o catálogo atualizado de filhotes da By Império Dog.",
    url: PAGE_URL,
    siteName: "By Império Dog",
    type: "article",
    locale: "pt_BR",
    images: [
      {
        url: WHITE_FEMALE_IMAGE,
        width: 900,
        height: 1600,
        alt: "Filhote fêmea de Spitz Alemão Anão Branco no jardim",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spitz Alemão Anão Branco: diferenças do creme claro",
    description:
      "Como comparar as tonalidades e consultar filhotes, preços e disponibilidade.",
    images: [WHITE_FEMALE_IMAGE],
  },
};

const FAQS = [
  {
    question: "Qual é a diferença entre Spitz Alemão Branco e creme claro?",
    answer:
      "O branco tem aparência visualmente neutra. O creme claro apresenta um fundo mais quente, próximo de marfim ou champanhe. Luz ambiente, balanço de branco da câmera e tela podem aproximar as duas tonalidades em fotos, então a comparação deve incluir imagens atuais em luz natural.",
  },
  {
    question: "Todo Spitz que parece branco em uma foto é da cor branca?",
    answer:
      "Não necessariamente. Um creme muito claro pode parecer branco em determinadas condições de luz ou edição. Por isso, uma foto isolada não basta para diferenciar as tonalidades com segurança.",
  },
  {
    question: "Qual é o preço do Spitz Alemão Anão Branco?",
    answer:
      "A tabela atual traz R$ 8.500 para macho e R$ 9.500 para fêmea — o maior valor entre as cinco cores, nos dois sexos.",
  },
  {
    question: "A pelagem branca define temperamento ou saúde?",
    answer:
      "Não. A cor da pelagem é uma característica estética e, isoladamente, não determina comportamento, inteligência ou saúde. A avaliação de cada filhote deve considerar documentação, acompanhamento veterinário, socialização e características individuais.",
  },
  {
    question: "Como saber se há filhotes de Spitz Branco disponíveis?",
    answer:
      "Consulte o catálogo por cor, que reúne os filhotes cadastrados como brancos. Quando a lista estiver vazia, isso indica apenas que não há um filhote branco publicado no catálogo naquele momento; a agenda pode ser consultada com a equipe.",
  },
] as const;

const COMPARISON = [
  {
    title: "Branco",
    body: "A pelagem tem aparência branca e neutra, sem o fundo quente que caracteriza visualmente o creme.",
  },
  {
    title: "Creme claro",
    body: "A pelagem apresenta tonalidade mais quente, que pode lembrar marfim ou champanhe, mesmo quando é muito clara.",
  },
] as const;

export default function SpitzAlemaoBrancoPage() {
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: "Spitz Alemão Branco", url: PAGE_URL },
  ]);
  const faqLd = buildFAQLD([...FAQS]);
  const businessLd = buildLocalBusinessLD();
  const articleLd = buildArticleLD({
    url: PAGE_URL,
    title: metadata.title as string,
    description: metadata.description as string,
    image: `${SITE_URL}${WHITE_FEMALE_IMAGE}`,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <PageViewPing pageType="intent" intent="spitz-alemao-branco" />
      <script id="ld-branco-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-branco-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-branco-business" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script id="ld-branco-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="grid items-center gap-8 sm:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
            Cor da pelagem
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Spitz Alemão Anão Branco: como diferenciar do creme claro
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
            Branco e creme claro podem parecer semelhantes em fotografias, mas não são a mesma descrição de cor. A diferença está principalmente no fundo visual da pelagem: neutro no branco e mais quente no creme.
          </p>
        </div>
        <figure className="overflow-hidden rounded-3xl bg-zinc-100 shadow-xl">
          <Image
            src={WHITE_FEMALE_IMAGE}
            alt="Filhote fêmea de Spitz Alemão Anão Branco fotografada em luz natural no jardim"
            width={900}
            height={1600}
            sizes="(max-width: 639px) 100vw, 280px"
            className="aspect-[3/4] w-full object-cover object-[50%_36%]"
            priority
          />
          <figcaption className="bg-white px-4 py-3 text-xs leading-relaxed text-zinc-500">
            Fêmea branca fotografada em luz natural no jardim da By Império Dog.
          </figcaption>
        </figure>
      </header>

      <section aria-labelledby="comparacao-heading" className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
            Comparação visual
          </p>
          <h2 id="comparacao-heading" className="mt-2 text-2xl font-bold text-zinc-900">
            Branco x creme claro
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPARISON.map((item) => (
            <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.body}</p>
            </article>
          ))}
        </div>
        <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-600">
          Uma foto isolada pode enganar: luz amarela, exposição e processamento da câmera mudam a percepção do branco. Para comparar, peça fotos e vídeos atuais em luz natural e observe mais de um registro do mesmo filhote.
        </p>
      </section>

      <section aria-labelledby="avaliar-heading" className="space-y-4">
        <h2 id="avaliar-heading" className="text-2xl font-bold text-zinc-900">
          O que avaliar além da cor
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
          A escolha responsável não deve depender apenas da tonalidade da pelagem. Verifique a identificação do filhote, o histórico informado da ninhada, a documentação contratual e o acompanhamento veterinário apresentado pelo criador.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Fotos e vídeos atuais do mesmo filhote",
            "Informação clara sobre a cor cadastrada",
            "Registro e documentação previstos em contrato",
            "Laudos e protocolo veterinário correspondentes ao filhote",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-xl border border-zinc-100 bg-white p-4 text-sm text-zinc-700 shadow-sm">
              <span className="mt-0.5 text-emerald-600" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="preco-branco-heading" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <h2 id="preco-branco-heading" className="text-xl font-bold text-zinc-900">
          Preço e disponibilidade do Spitz Branco
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-700">
          A tabela atual traz R$ 8.500 para macho e R$ 9.500 para fêmea — o maior valor entre as cinco cores, nos dois sexos.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/preco-spitz-anao" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-700">
            Ver tabela de preços
          </Link>
          <Link href="/filhotes/cor/branco" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50">
            Ver filhotes brancos
          </Link>
        </div>
      </section>

      <section aria-labelledby="faq-branco-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-branco-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Perguntas frequentes
        </h2>
        <dl className="divide-y divide-zinc-100">
          {FAQS.map((item, index) => (
            <div key={item.question} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <details className="group py-4" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" itemProp="name">
                  <span className="text-sm font-semibold leading-snug text-zinc-900 sm:text-base">{item.question}</span>
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
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900">
          Consulte o catálogo antes de decidir pela cor
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
          Veja os filhotes cadastrados, compare fotos atuais e confira as informações individuais de cada um.
        </p>
        <Link href="/filhotes" className="mt-6 inline-flex min-h-[50px] items-center justify-center rounded-full bg-emerald-600 px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          Ver todos os filhotes
        </Link>
      </section>

      <RelatedPages links={[
        { label: "Filhotes Brancos", href: "/filhotes/cor/branco", desc: "Catálogo atualizado por cor" },
        { label: "Tabela de Preços", href: "/preco-spitz-anao", desc: "Valores por cor e sexo" },
        { label: "Spitz Alemão Anão", href: "/spitz-alemao", desc: "Guia completo da raça" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/filhotes" className="hover:text-emerald-700">Filhotes</Link></li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Spitz Alemão Branco</li>
        </ol>
      </nav>
    </div>
  );
}
