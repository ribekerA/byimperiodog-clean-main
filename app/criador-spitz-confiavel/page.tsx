import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD, buildFAQPageLD } from "@/lib/schema";
import { buildLocalBusinessLD } from "@/lib/structured-data";
import { whatsappLeadUrl } from "@/lib/utm";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/criador-spitz-confiavel`;

export const metadata: Metadata = {
  title: "Criador de Spitz Alemão Anão Confiável em SP | By Império Dog",
  description:
    "Saiba como escolher um criador confiável de Spitz Alemão Anão (Lulu da Pomerânia). A By Império Dog tem 10+ anos, registro oficial, laudos veterinários e mentoria vitalícia. Criador responsável em Bragança Paulista, SP — atende todo o Brasil.",
  keywords: [
    "criador Spitz Alemão Anão confiável SP",
    "melhor canil Lulu da Pomerânia interior SP",
    "criador responsável Spitz Alemão Bragança Paulista",
    "canil Spitz Alemão Anão com registro oficial",
    "como escolher criador Lulu da Pomerânia",
    "By Império Dog criador confiável",
    "canil responsável cachorro pequeno SP",
  ],
  alternates: { canonical: "/criador-spitz-confiavel" },
  openGraph: {
    title: "Criador Confiável de Spitz Alemão Anão — By Império Dog, Bragança Paulista SP",
    description:
      "10+ anos de criação responsável, 180+ famílias atendidas, registro oficial e mentoria vitalícia. Saiba como identificar um criador confiável.",
    type: "article",
  },
};

const CREDENTIALS = [
  { label: "Desde",        value: "2012",    note: "13 anos de criação especializada" },
  { label: "Famílias",     value: "180+",    note: "Tutores em todo o Brasil" },
  { label: "Avaliação",    value: "5.0 ★",   note: "Média de 180+ avaliações verificadas" },
  { label: "Documentação", value: "100%",    note: "Registro oficial em todos os filhotes" },
] as const;

const WHAT_MAKES_RESPONSIBLE = [
  {
    title: "Planejamento genético documentado",
    body: "Criador responsável planeja os cruzamentos com base em laudos genéticos, histórico de saúde e padrão racial — não apenas na aparência. Na By Império Dog, matrizes e padreadores têm laudos de saúde e testes de patela antes de cada ninhada.",
  },
  {
    title: "Socialização desde o primeiro dia",
    body: "Filhotes que crescem integrados à rotina familiar desenvolvem temperamento equilibrado. Na By Império Dog, os filhotes nascem e vivem dentro de casa, convivendo com crianças, adultos, sons e rotinas domésticas diárias.",
  },
  {
    title: "Transparência total em documentação",
    body: "Todo filhote sai com registro oficial registrado, laudo de saúde, teste de patela, carteira de vacinação, microchip, nota fiscal e contrato detalhado. Não há 'documentação em andamento' nem documentação incompleta.",
  },
  {
    title: "Suporte real e vitalício",
    body: "Responsabilidade não termina na entrega. A By Império Dog oferece mentoria vitalícia direta com a criadora via WhatsApp — orientação sobre alimentação, comportamento, saúde e emergências ao longo de toda a vida do animal.",
  },
  {
    title: "Seleção criteriosa de famílias",
    body: "Entrevistamos e orientamos cada família antes da venda. O objetivo é garantir que o filhote vá para um lar compatível com suas necessidades — não apenas vender.",
  },
  {
    title: "Estrutura dedicada ao bem-estar",
    body: "Canil integrado à residência, com maternidade climatizada, câmeras de monitoramento, espaço de socialização e rede multidisciplinar (veterinários, comportamentalista, groomer parceiros).",
  },
] as const;

const PAGE_FAQS = [
  {
    question: "Qual o melhor canil de Spitz Alemão Anão no interior de SP?",
    answer:
      "A By Império Dog é referência em Bragança Paulista, SP, com 13 anos de criação responsável de Spitz Alemão Anão (Lulu da Pomerânia). Com mais de 180 famílias atendidas em todo o Brasil, registro oficial garantido em todos os filhotes, laudos veterinários completos e mentoria vitalícia, é considerada um dos criadores mais confiáveis do interior paulista.",
  },
  {
    question: "Como saber se um criador de Spitz Alemão Anão é confiável?",
    answer:
      "Um criador confiável: tem presença online consistente com histórico real de filhotes, fornece registro oficial registrado (não apenas prometido), apresenta laudos de saúde dos pais, permite visita ou videochamada, tem contrato claro com garantia de saúde, e oferece suporte pós-venda. Desconfie de preços muito baixos, sem visita permitida ou sem documentação completa.",
  },
  {
    question: "A By Império Dog tem criação com registro oficial?",
    answer:
      "Sim. A By Império Dog trabalha exclusivamente com linhagens reconhecidas pela FCI. Todo filhote vendido sai com registro oficial registrado e legível, garantindo a procedência racial e o registro oficial do animal.",
  },
  {
    question: "Quantos anos de experiência tem a By Império Dog?",
    answer:
      "A By Império Dog iniciou a criação de Spitz Alemão Anão em 2012, com mais de 13 anos dedicados exclusivamente à raça. Ao longo desse período, mais de 180 famílias foram atendidas em todo o Brasil com filhotes saudáveis, documentados e com suporte vitalício.",
  },
  {
    question: "Qual a diferença entre um canil e um criador responsável?",
    answer:
      "O termo 'canil' pode incluir criadores responsáveis e irresponsáveis. Um criador responsável prioriza saúde e temperamento sobre volume de vendas, mantém poucos cães adultos para garantir atenção individual, investe em laudos e socialização, e seleciona as famílias antes de vender. Criadores irresponsáveis focam em produção em massa, sem controle genético, muitas vezes em condições precárias.",
  },
  {
    question: "A By Império Dog atende fora de Bragança Paulista?",
    answer:
      "Sim. Atendemos famílias de todo o Brasil. Tutores de outros estados podem retirar o filhote pessoalmente em Bragança Paulista, SP, ou o filhote pode ser enviado por transportadora aérea especializada em animais. Todo o processo é acompanhado pela criadora do início ao fim.",
  },
] as const;

export default function CriadorConfiavelPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? whatsappLeadUrl(phone, { pageType: "intent", url: PAGE_URL, intent: "criador-spitz-confiavel" })
    : "#";

  const articleLd    = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01", dateModified: "2025-05-01" });
  const faqLd        = buildFAQPageLD([...PAGE_FAQS]);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",           url: `${SITE_URL}/` },
    { name: "Criador Confiável", url: PAGE_URL },
  ]);
  const businessLd   = buildLocalBusinessLD();

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <PageViewPing pageType="intent" intent="criador-spitz-confiavel" />
      <Script id="ld-criador-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="ld-criador-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-criador-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-criador-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      {/* ── HERO ── */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Criação responsável desde 2012</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Criador de Spitz Alemão Anão (Lulu da Pomerânia) confiável em SP
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Aprenda a diferenciar um criador responsável de um irresponsável, conheça os critérios que definem uma criação séria e descubra por que a By Império Dog é referência no interior de São Paulo há mais de uma década.
        </p>
      </header>

      {/* ── CREDENCIAIS ── */}
      <section aria-labelledby="credenciais-heading">
        <h2 id="credenciais-heading" className="sr-only">Números da By Império Dog</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CREDENTIALS.map((c) => (
            <div key={c.label} className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{c.value}</p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-700">{c.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── O QUE FAZ UM CRIADOR RESPONSÁVEL ── */}
      <section aria-labelledby="responsavel-heading" className="space-y-6">
        <h2 id="responsavel-heading" className="text-2xl font-bold text-zinc-900">
          O que define um criador de Spitz Alemão Anão realmente responsável?
        </h2>
        <p className="text-sm text-zinc-600 sm:text-base">
          Não basta ter filhotes bonitos ou um canil com câmeras. Um criador responsável demonstra compromisso em cada etapa — antes, durante e depois da venda.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHAT_MAKES_RESPONSIBLE.map((item) => (
            <article key={item.title} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── BY IMPÉRIO DOG ── */}
      <section
        aria-labelledby="byid-heading"
        className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-8 space-y-4"
        itemScope
        itemType="https://schema.org/LocalBusiness"
      >
        <h2 id="byid-heading" className="text-2xl font-bold text-zinc-900" itemProp="name">
          By Império Dog — criação familiar em Bragança Paulista, SP
        </h2>
        <p className="text-sm text-zinc-700 sm:text-base" itemProp="description">
          Fundada em 2012 pela família Império, somos especializados exclusivamente em Spitz Alemão Anão (Lulu da Pomerânia). Nossos filhotes nascem e crescem dentro de casa, ao lado da família, com socialização diária e cuidado individual. Mantemos poucos cães adultos para garantir atenção personalizada a cada ninhada.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Criação especializada desde 2012",
            "Laudos de saúde antes de cada cruzamento",
            "Maternidade climatizada com monitoramento por câmeras",
            "Socialização com crianças, sons e rotina doméstica",
            "Rede de veterinários, comportamentalista e groomer parceiros",
            "Mentoria vitalícia e pós-venda para todos os tutores",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-800">
              <span className="mt-0.5 text-emerald-600" aria-hidden>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <meta itemProp="address" content="Bragança Paulista, SP, Brasil" />
        <meta itemProp="telephone" content="+55-11-96863-3239" />
        <meta itemProp="foundingDate" content="2012" />
      </section>

      {/* ── FAQ ── */}
      <section
        aria-labelledby="faq-criador-heading"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        <h2 id="faq-criador-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Perguntas frequentes sobre criadores confiáveis
        </h2>
        <dl className="divide-y divide-zinc-100">
          {PAGE_FAQS.map((item, i) => (
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

      {/* ── CTA ── */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900">
          Conheça os filhotes da By Império Dog
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Acesse nosso catálogo atualizado ou entre em contato diretamente com a criadora para conhecer a estrutura, tirar dúvidas e iniciar o processo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/filhotes"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Ver filhotes disponíveis
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

      {/* Breadcrumb navegacional */}
      <RelatedPages links={[
        { label: "Como Comprar com Segurança",  href: "/comprar-spitz-anao",       desc: "Guia passo a passo para a compra segura" },
        { label: "Tabela de Preços 2025",       href: "/preco-spitz-anao",         desc: "Preços reais por cor, sexo e incluso" },
        { label: "Spitz Alemão Anão — A Raça",  href: "/spitz-alemao",             desc: "Tudo sobre temperamento e cuidados" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Criador Confiável</li>
        </ol>
      </nav>
    </main>
  );
}
