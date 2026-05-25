import type { Metadata } from "next";
import Link from "next/link";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const path = "/faq-do-tutor";
const lastUpdated = "2025-10-18T09:00:00.000Z";

const faqItems = [
  {
    question: "Como preparamos cada Spitz Alemão (Lulu da Pomerânia) antes da nova família?",
    answer:
      "Realizamos socialização diária com crianças e adultos, dessensibilização a sons domésticos, enriquecimento ambiental supervisionado e avaliação veterinária completa. O objetivo é que o Spitz Alemão (Lulu da Pomerânia) chegue com autoconfiança e rotina estável.",
  },
  {
    question: "Qual o porte adulto esperado do Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      "As nossas linhagens são acompanhadas por geneticista e mantêm estrutura saudável com até 22 cm de altura, pelagem densa e equilíbrio entre energia e docilidade. Compartilhamos laudos com curva de peso e reforçamos os ajustes de alimentação para cada fase.",
  },
  {
    question: "Quais cuidados manter nas primeiras 48 horas em casa?",
    answer:
      "Providencie ambiente calmo, tigelas individuais, água fresca, ração indicada e intervalo de descanso sem visitantes. Agende consulta veterinária preventiva e monitore alimentação, hidratação e eliminações. Qualquer alteração deve ser reportada imediatamente ao nosso time.",
  },
  {
    question: "Como funciona o suporte contínuo após a entrega?",
    answer:
      "O tutor recebe acesso à biblioteca digital, cronograma de socialização e acompanhamento por WhatsApp. Disponibilizamos videochamadas para ajustes de rotina, reforço positivo e orientação em emergências comportamentais ou nutricionais.",
  },
  {
    question: "Quais exames acompanham o Spitz Alemão (Lulu da Pomerânia)?",
    answer:
      "Entregamos carteira de vacinação, exames parasitológicos, histórico de vermifugação, relatório de avaliação odontológica e teste de patela. Também emitimos nota fiscal, contrato de responsabilidade compartilhada e garantia de suporte vitalício.",
  },
];

const tocItems = [
  { id: "faq-principais", label: "Perguntas frequentes" },
  { id: "primeiros-cuidados", label: "Primeiros cuidados" },
  { id: "materiais-suporte", label: "Materiais de suporte" },
  { id: "contato", label: "Canais de contato" },
];

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "FAQ do Tutor | By Imperio Dog",
    description:
      "Perguntas frequentes sobre preparo, saúde, socialização e suporte vitalício para o Spitz Alemão (Lulu da Pomerânia).",
    path,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br"}/og/faq-tutor.jpg`,
        alt: "Tutora segurando um Spitz Alemão (Lulu da Pomerânia) saudável no colo",
      },
    ],
  });
}

export default function FaqDoTutorPage() {
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br").replace(/\/$/, "");
  const jsonLd = faqPageSchema(faqItems, `${siteBase}${path}`);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${siteBase}/` },
      { "@type": "ListItem", position: 2, name: "FAQ do Tutor", item: `${siteBase}${path}` },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteBase}${path}#webpage`,
    url: `${siteBase}${path}`,
    name: "FAQ do Tutor | By Imperio Dog",
    description:
      "Perguntas frequentes sobre preparo, saúde, socialização e suporte vitalício para o Spitz Alemão (Lulu da Pomerânia).",
    isPartOf: { "@type": "WebSite", url: siteBase, name: "By Imperio Dog" },
  };

  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">FAQ do tutor</p>
        <h1 className="text-4xl font-bold text-zinc-900">Guia prático para receber o Spitz Alemão (Lulu da Pomerânia)</h1>
        <p className="text-lg text-zinc-600">
          Reunimos os pontos mais importantes para preparar a casa, organizar os primeiros dias e acionar o suporte da criadora.
          Use esta página como referência rápida sempre que surgir uma dúvida sobre rotina, nutrição ou comportamento.
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="faq-principais" className="space-y-6">
        <h2 className="text-2xl font-semibold text-zinc-900">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-zinc-900">{item.question}</h3>
              <p className="mt-2 text-zinc-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="primeiros-cuidados" className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Primeiros cuidados nas 48 horas</h2>
        <p className="text-zinc-600">
          A adaptação do Spitz Alemão (Lulu da Pomerânia) depende de rotina previsível, estímulos positivos e monitoramento próximo.
          Recomendamos o seguinte passo a passo:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>
            Defina um quarto seguro com cama ortopédica, tapete higiênico e brinquedos de diferentes texturas para estimular
            exploração.
          </li>
          <li>
            Mantenha a alimentação dividida em pequenas porções, com suplementação indicada pela nossa equipe de acordo com o peso
            e com até 22 cm de altura previstos para a fase adulta.
          </li>
          <li>
            Registre vídeos curtos para avaliarmos comportamento, postura e interação com a família. Isso acelera eventuais
            ajustes de manejo.
          </li>
          <li>
            Livre acesso à água filtrada, controle de temperatura entre 22 °C e 24 °C e passeio apenas após liberação do veterinário
            responsável.
          </li>
        </ul>
      </section>

      <section id="materiais-suporte" className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Materiais de suporte</h2>
        <p className="text-zinc-600">
          Todo tutor recebe acesso a um ecossistema de materiais para aprofundar o conhecimento sobre o Spitz Alemão (Lulu da
          Pomerânia):
        </p>
        <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 md:grid-cols-2">
          <article>
            <h3 className="text-lg font-semibold text-emerald-900">Biblioteca digital</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
              <li>Protocolos de socialização por faixa etária.</li>
              <li>Planilhas de reforço positivo e treino de caixa de transporte.</li>
              <li>Checklist de viagem com o Spitz Alemão (Lulu da Pomerânia).</li>
            </ul>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-emerald-900">Suporte direto</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
              <li>Videochamadas para ajustes de rotina e ambientação.</li>
              <li>Canal prioritário para emergências comportamentais.</li>
              <li>
                Consultoria com nutricionista canino quando houver necessidade de adaptação de dieta ou suplementação.
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section id="contato" className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Canais de contato</h2>
        <p className="text-zinc-600">
          Sempre que precisar de suporte imediato, utilize um dos canais oficiais abaixo. Respostas são priorizadas para tutores
          em fase de adaptação.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/5511968633239?text=Olá! Preciso de orientação para o meu Spitz Alemão (Lulu da Pomerânia)."
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
          >
            Falar no WhatsApp
          </a>
          <Link
            href="/contato"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
          >
            Ver canais completos
          </Link>
        </div>
      </section>

      <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
    </main>
  );
}
