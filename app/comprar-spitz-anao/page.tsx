import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD, buildFAQPageLD } from "@/lib/schema";
import { buildLocalBusinessLD } from "@/lib/structured-data";
import { whatsappLeadUrl } from "@/lib/utm";
import { RelatedPages } from "@/components/common/RelatedPages";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/comprar-spitz-anao`;

export const metadata: Metadata = {
  title: "Como Comprar Spitz Alemão Anão com Segurança | By Império Dog",
  description:
    "Guia completo para comprar um filhote de Spitz Alemão Anão (Lulu da Pomerânia) com segurança. Saiba o que verificar, quais documentos exigir, como evitar golpes e onde encontrar criadores responsáveis em Bragança Paulista, SP.",
  keywords: [
    "comprar Spitz Alemão Anão",
    "onde comprar Lulu da Pomerânia confiável",
    "como comprar filhote Spitz Alemão com documentação",
    "Lulu da Pomerânia à venda SP",
    "canil Spitz Alemão responsável interior SP",
    "comprar Pomeranian Brasil com garantia",
    "filhote Lulu da Pomerânia documentado",
  ],
  alternates: { canonical: "/comprar-spitz-anao" },
  openGraph: {
    title: "Como Comprar Spitz Alemão Anão com Segurança — By Império Dog",
    description:
      "Guia completo: o que exigir, documentos obrigatórios, sinais de alerta e como funciona a compra na By Império Dog. Bragança Paulista, SP.",
    type: "article",
  },
};

const CHECKLIST_YES = [
  "Registro oficial registrado (não apenas 'em andamento')",
  "Laudo de saúde dos pais e do filhote",
  "Teste de patela bilateral",
  "Carteira de vacinação com carimbos veterinários reais",
  "Contrato claro com garantia de saúde e suporte pós-venda",
  "Fotos e vídeos reais — sem filtros exagerados",
  "Visita ou videochamada para conhecer a estrutura",
  "Referências de compradores anteriores",
] as const;

const CHECKLIST_NO = [
  "Preço muito abaixo do mercado (menos de R$ 3.000)",
  "Sem documentação ou 'registro no futuro'",
  "Não permite visitar ou fazer videochamada",
  "Filhotes entregues com menos de 60 dias",
  "Sem contrato ou contrato genérico sem garantia",
  "Pagamento apenas via Pix antecipado sem comprovantes",
  "Várias ninhadas 'sempre disponíveis' ao mesmo tempo",
] as const;

const STEPS = [
  { num: "01", title: "Pesquise e compare criadores", body: "Busque criadores com histórico online, avaliações reais de clientes e presença nas redes sociais. Desconfie de quem não tem referências." },
  { num: "02", title: "Solicite documentação dos pais", body: "Exija o registro oficial dos pais, laudos de saúde e histórico veterinário antes de qualquer pagamento. Um criador responsável apresenta tudo sem hesitar." },
  { num: "03", title: "Faça uma visita ou videochamada", body: "Ver o ambiente onde o filhote cresceu é essencial. Na By Império Dog fazemos videochamadas e recebemos visitas agendadas." },
  { num: "04", title: "Confirme reserva com contrato", body: "A reserva é formalizada com contrato detalhado e sinal. O contrato cobre garantia de saúde, suporte pós-venda e responsabilidades de ambas as partes." },
  { num: "05", title: "Receba o filhote com toda a documentação", body: "Na entrega, o filhote vem com registro oficial, laudo de saúde, carteira de vacinação, microchip, nota fiscal e acesso à mentoria vitalícia." },
] as const;

const PAGE_FAQS = [
  {
    question: "Onde comprar Spitz Alemão Anão (Lulu da Pomerânia) com segurança?",
    answer:
      "A By Império Dog é um canil familiar especializado em Spitz Alemão Anão localizado em Bragança Paulista, SP, com mais de 10 anos de criação responsável e mais de 180 famílias atendidas. Todos os filhotes têm registro oficial, laudos veterinários e mentoria vitalícia. Atendemos famílias de todo o Brasil.",
  },
  {
    question: "Quais documentos são obrigatórios ao comprar um Spitz Alemão Anão?",
    answer:
      "Os documentos essenciais são: registro oficial registrado, laudo de saúde, carteira de vacinação com V8/V10 e antirrábica, teste de patela, histórico de vermifugação, microchip implantado, nota fiscal e contrato de compra com garantia de saúde. Sem esses documentos, a compra é de alto risco.",
  },
  {
    question: "Como funciona a entrega do filhote em outro estado?",
    answer:
      "O filhote pode ser retirado pessoalmente em Bragança Paulista (SP) ou transportado por transportadora aérea especializada em animais. Auxiliamos em todo o processo: escolha da empresa, preparação da caixa, documentação de viagem e acompanhamento até a chegada. O filhote só viaja após atingir peso, maturidade e com todos os exames em dia.",
  },
  {
    question: "Posso visitar o canil antes de comprar?",
    answer:
      "Sim. Fazemos videochamadas para mostrar a estrutura, os filhotes e os pais a qualquer momento. Visitas presenciais são permitidas por agendamento em Bragança Paulista, SP.",
  },
  {
    question: "Existe garantia de saúde?",
    answer:
      "Sim. Nosso contrato inclui garantia de saúde de 90 dias para condições genéticas documentadas. Além disso, o tutor tem suporte vitalício direto com a criadora para orientações ao longo de toda a vida do Spitz.",
  },
  {
    question: "Como evitar golpes ao comprar Spitz Alemão Anão pela internet?",
    answer:
      "Verifique: presença consistente nas redes sociais com histórico de filhotes, avaliações reais de clientes (não só prints), registro oficial verificável, contrato detalhado e possibilidade de visita ou videochamada. Desconfie de preços muito abaixo do mercado, pagamento apenas por Pix antecipado e criadores que não permitem qualquer forma de verificação presencial.",
  },
  {
    question: "Quanto tempo leva o processo de compra?",
    answer:
      "Da primeira conversa até a entrega, geralmente de 2 a 8 semanas — depende da disponibilidade de filhotes e da maturidade da ninhada. A reserva pode ser feita assim que o filhote estiver pronto (geralmente com 45+ dias de vida), com entrega após 60 dias.",
  },
] as const;

export default function ComprarSpitzPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? whatsappLeadUrl(phone, { pageType: "intent", url: PAGE_URL, intent: "comprar-spitz-anao" })
    : "#";

  const articleLd    = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: "2025-01-01", dateModified: "2025-05-01" });
  const faqLd        = buildFAQPageLD([...PAGE_FAQS]);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",          url: `${SITE_URL}/` },
    { name: "Comprar Spitz Anão", url: PAGE_URL },
  ]);
  const businessLd   = buildLocalBusinessLD();

  return (
    <main className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <PageViewPing pageType="intent" intent="comprar-spitz-anao" />
      <Script id="ld-comprar-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="ld-comprar-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-comprar-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-comprar-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      {/* ── HERO ── */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Guia de compra segura</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Como comprar um Spitz Alemão Anão (Lulu da Pomerânia) com segurança
        </h1>
        <p className="text-base text-zinc-600 sm:text-lg">
          Um guia completo para quem quer comprar um filhote de Lulu da Pomerânia sem cair em armadilhas: documentos obrigatórios, sinais de alerta, como funciona a entrega e o que esperar de um criador responsável.
        </p>
      </header>

      {/* ── PASSO A PASSO ── */}
      <section aria-labelledby="processo-heading">
        <h2 id="processo-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Passo a passo: como funciona a compra
        </h2>
        <ol className="space-y-4 border-l border-dashed border-zinc-200 pl-6">
          {STEPS.map((step) => (
            <li key={step.num} className="relative rounded-2xl bg-white border border-zinc-100 p-5 shadow-sm">
              <span className="absolute -left-[37px] top-5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow">
                {step.num}
              </span>
              <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── CHECKLIST ── */}
      <section aria-labelledby="checklist-heading" className="space-y-6">
        <h2 id="checklist-heading" className="text-2xl font-bold text-zinc-900">
          Checklist: criador responsável vs. alerta vermelho
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* O que deve ter */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
            <p className="mb-3 text-sm font-bold text-emerald-800">✅ Criador responsável — deve ter:</p>
            <ul className="space-y-2">
              {CHECKLIST_YES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-0.5 text-emerald-600" aria-hidden>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* O que é alerta */}
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
            <p className="mb-3 text-sm font-bold text-red-800">🚫 Sinais de alerta — evite se:</p>
            <ul className="space-y-2">
              {CHECKLIST_NO.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-0.5 text-red-500" aria-hidden>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        aria-labelledby="faq-comprar-heading"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        <h2 id="faq-comprar-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Perguntas frequentes sobre como comprar
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
          Pronto para conhecer os filhotes disponíveis?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Acesse nosso catálogo atualizado ou fale diretamente com a criadora para tirar dúvidas e iniciar o processo.
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
        { label: "Criador Confiável — Como Identificar", href: "/criador-spitz-confiavel",  desc: "O que exigir antes de fechar negócio" },
        { label: "Tabela de Preços 2025",                href: "/preco-spitz-anao",         desc: "Valores por cor e sexo em detalhe" },
        { label: "Filhote de Spitz Alemão",              href: "/filhote-de-spitz-alemao",  desc: "Primeiros cuidados e o que verificar" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Comprar Spitz Anão</li>
        </ol>
      </nav>
    </main>
  );
}
