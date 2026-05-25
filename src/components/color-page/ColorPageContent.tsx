"use client";

/**
 * ColorPageContent — Experiência épica por cor de Spitz Alemão Anão.
 *
 * Seções:
 *  1. Hero fullscreen — gradiente por cor, imagem flutuante, stats, CTA
 *  2. Personalidade — trait bars animadas com useInView
 *  3. Catálogo — grid de filhotes com hover cinematográfico
 *  4. Navegação por cor — swatches visuais
 *  5. FAQ accordion — smooth AnimatePresence
 *  6. CTA final
 */

import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ALL_COLORS, COLOR_SEO, type CatalogItem, type ColorSeo, formatPrice } from "@/lib/catalog-utils";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// ─── Temas por cor ────────────────────────────────────────────────────────────

const THEMES = {
  creme: {
    heroGradient: "bg-gradient-to-br from-amber-50 via-orange-50/40 to-zinc-50",
    heroDark:     false,
    sectionBg:    "bg-amber-50/50",
    accentText:   "text-amber-700",
    accentBg:     "bg-amber-500",
    accentLight:  "bg-amber-100",
    accentBorder: "border-amber-200",
    progressBar:  "bg-amber-500",
    badge:        "✨ A mais valorizada",
    badgeCss:     "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    swatchCss:    "bg-[#f5e6c8] ring-amber-300",
    heroImg:      "/filhotes/creme/creme-femea-01.jpg",
    traits: [
      { label: "Docilidade",          pct: 95, icon: "🧸" },
      { label: "Afeto c/ crianças",   pct: 92, icon: "👶" },
      { label: "Raridade",            pct: 85, icon: "💎" },
      { label: "Vida em apartamento", pct: 96, icon: "🏢" },
    ],
  },
  laranja: {
    heroGradient: "bg-gradient-to-br from-orange-100 via-amber-50/60 to-zinc-50",
    heroDark:     false,
    sectionBg:    "bg-orange-50/50",
    accentText:   "text-orange-600",
    accentBg:     "bg-orange-500",
    accentLight:  "bg-orange-100",
    accentBorder: "border-orange-200",
    progressBar:  "bg-orange-500",
    badge:        "🔥 A mais icônica",
    badgeCss:     "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
    swatchCss:    "bg-orange-400 ring-orange-500",
    heroImg:      "/filhotes/laranja/laranja-femea-flores-01.jpg",
    traits: [
      { label: "Alegria e energia",   pct: 92, icon: "⚡" },
      { label: "Sociabilidade",       pct: 96, icon: "🤝" },
      { label: "Afeto c/ crianças",   pct: 95, icon: "👶" },
      { label: "Vida em apartamento", pct: 95, icon: "🏢" },
    ],
  },
  preto: {
    heroGradient: "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800",
    heroDark:     true,
    sectionBg:    "bg-zinc-50",
    accentText:   "text-zinc-700",
    accentBg:     "bg-zinc-700",
    accentLight:  "bg-zinc-100",
    accentBorder: "border-zinc-200",
    progressBar:  "bg-zinc-800",
    badge:        "🖤 Elegância Rara",
    badgeCss:     "bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700",
    swatchCss:    "bg-zinc-900 ring-zinc-600",
    heroImg:      "/filhotes/preto/preto-filhote-flores-01.jpg",
    traits: [
      { label: "Lealdade",         pct: 98, icon: "❤️" },
      { label: "Elegância",        pct: 99, icon: "✨" },
      { label: "Raridade",         pct: 92, icon: "💎" },
      { label: "Vínculo c/ tutor", pct: 97, icon: "🤝" },
    ],
  },
  "wolf-sable": {
    heroGradient: "bg-gradient-to-br from-stone-300 via-stone-100/80 to-zinc-50",
    heroDark:     false,
    sectionBg:    "bg-stone-50",
    accentText:   "text-stone-700",
    accentBg:     "bg-stone-700",
    accentLight:  "bg-stone-200",
    accentBorder: "border-stone-200",
    progressBar:  "bg-stone-600",
    badge:        "🐺 O mais raro do Brasil",
    badgeCss:     "bg-stone-200 text-stone-800 ring-1 ring-stone-300",
    swatchCss:    "bg-stone-400 ring-stone-500",
    heroImg:      "/filhotes/wolf-sable/wolf-sable-femea-01.jpg",
    traits: [
      { label: "Inteligência",        pct: 97, icon: "🧠" },
      { label: "Raridade",            pct: 98, icon: "💎" },
      { label: "Expressividade",      pct: 99, icon: "🎭" },
      { label: "Vida em apartamento", pct: 90, icon: "🏢" },
    ],
  },
} as const;

type ColorKey = keyof typeof THEMES;

// ─── TraitBar ─────────────────────────────────────────────────────────────────

function TraitBar({
  label, pct, icon, progressBar,
}: {
  label: string; pct: number; icon: string; progressBar: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <span aria-hidden="true">{icon}</span>
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-zinc-500">{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <motion.div
          className={`h-full rounded-full ${progressBar}`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
          }
        />
      </div>
    </div>
  );
}

// ─── PuppyCard ────────────────────────────────────────────────────────────────

function PuppyCard({ puppy }: { puppy: CatalogItem }) {
  const img = puppy.images.find((i) => !i.endsWith(".mp4")) ?? puppy.images[0];
  const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";
  const corLabel = (puppy as Record<string, unknown>).cor as string ?? puppy.color;
  const priceCents =
    ((puppy as Record<string, unknown>).priceCents as number) ??
    ((puppy as Record<string, unknown>).price_cents as number) ??
    0;
  const isAvailable = puppy.status === "available";

  const waLink = buildWhatsAppLink({
    message:      `Olá! Vi o ${puppy.name} na página de cores do site e tenho interesse. Pode me informar disponibilidade?`,
    utmSource:    "site",
    utmMedium:    "color_page",
    utmCampaign:  "filhote_cor",
    utmContent:   puppy.slug,
  });

  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-900/5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-emerald-200"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/filhotes/${puppy.slug}`} tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={`${puppy.name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow ${
              isAvailable ? "bg-emerald-500" : "bg-amber-500"
            }`}
          >
            {isAvailable ? "Disponível" : "Reservado"}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {sexLabel}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link
            href={`/filhotes/cor/${puppy.color}`}
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-emerald-600 transition"
          >
            {corLabel}
          </Link>
          <Link href={`/filhotes/${puppy.slug}`}>
            <h3 className="mt-0.5 text-base font-bold text-zinc-900 transition group-hover:text-emerald-700">
              {puppy.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto space-y-3">
          {priceCents > 0 && (
            <div>
              <p className="text-xl font-extrabold text-[var(--accent,#059669)]">
                {formatPrice(priceCents)}
              </p>
              <p className="text-[10px] text-zinc-400">pedigree CBKC incluso</p>
            </div>
          )}
          <PawConfettiButton
            href={waLink}
            rel="noreferrer"
            target="_blank"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow transition hover:bg-emerald-700 hover:scale-[1.02]"
            emojis="mixed"
            count={12}
          >
            <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
            Tenho interesse
          </PawConfettiButton>
          <Link
            href={`/filhotes/${puppy.slug}`}
            className="block text-center text-xs font-medium text-zinc-400 hover:text-emerald-600 transition"
          >
            Ver galeria completa →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left text-zinc-900 transition hover:bg-zinc-50"
        aria-expanded={open}
      >
        <span className="font-semibold leading-snug">{question}</span>
        <motion.span
          className="shrink-0 text-2xl font-light text-zinc-400"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="border-t border-zinc-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-zinc-600">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Color Swatch Nav ─────────────────────────────────────────────────────────

function ColorNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="Navegar por cor"
      className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0"
    >
      {ALL_COLORS.map((cor) => {
        const seo = COLOR_SEO[cor];
        const t = THEMES[cor as ColorKey];
        const isActive = cor === active;
        return (
          <Link
            key={cor}
            href={`/filhotes/cor/${cor}`}
            className={`flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? "bg-zinc-900 text-white shadow-lg ring-2 ring-zinc-900/20"
                : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 hover:shadow-sm"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`h-3.5 w-3.5 shrink-0 rounded-full ring-2 ${t?.swatchCss ?? "bg-zinc-300 ring-zinc-400"}`}
              aria-hidden="true"
            />
            {seo?.h1 ?? cor}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  color: string;
  seo: ColorSeo;
  puppies: CatalogItem[];
  waLink: string;
}

export default function ColorPageContent({ color, seo, puppies, waLink }: Props) {
  const theme    = THEMES[color as ColorKey] ?? THEMES.creme;
  const reduced  = useReducedMotion();
  const { heroDark } = theme;

  const available = puppies.filter((p) => p.status === "available").length;
  const allPrices = puppies.map(
    (p) =>
      ((p as Record<string, unknown>).priceCents as number) ??
      ((p as Record<string, unknown>).price_cents as number) ??
      0
  ).filter(Boolean);
  const priceMin = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  return (
    <>
      {/* ── 1. HERO ───────────────────────────────────────────────────────────── */}
      <section
        className={`relative overflow-hidden ${theme.heroGradient} py-12 sm:py-28`}
        aria-labelledby="color-h1"
      >
        {/* Decorative blur orb */}
        <div
          className="pointer-events-none absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: heroDark
              ? "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">

          {/* ── LEFT: copy ── */}
          <motion.div
            className="flex flex-col gap-6"
            initial={reduced ? {} : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { label: "Início",   href: "/" },
                { label: "Filhotes", href: "/filhotes" },
              ].map(({ label, href }) => (
                <span key={href} className="flex items-center gap-1.5">
                  <Link
                    href={href}
                    className={`transition hover:underline ${heroDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-400 hover:text-zinc-700"}`}
                  >
                    {label}
                  </Link>
                  <span className={heroDark ? "text-zinc-600" : "text-zinc-300"} aria-hidden="true">/</span>
                </span>
              ))}
              <span className={`font-medium ${heroDark ? "text-zinc-200" : "text-zinc-700"}`} aria-current="page">
                {seo.h1}
              </span>
            </nav>

            {/* Badge */}
            <motion.span
              className={`w-fit rounded-full px-3.5 py-1.5 text-xs font-bold ${theme.badgeCss}`}
              initial={reduced ? {} : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {theme.badge}
            </motion.span>

            {/* H1 */}
            <h1
              id="color-h1"
              className={`text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl ${
                heroDark ? "text-white" : "text-zinc-900"
              }`}
            >
              {seo.h1}
            </h1>

            {/* Intro */}
            <p
              className={`max-w-lg text-base leading-relaxed sm:text-lg ${
                heroDark ? "text-zinc-300" : "text-zinc-600"
              }`}
            >
              {seo.intro}
            </p>

            {/* Stats pill row */}
            <div
              className={`flex flex-wrap items-center gap-5 rounded-2xl px-5 py-4 backdrop-blur-sm ring-1 ${
                heroDark
                  ? "bg-white/8 ring-white/10"
                  : "bg-white/70 ring-zinc-900/5"
              }`}
            >
              {[
                {
                  value: available > 0 ? String(available) : "—",
                  label: available === 1 ? "disponível" : "disponíveis",
                },
                priceMin > 0
                  ? { value: formatPrice(priceMin), label: "a partir de" }
                  : null,
                { value: "Pedigree CBKC", label: "incluso" },
                { value: "Mentoria", label: "vitalícia" },
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item!.label} className="text-center min-w-[72px]">
                    <p
                      className={`text-lg font-extrabold leading-tight tabular-nums ${
                        heroDark ? "text-white" : "text-zinc-900"
                      }`}
                    >
                      {item!.value}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] ${
                        heroDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      {item!.label}
                    </p>
                  </div>
                ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PawConfettiButton
                href={waLink}
                rel="noreferrer"
                target="_blank"
                className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-7 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                emojis="mixed"
                count={14}
              >
                <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
                Consultar disponibilidade
              </PawConfettiButton>
              <Link
                href="/filhotes"
                className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border px-6 text-sm font-semibold transition hover:scale-[1.02] sm:w-auto ${
                  heroDark
                    ? "border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:bg-white/5 hover:text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                Ver todos os filhotes →
              </Link>
            </div>
          </motion.div>

          {/* ── RIGHT: hero image ── */}
          <motion.div
            className="relative flex justify-center"
            initial={reduced ? {} : { opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <div className="relative w-full max-w-md">
              <div className="overflow-hidden rounded-3xl shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={theme.heroImg}
                  alt={`${seo.h1} — By Império Dog`}
                  className="aspect-[3/4] w-full object-cover"
                  loading="eager"
                />
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 rounded-3xl ${
                    heroDark
                      ? "bg-gradient-to-t from-zinc-900/30 to-transparent"
                      : "bg-gradient-to-t from-black/10 to-transparent"
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* Floating "incluso" badge */}
              <motion.div
                className={`absolute bottom-3 left-3 sm:-bottom-5 sm:-left-8 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md ring-1 ${
                  heroDark ? "bg-zinc-900/90 ring-white/10" : "bg-white/95 ring-zinc-900/5"
                }`}
                animate={reduced ? {} : { y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${heroDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  Incluso
                </p>
                <p className={`mt-0.5 font-bold ${heroDark ? "text-white" : "text-zinc-900"}`}>
                  Pedigree CBKC
                </p>
                <p className={`text-xs ${heroDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  + Mentoria vitalícia
                </p>
              </motion.div>

              {/* Floating "10+ anos" badge */}
              <motion.div
                className={`absolute right-3 top-3 sm:-right-8 sm:top-8 rounded-2xl px-3 py-2.5 shadow-xl backdrop-blur-md ring-1 ${
                  heroDark ? "bg-zinc-900/90 ring-white/10" : "bg-white/95 ring-zinc-900/5"
                }`}
                animate={reduced ? {} : { y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 0.6 }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${heroDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  By Império Dog
                </p>
                <p className={`mt-0.5 font-bold text-emerald-600`}>
                  10+ anos
                </p>
                <p className={`text-xs ${heroDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  de criação
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. PERSONALIDADE ──────────────────────────────────────────────────── */}
      <section
        className={`py-14 sm:py-28 ${theme.sectionBg}`}
        aria-labelledby="personality-heading"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-start">

            {/* Trait bars */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
                Temperamento
              </p>
              <h2
                id="personality-heading"
                className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
              >
                Personalidade e Temperamento
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                {seo.intro}
              </p>
              <div className="mt-8 space-y-6">
                {theme.traits.map((trait) => (
                  <TraitBar
                    key={trait.label}
                    label={trait.label}
                    pct={trait.pct}
                    icon={trait.icon}
                    progressBar={theme.progressBar}
                  />
                ))}
              </div>
            </div>

            {/* Characteristics list */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
                Diferenciais
              </p>
              <h3 className="mt-3 text-2xl font-bold text-zinc-900">
                O que torna essa cor especial
              </h3>
              <ul className="mt-6 space-y-3">
                {seo.characteristics.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-900/5 shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true">✓</span>
                    <span className="text-sm leading-relaxed text-zinc-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FILHOTES ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28" aria-labelledby="puppies-heading">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">

          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
              Catálogo
            </p>
            <h2
              id="puppies-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
            >
              {puppies.length > 0
                ? `${puppies.length} ${puppies.length === 1 ? "filhote" : "filhotes"} ${seo.h1}`
                : `Filhotes ${seo.h1}`}
            </h2>
            {puppies.length > 0 && (
              <p className="mt-2 text-zinc-500">
                Todos criados em ambiente familiar com socialização guiada desde o nascimento.
              </p>
            )}
          </motion.div>

          {puppies.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {puppies.map((puppy) => (
                <PuppyCard key={puppy.slug} puppy={puppy} />
              ))}
            </div>
          ) : (
            <motion.div
              className="mx-auto max-w-lg rounded-3xl bg-zinc-50 p-12 text-center ring-1 ring-zinc-200"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-5xl" aria-hidden="true">🐾</p>
              <p className="mt-5 text-lg font-bold text-zinc-800">
                Sem filhotes disponíveis agora
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Entre na lista de interesse e seja avisado assim que a próxima ninhada for confirmada.
              </p>
              <PawConfettiButton
                href={waLink}
                rel="noreferrer"
                target="_blank"
                className="mx-auto mt-7 flex min-h-[52px] w-fit items-center gap-2.5 rounded-2xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-500 hover:scale-[1.02]"
                emojis="paw"
                count={10}
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                Entrar na lista de interesse
              </PawConfettiButton>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── 4. COLOR NAV ──────────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 py-14" aria-label="Navegar por cor">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
            Explorar outras cores
          </p>
          <ColorNav active={color} />
        </div>
      </section>

      {/* ── 5. FAQ ────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
              Dúvidas
            </p>
            <h2
              id="faq-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
            >
              Perguntas sobre {seo.h1}
            </h2>
          </div>
          <div className="space-y-3">
            {seo.faqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Pronto para encontrar seu companheiro?
            </h2>
            <p className="mt-3 text-lg text-emerald-100">
              Fale com a nossa equipe. A gente te ajuda a encontrar o filhote ideal para o seu perfil.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <PawConfettiButton
                href={waLink}
                rel="noreferrer"
                target="_blank"
                className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-8 text-base font-bold text-emerald-700 shadow-xl transition hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98]"
                emojis="mixed"
                count={16}
              >
                <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
                Falar com a equipe agora
              </PawConfettiButton>
              <Link
                href="/filhotes"
                className="flex min-h-[56px] items-center rounded-2xl border-2 border-white/40 px-7 text-sm font-semibold text-white transition hover:bg-white/10 hover:scale-[1.02]"
              >
                Ver todos os filhotes →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
