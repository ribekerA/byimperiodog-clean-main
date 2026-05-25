"use client";

/**
 * PuppyDetailPanel — Painel de detalhes animado para a página do filhote.
 *
 * Features:
 *  • Status badge com ponto pulsante
 *  • Preço com entrada animada (scale + fade)
 *  • Badge de escassez pulsante
 *  • Descrição com ScrollReveal
 *  • "Incluído no valor" com stagger por item
 *  • CTA principal com PawConfetti
 *  • HeartBurst para favoritar
 */

import Link from "next/link";
import { motion } from "framer-motion";

import { HeartBurstButton } from "@/components/motion/HeartBurst";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  name: string;
  corLabel: string;
  colorSlug: string;
  sexLabel: string;
  sexSlug: string;
  status: "available" | "reserved" | "sold";
  priceCents?: number;
  description: string;
  availableOfSameColor: number;
  waLink: string;
  slug: string;
  viewerCount?: number;
}

// ─── Configurações ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  available: {
    label: "Disponível",
    bg:    "bg-emerald-50",
    text:  "text-emerald-800",
    dot:   "bg-emerald-500",
    ring:  "ring-emerald-200",
  },
  reserved: {
    label: "Reservado",
    bg:    "bg-amber-50",
    text:  "text-amber-800",
    dot:   "bg-amber-500",
    ring:  "ring-amber-200",
  },
  sold: {
    label: "Vendido",
    bg:    "bg-zinc-50",
    text:  "text-zinc-600",
    dot:   "bg-zinc-400",
    ring:  "ring-zinc-200",
  },
} as const;

const INCLUDED = [
  { icon: "📋", title: "Pedigree CBKC",       desc: "Registro oficial da raça"        },
  { icon: "❤️", title: "Laudo cardiológico",  desc: "Atestado de saúde cardíaca"      },
  { icon: "💉", title: "Vacinação completa",  desc: "Protocolo vacinal em dia"        },
  { icon: "🔖", title: "Microchip",           desc: "Identificação permanente"        },
  { icon: "🎓", title: "Mentoria vitalícia",  desc: "Suporte direto com a criadora"   },
  { icon: "🧸", title: "Enxoval do filhote",  desc: "Kit de acolhimento incluso"      },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatPrice(cents?: number) {
  if (!cents) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PuppyDetailPanel({
  name,
  corLabel,
  colorSlug,
  sexLabel,
  sexSlug,
  status,
  priceCents,
  description,
  availableOfSameColor,
  waLink,
  slug,
}: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  const isSold      = status === "sold";
  const isLastColor = availableOfSameColor === 1 && !isSold;
  const isLowStock  = availableOfSameColor === 2 && !isSold;
  const price       = formatPrice(priceCents);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Status + taxonomia ───────────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap items-center gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
      >
        {/* Status badge com ponto pulsante */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
        >
          <span className="relative flex h-2 w-2">
            {!isSold && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${cfg.dot}`} />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
          </span>
          {cfg.label}
        </span>

        <Link
          href={`/filhotes/cor/${colorSlug}`}
          className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 hover:text-emerald-700"
        >
          Cor: {corLabel}
        </Link>

        <Link
          href={`/filhotes/sexo/${sexSlug}`}
          className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 hover:text-emerald-700"
        >
          {sexLabel}
        </Link>
      </motion.div>

      {/* ── Nome ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.18 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          {name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Spitz Alemão Anão · Bragança Paulista, SP
        </p>
      </motion.div>

      {/* ── Preço + escassez ─────────────────────────────────────────────── */}
      {price && (
        <motion.div
          className="flex flex-wrap items-end gap-3"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.26 }}
        >
          <div>
            <p className="text-3xl font-extrabold text-[var(--accent)]">{price}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Pedigree CBKC, laudos e mentoria inclusos</p>
          </div>

          {/* Badge de escassez pulsante */}
          {(isLastColor || isLowStock) && (
            <motion.span
              className="mb-1 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--accent-foreground)]"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            >
              ⚡{" "}
              {isLastColor
                ? "Último desta cor"
                : `Apenas ${availableOfSameColor} disponíveis`}
            </motion.span>
          )}
        </motion.div>
      )}

      {/* ── Descrição ────────────────────────────────────────────────────── */}
      <ScrollReveal variant="fadeIn" delay={0.08}>
        <p className="text-base leading-relaxed text-zinc-700">{description}</p>
      </ScrollReveal>

      {/* ── CTA principal ────────────────────────────────────────────────── */}
      {!isSold ? (
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.36 }}
        >
          <PawConfettiButton
            href={waLink}
            rel="noreferrer"
            target="_blank"
            wrapperClassName="flex-1"
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-2.5 sm:px-6 sm:text-base"
            emojis="mixed"
            count={16}
            aria-label={`Entrar em contato sobre ${name} via WhatsApp`}
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">Tenho interesse — falar agora</span>
          </PawConfettiButton>

          <HeartBurstButton
            puppyId={slug}
            size={22}
            className="h-14 w-14 rounded-xl"
          />
        </motion.div>
      ) : (
        <ScrollReveal variant="fadeIn" delay={0.2}>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-4 text-center text-sm text-zinc-500">
            Este filhote já foi para sua família. 🐾 Veja outros disponíveis abaixo.
          </div>
        </ScrollReveal>
      )}

      {/* ── Incluído no valor ────────────────────────────────────────────── */}
      <ScrollReveal variant="fadeUp" delay={0.05}>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Incluído no valor
          </p>

          <StaggerContainer stagger={0.07} delay={0.1} margin="-20px">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INCLUDED.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="group flex items-start gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 transition hover:border-emerald-100 hover:bg-emerald-50/60">
                    <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </ScrollReveal>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <ScrollReveal variant="fadeIn" delay={0.1}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
          {[
            { icon: "🏆", text: "10+ anos criando" },
            { icon: "👨‍👩‍👧", text: "180+ famílias felizes" },
            { icon: "✈️", text: "Entregamos em todo o Brasil" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span aria-hidden="true">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
