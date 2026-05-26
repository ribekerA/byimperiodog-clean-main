import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildArticleLD } from "@/lib/schema";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/filhote-de-spitz-alemao`;

export const metadata: Metadata = {
  title: "Filhote de Spitz Alemão Anão — Como Escolher, Cuidar e Onde Comprar | By Império Dog",
  description:
    "Guia completo para quem quer um filhote de Spitz Alemão Anão: como escolher, o que verificar, os primeiros cuidados, alimentação, vacinação e onde encontrar filhotes com procedência no Brasil.",
  keywords: [
    "filhote de Spitz Alemão Anão",
    "filhote Lulu da Pomerânia",
    "como escolher filhote Spitz Alemão",
    "filhote Spitz Alemão com documentação Brasil",
    "cuidados filhote Spitz Alemão",
    "filhote Lulu da Pomerânia disponível SP",
  ],
  alternates: { canonical: "/filhote-de-spitz-alemao" },
  openGraph: {
    title: "Filhote de Spitz Alemão Anão — Guia Completo | By Império Dog",
    description: "Como escolher, o que verificar e os primeiros cuidados com um filhote de Spitz Alemão Anão.",
    type: "article",
  },
};

const FIRST_DAYS = [
  { title: "Ambiente seguro", body: "Prepare um espaço calmo com cama, tapete higiênico e brinquedos. Evite visitantes nas primeiras 48–72 horas para não sobrecarregar o filhote." },
  { title: "Alimentação", body: "Mantenha a ração indicada pela criadora por pelo menos 15 dias antes de qualquer troca. Mudanças bruscas de dieta causam diarreia em filhotes pequenos." },
  { title: "Hidratação", body: "Água fresca disponível 24h. Filhotes de porte muito pequeno podem sofrer hipoglicemia — alimentação a cada 4–6 horas é essencial nos primeiros dias." },
  { title: "Veterinário", body: "Agende consulta veterinária nas primeiras 72 horas. Leve a carteira de vacinação, histórico de vermifugação e o laudo de saúde entregues pela criadora." },
  { title: "Temperatura", body: "Filhotes têm dificuldade de regular temperatura. Mantenha entre 22–24°C. Evite correntes de ar, piso frio e ar-condicionado direto." },
  { title: "Socialização gradual", body: "Permita exploração no espaço seguro antes de apresentar outros animais ou crianças. Respeite o ritmo do filhote para evitar trauma." },
];

const FAQS = [
  {
    question: "Com quantas semanas o filhote de Spitz Alemão pode sair da criadora?",
    answer:
      "O ideal é que o filhote saia com no mínimo 60 dias de vida — nunca antes. Filhotes muito novos separados da mãe e da ninhada têm maior risco de problemas comportamentais, imunológicos e de socialização. Criadores responsáveis não antecipam a entrega por pressão do comprador.",
  },
  {
    question: "Quais vacinas o filhote precisa tomar?",
    answer:
      "O protocolo padrão é: V8 ou V10 a partir das 6–8 semanas (com reforços a cada 3–4 semanas até 16 semanas), antirrábica após 12 semanas e reforço anual de todas as vacinas. Filhotes da By Império Dog saem com a primeira dose em dia e com o calendário completo orientado.",
  },
  {
    question: "O que perguntar ao criador antes de comprar o filhote?",
    answer:
      "Pergunte: (1) Os pais têm laudo de saúde? (2) O filhote tem registro oficial? (3) Quais exames foram feitos? (4) Qual o protocolo de vacinação? (5) Posso fazer visita ou videochamada? (6) Tem contrato de venda? (7) Qual o suporte pós-venda? Se o criador hesitar em qualquer dessas, é um sinal de alerta.",
  },
  {
    question: "O filhote de Spitz Alemão Anão é difícil de adestrar?",
    answer:
      "Não — é uma das raças mais inteligentes e treináveis de pequeno porte. Aprende comandos rápido com reforço positivo. O maior desafio é o treino de higiene (xixi no lugar certo), que exige consistência e paciência nas primeiras semanas. Filhotes bem socializados desde filhote têm muito menos problemas comportamentais.",
  },
  {
    question: "Quando o filhote de Spitz Alemão pode sair para passear?",
    answer:
      "Só após completar o ciclo vacinal básico — geralmente entre 14 e 16 semanas de vida. Antes disso, o sistema imunológico ainda está em formação e o filhote está vulnerável a doenças como parvovirose e cinomose. Consulte o veterinário para a liberação final.",
  },
];

export default function FilhoteDeSpitzPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Tenho interesse em um filhote de Spitz Alemão Anão da By Império Dog. Pode me informar disponibilidade?")}`
    : "#";

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: "Filhote de Spitz Alemão", url: PAGE_URL },
  ]);
  const faqLd      = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01" });

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <Script id="ld-fil-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-fil-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-fil-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <Script id="ld-fil-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Guia completo para novos tutores</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Filhote de Spitz Alemão Anão — como escolher, cuidar e onde comprar
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Um guia prático para quem está pensando em ter um filhote de Spitz Alemão Anão (Lulu da Pomerânia): o que verificar antes de comprar, os primeiros dias em casa e o que esperar nos primeiros meses.
        </p>
      </header>

      {/* Como escolher */}
      <section aria-labelledby="escolher-heading" className="space-y-4">
        <h2 id="escolher-heading" className="text-2xl font-bold text-zinc-900">Como escolher um filhote de Spitz Alemão Anão</h2>
        <p className="text-sm text-zinc-700 sm:text-base">
          A escolha começa muito antes de ver o filhote — começa com a <strong>escolha do criador</strong>. Um filhote saudável, equilibrado e bem socializado é resultado direto de uma criação responsável. Avalie:
        </p>
        <ul className="space-y-3">
          {[
            { t: "Procedência documentada", b: "Registro oficial nos pais e garantia de registro no filhote. Sem isso, não há garantia racial ou rastreabilidade genética." },
            { t: "Laudos veterinários dos pais", b: "Laudo de saúde e teste de patela bilateral dos reprodutores antes de cada ninhada." },
            { t: "Socialização comprovada", b: "Filhotes criados dentro de casa, com contato humano diário, sons e rotinas domésticas têm temperamento muito mais equilibrado." },
            { t: "Carteira de vacinação em dia", b: "A primeira dose da vacina múltipla (V8/V10) deve estar aplicada antes da entrega." },
            { t: "Contrato com garantia", b: "Contrato claro com garantia de saúde, responsabilidades e suporte pós-venda." },
          ].map((item) => (
            <li key={item.t} className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
              <span className="mt-0.5 text-emerald-500 font-bold">✓</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{item.t}</p>
                <p className="mt-0.5 text-sm text-zinc-600">{item.b}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Primeiros dias */}
      <section aria-labelledby="primeiros-dias-heading" className="space-y-4">
        <h2 id="primeiros-dias-heading" className="text-2xl font-bold text-zinc-900">Primeiros dias em casa</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIRST_DAYS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-fil-heading" itemScope itemType="https://schema.org/FAQPage">
        <h2 id="faq-fil-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
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
        <h2 className="text-xl font-bold text-zinc-900">Ver filhotes disponíveis agora</h2>
        <p className="mt-2 text-sm text-zinc-600">Catálogo completo com fotos, sexo, cor e valor — atualizado regularmente.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/filhotes" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700">
            Ver catálogo de filhotes
          </Link>
          {phone && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Falar com a criadora
            </a>
          )}
        </div>
      </section>

      <RelatedPages links={[
        { label: "Spitz Alemão Anão — Raça Completa", href: "/spitz-alemao",              desc: "Tudo sobre a raça antes de decidir" },
        { label: "Como Comprar com Segurança",        href: "/comprar-spitz-anao",         desc: "Passo a passo para não errar" },
        { label: "Criador Confiável — Como Identificar", href: "/criador-spitz-confiavel", desc: "Documentação, laudos e red flags" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/filhotes" className="hover:text-emerald-700">Filhotes</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Filhote de Spitz Alemão</li>
        </ol>
      </nav>
    </main>
  );
}
