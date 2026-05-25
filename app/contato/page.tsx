import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import LeadForm from "@/components/LeadForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/route";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";

// Número oficial: +55 11 9 6863-3239
// Normalizamos priorizando variáveis de ambiente (com ou sem DDI) e caindo no fallback.
const RAW_FULL = (process.env.NEXT_PUBLIC_WA_PHONE || process.env.NEXT_PUBLIC_WA_LINK || "5511968633239").replace(/\D/g, "");
// Parte local (sem DDI) para formatação e JSON-LD auxiliar
const RAW_LOCAL = RAW_FULL.startsWith("55") ? RAW_FULL.slice(2) : RAW_FULL; // ex: 1196863239 (caso possua 9 dígitos) ou 1196863239/119686323 (dependendo do número fornecido)

function formatDisplayPhone(p: string): string {
  // Esperado: AA + restante. Identifica se há 10 ou 9 dígitos após DDI.
  if (p.length < 4) return p;
  const area = p.slice(0, 2);
  const rest = p.slice(2);
  // Se tiver 9 dígitos (mobile padrão Brasil): 5+4
  if (rest.length === 9) return `(${area}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  // Se tiver 8 dígitos (alguns fixos / número informado reduzido): 4+4
  if (rest.length === 8) return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  // Fallback genérico
  return `(${area}) ${rest}`;
}

const DISPLAY_PHONE = process.env.NEXT_PUBLIC_WA_DISPLAY || formatDisplayPhone(RAW_LOCAL);
const WA_LINK = `https://wa.me/${RAW_FULL}`; // garante canonical simples
const WA_MESSAGE = "Olá! Vim do site By Império Dog e gostaria de saber sobre filhotes disponíveis.";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "byimperiodog@gmail.com";
const INSTAGRAM = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/byimperiodog";
const YOUTUBE = process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://youtube.com/@byimperiodog";

export const metadata: Metadata = {
  title: "Contato | By Império Dog",
  description: "Fale com a By Império Dog por WhatsApp, e-mail ou formulário. Resposta rápida e acompanhamento direto com a criadora do Spitz Alemão Anão Lulu da Pomerânia.",
  alternates: { canonical: `${SITE_URL}/contato` },
};

const quickFaq = [
  {
    question: "Qual o prazo de resposta?",
    answer: "Respondemos no WhatsApp em até 2 horas nos dias úteis. E-mails são retornados no mesmo dia útil.",
  },
  {
    question: "Posso visitar a criação?",
    answer: "Sim. Agendamos visitas presenciais aos sábados mediante disponibilidade ou videochamadas durante a semana.",
  },
  {
    question: "Vocês entregam em outras cidades?",
    answer: "Realizamos transporte humanizado para todo o Brasil, com profissional acompanhando o Spitz Alemão Anão Lulu da Pomerânia.",
  },
  {
    question: "Como funciona a reserva?",
    answer: "Após conhecer a família, enviamos contrato digital e sinal para garantir prioridade de escolha da ninhada.",
  },
] as const;

export default function ContatoPage() {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "By Império Dog",
    url: SITE_URL,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
  // Preferimos E.164 completo; se já vier com 55 não duplicamos.
  telephone: RAW_FULL ? (RAW_FULL.startsWith("55") ? `+${RAW_FULL}` : `+55${RAW_FULL}`) : undefined,
        email: EMAIL,
        areaServed: "BR",
        availableLanguage: ["Portuguese"],
      },
    ].filter(Boolean),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Contato", item: `${SITE_URL}/contato` },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL.replace(/\/$/, "")}/contato#webpage`,
    url: `${SITE_URL.replace(/\/$/, "")}/contato`,
    name: "Contato | By Império Dog",
    description:
      "Fale com a By Império Dog por WhatsApp, e-mail ou formulário. Resposta rápida e acompanhamento direto com a criadora do Spitz Alemão Anão Lulu da Pomerânia.",
    isPartOf: { "@type": "WebSite", url: SITE_URL.replace(/\/$/, ""), name: "By Imperio Dog" },
  };

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-5 pb-24 pt-16 text-[var(--text)]">
      <Script id="ld-contact" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Script id="ld-breadcrumb-contact" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-webpage-contact" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />

      <header className="text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
          Contato direto com a criadora
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Fale com a By Império Dog</h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--text-muted)] sm:text-lg">
          Dúvidas sobre disponibilidade, valores ou preparo do lar? Estamos no WhatsApp, e-mail e redes sociais para orientar cada etapa dessa jornada responsável com o seu Spitz Alemão Anão Lulu da Pomerânia.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
          <a
            href={`${WA_LINK}?text=${encodeURIComponent(WA_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "solid", size: "lg" }),
              "h-12 rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] shadow-md hover:brightness-110"
            )}
          >
            <WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
            Abrir WhatsApp
          </a>
          <Link
            href={routes.filhotes}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
            )}
          >
            Ver filhotes disponíveis
          </Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Envie uma mensagem</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Conte-nos sobre sua família, cidade e quando deseja receber o Spitz Alemão Anão Lulu da Pomerânia. Respondemos com prioridade para mensagens completas.
          </p>
          <LeadForm />
        </div>
        <aside className="space-y-6">
          <a
            href={`${WA_LINK}?text=${encodeURIComponent(WA_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-3xl bg-[var(--brand)] px-6 py-5 text-[var(--brand-foreground)] shadow-md transition hover:brightness-110"
          >
            <span className="flex items-center gap-3 text-base font-semibold">
              <MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp prioritário
            </span>
            <span className="text-sm">Tempo médio: 2h</span>
          </a>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--text)]">Outros canais</h3>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text)]">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--brand)]" aria-hidden />
                <span>{DISPLAY_PHONE}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[var(--brand)]" aria-hidden />
                <a href={`mailto:${EMAIL}`} className="hover:underline">{EMAIL}</a>
              </li>
              <li className="flex items-center gap-3 text-[var(--text-muted)]">
                <Clock className="h-4 w-4 text-[var(--brand)]" aria-hidden /> Atendimento: 09h às 19h (seg-sáb)
              </li>
              <li className="flex items-center gap-3 text-[var(--text-muted)]">
                <MapPin className="h-4 w-4 text-[var(--brand)]" aria-hidden /> Bragança Paulista – SP (visitas com agendamento)
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <Instagram className="h-4 w-4" aria-hidden /> Instagram
              </a>
              <a
                href={YOUTUBE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <Youtube className="h-4 w-4" aria-hidden /> YouTube
              </a>
            </div>
          </div>
        </aside>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-[var(--text)]">Perguntas rápidas</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {quickFaq.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40">
                {item.question}
              </summary>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Pronto para dar o primeiro passo?</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Compartilhe sua rotina e receba materiais exclusivos com filhotes de Spitz Alemão Anão Lulu da Pomerânia disponíveis, valores e guia de preparação.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={`${WA_LINK}?text=${encodeURIComponent(WA_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "solid", size: "lg" }),
              "h-12 rounded-full bg-[var(--brand)] px-6 text-[var(--brand-foreground)] shadow-md hover:shadow-lg"
            )}
          >
            <WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
            Conversar com a criadora
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
      </section>
    </main>
  );
}
