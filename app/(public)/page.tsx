import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Script from "next/script";

import ColorGallery from "@/components/sections/ColorGallery";
import HomeFAQ from "@/components/sections/HomeFAQ";
import { HOME_FAQ_ITEMS } from "@/content/home-faq-items";
import NinhadaAlert from "@/components/sections/NinhadaAlert";
import PriceTransparency from "@/components/sections/PriceTransparency";
import TextTestimonials from "@/components/sections/TextTestimonials";
import VideoHero from "@/components/sections/VideoHero";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { staticPuppies } from "@/content/puppies-static";
import { buildLocalBusinessLD, buildFAQLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  ssr: false,
  loading: () => null,
});

// AI Matchmaker substitui o quiz estático (fallback para quiz se Groq indisponível)
const AiMatchmakerChat = dynamic(() => import("@/components/sections/AiMatchmakerChat"), {
  ssr: false,
  loading: () => null,
});

export const metadata: Metadata = {
  title: "Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista | By Império Dog",
  description:
    "Canil especializado em Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP. Filhotes com registro oficial, laudo de saúde, vacinação e mentoria vitalícia. 10+ anos, 180+ famílias. Entregamos em todo o Brasil.",
  keywords: [
    "Spitz Alemão Anão", "Lulu da Pomerânia", "Pomeranian",
    "filhote Spitz Alemão", "canil Bragança Paulista",
    "canil Spitz Alemão SP", "Lulu da Pomerânia à venda SP",
    "comprar Spitz Alemão Anão", "canil confiável Spitz",
    "registro oficial Spitz Alemão Anão", "Lulu da Pomerânia interior SP",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia) — Bragança Paulista, SP",
    description:
      "Canil especializado em Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria vitalícia inclusos. 10+ anos, 180+ famílias atendidas.",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "Filhote de Spitz Alemão Anão (Lulu da Pomerânia) — By Império Dog, Bragança Paulista SP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia)",
    description: "Criação responsável em Bragança Paulista, SP. Registro oficial, laudos e mentoria vitalícia inclusos.",
    images: ["/og/home.jpg"],
  },
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

// Links estratégicos — PageRank distribution para landing pages
const RACE_LINKS = [
  { emoji: "🐾", label: "Spitz Alemão Anão — A Raça", href: "/spitz-alemao",              desc: "Lulu da Pomerânia — origem, características, temperamento e cuidados" },
  { emoji: "💰", label: `Tabela de Preços ${new Date().getFullYear()}`,       href: "/preco-spitz-anao",          desc: "Valores por cor e sexo — sem surpresas" },
  { emoji: "🛡️", label: "Como Comprar com Segurança", href: "/comprar-spitz-anao",         desc: "Guia passo a passo para não cair em golpes" },
  { emoji: "🍼", label: "Filhote de Spitz Alemão",    href: "/filhote-de-spitz-alemao",   desc: "Lulu da Pomerânia — como escolher, primeiros cuidados e vacinação" },
  { emoji: "✅", label: "Criador Confiável",           href: "/criador-spitz-confiavel",   desc: "Documentação, laudos e red flags para evitar" },
  { emoji: "📍", label: "Canil no Interior de SP",    href: "/canil-spitz-alemao-interior-sp", desc: "Cidades atendidas — Bragança Paulista e região" },
] as const;

// Diferenciais — definidos fora para evitar recriação a cada render
const DIFFERENTIALS = [
  { emoji: "🏅", title: "Registro oficial incluso", body: "Toda documentação oficial entregue antes da reserva. Sem surpresas, sem letras miúdas." },
  { emoji: "🩺", title: "Saúde validada", body: "Laudo de saúde, exames genéticos e vacinação em dia. O filhote chega pronto." },
  { emoji: "🏡", title: "Socialização guiada", body: "Criados em ambiente familiar com estímulos visuais, auditivos e de contato desde o nascimento." },
  { emoji: "💬", title: "Mentoria vitalícia", body: "Suporte direto com a criadora via WhatsApp para rotina, nutrição e comportamento." },
  { emoji: "🚗", title: "Logística assistida", body: "Orientação completa sobre transporte seguro, seja buscar pessoalmente ou por transportadora." },
  { emoji: "📋", title: "Enxoval completo", body: "Lista personalizada de itens, alimentação e rotina entregue antes da chegada do filhote." },
] as const;

// Prova social — barra de trust signals
const TRUST_SIGNALS = [
  "Registro oficial",
  "Laudos de saúde",
  "Mentoria vitalícia inclusa",
  "10+ anos de criação",
  "180+ famílias atendidas",
] as const;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

// WebSite schema com SearchAction — sinaliza site canônico para IAs
const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "By Império Dog",
  alternateName: "Canil By Império Dog — Spitz Alemão Anão Lulu da Pomerânia",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
  // Speakable: marca o conteúdo principal para voice search
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["#hero-heading", "#featured-heading", "#diff-heading", "#faq-heading"],
  },
};

// Organization com autoridade semântica
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "By Império Dog",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/byimperiologo.svg`,
    width: 120,
    height: 120,
  },
  foundingDate: "2012",
  description: "Criação familiar e responsável de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP.",
  knowsAbout: [
    "Spitz Alemão Anão", "Lulu da Pomerânia", "Pomeranian",
    "criação responsável de cães", "registro oficial", "genética canina",
    "socialização de filhotes", "mentoria para tutores de pets",
  ],
  sameAs: [
    "https://www.instagram.com/byimperiodog",
    "https://www.facebook.com/byimperiodog",
    "https://www.youtube.com/@byimperiodog",
    "https://www.tiktok.com/@byimperiodogs",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+55-11-96863-3239",
    contactType: "customer service",
    availableLanguage: "Portuguese",
    areaServed: "BR",
    contactOption: "TollFree",
  },
};

export default function HomePage() {
  const businessLd = buildLocalBusinessLD();
  const faqLd      = buildFAQLD(HOME_FAQ_ITEMS);

  // 4 filhotes em destaque — disponíveis primeiro, mix de cores
  const featured = staticPuppies
    .filter((p) => p.status !== "sold" && p.status !== "vendido")
    .slice(0, 4);

  return (
    <>
      <Script
        id="ld-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
      />
      <Script
        id="ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <main id="conteudo-principal" role="main" className="relative flex flex-col">

        {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
        <VideoHero />

        {/* ── 2. SOCIAL PROOF BAR ────────────────────────────────────────────── */}
        <div className="border-b border-zinc-100 bg-white py-5 overflow-hidden">
          <StaggerContainer
            className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-5 text-sm text-zinc-500"
            stagger={0.07}
            delay={0.1}
          >
            {TRUST_SIGNALS.map((signal) => (
              <StaggerItem key={signal}>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-600" aria-hidden="true">✓</span>
                  {signal}
                </span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* ── 3. FILHOTES EM DESTAQUE ─────────────────────────────────────────── */}
        <section className="bg-[var(--bg)] py-14 sm:py-28 overflow-hidden" aria-labelledby="featured-heading">
          <div className="mx-auto max-w-7xl">

            {/* Header da seção */}
            <ScrollReveal className="mx-auto mb-8 max-w-xl px-5 text-center sm:mb-12 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
                Filhotes disponíveis
              </p>
              <h2 id="featured-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Conheça os filhotes
              </h2>
              <p className="mt-3 text-sm text-zinc-600 sm:text-base">
                Cada filhote criado com socialização guiada, alimentação premium e acompanhamento veterinário desde o nascimento.
              </p>
            </ScrollReveal>

            {/* ── Mobile: carrossel horizontal snap ─────────────────────────── */}
            <div className="sm:hidden">
              <ul
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Filhotes em destaque"
              >
                {featured.map((puppy, i) => {
                  const corLabel = (puppy as any).cor ?? puppy.color ?? "";
                  const sexRaw = puppy.sex ?? (puppy as any).gender ?? "";
                  const sexLabel = sexRaw === "female" ? "Fêmea" : sexRaw === "male" ? "Macho" : "";
                  const cover = puppy.images.find((img: string) => !img.endsWith(".mp4")) ?? puppy.images[0];
                  const price = (puppy as any).priceCents ?? (puppy as any).price_cents;
                  const isReserved = puppy.status === "reserved" || puppy.status === "reservado";
                  const waLink = buildWhatsAppLink({
                    message: `Olá! Vi o ${puppy.name} (${corLabel} ${sexLabel}) no site e quero saber mais informações.`,
                    utmSource: "site",
                    utmMedium: "featured_home",
                    utmCampaign: "filhotes",
                    utmContent: puppy.id,
                  });
                  return (
                    <li key={puppy.id} className="w-[72vw] max-w-[260px] shrink-0 snap-start">
                      <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-900/5 shadow-sm">
                        <Link href={`/filhotes/${puppy.slug}`} tabIndex={-1} aria-hidden="true">
                          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                            {cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={`${puppy.name} — Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel}`}
                                className="h-full w-full object-cover"
                                loading={i < 2 ? "eager" : "lazy"}
                              />
                            )}
                            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow ${isReserved ? "bg-amber-500" : "bg-emerald-500"}`}>
                              {isReserved ? "Reservado" : "Disponível"}
                            </span>
                            {sexLabel && (
                              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                {sexLabel}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex flex-1 flex-col gap-2.5 p-3">
                          <div>
                            <Link href={`/filhotes/cor/${puppy.color}`} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                              {corLabel}
                            </Link>
                            <Link href={`/filhotes/${puppy.slug}`}>
                              <h3 className="mt-0.5 text-sm font-bold text-zinc-900">{puppy.name}</h3>
                            </Link>
                          </div>
                          <div className="mt-auto">
                            {price > 0 && (
                              <p className="text-lg font-extrabold text-[var(--accent)]">{formatPrice(price)}</p>
                            )}
                            <p className="text-[9px] text-zinc-400">Documentação inclusa</p>
                          </div>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white active:scale-[0.97]"
                          >
                            <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                            Interesse
                          </a>
                        </div>
                      </article>
                    </li>
                  );
                })}
                {/* Peek card — CTA ver todos */}
                <li className="w-[56vw] max-w-[200px] shrink-0 snap-start">
                  <Link
                    href="/filhotes"
                    className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl bg-emerald-600 p-5 text-center shadow-md active:scale-[0.97] transition-transform"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">🐾</span>
                    <span className="text-sm font-bold leading-snug text-white">Ver todos os filhotes</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-700 text-sm font-bold shadow-sm">→</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* ── Desktop: grid 4-colunas ────────────────────────────────────── */}
            <div className="hidden sm:block px-5 sm:px-8">
              <StaggerContainer
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                stagger={0.12}
                delay={0.15}
              >
                {featured.map((puppy, i) => {
                  const corLabel = (puppy as any).cor ?? puppy.color ?? "";
                  const sexRaw = puppy.sex ?? (puppy as any).gender ?? "";
                  const sexLabel = sexRaw === "female" ? "Fêmea" : sexRaw === "male" ? "Macho" : "";
                  const cover = puppy.images.find((img: string) => !img.endsWith(".mp4")) ?? puppy.images[0];
                  const price = (puppy as any).priceCents ?? (puppy as any).price_cents;
                  const isReserved = puppy.status === "reserved" || puppy.status === "reservado";
                  const waLink = buildWhatsAppLink({
                    message: `Olá! Vi o ${puppy.name} (${corLabel} ${sexLabel}) no site e quero saber mais informações.`,
                    utmSource: "site",
                    utmMedium: "featured_home",
                    utmCampaign: "filhotes",
                    utmContent: puppy.id,
                  });
                  return (
                    <StaggerItem key={puppy.id}>
                      <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-900/5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <Link href={`/filhotes/${puppy.slug}`} tabIndex={-1} aria-hidden="true">
                          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                            {cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={`${puppy.name} — Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel}`}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                loading={i < 2 ? "eager" : "lazy"}
                              />
                            )}
                            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow ${isReserved ? "bg-amber-500" : "bg-emerald-500"}`}>
                              {isReserved ? "Reservado" : "Disponível"}
                            </span>
                            {sexLabel && (
                              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                {sexLabel}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div>
                            <Link href={`/filhotes/cor/${puppy.color}`} className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-emerald-600">
                              {corLabel}
                            </Link>
                            <Link href={`/filhotes/${puppy.slug}`}>
                              <h3 className="mt-0.5 text-base font-bold text-zinc-900 transition group-hover:text-emerald-700">
                                {puppy.name}
                              </h3>
                            </Link>
                          </div>
                          <div className="mt-auto">
                            {price > 0 && (
                              <p className="text-xl font-extrabold text-[var(--accent)]">{formatPrice(price)}</p>
                            )}
                            <p className="text-[10px] text-zinc-400">registro oficial incluso</p>
                          </div>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                            Tenho interesse
                          </a>
                          <Link
                            href={`/filhotes/${puppy.slug}`}
                            className="text-center text-xs font-medium text-zinc-400 hover:text-emerald-600 hover:underline"
                          >
                            Ver galeria →
                          </Link>
                        </div>
                      </article>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>

              <ScrollReveal delay={0.2} className="mt-12 text-center">
                <Link
                  href="/filhotes"
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-full border-2 border-zinc-200 px-8 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 hover:scale-[1.02]"
                >
                  Ver todos os filhotes disponíveis →
                </Link>
              </ScrollReveal>
            </div>

            {/* ── Mobile: CTA após carrossel ─────────────────────────────────── */}
            <div className="mt-6 px-5 sm:hidden">
              <Link
                href="/filhotes"
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-200 text-sm font-semibold text-zinc-700 transition active:scale-[0.98]"
              >
                Ver todos os filhotes disponíveis →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 4. GALERIA DE CORES ─────────────────────────────────────────────── */}
        <ColorGallery />

        {/* ── 5. DIFERENCIAIS ─────────────────────────────────────────────────── */}
        <section className="bg-white py-14 sm:py-28 overflow-hidden" aria-labelledby="diff-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">

            <ScrollReveal className="mx-auto mb-8 sm:mb-12 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Criação responsável</p>
              <h2 id="diff-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Por que a By Império Dog?
              </h2>
              <p className="mt-3 text-zinc-600 text-sm sm:text-base">
                Mais de 10 anos cuidando de cada detalhe para que você receba um filhote saudável, socializado e com suporte para toda a vida.
              </p>
            </ScrollReveal>

            <StaggerContainer
              className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.08}
              delay={0.1}
            >
              {DIFFERENTIALS.map(({ emoji, title, body }) => (
                <StaggerItem key={title}>
                  <div className="group flex h-full gap-3 sm:gap-4 rounded-2xl border border-zinc-100 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
                    <div
                      className="mt-0.5 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg sm:text-xl transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      {emoji}
                    </div>
                    <div>
                      <dt className="text-sm font-bold text-zinc-900 sm:text-base">{title}</dt>
                      <dd className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-600">{body}</dd>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── 6. AI MATCHMAKER ────────────────────────────────────────────────── */}
        <ScrollReveal variant="scaleIn" className="bg-[var(--bg)]">
          <AiMatchmakerChat />
        </ScrollReveal>

        {/* ── 7. PROVA SOCIAL ─────────────────────────────────────────────────── */}
        <div className="bg-white overflow-hidden">
          <ScrollReveal>
            <TextTestimonials />
          </ScrollReveal>
          <ScrollReveal delay={0.1} className="border-t border-zinc-100 pb-4">
            <Testimonials title="Álbum das famílias" />
          </ScrollReveal>
        </div>

        {/* ── 8. TRANSPARÊNCIA DE PREÇO ───────────────────────────────────────── */}
        <ScrollReveal className="bg-[var(--bg)]" variant="fadeUp">
          <PriceTransparency />
        </ScrollReveal>

        {/* ── 9. ALERTA DE NINHADA ────────────────────────────────────────────── */}
        <ScrollReveal variant="scaleIn" className="bg-[var(--bg)] px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <NinhadaAlert />
          </div>
        </ScrollReveal>

        {/* ── 10. FAQ — SEO semântico, voice search, AI overviews ─────────────── */}
        <ScrollReveal variant="fadeUp">
          <HomeFAQ />
        </ScrollReveal>

        {/* ── 10.5. RECURSOS SOBRE A RAÇA — PageRank distribution ─────────── */}
        <ScrollReveal variant="fadeUp">
          <section className="bg-zinc-50 border-t border-zinc-100 py-14 sm:py-20" aria-labelledby="recursos-heading">
            <div className="mx-auto max-w-5xl px-5 sm:px-8">
              <div className="mb-8 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Tudo sobre a raça</p>
                <h2 id="recursos-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Guias e recursos para novos tutores
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Conteúdo escrito por quem cria há mais de 13 anos — para você tomar a melhor decisão.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {RACE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="text-2xl" aria-hidden="true">{l.emoji}</span>
                    <span className="mt-3 text-sm font-bold text-zinc-900 leading-snug group-hover:text-emerald-700">{l.label}</span>
                    <span className="mt-1.5 text-xs text-zinc-500 leading-snug">{l.desc}</span>
                    <span className="mt-4 text-xs font-semibold text-emerald-700">Ler mais →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── 11. CTA DE GUIAS ────────────────────────────────────────────────── */}
        <ScrollReveal className="border-t border-zinc-200 bg-white py-14" variant="fadeUp">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Conteúdo educativo</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Prepare-se para receber seu filhote
            </h2>
            <p className="mt-3 text-zinc-600">
              Guias escritos por quem cria há mais de 10 anos: alimentação, cuidados, documentação e muito mais.
            </p>
            <Link
              href="/guias"
              className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-7 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 hover:scale-[1.02]"
            >
              Ver todos os guias →
            </Link>
          </div>
        </ScrollReveal>
      </main>
    </>
  );
}
