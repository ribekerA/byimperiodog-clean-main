import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/canil-spitz-alemao-interior-sp`;

export const metadata: Metadata = {
  title: "Canil Spitz AlemÃ£o AnÃ£o no Interior de SP | By ImpÃ©rio Dog â€” BraganÃ§a Paulista",
  description:
    "O melhor canil de Spitz AlemÃ£o AnÃ£o (Lulu da PomerÃ¢nia) no interior de SÃ£o Paulo fica em BraganÃ§a Paulista. 13 anos de criaÃ§Ã£o, registro oficial, laudos e mentoria vitalÃ­cia. Atende Campinas, Sorocaba, SÃ£o JosÃ© dos Campos e todo SP.",
  keywords: [
    "canil Spitz AlemÃ£o interior SP",
    "canil Lulu da PomerÃ¢nia interior SÃ£o Paulo",
    "Spitz AlemÃ£o BraganÃ§a Paulista SP",
    "melhor canil Spitz AlemÃ£o SP",
    "filhote Lulu da PomerÃ¢nia interior SP",
    "criador Spitz AlemÃ£o Campinas SP",
  ],
  alternates: { canonical: "/canil-spitz-alemao-interior-sp" },
  openGraph: {
    title: "Canil Spitz AlemÃ£o AnÃ£o â€” Interior de SP | By ImpÃ©rio Dog",
    description: "ReferÃªncia no interior de SP: 13 anos de criaÃ§Ã£o responsÃ¡vel de Spitz AlemÃ£o AnÃ£o em BraganÃ§a Paulista.",
    type: "website",
  },
};

const CITIES = [
  "BraganÃ§a Paulista (sede)",
  "Atibaia",
  "JundiaÃ­",
  "Campinas e RegiÃ£o",
  "Sorocaba",
  "SÃ£o JosÃ© dos Campos",
  "TaubatÃ©",
  "Americana",
  "RibeirÃ£o Preto",
  "Franca",
  "Bauru",
  "Todo o interior de SP",
] as const;

const FAQS = [
  {
    question: "Qual o melhor canil de Spitz AlemÃ£o AnÃ£o no interior de SP?",
    answer:
      “A By ImpÃ©rio Dog Ã© reconhecida como referÃªncia no interior de SÃ£o Paulo com 13 anos de especializaÃ§Ã£o exclusiva em Spitz AlemÃ£o AnÃ£o. Localizada em BraganÃ§a Paulista, conta com mais de 180 famÃ­lias atendidas, registro oficial em 100% dos filhotes, laudos veterinÃ¡rios completos e mentoria vitalÃ­cia â€” um conjunto de diferenciais que poucos criadores da regiÃ£o oferecem.”,
  },
  {
    question: "VocÃªs entregam em Campinas, Sorocaba e outras cidades do interior?",
    answer:
      "Sim. Atendemos famÃ­lias de todo o interior de SP. Para cidades prÃ³ximas, Ã© possÃ­vel fazer a entrega pessoalmente ou o tutor vir buscar em BraganÃ§a Paulista. Para cidades mais distantes, o filhote pode ser transportado por transportadora especializada ou pelo prÃ³prio tutor apÃ³s visita.",
  },
  {
    question: "BraganÃ§a Paulista Ã© perto de Campinas?",
    answer:
      "BraganÃ§a Paulista fica a aproximadamente 90 km de Campinas (cerca de 1h de carro). Ã‰ facilmente acessÃ­vel pela Rodovia D. Pedro I (SP-065). Para tutores de Campinas, JundiaÃ­, Atibaia, Itatiba e cidades vizinhas, Ã© uma opÃ§Ã£o prÃ³xima.",
  },
  {
    question: "Existe algum canil de Spitz AlemÃ£o AnÃ£o em Campinas?",
    answer:
      "HÃ¡ criadores na regiÃ£o de Campinas, mas a recomendaÃ§Ã£o Ã© sempre verificar procedÃªncia, registro oficial, laudos veterinÃ¡rios e suporte pÃ³s-venda antes de qualquer decisÃ£o. A By ImpÃ©rio Dog em BraganÃ§a Paulista Ã© a referÃªncia mais prÃ³xima com todo esse conjunto de garantias documentado.",
  },
  {
    question: "Como agendar uma visita ao canil?",
    answer:
      "Visitas sÃ£o bem-vindas por agendamento via WhatsApp. TambÃ©m realizamos videochamadas para quem nÃ£o pode se deslocar. O processo de conhecer o canil, os pais e os filhotes Ã© parte fundamental antes da decisÃ£o de compra.",
  },
];

export default function CanilInteriorSPPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("OlÃ¡! Vi que vocÃªs sÃ£o referÃªncia de canil de Spitz AlemÃ£o no interior de SP. Pode me informar sobre disponibilidade de filhotes?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "InÃ­cio", url: `${SITE_URL}/` },
    { name: "Canil Spitz AlemÃ£o â€” Interior SP", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-isp-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-isp-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-isp-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-isp-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">ReferÃªncia no interior de SÃ£o Paulo</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Canil Spitz AlemÃ£o AnÃ£o no Interior de SP â€” By ImpÃ©rio Dog
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Se vocÃª mora no interior de SÃ£o Paulo e procura um criador responsÃ¡vel de Spitz AlemÃ£o AnÃ£o (Lulu da PomerÃ¢nia), a By ImpÃ©rio Dog em BraganÃ§a Paulista Ã© referÃªncia na regiÃ£o hÃ¡ 13 anos.
        </p>
      </header>

      {/* Credenciais */}
      <section aria-labelledby="cred-isp-heading">
        <h2 id="cred-isp-heading" className="sr-only">Credenciais</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { v: "2012", l: "FundaÃ§Ã£o" },
            { v: "13+", l: "Anos de criaÃ§Ã£o" },
            { v: "180+", l: "FamÃ­lias atendidas" },
            { v: "100%", l: "Com registro oficial" },
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
              <span className="text-emerald-500">âœ“</span>
              {city}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-isp-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-isp-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes ou agendar visita</h2>
        <p className="mt-2 text-sm text-zinc-600">Atendemos famÃ­lias de todo o interior de SP â€” pessoalmente ou com entrega.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver filhotes disponÃ­veis
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar no WhatsApp
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Lulu da PomerÃ¢nia em BraganÃ§a Paulista", href: "/lulu-da-pomerania-braganca-paulista", desc: "LocalizaÃ§Ã£o, visitas e como chegar" },
        { label: "Spitz AlemÃ£o AnÃ£o â€” A RaÃ§a",            href: "/spitz-alemao",                        desc: "CaracterÃ­sticas, temperamento e cuidados" },
        { label: "Ver Filhotes DisponÃ­veis",              href: "/filhotes",                            desc: "CatÃ¡logo atualizado com fotos e valores" },
      ]} />

      <nav aria-label="NavegaÃ§Ã£o estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">InÃ­cio</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Canil Spitz AlemÃ£o â€” Interior SP</li>
        </ol>
      </nav>
    </main>
  );
}
