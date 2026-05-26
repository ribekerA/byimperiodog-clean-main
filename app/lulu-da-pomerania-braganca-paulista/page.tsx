import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/lulu-da-pomerania-braganca-paulista`;

export const metadata: Metadata = {
  title: "Lulu da PomerÃ¢nia em BraganÃ§a Paulista SP | By ImpÃ©rio Dog â€” Canil ResponsÃ¡vel",
  description:
    "Canil de Lulu da PomerÃ¢nia (Spitz AlemÃ£o AnÃ£o) em BraganÃ§a Paulista, SP. CriaÃ§Ã£o familiar desde 2012, registro oficial, laudos veterinÃ¡rios e mentoria vitalÃ­cia. Atendemos BraganÃ§a Paulista, interior de SP e todo o Brasil.",
  keywords: [
    "Lulu da PomerÃ¢nia BraganÃ§a Paulista",
    "Spitz AlemÃ£o AnÃ£o BraganÃ§a Paulista",
    "canil Lulu da PomerÃ¢nia interior SP",
    "filhote Spitz AlemÃ£o BraganÃ§a Paulista SP",
    "criador Spitz AlemÃ£o perto de mim interior SP",
  ],
  alternates: { canonical: "/lulu-da-pomerania-braganca-paulista" },
  openGraph: {
    title: "Lulu da PomerÃ¢nia em BraganÃ§a Paulista SP â€” By ImpÃ©rio Dog",
    description: "CriaÃ§Ã£o familiar de Spitz AlemÃ£o AnÃ£o desde 2012. Atende BraganÃ§a Paulista e todo o Brasil.",
    type: "website",
  },
};

const FAQS = [
  {
    question: "A By ImpÃ©rio Dog fica em BraganÃ§a Paulista?",
    answer:
      "Sim. A By ImpÃ©rio Dog Ã© um canil familiar localizado em BraganÃ§a Paulista, SP, no interior de SÃ£o Paulo. Recebemos visitas agendadas para que o futuro tutor conheÃ§a a estrutura, os filhotes e os pais antes de tomar qualquer decisÃ£o.",
  },
  {
    question: "Fica longe de SÃ£o Paulo capital?",
    answer:
      "BraganÃ§a Paulista fica a aproximadamente 100 km de SÃ£o Paulo capital â€” cerca de 1h30 a 2h de carro pela Rodovia D. Pedro I (SP-065) ou pela Rodovia dos Bandeirantes. Ã‰ acessÃ­vel para quem mora na capital, Grande SP ou interior de SP.",
  },
  {
    question: "VocÃªs entregam fora de BraganÃ§a Paulista?",
    answer:
      "Sim. Atendemos famÃ­lias de todo o Brasil. O tutor pode buscar pessoalmente em BraganÃ§a Paulista ou o filhote pode ser transportado por transportadora aÃ©rea especializada. Auxiliamos em todo o processo de envio para qualquer estado.",
  },
  {
    question: "Posso fazer uma visita antes de decidir?",
    answer:
      "Sim. Fazemos videochamadas para mostrar a estrutura e os filhotes a qualquer momento. Visitas presenciais em BraganÃ§a Paulista sÃ£o bem-vindas por agendamento prÃ©vio via WhatsApp.",
  },
  {
    question: "BraganÃ§a Paulista tem outros canis de Spitz AlemÃ£o?",
    answer:
      “Existem outros criadores na regiÃ£o, mas a By ImpÃ©rio Dog Ã© reconhecida como referÃªncia pelo histÃ³rico de 13 anos, registro oficial em 100% dos filhotes, laudos veterinÃ¡rios completos e mentoria vitalÃ­cia pÃ³s-venda â€” diferenciais que poucos criadores da regiÃ£o oferecem juntos.”,
  },
];

export default function LuluBragancaPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("OlÃ¡! Vi o canil em BraganÃ§a Paulista e gostaria de saber sobre os filhotes disponÃ­veis.")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "InÃ­cio", url: `${SITE_URL}/` },
    { name: "Lulu da PomerÃ¢nia â€” BraganÃ§a Paulista", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-bp-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-bp-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-bp-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-bp-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">BraganÃ§a Paulista Â· Interior de SP</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Lulu da PomerÃ¢nia em BraganÃ§a Paulista, SP
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          A By ImpÃ©rio Dog Ã© um canil familiar especializado em Spitz AlemÃ£o AnÃ£o (Lulu da PomerÃ¢nia) localizado em BraganÃ§a Paulista, SP. Com mais de 13 anos de criaÃ§Ã£o responsÃ¡vel, atendemos famÃ­lias de toda a regiÃ£o e de todo o Brasil.
        </p>
      </header>

      {/* Mapa de info local */}
      <section aria-labelledby="local-heading" className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-8 space-y-5"
        itemScope itemType="https://schema.org/LocalBusiness">
        <h2 id="local-heading" className="text-xl font-bold text-zinc-900">InformaÃ§Ãµes do canil</h2>
        <meta itemProp="name" content="By ImpÃ©rio Dog" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Cidade", value: "BraganÃ§a Paulista, SP", itemprop: "addressLocality" },
            { label: "Atendimento", value: "Segâ€“SÃ¡b, 9hâ€“18h" },
            { label: "DistÃ¢ncia de SP Capital", value: "â‰ˆ 100 km / 1h30" },
            { label: "Visitas", value: "Por agendamento (WhatsApp)" },
            { label: "Desde", value: "2012 â€” 13+ anos de criaÃ§Ã£o" },
            { label: "FamÃ­lias atendidas", value: "180+ em todo o Brasil" },
          ].map((info) => (
            <div key={info.label} className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{info.label}</p>
              <p className="mt-1 text-sm font-medium text-zinc-900" {...(info.itemprop ? { itemProp: info.itemprop } : {})}>{info.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-bp-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-bp-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes disponÃ­veis ou agendar visita</h2>
        <p className="mt-2 text-sm text-zinc-600">CatÃ¡logo atualizado ou contato direto com a criadora em BraganÃ§a Paulista.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver filhotes
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Agendar visita â€” WhatsApp
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Canil â€” Interior de SP",      href: "/canil-spitz-alemao-interior-sp", desc: "Cidades atendidas no interior paulista" },
        { label: "Spitz AlemÃ£o AnÃ£o â€” A RaÃ§a",  href: "/spitz-alemao",                   desc: "CaracterÃ­sticas, cores e temperamento" },
        { label: "Ver Filhotes DisponÃ­veis",    href: "/filhotes",                        desc: "CatÃ¡logo atualizado com fotos e valores" },
      ]} />

      <nav aria-label="NavegaÃ§Ã£o estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">InÃ­cio</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Lulu da PomerÃ¢nia â€” BraganÃ§a Paulista</li>
        </ol>
      </nav>
    </main>
  );
}
