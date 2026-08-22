import Link from "next/link";
import type { Metadata } from "next";

import { RelatedPages } from "@/components/common/RelatedPages";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/filhote-de-spitz-alemao`;

export const metadata: Metadata = {
  title: "Filhote de Spitz Alemão Anão — Onde Comprar",
  description:
    // 192 caracteres, e sem o sinônimo pelo qual a raça é mais pesquisada.
    // Reescrita em 155, agora com "Lulu da Pomerânia".
    "Filhote de Spitz Alemão Anão: como escolher, o que verificar, primeiros cuidados, alimentação e vacinação. Onde comprar com procedência.",
  keywords: [
    "filhote de Spitz Alemão Anão",
    "filhote Lulu da Pomerânia",
    "como escolher filhote Spitz Alemão",
    "filhote Spitz Alemão com documentação Brasil",
    "cuidados filhote Spitz Alemão",
    "filhote Lulu da Pomerânia disponível SP",
    "Pomeranian",
    "Pomeranian Brasil",
  ],
  alternates: { canonical: "/filhote-de-spitz-alemao" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Filhote de Spitz Alemão Anão — Guia Completo | By Império Dog",
    description: "Como escolher, o que verificar e os primeiros cuidados com um filhote de Spitz Alemão Anão.",
    type: "article",
  },
};

const FIRST_DAYS = [
  { title: "Ambiente seguro", body: "Prepare um espaço calmo com cama, tapete higiênico e brinquedos. Evite visitantes nas primeiras 48–72 horas para não sobrecarregar o filhote." },
  { title: "Alimentação", body: "Mantenha a ração indicada pela criadora por pelo menos 15 dias antes de qualquer troca. Mudanças bruscas de dieta causam diarreia em filhotes pequenos." },
  { title: "Hidratação", body: "Água fresca disponível 24h. Filhotes de porte muito pequeno podem sofrer hipoglicemia — alimentação a cada 4–6 horas é essencial nos primeiros dias." },
  { title: "Veterinário", body: "Agende a primeira consulta veterinária logo após a chegada e confira no contrato os prazos previstos. Leve a carteira de vacinação, o histórico de vermifugação e os exames entregues pela criadora." },
  { title: "Temperatura", body: "Filhotes têm dificuldade de regular temperatura. Mantenha entre 22–24°C. Evite correntes de ar, piso frio e ar-condicionado direto." },
  { title: "Socialização gradual", body: "Permita exploração no espaço seguro antes de apresentar outros animais ou crianças. Respeite o ritmo do filhote para evitar trauma." },
];

const FAQS = [
  {
    question: "Quando o filhote de Spitz Alemão pode ir para o novo lar?",
    answer:
      "A comercialização e a entrega são realizadas somente após o cumprimento dos requisitos sanitários, de identificação e documentais previstos na legislação aplicável. Do ponto de vista do desenvolvimento, filhotes separados cedo demais da mãe e da ninhada têm maior risco de problemas comportamentais, imunológicos e de socialização — por isso criadores responsáveis não antecipam a entrega por pressão do comprador.",
  },
  {
    question: "Quais vacinas o filhote precisa tomar?",
    answer:
      "Os filhotes da By Império Dog são entregues vacinados e vermifugados, com o protocolo em andamento conforme a idade e definido pelo médico-veterinário responsável, com carteira de vacinação assinada pelo médico-veterinário e orientação por escrito das doses seguintes. O protocolo em andamento não é, por si só, condição suficiente para a entrega: a comercialização e a entrega são realizadas somente após o cumprimento dos requisitos sanitários, de identificação e documentais previstos na legislação aplicável.",
  },
  {
    question: "O que perguntar ao criador antes de comprar o filhote?",
    answer:
      "Pergunte: (1) O filhote tem registro oficial? (2) Quais exames foram feitos? (3) Qual o protocolo de vacinação e o que consta na carteira? (4) Como a criação pode ser verificada? (5) Tem contrato de venda, e o que ele descreve? (6) Qual o suporte após a entrega? Um criador responsável responde todas essas perguntas sem dificuldade.",
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
  const articleLd  = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <script id="ld-fil-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-fil-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-fil-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script id="ld-fil-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

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
            { t: "Procedência documentada", b: "Registro oficial nos pais e garantia de registro no filhote — é o que permite conferir a linhagem por escrito." },
            { t: "Laudos veterinários dos pais", b: "Pergunte quais exames os reprodutores fizeram e peça os laudos por escrito." },
            { t: "Socialização em ambiente familiar", b: "Filhotes criados dentro de casa, com contato humano diário, sons e rotinas domésticas tendem a se adaptar melhor à rotina da nova família." },
            { t: "Carteira de vacinação em dia", b: "Protocolo vacinal em dia conforme a idade do filhote, com carteira de vacinação assinada pelo médico-veterinário e orientação para as doses seguintes." },
            { t: "Contrato claro", b: "Contrato que descreve por escrito as condições de saúde, as responsabilidades de cada parte e o suporte pós-venda." },
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
    </div>
  );
}
