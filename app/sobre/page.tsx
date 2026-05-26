import {
  CheckCircle,
  Heart,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import TextTestimonials from "@/components/sections/TextTestimonials";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Sobre a By Império Dog | Canil Spitz Alemão Anão desde 2012 — Bragança Paulista",
  description:
    "Conheça a história da By Império Dog: 13 anos criando Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade em Bragança Paulista, SP. Metodologia familiar, registro oficial e mentoria vitalícia.",
  keywords: [
    "criador Spitz Alemão Anão confiável",
    "canil Lulu da Pomerânia Bragança Paulista",
    "By Império Dog sobre",
    "história canil Spitz Alemão SP",
    "canil responsável interior SP",
  ],
  alternates: { canonical: `${SITE_URL}/sobre` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/sobre`,
    title: "Sobre a By Império Dog — 13 anos criando Spitz Alemão Anão em Bragança Paulista",
    description:
      "13 anos criando Spitz Alemão Anão com responsabilidade. Metodologia familiar, registro oficial e mentoria vitalícia.",
  },
};

const TIMELINE = [
  {
    year: "2012",
    title: "O primeiro Spitz chegou",
    description:
      "Por puro amor à raça, a família Império recebeu a primeira fêmea de Spitz Alemão Anão e começou um longo estudo sobre genética, saúde e padrões da raça.",
    emoji: "🐾",
  },
  {
    year: "2015",
    title: "Primeira ninhada registrada",
    description:
      "A primeira ninhada com registro oficial saiu da By Império Dog. Um marco que estabeleceu o compromisso com a rastreabilidade e a saúde validada.",
    emoji: "📋",
  },
  {
    year: "2018",
    title: "100 famílias atendidas",
    description:
      "Atingimos a marca de 100 famílias em todo o Brasil. Cada entrega foi acompanhada de perto, com contrato claro e suporte pós-entrega.",
    emoji: "🏡",
  },
  {
    year: "2022",
    title: "Estrutura de maternidade dedicada",
    description:
      "Inauguramos a maternidade monitorada com câmeras, ambiente climatizado e espaço de socialização sensorial para os filhotes.",
    emoji: "🏗️",
  },
  {
    year: "2026",
    title: "Mais de 180 famílias felizes",
    description:
      "Hoje, mais de 180 famílias espalhadas pelo Brasil confiam na By Império Dog para escolher seu Spitz Alemão Anão. E cada uma recebe mentoria vitalícia.",
    emoji: "💚",
  },
] as const;

const VALUES = [
  {
    icon: Shield,
    title: "Transparência absoluta",
    description:
      "Registro oficial, laudos de saúde, contratos claros e nada de surpresas. Você sabe o que está levando para casa.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    icon: Heart,
    title: "Vínculo desde o nascimento",
    description:
      "Os filhotes crescem dentro de casa, ao lado da família — com música, vozes, crianças e afeto desde o primeiro dia.",
    color: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    icon: CheckCircle,
    title: "Saúde validada",
    description:
      "Exames genéticos, cardiológicos e protocolo veterinário completo antes da entrega. Saúde não é opcional.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    icon: Users,
    title: "Suporte vitalício",
    description:
      "Você não fica sozinho depois da entrega. Grupo de WhatsApp, biblioteca de conteúdos e parceiros especializados disponíveis sempre.",
    color: "bg-violet-50 text-violet-700 border-violet-100",
  },
] as const;

const DIFERENCIAIS = [
  {
    label: "Registro oficial",
    us: "CBKC / SBK em todas as ninhadas",
    them: "Sem documentação ou registro informal",
  },
  {
    label: "Saúde comprovada",
    us: "Exames genéticos, laudos e carteira de vacinas",
    them: "Apenas vacinação básica sem laudos",
  },
  {
    label: "Suporte após a entrega",
    us: "Mentoria vitalícia com grupo e plantão WhatsApp",
    them: "Sem acompanhamento pós-venda",
  },
  {
    label: "Contrato claro",
    us: "Contrato digital com garantias e cláusulas de devolução",
    them: "Recibo informal ou sem garantia",
  },
  {
    label: "Socialização",
    us: "Protocolo ENS desde o nascimento em ambiente familiar",
    them: "Socialização mínima em canil segregado",
  },
] as const;

export default function SobrePage() {
  const waLink = buildWhatsAppLink({
    message: "Olá! Quero conhecer mais sobre a criadora e o processo da By Império Dog.",
    utmSource: "sobre",
    utmCampaign: "sobre-cta",
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Sobre", item: `${SITE_URL}/sobre` },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/sobre#webpage`,
    url: `${SITE_URL}/sobre`,
    name: "Sobre a By Império Dog",
    description:
      "13 anos criando Spitz Alemão Anão com responsabilidade. Metodologia familiar, registro oficial e mentoria vitalícia em Bragança Paulista.",
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: "By Imperio Dog" },
  };

  const businessLd = buildLocalBusinessLD();

  return (
    <main>
      <Script id="ld-breadcrumb-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-webpage-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <Script id="ld-business-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      {/* ── Hero pessoal ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 px-5 py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, #059669 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #065f46 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-900/40 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Nossa história
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Comecei em 2012 por amor à raça.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300 sm:text-xl">
            Hoje, cada filhote que sai daqui carrega{" "}
            <strong className="text-emerald-400">13 anos de aprendizado</strong>,
            afeto e responsabilidade genética.
          </p>
          <p className="mt-4 max-w-xl text-zinc-400 leading-relaxed">
            A By Império Dog nasceu em Bragança Paulista, SP, de uma paixão genuína pelo
            Spitz Alemão Anão (Lulu da Pomerânia). Não somos uma fábrica de filhotes —
            somos uma família que escolheu fazer isso com seriedade.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition px-6 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <WAIcon size={18} aria-hidden />
              Falar com a criadora
            </a>
            <Link
              href="/filhotes"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 hover:border-emerald-600 transition px-6 py-3 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              Ver filhotes disponíveis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Nossa trajetória</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              13 anos construindo confiança
            </h2>
          </div>
          <ol className="relative space-y-0" aria-label="Linha do tempo da By Império Dog">
            {TIMELINE.map((item, i) => (
              <li key={item.year} className="relative flex gap-6 pb-10 last:pb-0">
                {/* Vertical line */}
                {i < TIMELINE.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-emerald-100" aria-hidden />
                )}
                {/* Circle */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 shadow-sm">
                  <span className="text-base" aria-hidden>{item.emoji}</span>
                </div>
                <div className="flex-1 pt-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">{item.year}</span>
                  <h3 className="mt-1 text-lg font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Valores ──────────────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">O que nos guia</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Nossos valores
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <article
                key={value.title}
                className={`flex flex-col gap-4 rounded-2xl border p-6 transition hover:shadow-md ${value.color}`}
              >
                <value.icon className="h-7 w-7" aria-hidden />
                <div>
                  <h3 className="font-bold text-base">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-80">{value.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais comparativos ─────────────────────────────────────────── */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Comparativo</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              O que nos diferencia
            </h2>
            <p className="mt-3 text-zinc-500">
              Antes de decidir, compare. Transparência é um dos nossos valores.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-[1fr,1fr,1fr] bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500 sm:grid-cols-[1.5fr,1fr,1fr]">
              <div className="px-5 py-3">Critério</div>
              <div className="px-5 py-3 text-emerald-700">By Império Dog</div>
              <div className="px-5 py-3 text-zinc-400">Criadores comuns</div>
            </div>
            {/* Rows */}
            {DIFERENCIAIS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr,1fr,1fr] sm:grid-cols-[1.5fr,1fr,1fr] border-t border-zinc-100 ${i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}`}
              >
                <div className="flex items-start px-5 py-4">
                  <span className="text-sm font-semibold text-zinc-800">{row.label}</span>
                </div>
                <div className="flex items-start gap-2 px-5 py-4">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-sm text-zinc-700">{row.us}</span>
                </div>
                <div className="flex items-start gap-2 px-5 py-4">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-zinc-300 text-lg leading-none">×</span>
                  <span className="text-sm text-zinc-400">{row.them}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ──────────────────────────────────────────────────────── */}
      <section className="bg-emerald-50 px-5 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Famílias reais</span>
          </div>
        </div>
        <TextTestimonials />
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-emerald-200" aria-hidden />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Veja os filhotes disponíveis hoje
          </h2>
          <p className="mt-4 text-emerald-100">
            Cada ninhada é única. Não deixe para amanhã a conversa que pode mudar a vida da sua família.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/filhotes"
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-lg"
            >
              Ver filhotes disponíveis
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              <WAIcon size={18} aria-hidden />
              Conversar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
