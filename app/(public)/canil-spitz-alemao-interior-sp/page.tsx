import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import GoogleReviewsSection from "@/components/reviews/GoogleReviewsSection";
import { googleReviews, googleReviewSnapshot } from "@/content/google-reviews";
import { BRAND, FOUNDING_YEAR } from "@/domain/config";
import { REGRA_DE_ENTREGA } from "@/domain/public-truth";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/canil-spitz-alemao-interior-sp`;

export const metadata: Metadata = {
  title: "Canil de Spitz Alemão Anão (Lulu da Pomerânia) no Interior de SP",
  description:
    "Canil de Spitz Alemão Anão (Lulu da Pomerânia) no interior de São Paulo, com sede em Bragança Paulista. Retirada ou entrega combinadas antes da reserva.",
  alternates: { canonical: "/canil-spitz-alemao-interior-sp" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Canil Spitz Alemão Anão (Lulu da Pomerânia) — Interior de SP | By Imperio Dog",
    description: `Atendimento especializado em Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, no interior de SP, desde ${FOUNDING_YEAR}.`,
    type: "website",
  },
};

const FAQS = [
  {
    question: "Qual o melhor canil de Spitz Alemão Anão (Lulu da Pomerânia) no interior de SP?",
    answer:
      `Não existe um ranking oficial de canis. O que dá para verificar é o que cada criador entrega: registro oficial, consulta veterinária, exames laboratoriais, carteira de vacinação assinada pelo médico-veterinário e contrato. A By Imperio Dog fica em Bragança Paulista, cria Spitz Alemão Anão (Lulu da Pomerânia) desde ${FOUNDING_YEAR} e entrega todos esses itens. Peça a mesma lista a qualquer criador antes de decidir.`,
  },
  {
    question: "Como funciona a retirada ou a entrega?",
    answer: REGRA_DE_ENTREGA,
  },
  {
    question: "Bragança Paulista é perto de Campinas?",
    answer:
      "Bragança Paulista fica a aproximadamente 90 km de Campinas (cerca de 1h de carro). É facilmente acessível pela Rodovia D. Pedro I (SP-065).",
  },
  {
    question: "Existe algum canil de Spitz Alemão Anão (Lulu da Pomerânia) em Campinas?",
    answer:
      "Há criadores na região de Campinas, mas a recomendação é sempre verificar procedência, registro oficial, acompanhamento veterinário e suporte pós-venda antes de qualquer decisão. A By Imperio Dog, em Bragança Paulista, entrega esse conjunto documentado.",
  },
  {
    question: "Como agendar uma visita ao canil?",
    answer:
      "A possibilidade e o formato da visita são combinados diretamente com a criadora pelo WhatsApp. Quando a visita não for viável, o interessado pode solicitar documentação e outras formas de verificação antes de decidir.",
  },
];

// Texto de "Quem somos" e "O que você recebe" aprovado pelo usuário em
// 18/11/2026 para o grupo "Canil" do Google Ads. Sem parceiros, e sem dizer que
// todo filhote nasceu aqui (nem todos nasceram). Só fatos já confirmados.
const O_QUE_VOCE_RECEBE = [
  "Registro oficial",
  "Consulta veterinária e hemograma antes da entrega",
  "Carteira de vacinação assinada",
  "Contrato",
  "Atendimento pelo WhatsApp depois da entrega, direto com a criadora e sem prazo para acabar",
];

// Trechos de avaliações reais do Google, lidos de content/google-reviews.ts.
const TRECHOS = ["fernando-amaral", "nathalia-medeiros", "leone-gustavo"]
  .map((id) => googleReviews.find((r) => r.id === id))
  .filter((r): r is (typeof googleReviews)[number] & { text: string } => Boolean(r?.text));

export default function CanilInteriorSPPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") || WHATSAPP_NUMBER;
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Vi que vocês são referência de canil de Spitz Alemão (Lulu da Pomerânia) no interior de SP. Pode me informar sobre disponibilidade de filhotes?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Canil Spitz Alemão (Lulu da Pomerânia) — Interior SP", url: PAGE_URL },
  ]);
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <script id="ld-isp-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-isp-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="faixa-topo space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Criação especializada no interior de São Paulo</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Canil Spitz Alemão Anão (Lulu da Pomerânia) no Interior de SP — By Imperio Dog
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Se você mora no interior de São Paulo e procura um criador responsável de Spitz Alemão Anão (Lulu da Pomerânia), a By Imperio Dog fica em Bragança Paulista e cria a raça desde {FOUNDING_YEAR}.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver filhotes disponíveis
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" data-wa-placement="canil_interior_topo" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar com a Karen no WhatsApp
            </a>
          )}
        </div>
      </header>

      <section aria-labelledby="quem-somos-isp-heading" className="space-y-4">
        <h2 id="quem-somos-isp-heading" className="text-2xl font-bold text-zinc-900">Quem somos</h2>
        <p className="text-base leading-relaxed text-zinc-700">
          A By Imperio Dog é o canil da criadora Karen Cristina, em Bragança Paulista, no interior de SP. Desde {FOUNDING_YEAR} ela trabalha com uma única raça, o Spitz Alemão Anão (Lulu da Pomerânia). O canil tem registro na CBKC, nº {BRAND.registroCbkc}. Enquanto estão com a Karen, os filhotes de Spitz Alemão Anão (Lulu da Pomerânia) vivem dentro de casa, junto da família.
        </p>
      </section>

      <section aria-labelledby="recebe-isp-heading" className="space-y-4">
        <h2 id="recebe-isp-heading" className="text-2xl font-bold text-zinc-900">O que você recebe com o seu Lulu da Pomerânia</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {O_QUE_VOCE_RECEBE.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
              <span aria-hidden className="mt-0.5 text-emerald-600">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="avaliacoes-isp-heading" className="space-y-6">
        <h2 id="avaliacoes-isp-heading" className="text-2xl font-bold text-zinc-900">O que dizem as famílias</h2>
        <p className="text-sm text-zinc-500">Nota e total conferidos no Google em {googleReviewSnapshot.checkedAtLabel}.</p>
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
          <ul className="space-y-4">
            {TRECHOS.map((r) => (
              <li key={r.id}>
                <figure className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p role="img" aria-label="5 de 5 estrelas" className="text-[#fbbc04]">★★★★★</p>
                  <blockquote className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">“{r.text}”</blockquote>
                  <figcaption className="mt-3 text-xs font-semibold text-zinc-500">{r.name} · Google</figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <GoogleReviewsSection />
        </div>
      </section>

      {/* Credenciais */}
      <section aria-labelledby="cred-isp-heading">
        <h2 id="cred-isp-heading" className="sr-only">Credenciais</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { v: String(FOUNDING_YEAR), l: "Fundação" },
            { v: "Spitz Alemão Anão (Lulu da Pomerânia)", l: "Raça exclusiva" },
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
        <p className="mt-2 text-sm text-zinc-600">Retirada ou entrega, conforme a disponibilidade. Local, prazo e condições são combinados antes da reserva.</p>
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
        { label: "Spitz Alemão Anão (Lulu da Pomerânia) — A Raça",            href: "/spitz-alemao",                        desc: "Características, temperamento e cuidados" },
        { label: "Ver a Vitrine de Filhotes",             href: "/filhotes",                            desc: "Fotos reais por cor e sexo, com o valor de partida" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Canil Spitz Alemão (Lulu da Pomerânia) — Interior SP</li>
        </ol>
      </nav>
    </div>
  );
}
