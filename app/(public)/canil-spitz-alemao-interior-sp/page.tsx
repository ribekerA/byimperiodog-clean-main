import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import { FOUNDING_YEAR } from "@/domain/config";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/canil-spitz-alemao-interior-sp`;

export const metadata: Metadata = {
  title: "Canil de Spitz Alemão Anão no Interior de SP",
  description:
    // 219 caracteres: o Google cortava justamente a lista de cidades, que é o
    // que essa página tem de próprio. Reescrita em 157.
    "Canil de Spitz Alemão Anão no interior de São Paulo, em Bragança Paulista. Atende Campinas, Sorocaba, São José dos Campos e todo o estado.",
  keywords: [
    "canil Spitz Alemão interior SP",
    "canil Lulu da Pomerânia interior São Paulo",
    "Spitz Alemão Bragança Paulista SP",
    "melhor canil Spitz Alemão SP",
    "filhote Lulu da Pomerânia interior SP",
    "criador Spitz Alemão Campinas SP",
    "Pomeranian",
    "Pomeranian Brasil",
  ],
  alternates: { canonical: "/canil-spitz-alemao-interior-sp" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Canil Spitz Alemão Anão — Interior de SP | By Império Dog",
    description: `Criação responsável de Spitz Alemão Anão em Bragança Paulista, no interior de SP, desde ${FOUNDING_YEAR}.`,
    type: "website",
  },
};

const CITIES = [
  "Bragança Paulista (sede)",
  "Atibaia",
  "Jundiaí",
  "Campinas e Região",
  "Sorocaba",
  "São José dos Campos",
  "Taubaté",
  "Americana",
  "Ribeirão Preto",
  "Franca",
  "Bauru",
  "Todo o interior de SP",
] as const;

const FAQS = [
  {
    question: "Qual o melhor canil de Spitz Alemão Anão no interior de SP?",
    answer:
      `Não existe um ranking oficial de canis. O que dá para verificar é o que cada criador entrega: registro oficial, consulta veterinária, exames laboratoriais, carteira de vacinação assinada pelo médico-veterinário e contrato. A By Império Dog fica em Bragança Paulista, cria Spitz Alemão Anão desde ${FOUNDING_YEAR} e entrega todos esses itens. Peça a mesma lista a qualquer criador antes de decidir.`,
  },
  {
    question: "Vocês entregam em Campinas, Sorocaba e outras cidades do interior?",
    answer:
      "Sim. Atendemos famílias de todo o interior de SP. Para cidades próximas, é possível fazer a entrega pessoalmente ou o tutor vir buscar em Bragança Paulista. Para cidades mais distantes, o filhote pode ser transportado por transportadora especializada ou pelo próprio tutor após visita.",
  },
  {
    question: "Bragança Paulista é perto de Campinas?",
    answer:
      "Bragança Paulista fica a aproximadamente 90 km de Campinas (cerca de 1h de carro). É facilmente acessível pela Rodovia D. Pedro I (SP-065). Para tutores de Campinas, Jundiaí, Atibaia, Itatiba e cidades vizinhas, é uma opção próxima.",
  },
  {
    question: "Existe algum canil de Spitz Alemão Anão em Campinas?",
    answer:
      "Há criadores na região de Campinas, mas a recomendação é sempre verificar procedência, registro oficial, acompanhamento veterinário e suporte pós-venda antes de qualquer decisão. A By Império Dog, em Bragança Paulista, entrega esse conjunto documentado.",
  },
  {
    question: "Como agendar uma visita ao canil?",
    answer:
      "A possibilidade e o formato da visita são combinados diretamente com a criadora pelo WhatsApp. Quando a visita não for viável, o interessado pode solicitar documentação e outras formas de verificação antes de decidir.",
  },
];

export default function CanilInteriorSPPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi que vocês são referência de canil de Spitz Alemão no interior de SP. Pode me informar sobre disponibilidade de filhotes?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Canil Spitz Alemão — Interior SP", url: PAGE_URL },
  ]);
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <script id="ld-isp-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-isp-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Criação especializada no interior de São Paulo</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Canil Spitz Alemão Anão no Interior de SP — By Império Dog
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Se você mora no interior de São Paulo e procura um criador responsável de Spitz Alemão Anão (Lulu da Pomerânia), a By Império Dog fica em Bragança Paulista e cria a raça desde {FOUNDING_YEAR}.
        </p>
      </header>

      {/* Credenciais */}
      <section aria-labelledby="cred-isp-heading">
        <h2 id="cred-isp-heading" className="sr-only">Credenciais</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { v: String(FOUNDING_YEAR), l: "Fundação" },
            { v: "Spitz Alemão Anão", l: "Raça exclusiva" },
            { v: "Contrato", l: "Compra e venda por escrito" },
            { v: "Incluso", l: "Registro oficial" },
          ].map((c) => (
            <div key={c.l} className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{c.v}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{c.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cidades atendidas */}
      <section aria-labelledby="cidades-heading" className="space-y-4">
        <h2 id="cidades-heading" className="text-2xl font-bold text-zinc-900">Cidades atendidas no interior de SP</h2>
        <p className="text-sm text-zinc-600">Atendemos diretamente ou com envio por transportadora especializada:</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CITIES.map((city) => (
            <li key={city} className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 text-sm text-zinc-700">
              <span className="text-emerald-500">✓</span>
              {city}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-isp-heading">
        <h2 id="faq-isp-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes ou agendar visita</h2>
        <p className="mt-2 text-sm text-zinc-600">Atendemos famílias de todo o interior de SP — pessoalmente ou com entrega.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver a vitrine de filhotes
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar no WhatsApp
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Lulu da Pomerânia em Bragança Paulista", href: "/lulu-da-pomerania-braganca-paulista", desc: "Localização, visitas e como chegar" },
        { label: "Spitz Alemão Anão — A Raça",            href: "/spitz-alemao",                        desc: "Características, temperamento e cuidados" },
        { label: "Ver a Vitrine de Filhotes",             href: "/filhotes",                            desc: "Fotos reais por cor e sexo, com o valor de partida" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Canil Spitz Alemão — Interior SP</li>
        </ol>
      </nav>
    </div>
  );
}
