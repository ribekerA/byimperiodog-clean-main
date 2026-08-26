import type { Metadata } from "next";
import Link from "next/link";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";
import { buildWebPageLD } from "@/lib/structured-data";

const path = "/faq-do-tutor";
const lastUpdated = "2026-08-06T09:00:00.000Z";

const faqItems = [
  {
    question: "Como preparamos cada Spitz Alemão Anão antes da nova família?",
    answer:
      "Os filhotes crescem em convívio familiar, com contato cotidiano com pessoas e com os sons normais de uma casa, enriquecimento ambiental supervisionado e acompanhamento veterinário. O objetivo é que o Spitz Alemão Anão chegue com autoconfiança e rotina estável.",
  },
  {
    question: "Qual o porte adulto esperado do Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      // "laudos veterinários com curva de peso" prometia um documento que não
      // existe: a entrega tem carteira de vacinação, histórico de vermifugação,
      // laudo de saúde e hemograma, como já diz a resposta sobre exames.
      "O padrão FCI nº 97 define a cernelha (altura) em 21 cm ± 3 cm e determina que o peso seja proporcional ao tamanho do cão. Buscamos estrutura saudável, pelagem densa e equilíbrio entre energia e docilidade na escolha dos reprodutores. Na entrega compartilhamos a consulta veterinária e o hemograma completo do filhote e orientamos os ajustes de alimentação para cada fase.",
  },
  {
    question: "Quais cuidados manter nas primeiras 48 horas em casa?",
    answer:
      // "reportada ao nosso time" sugeria uma equipe de plantão. O atendimento
      // é da própria criadora, por WhatsApp — e alteração de saúde é assunto de
      // médico-veterinário, não de canil.
      "Providencie ambiente calmo, tigelas individuais, água fresca, ração indicada e intervalo de descanso sem visitantes. Agende consulta veterinária preventiva e monitore alimentação, hidratação e eliminações. Diante de qualquer alteração, procure um médico-veterinário e avise a criadora pelo WhatsApp.",
  },
  {
    question: "Como funciona o suporte contínuo após a entrega?",
    answer:
      "O tutor tem contato direto com a criadora por WhatsApp, com orientação sobre rotina, manejo e reforço positivo. Disponibilizamos orientações gerais de pós-entrega. Essas informações não substituem atendimento veterinário, nutricional ou comportamental realizado por profissional habilitado.",
  },
  {
    question: "Quais exames acompanham o Spitz Alemão Anão?",
    answer:
      "Entregamos a carteira de vacinação assinada pelo médico-veterinário, com o protocolo em dia conforme a idade do filhote e orientação para as doses seguintes, o histórico de vermifugação, a consulta veterinária antes da entrega e o hemograma completo. Também emitimos contrato de responsabilidade compartilhada, com mentoria pós-venda junto à criadora.",
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
    // Sem a marca aqui: o layout raiz já aplica o template "%s | By Império Dog".
    title: "FAQ do Tutor — Spitz Alemão Anão",
    description:
      "Perguntas frequentes sobre preparo, saúde, socialização e suporte pós-venda para o Spitz Alemão Anão.",
    path,
    // A imagem apontava para /og/faq-tutor.jpg, que não existe no repositório
    // (a pasta public/og/ nunca foi criada) e respondia 404. Sem `images`, o
    // pageMetadata aplica a imagem padrão do site, que é um arquivo real.
  });
}

export default function FaqDoTutorPage() {
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br").replace(/\/$/, "");
  // Sem FAQPage: o rich result de FAQ foi encerrado pelo Google em
  // 07/05/2026 e o markup deixou de produzir resultado na busca. A pagina
  // continua descrita por WebPage + BreadcrumbList, e as perguntas seguem
  // visiveis no HTML -- que e o que os sistemas de busca e de IA leem hoje.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${siteBase}/` },
      { "@type": "ListItem", position: 2, name: "FAQ do Tutor", item: `${siteBase}${path}` },
    ],
  };
  const webPageLd = buildWebPageLD({
    path,
    name: "FAQ do Tutor",
    description:
      "Perguntas frequentes sobre preparo, saúde, socialização e suporte pós-venda para o Spitz Alemão Anão.",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">FAQ do tutor</p>
        <h1 className="text-4xl font-bold text-zinc-900">Guia prático para receber o Spitz Alemão Anão</h1>
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
          A adaptação do Spitz Alemão Anão depende de rotina previsível, estímulos positivos e monitoramento próximo.
          Recomendamos o seguinte passo a passo:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>
            Defina um quarto seguro com cama ortopédica, tapete higiênico e brinquedos de diferentes texturas para estimular
            exploração.
          </li>
          <li>
            Mantenha a alimentação dividida em pequenas porções, ajustadas ao peso do filhote e ao porte previsto para a fase
            adulta. Mudanças de dieta e suplementação devem ser definidas pelo médico-veterinário que acompanha o cão.
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
            <h3 className="text-lg font-semibold text-emerald-900">Orientações de rotina</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
              <li>Socialização por faixa etária.</li>
              <li>Reforço positivo e treino de caixa de transporte.</li>
              <li>Checklist de viagem com o Spitz Alemão Anão.</li>
            </ul>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-emerald-900">Suporte direto</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
              <li>Contato direto com a criadora por WhatsApp.</li>
              <li>Encaminhamento ao médico-veterinário quando o caso exigir avaliação profissional.</li>
            </ul>
          </article>
        </div>
        {/* A lista anterior prometia biblioteca digital, canal de emergência
            comportamental e consultoria com nutricionista canino. Nada disso
            estava documentado em outro lugar do site nem confirmado pela
            criadora, e o texto virava garantia de serviço. A ressalva abaixo é
            obrigatória: orientação de criador não substitui profissional. */}
        <p className="text-sm text-zinc-500">
          Disponibilizamos orientações gerais de pós-entrega. Essas informações não substituem atendimento veterinário,
          nutricional ou comportamental realizado por profissional habilitado.
        </p>
      </section>

      <section id="contato" className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Canais de contato</h2>
        <p className="text-zinc-600">
          Sempre que precisar de suporte imediato, utilize um dos canais oficiais abaixo. Respostas são priorizadas para tutores
          em fase de adaptação.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/5511968633239?text=Olá! Preciso de orientação para o meu Spitz Alemão Anão."
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

      <LastUpdated contentTime={lastUpdated} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
    </div>
  );
}
