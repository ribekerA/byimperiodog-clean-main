import { CheckCircle, Clock, HeartHandshake, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import LeadForm from "@/components/LeadForm";
import TrustBar from "@/components/TrustBar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/route";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://byimperiodog.com.br";

export const metadata: Metadata = {
  title: "Reserve seu Filhote de Spitz Alemão Anão",
  description:
    // 188 caracteres, e sem o sinônimo pelo qual a raça é mais pesquisada.
    // Reescrita em 142, agora com "Lulu da Pomerânia".
    "Garanta prioridade de escolha na próxima ninhada de Spitz Alemão Anão, com registro oficial e suporte direto com a criadora.",
  alternates: { canonical: "/reserve-seu-filhote" },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    type: "website",
    url: "/reserve-seu-filhote",
    title: "Reserve seu Filhote de Spitz Alemão Anão | By Império Dog",
    description:
      "Processo de reserva transparente: conversa inicial, sinal, acompanhamento até a entrega e suporte pós-venda.",
  },
};

const benefits = [
  {
    icon: Shield,
    title: "Saúde Documentada",
    description: "Laudos veterinários e protocolo vacinal em dia conforme a idade do filhote, com carteira de vacinação assinada pelo médico-veterinário e orientação para as doses seguintes. Registro oficial incluso, com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato.",
  },
  {
    icon: HeartHandshake,
    title: "Acompanhamento até a entrega",
    description: "Fotos e informações sobre o filhote reservado até o momento da entrega.",
  },
  {
    icon: Clock,
    title: "Prioridade de Escolha",
    description: "A reserva antecipada define a ordem de escolha entre os filhotes disponíveis.",
  },
  {
    icon: CheckCircle,
    title: "Mentoria pós-venda",
    description: "Acompanhamento direto pelo WhatsApp para rotina, cuidados e dúvidas depois da entrega.",
  },
] as const;

const processSteps = [
  {
    step: "01",
    title: "Entrevista e Alinhamento",
    description: "Conversamos sobre a sua rotina e as suas preferências, e explicamos como funciona o processo.",
  },
  {
    step: "02",
    title: "Sinal de Reserva",
    description: "Com o alinhamento feito, um sinal garante sua prioridade na ninhada. Contrato digital e condições claras são enviados imediatamente.",
  },
  {
    step: "03",
    title: "Acompanhamento da Gestação",
    description: "Você recebe atualizações sobre a gestação e nascimento, com vídeos e fotos dos filhotes desde os primeiros dias de vida.",
  },
  {
    step: "04",
    title: "Escolha do Filhote",
    description: "Conforme a ordem de reserva, você escolhe seu filhote com base em vídeos, avaliação de temperamento e orientação da criadora.",
  },
  {
    step: "05",
    title: "Socialização e Preparo",
    description: "Até a liberação para a entrega, o filhote recebe socialização guiada, enriquecimento ambiental e protocolo veterinário em andamento conforme a idade.",
  },
  {
    step: "06",
    title: "Entrega Humanizada",
    description: "Retirada presencial ou transporte assistido para todo o Brasil, com kit de boas-vindas, registro oficial incluso — com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato — e suporte pós-entrega.",
  },
] as const;

const faqEntries = [
  {
    question: "Qual o valor da reserva e como funciona o pagamento?",
    answer: "O sinal de reserva é de 30% do valor total e garante sua prioridade. O saldo pode ser parcelado ou pago na entrega. Condições detalhadas são enviadas no contrato digital.",
  },
  {
    question: "Posso visitar os filhotes antes de reservar?",
    answer: "A possibilidade e o formato da visita devem ser informados com transparência. Quando a visita ao local de criação não for viável, o interessado pode solicitar videochamada, documentação e outras formas de verificação. Combine o formato diretamente com a criadora pelo WhatsApp.",
  },
  {
    question: "Quanto tempo devo esperar após a reserva?",
    answer: "Dependendo do momento da reserva, o tempo pode variar de 2 a 6 meses. Mantemos comunicação constante e você acompanha todo o processo.",
  },
  {
    question: "O que está incluso na reserva?",
    answer: "Registro oficial (emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato), carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade, vermifugação, exames laboratoriais, kit de boas-vindas, contrato digital e mentoria pós-venda. A identificação do animal segue os requisitos exigidos pela legislação aplicável.",
  },
  {
    question: "E se eu desistir após a reserva?",
    answer: "Nas contratações sujeitas ao direito de arrependimento previsto no art. 49 do Código de Defesa do Consumidor, serão observados integralmente os prazos e efeitos previstos na legislação, inclusive quanto à restituição dos valores pagos. Fora dessas hipóteses, valem as condições pactuadas no contrato: o sinal pode ser reembolsado parcialmente (70%) ou transferido para outra ninhada.",
  },
] as const;

export default function ReserveSeuFilhotePage() {
  const trimmedPhone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = trimmedPhone ? `https://wa.me/${trimmedPhone}` : process.env.NEXT_PUBLIC_WA_LINK ?? "#";
  const waMessage = "Olá! Quero reservar um filhote de Spitz Alemão Anão e conhecer o processo completo.";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Reserve seu Filhote", item: `${SITE_URL}/reserve-seu-filhote` },
    ],
  };

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/reserve-seu-filhote#webpage`,
    url: `${SITE_URL}/reserve-seu-filhote`,
    name: "Reserve seu Filhote de Spitz Alemão Anão",
    description:
      "Prioridade de escolha entre os filhotes de Spitz Alemão Anão (Lulu da Pomerânia) disponíveis, com processo transparente e suporte pós-venda.",
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: "By Império Dog" },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <script id="ld-breadcrumb-reserve" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-webpage-reserve" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <script id="ld-faq-reserve" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl space-y-6 px-5 py-16 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
          🐾 Reserve com Prioridade
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Garanta seu Filhote de Spitz Alemão Anão com Processo Transparente
        </h1>
        <p className="max-w-3xl text-base text-[var(--text-muted)] sm:text-lg">
          Reserve e acompanhe o processo até a entrega, com as condições descritas em contrato.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <a
            href={`${waHref}?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "solid", size: "lg" }),
              "h-12 rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] shadow-md hover:brightness-110"
            )}
          >
            <WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
            Falar com a criadora agora
          </a>
          <Link
            href={routes.filhotes}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full border-[var(--brand)] px-6 text-[var(--brand)] hover:bg-[var(--surface-2)]"
            )}
          >
            Ver filhotes disponíveis
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl space-y-6 px-5 py-16">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Por que reservar com a By Império Dog?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <benefit.icon className="h-6 w-6 text-[var(--brand)]" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">{benefit.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-6xl space-y-6 px-5 py-16">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Como funciona o processo de reserva</h2>
        <ol className="space-y-6">
          {processSteps.map((item) => (
            <li key={item.step} className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-[var(--brand-foreground)] shadow">
                {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-4xl space-y-6 px-5 py-16">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Inicie sua reserva</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Preencha o formulário abaixo e entraremos em contato no horário de atendimento (todos os dias, das 8h às 22h) para falar sobre os filhotes disponíveis.
          </p>
          <TrustBar className="mt-4" />
          <div className="mt-6">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl space-y-6 px-5 py-16">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Perguntas frequentes sobre reserva</h2>
        <div className="space-y-4">
          {faqEntries.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Pronto para reservar seu Spitz Alemão Anão?</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Entre em contato agora para receber o checklist completo, condições de reserva e próximos passos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`${waHref}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "solid", size: "lg" }),
                "h-12 rounded-full bg-[var(--brand)] px-6 text-[var(--brand-foreground)] shadow-md hover:shadow-lg"
              )}
            >
              <WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
              Reservar via WhatsApp
            </a>
            <Link
              href={routes.sobre}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
            >
              Conhecer nossa história
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
