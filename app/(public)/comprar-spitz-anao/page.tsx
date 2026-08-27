import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import PageViewPing from "@/components/PageViewPing";
import { FOUNDING_YEAR } from "@/domain/config";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/comprar-spitz-anao`;

export const metadata: Metadata = {
  title: "Como Comprar Spitz Alemão Anão com Segurança",
  description:
    // 226 caracteres: o Google cortava a partir de "como evitar golpes".
    // Reescrita em 141.
    "Como comprar um filhote de Spitz Alemão Anão com segurança: documentos a exigir, sinais de golpe e como avaliar o criador.",
  keywords: [
    "comprar Spitz Alemão Anão",
    "onde comprar Lulu da Pomerânia confiável",
    "como comprar filhote Spitz Alemão com documentação",
    "Lulu da Pomerânia à venda SP",
    "canil Spitz Alemão responsável interior SP",
    "comprar Pomeranian no Brasil",
    "filhote Lulu da Pomerânia documentado",
  ],
  alternates: { canonical: "/comprar-spitz-anao" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    title: "Como Comprar Spitz Alemão Anão com Segurança — By Império Dog",
    description:
      "Guia completo: o que exigir, documentos obrigatórios, sinais de alerta e como funciona a compra na By Império Dog. Bragança Paulista, SP.",
    type: "article",
  },
};

const CHECKLIST_YES = [
  "Registro oficial (não apenas 'em andamento')",
  "Consulta veterinária e hemograma completo do filhote",
  "Carteira de vacinação com carimbos veterinários reais",
  "Contrato claro, com as condições de saúde e o suporte pós-venda descritos",
  "Fotos e vídeos reais — sem filtros exagerados",
  "Transparência sobre como a criação pode ser verificada",
  "Referências de compradores anteriores",
] as const;

const CHECKLIST_NO = [
  "Valor muito distante da média praticada, sem explicação para a diferença",
  "Sem documentação ou 'registro no futuro'",
  "Não informa com transparência como a criação pode ser verificada",
  "Entrega antes de cumprir os requisitos legais de comercialização",
  "Sem contrato, ou contrato genérico que não descreve as condições",
  "Pagamento apenas via Pix antecipado sem comprovantes",
  "Várias ninhadas 'sempre disponíveis' ao mesmo tempo",
] as const;

const STEPS = [
  { num: "01", title: "Pesquise e compare criadores", body: "Busque criadores com histórico online, avaliações reais de clientes e presença nas redes sociais. Desconfie de quem não tem referências." },
  { num: "02", title: "Peça a documentação do filhote", body: "Confira o registro oficial, a carteira de vacinação e o histórico veterinário do filhote antes de qualquer pagamento. Um criador responsável apresenta o que tem sem hesitar." },
  { num: "03", title: "Verifique antes de decidir", body: "Peça a documentação do filhote e combine com a criadora, pelo WhatsApp, o formato de verificação possível." },
  { num: "04", title: "Confirme reserva com contrato", body: "A reserva é formalizada com contrato de compra e venda e sinal. Leia as condições antes de assinar: o contrato descreve prazos, obrigações e responsabilidades de ambas as partes." },
  { num: "05", title: "Receba o filhote com toda a documentação", body: "Na entrega, o filhote vem com registro oficial, consulta veterinária, hemograma completo, carteira de vacinação assinada pelo médico-veterinário, contrato e acesso à mentoria pós-venda. A identificação do animal segue os requisitos exigidos pela legislação aplicável." },
] as const;

const PAGE_FAQS = [
  {
    question: "Onde comprar Spitz Alemão Anão com segurança?",
    answer:
      `A By Império Dog é um canil familiar especializado em Spitz Alemão Anão (Lulu da Pomerânia) localizado em Bragança Paulista, SP, com criação responsável desde ${FOUNDING_YEAR}. Os filhotes saem com registro oficial, consulta veterinária, hemograma completo, protocolo vacinal em dia conforme a idade, histórico de vermifugação, contrato e mentoria pós-venda. Atendemos famílias de todo o Brasil.`,
  },
  {
    question: "Quais documentos são obrigatórios ao comprar um Spitz Alemão Anão?",
    answer:
      "Os documentos essenciais são: registro oficial, comprovação da consulta veterinária e do hemograma, carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade do filhote e orientação para as doses seguintes, histórico de vermifugação, nota fiscal e contrato de compra e venda. A identificação do animal deve seguir os requisitos exigidos pela legislação aplicável — confirme com o criador o que consta no contrato. Peça para conferir todos esses itens antes de fechar a compra.",
  },
  {
    question: "Como funciona a entrega do filhote em outro estado?",
    answer:
      "O filhote pode ser retirado pessoalmente em Bragança Paulista (SP) ou transportado por transportadora aérea especializada em animais. Auxiliamos em todo o processo: escolha da empresa, preparação da caixa, documentação de viagem e acompanhamento até a chegada. O filhote só viaja após atingir peso, maturidade e com todos os exames em dia.",
  },
  {
    question: "Posso visitar o canil antes de comprar?",
    answer:
      "A possibilidade e o formato da visita devem ser informados com transparência. Quando a visita ao local de criação não for viável, o interessado pode solicitar videochamada, documentação e outras formas de verificação.",
  },
  {
    question: "Como funciona o contrato de compra e venda?",
    answer:
      "A compra é formalizada por contrato escrito, apresentado antes do pagamento. Ele descreve o filhote, o valor, as condições de entrega e as obrigações de cada parte. Leia as cláusulas completas antes de assinar e peça esclarecimento sobre qualquer ponto. As garantias e demais direitos assegurados ao consumidor pela legislação aplicável valem independentemente do que o contrato preveja.",
  },
  {
    question: "Como evitar golpes ao comprar Spitz Alemão Anão pela internet?",
    answer:
      "Verifique: presença consistente nas redes sociais com histórico de filhotes, avaliações reais de clientes (não só prints), registro oficial verificável, contrato detalhado e transparência sobre como a criação pode ser verificada. Valores muito diferentes da média podem justificar uma verificação mais cuidadosa das condições da oferta e da documentação.",
  },
  {
    question: "Quanto tempo leva o processo de compra?",
    answer:
      "O prazo depende da disponibilidade de filhotes no momento do contato. A entrega é realizada após o cumprimento dos requisitos legais e sanitários aplicáveis. Consulte a disponibilidade atual pelo WhatsApp.",
  },
] as const;

export default function ComprarSpitzPage() {
  const phone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? whatsappLeadUrl(phone, { pageType: "intent", url: PAGE_URL, intent: "comprar-spitz-anao" })
    : "#";

  const articleLd    = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",          url: `${SITE_URL}/` },
    { name: "Comprar Spitz Anão", url: PAGE_URL },
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 text-zinc-800 sm:px-8">
      <PageViewPing pageType="intent" intent="comprar-spitz-anao" />
      <script id="ld-comprar-article"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script id="ld-comprar-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* ── HERO ── */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Guia de compra segura</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Como comprar um Spitz Alemão Anão com segurança
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
      >
        <h2 id="faq-comprar-heading" className="mb-6 text-2xl font-bold text-zinc-900">
          Perguntas frequentes sobre como comprar
        </h2>
        {/* <div> e nao <dl>: esta secao e um acordeao de <details>, nao uma lista
            de descricao. Sem <dt>/<dd> dentro, o <dl> reprovava a regra
            definition-list do axe e o leitor de tela anunciava uma lista que
            nao existe. A marcacao schema.org da FAQ foi removida em 26/08/2026: o
            Google encerrou o rich result de FAQ em 07/05/2026 e o markup
            deixou de render qualquer resultado na busca. A FAQ visivel
            continua igual — ela e para o leitor, nao para o SERP. */}
        <div className="divide-y divide-zinc-100">
          {PAGE_FAQS.map((item, i) => (
            <div key={item.question}>
              <details className="group py-4" open={i === 0}>
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                >
                  <span className="text-sm font-semibold text-zinc-900 sm:text-base leading-snug">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
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

      {/* ── CTA ── */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900">
          Pronto para conhecer a vitrine de filhotes?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Acesse nosso catálogo atualizado ou fale diretamente com a criadora para tirar dúvidas e iniciar o processo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/filhotes"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Ver a vitrine de filhotes
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
        { label: "Tabela de Preços",                                            href: "/preco-spitz-anao",         desc: "Valores por cor e sexo em detalhe" },
        { label: "Filhote de Spitz Alemão",              href: "/filhote-de-spitz-alemao",  desc: "Primeiros cuidados e o que verificar" },
      ]} />

      <nav aria-label="Navegação estrutural">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
          <li aria-hidden>/</li>
          <li className="font-medium text-zinc-600" aria-current="page">Comprar Spitz Anão</li>
        </ol>
      </nav>
    </div>
  );
}
