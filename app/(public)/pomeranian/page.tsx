import Link from "next/link";
import type { Metadata } from "next";

import { RelatedPages } from "@/components/common/RelatedPages";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/pomeranian`;

export const metadata: Metadata = {
  title: "Pomeranian no Brasil — Raça, Preço e Filhotes",
  description:
    // 195 caracteres: a equivalência de nomes, que é o ponto da página, ficava
    // fora do trecho exibido. Reescrita em 152.
    "Tudo sobre o Pomeranian no Brasil: o que é a raça, preço, características e onde encontrar filhotes com registro oficial. Pomeranian = Lulu da Pomerânia.",
  keywords: [
    "Pomeranian",
    "Pomeranian Brasil",
    "Pomeranian preço",
    "Pomeranian filhote Brasil",
    "Pomeranian raça",
    "Pomeranian SP",
    "comprar Pomeranian Brasil",
    "Pomeranian cachorro",
    "Pomeranian mini",
    "Pomeranian filhote com registro",
  ],
  alternates: { canonical: "/pomeranian" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Pomeranian no Brasil — Raça, Preço e Filhotes | By Império Dog",
    description:
      "O Pomeranian é o mesmo que Lulu da Pomerânia e Spitz Alemão Anão. Saiba preço, características e onde comprar com registro oficial no Brasil.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "O que é um Pomeranian?",
    answer:
      "O Pomeranian é uma raça de cão de pequeno porte originária da região da Pomerânia (atual fronteira entre Alemanha e Polônia). No Brasil, é amplamente conhecido como Lulu da Pomerânia, e o nome oficial reconhecido pela FCI é Spitz Alemão Anão. Os três nomes se referem exatamente ao mesmo animal: compacto, de pelagem dupla densa e personalidade marcante.",
  },
  {
    question: "Qual o preço de um Pomeranian no Brasil?",
    answer:
      "Na By Império Dog, os preços variam de R$ 6.500 a R$ 8.500 dependendo da cor e do sexo. Machos partem de R$ 6.500 (laranja e cinza-lobo) e chegam a R$ 7.500 (creme e preto). Fêmeas custam R$ 8.500, valor único para todas as cores. Todos incluem registro oficial, laudos veterinários, protocolo vacinal em dia conforme a idade do filhote e mentoria vitalícia. O microchip é opcional, sob contratação.",
  },
  {
    question: "Pomeranian tem outro nome no Brasil?",
    answer:
      "Sim. No Brasil o Pomeranian é chamado de Lulu da Pomerânia (o apelido mais popular) ou Spitz Alemão Anão (nome oficial da FCI). Outros termos usados são Spitz Anão, Mini Spitz e Pomerânio. São todos nomes para o mesmo cão.",
  },
  {
    question: "Pomeranian é bom para apartamento?",
    answer:
      "Sim, é uma das raças mais indicadas para apartamento. Com altura na cernelha de 21 cm ± 3 cm conforme o padrão FCI nº 97, e peso que na prática costuma ficar entre 1,5 e 3,5 kg, o Pomeranian adapta-se muito bem a espaços menores. Precisa de dois passeios curtos diários e estimulação mental, mas não exige área grande para se exercitar.",
  },
  {
    question: "Como encontrar um Pomeranian com registro oficial no Brasil?",
    answer:
      "A By Império Dog é criadora responsável de Pomeranian (Lulu da Pomerânia / Spitz Alemão Anão) em Bragança Paulista, SP, desde 2013. Todos os filhotes têm registro oficial (com emissão e entrega conforme o prazo da entidade responsável), laudos veterinários e contrato de venda. O microchip é opcional, sob contratação.",
  },
];

export default function PomeranianPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi a página sobre Pomeranian no site da By Império Dog e gostaria de informações sobre filhotes disponíveis.")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Pomeranian", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({
    url: PAGE_URL,
    title: metadata.title as string,
    description: metadata.description as string,
    datePublished: "2025-01-01",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <script id="ld-pom-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-pom-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-pom-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script id="ld-pom-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      {/* HERO */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Raça — guia completo</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Pomeranian no Brasil — o que você precisa saber
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O Pomeranian é uma das raças de cães mais buscadas no Brasil. Aqui você encontra tudo: o que é a raça, como ela se chama em português, preço atualizado, características e como encontrar um filhote com registro oficial.
        </p>
      </header>

      {/* Três nomes — seção central para SEO */}
      <section aria-labelledby="tres-nomes-heading" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
        <h2 id="tres-nomes-heading" className="text-base font-bold text-emerald-900">
          Pomeranian = Lulu da Pomerânia = Spitz Alemão Anão — são o mesmo cão
        </h2>
        <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
          A raça tem três nomes populares: <strong>Pomeranian</strong> (nome em inglês, usado mundialmente), <strong>Lulu da Pomerânia</strong> (apelido mais comum no Brasil) e <strong>Spitz Alemão Anão</strong> (nome oficial reconhecido pela FCI). São exatamente o mesmo animal — compacto, de pelagem dupla densa e personalidade marcante. Outros nomes usados: <em>Spitz Anão</em>, <em>Mini Spitz</em>, <em>Pomerânio</em>.
        </p>
      </section>

      {/* Tabela de preços */}
      <section aria-labelledby="preco-pom-heading" className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8 space-y-4">
        <h2 id="preco-pom-heading" className="text-xl font-bold text-zinc-900">
          Preço do Pomeranian no Brasil — By Império Dog
        </h2>
        <p className="text-sm text-zinc-600">
          Os valores variam conforme a cor e o sexo. Todos os filhotes incluem registro oficial, laudos e mentoria vitalícia.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { cor: "Macho — Laranja / Cinza-Lobo (Wolf Sable)", preco: "R$ 6.500", tag: "a partir de" },
            { cor: "Macho — Creme / Preto",                     preco: "R$ 7.500", tag: "a partir de" },
            { cor: "Fêmea — todas as cores",                    preco: "R$ 8.500", tag: "valor único" },
          ].map((p) => (
            <div key={p.cor} className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">{p.tag}</p>
              <p className="text-xl font-bold text-emerald-700">{p.preco}</p>
              <p className="text-sm text-zinc-600">{p.cor}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">
          Inclui registro oficial, laudo veterinário, hemograma, protocolo vacinal em dia conforme a idade do filhote, contrato e mentoria vitalícia. Microchip opcional, sob contratação.{" "}
          <Link href="/preco-spitz-anao" className="underline hover:text-emerald-700">Ver tabela completa →</Link>
        </p>
      </section>

      {/* Características */}
      <section aria-labelledby="caracteristicas-pom-heading" className="space-y-4">
        <h2 id="caracteristicas-pom-heading" className="text-2xl font-bold text-zinc-900">
          Características do Pomeranian
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Peso adulto (referência prática)", value: "1,5 – 3,5 kg" },
            { label: "Altura na cernelha",   value: "21 cm ± 3 cm (FCI nº 97)" },
            { label: "Expectativa de vida",  value: "12 – 16 anos" },
            { label: "Adaptação a apartamento", value: "Excelente" },
          ].map((c) => (
            <article key={c.label} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm text-center">
              <p className="text-xl font-bold text-emerald-700">{c.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{c.label}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-pom-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-pom-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes sobre o Pomeranian</h2>
        <dl className="divide-y divide-zinc-100">
          {FAQS.map((item, i) => (
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

      {/* CTA */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes de Pomeranian disponíveis</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Catálogo atualizado com fotos, sexo, cor e valor — criação responsável com registro oficial.
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
              Falar com a criadora
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Spitz Alemão Anão — Raça Completa", href: "/spitz-alemao",        desc: "Nome oficial FCI: tudo sobre a raça" },
        { label: "Lulu da Pomerânia",                 href: "/lulu-da-pomerania",   desc: "Guia completo em português" },
        { label: "Tabela de Preços",                  href: "/preco-spitz-anao",    desc: "Valores por cor e sexo" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Pomeranian</li>
        </ol>
      </nav>
    </div>
  );
}
