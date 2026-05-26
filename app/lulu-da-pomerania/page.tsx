import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/lulu-da-pomerania`;

export const metadata: Metadata = {
  title: "Lulu da PomerÃ¢nia â€” RaÃ§a, PreÃ§o, Cuidados e Filhotes | By ImpÃ©rio Dog",
  description:
    "Guia completo sobre o Lulu da PomerÃ¢nia (Spitz AlemÃ£o AnÃ£o): caracterÃ­sticas, personalidade, preÃ§os em 2025, cuidados, cores e onde comprar com seguranÃ§a. Criadora responsÃ¡vel em BraganÃ§a Paulista, SP.",
  keywords: [
    "Lulu da PomerÃ¢nia",
    "Lulu da PomerÃ¢nia preÃ§o",
    "Lulu da PomerÃ¢nia filhotes",
    "Lulu da PomerÃ¢nia cuidados",
    "Lulu da PomerÃ¢nia caracterÃ­sticas",
    "comprar Lulu da PomerÃ¢nia",
    "Lulu da PomerÃ¢nia SP",
  ],
  alternates: { canonical: "/lulu-da-pomerania" },
  openGraph: {
    title: "Lulu da PomerÃ¢nia â€” Guia Completo da RaÃ§a | By ImpÃ©rio Dog",
    description: "CaracterÃ­sticas, preÃ§os, cuidados e onde comprar Lulu da PomerÃ¢nia com seguranÃ§a.",
    type: "article",
  },
};

const FAQS = [
  {
    question: "Lulu da PomerÃ¢nia e Spitz AlemÃ£o AnÃ£o sÃ£o a mesma raÃ§a?",
    answer:
      "Sim, sÃ£o nomes para exatamente o mesmo cÃ£o. 'Lulu da PomerÃ¢nia' Ã© o apelido popular no Brasil; 'Spitz AlemÃ£o AnÃ£o' Ã© a denominaÃ§Ã£o oficial reconhecida pela FCI. Em inglÃªs, a raÃ§a Ã© chamada 'Pomeranian'. Qualquer uma dessas buscas refere-se ao mesmo animal fofo, compacto e de pelagem densa.",
  },
  {
    question: "Quanto custa um Lulu da PomerÃ¢nia?",
    answer:
      “Na By ImpÃ©rio Dog, os preÃ§os variam de R$ 7.000 a R$ 15.000 dependendo da cor e do sexo. Machos a partir de R$ 7.000 (laranja) e fÃªmeas a partir de R$ 10.000. O valor inclui registro oficial, laudos veterinÃ¡rios, vacinaÃ§Ã£o completa, microchip e mentoria vitalÃ­cia â€” sem cobranÃ§as extras.”,
  },
  {
    question: "O Lulu da PomerÃ¢nia Ã© bom com crianÃ§as?",
    answer:
      "Sim, desde que a interaÃ§Ã£o seja supervisionada e a socializaÃ§Ã£o seja feita corretamente desde filhote. O Lulu da PomerÃ¢nia Ã© afetivo e brincalhÃ£o, mas por ser de porte muito pequeno, crianÃ§as muito novas podem machucar o animal sem querer. Recomendamos famÃ­lias com crianÃ§as acima de 6 anos.",
  },
  {
    question: "Lulu da PomerÃ¢nia perde muito pelo?",
    answer:
      "Sim. A pelagem dupla e densa solta pelos, especialmente em duas Ã©pocas de muda por ano. EscovaÃ§Ã£o frequente (3â€“4Ã— por semana) reduz significativamente a quantidade de pelos pelo apartamento ou casa.",
  },
  {
    question: "Qual a expectativa de vida do Lulu da PomerÃ¢nia?",
    answer:
      "Entre 12 e 16 anos. RaÃ§as pequenas geralmente vivem mais do que raÃ§as grandes. Com criaÃ§Ã£o responsÃ¡vel (sem problemas genÃ©ticos hereditÃ¡rios), alimentaÃ§Ã£o adequada e acompanhamento veterinÃ¡rio regular, muitos chegam ao meio da faixa ou alÃ©m.",
  },
  {
    question: "O Lulu da PomerÃ¢nia precisa de banho frequente?",
    answer:
      "A cada 15â€“21 dias Ã© o ideal. A pelagem densa pode reter odores e sujeira se o intervalo for muito longo. A secagem completa apÃ³s o banho Ã© obrigatÃ³ria â€” pelo Ãºmido por horas favorece fungos e dermatites.",
  },
];

export default function LuluDaPomeraniaPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("OlÃ¡! Vi a pÃ¡gina sobre Lulu da PomerÃ¢nia no site da By ImpÃ©rio Dog e gostaria de informaÃ§Ãµes sobre filhotes.")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "InÃ­cio", url: `${SITE_URL}/` },
    { name: "Lulu da PomerÃ¢nia", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-lulu-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-lulu-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-lulu-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-lulu-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      {/* HERO */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Guia completo da raÃ§a</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Lulu da PomerÃ¢nia â€” tudo que vocÃª precisa saber
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          O Lulu da PomerÃ¢nia Ã© um dos cÃ£es de companhia mais amados do Brasil â€” pequeno, fofo, inteligente e cheio de personalidade. Aqui vocÃª encontra tudo: o que Ã© a raÃ§a, quanto custa, como cuidar e onde encontrar filhotes com procedÃªncia.
        </p>
      </header>

      {/* O que Ã© */}
      <section aria-labelledby="oque-heading" className="space-y-3">
        <h2 id="oque-heading" className="text-2xl font-bold text-zinc-900">O que Ã© o Lulu da PomerÃ¢nia?</h2>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          O Lulu da PomerÃ¢nia Ã© o nome popular no Brasil para o <strong>Spitz AlemÃ£o AnÃ£o</strong> â€” uma raÃ§a de pequeno porte originÃ¡ria da regiÃ£o da PomerÃ¢nia (atual norte da Alemanha e PolÃ´nia). No mundo, Ã© conhecido como <strong>Pomeranian</strong>. Todos esses nomes se referem ao mesmo cÃ£o compacto, com pelagem dupla densa, orelhas eretas pontudas e rabo enrolado sobre o dorso.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed sm:text-base">
          Pesa entre 1,5 e 3,5 kg na fase adulta e atinge no mÃ¡ximo 22 cm de altura na cernelha. Apesar do tamanho diminuto, tem <em>personalidade gigante</em>: Ã© curioso, expressivo, adora atenÃ§Ã£o e aprende comandos com facilidade.
        </p>
      </section>

      {/* Personalidade */}
      <section aria-labelledby="personalidade-heading" className="space-y-4">
        <h2 id="personalidade-heading" className="text-2xl font-bold text-zinc-900">Personalidade e comportamento</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "ðŸ§ ", t: "Muito inteligente", b: "Aprende comandos rÃ¡pido. Ideal para treino positivo." },
            { emoji: "ðŸ’›", t: "Afetivo", b: "Cria laÃ§os fortes com a famÃ­lia. Gosta de colo e atenÃ§Ã£o." },
            { emoji: "ðŸ ", t: "Ã“timo para apto", b: "Adapta-se muito bem a apartamentos com espaÃ§o limitado." },
            { emoji: "ðŸŽ­", t: "Expressivo", b: "Demonstra humor, alegria e curiosidade visivelmente." },
            { emoji: "ðŸ””", t: "Alerta", b: "Bom 'vigia' natural. Avisa sobre movimentos externos." },
            { emoji: "ðŸ‘¶", t: "SociÃ¡vel", b: "Quando bem socializado, convive bem com crianÃ§as e outros pets." },
          ].map((card) => (
            <article key={card.t} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <span className="text-2xl">{card.emoji}</span>
              <h3 className="mt-2 text-sm font-semibold text-zinc-900">{card.t}</h3>
              <p className="mt-1 text-xs text-zinc-500">{card.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PreÃ§os */}
      <section aria-labelledby="precos-heading" className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-8 space-y-4">
        <h2 id="precos-heading" className="text-2xl font-bold text-zinc-900">Quanto custa um Lulu da PomerÃ¢nia?</h2>
        <p className="text-sm text-zinc-700">
          Na By ImpÃ©rio Dog os preÃ§os sÃ£o:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { cor: "Laranja Macho",    valor: "R$ 7.000", tag: "a partir de" },
            { cor: "Laranja FÃªmea",    valor: "R$ 10.000", tag: "a partir de" },
            { cor: "Wolf Sable Macho", valor: "R$ 7.500", tag: "a partir de" },
            { cor: "Creme FÃªmea",      valor: "R$ 15.000", tag: "mais valorizado" },
          ].map((p) => (
            <div key={p.cor} className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">{p.tag}</p>
              <p className="text-xl font-bold text-emerald-700">{p.valor}</p>
              <p className="text-sm text-zinc-600">{p.cor}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">Inclui registro oficial, laudos, vacinaÃ§Ã£o, microchip e mentoria vitalÃ­cia. <Link href="/preco-spitz-anao" className="underline hover:text-emerald-700">Ver tabela completa â†’</Link></p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-lulu-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-lulu-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes sobre o Lulu da PomerÃ¢nia</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Pronto para conhecer os filhotes?</h2>
        <p className="mt-2 text-sm text-zinc-600">Acesse o catÃ¡logo atualizado ou fale com a criadora diretamente.</p>
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
        { label: "Spitz AlemÃ£o AnÃ£o",       href: "/spitz-alemao",         desc: "Ficha tÃ©cnica, origem e temperamento" },
        { label: "Tabela de PreÃ§os 2025",   href: "/preco-spitz-anao",     desc: "Valores por cor e sexo em detalhe" },
        { label: "Como Comprar com SeguranÃ§a", href: "/comprar-spitz-anao", desc: "Guia passo a passo para nÃ£o cair em golpes" },
      ]} />

      <nav aria-label="NavegaÃ§Ã£o estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">InÃ­cio</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Lulu da PomerÃ¢nia</li>
        </ol>
      </nav>
    </main>
  );
}
