import {
  Clock,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import LeadForm from "@/components/LeadForm";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { routes } from "@/lib/route";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br").replace(/\/$/, "");

// Phone normalization — priority to env vars
const RAW_FULL = (process.env.NEXT_PUBLIC_WA_PHONE || "5511968633239").replace(/\D/g, "");
const RAW_LOCAL = RAW_FULL.startsWith("55") ? RAW_FULL.slice(2) : RAW_FULL;

function formatDisplayPhone(p: string): string {
  if (p.length < 4) return p;
  const area = p.slice(0, 2);
  const rest = p.slice(2);
  if (rest.length === 9) return `(${area}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  if (rest.length === 8) return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${area}) ${rest}`;
}

const DISPLAY_PHONE = process.env.NEXT_PUBLIC_WA_DISPLAY || formatDisplayPhone(RAW_LOCAL);
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "byimperiodog@gmail.com";
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/byimperiodog";
const YOUTUBE_URL = process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://youtube.com/@byimperiodog";

export const metadata: Metadata = {
  title: "Contato | By Império Dog — Fale direto com a criadora",
  description:
    "Fale com a By Império Dog pelo WhatsApp, e-mail ou formulário. Resposta rápida, sem enrolação. Criadora do Spitz Alemão Anão em Bragança Paulista, SP.",
  alternates: { canonical: `${SITE_URL}/contato` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/contato`,
    title: "Contato | By Império Dog",
    description: "Fale diretamente com a criadora. WhatsApp, e-mail ou formulário — você escolhe.",
  },
};

const FAQ_ITEMS = [
  {
    q: "Qual o prazo de resposta pelo WhatsApp?",
    a: "Respondemos em até 30 minutos no horário comercial (seg–sáb, 9h–18h). Fora desse horário, responderemos na abertura do próximo dia.",
  },
  {
    q: "Posso visitar o canil presencialmente?",
    a: "Sim! Agendamos visitas aos sábados, mediante disponibilidade. Durante a semana, oferecemos videochamadas ao vivo para você conhecer os filhotes.",
  },
  {
    q: "Vocês entregam em outras cidades?",
    a: "Realizamos transporte humanizado para todo o Brasil, com profissional acompanhando o filhote durante toda a viagem. Consulte valores.",
  },
  {
    q: "Como funciona a reserva de um filhote?",
    a: "Após nossa conversa e aprovação da família, enviamos contrato digital e combinamos o sinal de reserva. Simples, transparente e sem surpresas.",
  },
  {
    q: "É possível ver vídeos e fotos antes de decidir?",
    a: "Claro! Enviamos vídeos diários do filhote escolhido via WhatsApp enquanto aguarda a entrega. Você acompanha tudo de perto.",
  },
] as const;

const SCHEDULE_DAYS = [
  { day: "Segunda", hours: "9h – 18h", open: true },
  { day: "Terça", hours: "9h – 18h", open: true },
  { day: "Quarta", hours: "9h – 18h", open: true },
  { day: "Quinta", hours: "9h – 18h", open: true },
  { day: "Sexta", hours: "9h – 18h", open: true },
  { day: "Sábado", hours: "9h – 14h", open: true },
  { day: "Domingo", hours: "Fechado", open: false },
] as const;

export default function ContatoPage() {
  const waMainLink = buildWhatsAppLink({
    message: "Olá! Vim do site By Império Dog e gostaria de saber sobre filhotes disponíveis.",
    utmSource: "contato",
    utmCampaign: "contato-hero",
  });

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "By Império Dog",
    url: SITE_URL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: RAW_FULL ? (RAW_FULL.startsWith("55") ? `+${RAW_FULL}` : `+55${RAW_FULL}`) : undefined,
      email: EMAIL,
      areaServed: "BR",
      availableLanguage: ["Portuguese"],
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Contato", item: `${SITE_URL}/contato` },
    ],
  };

  return (
    <main>
      <Script id="ld-org-contato" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Script id="ld-breadcrumb-contato" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 px-5 py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 25% 60%, #059669 0%, transparent 55%), radial-gradient(ellipse at 75% 30%, #065f46 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Fala comigo diretamente 💬
          </h1>
          <p className="mt-5 text-lg text-zinc-300">
            Não tem formulário complicado. Só uma conversa real no WhatsApp —
            ou pelo canal que preferir.
          </p>
          <p className="mt-2 text-zinc-400">
            Respondo em até 30 min no horário comercial.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={waMainLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition px-8 py-3.5 text-sm font-bold text-white shadow-xl"
            >
              <WAIcon size={20} aria-hidden />
              Abrir WhatsApp agora
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 hover:border-emerald-500 transition px-8 py-3.5 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Enviar e-mail
            </a>
          </div>
        </div>
      </section>

      {/* ── Cards de contato ─────────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="sr-only">Canais de contato</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* WhatsApp */}
            <a
              href={waMainLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 transition hover:border-emerald-400 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white group-hover:bg-emerald-500 transition">
                <WAIcon size={24} aria-hidden />
              </div>
              <div>
                <p className="font-bold text-zinc-900">WhatsApp</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Respondo em até 30 min no horário comercial
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">{DISPLAY_PHONE}</p>
              </div>
              <span className="mt-auto text-xs font-semibold text-emerald-700 group-hover:underline">
                Abrir conversa →
              </span>
            </a>

            {/* Instagram */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-4 rounded-2xl border border-pink-100 bg-pink-50 p-6 transition hover:border-pink-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                <Instagram className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-zinc-900">Instagram</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Fotos e vídeos diários dos filhotes
                </p>
                <p className="mt-2 text-sm font-semibold text-pink-700">@byimperiodog</p>
              </div>
              <span className="mt-auto text-xs font-semibold text-pink-700 group-hover:underline">
                Ver perfil →
              </span>
            </a>

            {/* E-mail */}
            <a
              href={`mailto:${EMAIL}`}
              className="group flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6 transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Mail className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-zinc-900">E-mail</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Para dúvidas não urgentes e documentação
                </p>
                <p className="mt-2 text-sm font-semibold text-blue-700 break-all">{EMAIL}</p>
              </div>
              <span className="mt-auto text-xs font-semibold text-blue-700 group-hover:underline">
                Enviar e-mail →
              </span>
            </a>

            {/* Endereço */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-700 text-white">
                <MapPin className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-zinc-900">Localização</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Bragança Paulista, SP
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Visitas com agendamento prévio (sáb)
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Bragança+Paulista+SP"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-xs font-semibold text-zinc-600 hover:text-emerald-700 hover:underline transition"
              >
                Ver no Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Horários de atendimento ───────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
              Disponibilidade
            </span>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
              Horários de atendimento
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
            {SCHEDULE_DAYS.map((item, i) => (
              <div
                key={item.day}
                className={`flex items-center justify-between px-6 py-3.5 ${i > 0 ? "border-t border-zinc-100" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Clock
                    className={`h-4 w-4 ${item.open ? "text-emerald-500" : "text-zinc-300"}`}
                    aria-hidden
                  />
                  <span className={`text-sm font-semibold ${item.open ? "text-zinc-800" : "text-zinc-400"}`}>
                    {item.day}
                  </span>
                </div>
                <span
                  className={`text-sm ${item.open ? "text-zinc-600" : "text-zinc-300"}`}
                >
                  {item.hours}
                </span>
                <span
                  className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.open ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}
                >
                  {item.open ? "Aberto" : "Fechado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulário + social ───────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Prefere escrever?</h2>
            <p className="mt-2 text-zinc-500">
              Preencha o formulário e respondemos com prioridade. Quanto mais detalhes, melhor!
            </p>
            <div className="mt-6">
              <LeadForm />
            </div>
          </div>

          <aside className="space-y-5">
            {/* YouTube */}
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 transition hover:border-red-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                <Youtube className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900">YouTube</p>
                <p className="text-xs text-zinc-500 truncate">Vídeos dos filhotes e do canil</p>
              </div>
              <span className="text-xs text-red-700 group-hover:underline shrink-0">Ver canal →</span>
            </a>

            {/* Phone */}
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-700 text-white">
                <Phone className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Telefone</p>
                <p className="text-sm text-zinc-600">{DISPLAY_PHONE}</p>
              </div>
            </div>

            {/* Endereço card */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-emerald-600" aria-hidden />
                <span className="text-sm font-bold text-zinc-900">Como nos encontrar</span>
              </div>
              <p className="text-sm text-zinc-600">
                Bragança Paulista, SP<br />
                Região metropolitana de Campinas<br />
                <span className="text-zinc-400">Visitas: sábados com agendamento</span>
              </p>
              <a
                href="https://maps.google.com/?q=Bragança+Paulista+SP"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline"
              >
                Abrir no Google Maps →
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* ── FAQ accordion ────────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
              Perguntas frequentes
            </span>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
              Dúvidas antes do primeiro contato
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-zinc-200 bg-white px-6 py-4 open:border-emerald-200 transition"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 marker:hidden list-none">
                  <span>{item.q}</span>
                  <span className="shrink-0 rounded-full border border-zinc-200 p-1 text-zinc-400 group-open:border-emerald-300 group-open:text-emerald-600 transition">
                    <svg className="h-3.5 w-3.5 group-open:rotate-45 transition-transform duration-200" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path d="M7 1v12M1 7h12" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 py-20 text-center text-white">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para dar o primeiro passo?
          </h2>
          <p className="mt-4 text-emerald-100">
            Uma conversa de 5 minutos é suficiente para saber se um Spitz Alemão Anão
            da By Império Dog combina com a sua família.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={waMainLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-lg"
            >
              <WAIcon size={18} aria-hidden />
              Falar no WhatsApp
            </a>
            <Link
              href={routes.filhotes}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Ver filhotes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
