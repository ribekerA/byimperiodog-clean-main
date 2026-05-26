"use client";

import Link from "next/link";
import { useMemo } from "react";

import { TiltCard } from "@/components/motion/TiltCard";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { HeartBurstButton } from "@/components/motion/HeartBurst";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { staticPuppies } from "@/content/puppies-static";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StaticPuppyCardProps = {
  id: string;
  slug: string;
  name: string;
  color?: string;
  cor?: string;
  sex?: string;
  gender?: string;
  status?: string;
  priceCents?: number;
  price_cents?: number;
  images: string[];
  description?: string;
  priority?: boolean;
};

// ─── Mapas de cor ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string }> = {
  available:  { label: "Disponível", icon: "✓", bg: "bg-emerald-500" },
  disponivel: { label: "Disponível", icon: "✓", bg: "bg-emerald-500" },
  reserved:   { label: "Reservado",  icon: "⏳", bg: "bg-amber-500"  },
  reservado:  { label: "Reservado",  icon: "⏳", bg: "bg-amber-500"  },
  sold:       { label: "Vendido",    icon: "✕", bg: "bg-zinc-500"   },
  vendido:    { label: "Vendido",    icon: "✕", bg: "bg-zinc-500"   },
};

/** Glow colorido por pelagem do filhote */
const COLOR_GLOW: Record<string, string> = {
  creme:        "rgba(243,181,98,0.45)",
  laranja:      "rgba(249,115,22,0.40)",
  preto:        "rgba(161,161,170,0.30)",
  "wolf-sable": "rgba(99,102,241,0.35)",
  branco:       "rgba(255,255,255,0.30)",
};
const DEFAULT_GLOW = "rgba(52,211,153,0.30)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents?: number) {
  if (!cents) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function StaticPuppyCard({
  id,
  slug,
  name,
  color,
  cor,
  sex,
  gender,
  status = "available",
  priceCents,
  price_cents,
  images,
  description,
  priority = false,
}: StaticPuppyCardProps) {
  const corLabel = cor ?? color ?? "";
  const corKey = (color ?? cor ?? "").toLowerCase();
  const sexRaw = sex ?? gender ?? "";
  const sexLabel =
    sexRaw === "female" || sexRaw === "femea" ? "Fêmea" :
    sexRaw === "male"   || sexRaw === "macho" ? "Macho" : "";
  const price = priceCents ?? price_cents;
  const cover = images.find((img) => !img.endsWith(".mp4")) ?? images[0];
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  const isSold = status === "sold" || status === "vendido";
  const glowColor = COLOR_GLOW[corKey] ?? DEFAULT_GLOW;

  // Escassez da cor
  const availableOfSameColor = (staticPuppies as any[]).filter((p) => {
    const pColor = (p.color ?? p.cor ?? "").toLowerCase();
    const pStatus = p.status ?? "available";
    return pColor === corKey && pStatus !== "sold" && pStatus !== "vendido";
  }).length;
  const isLastOfColor = availableOfSameColor === 1 && !isSold;
  const isAlmostGone = availableOfSameColor === 2 && !isSold;

  const waLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: `Olá! Vi o filhote ${name} (${corLabel} ${sexLabel}) no site e quero saber disponibilidade.`,
        utmSource: "site",
        utmMedium: "catalog_card",
        utmCampaign: "filhote_card",
        utmContent: slug,
      }),
    [name, corLabel, sexLabel, slug]
  );

  return (
    <TiltCard glowColor={glowColor} maxTilt={9}>
      <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-900/6 h-full">

        {/* ── Foto (full-bleed, aspect 4/5) ──────────────────────────────────── */}
        <Link
          href={`/filhotes/${slug}`}
          aria-label={`Ver detalhes de ${name}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={`${name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.07]"
                loading={priority ? "eager" : "lazy"}
              />
            )}

            {/* Gradiente inferior para legibilidade do glass panel */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)",
              }}
              aria-hidden="true"
            />

            {/* Badge de status — top-left */}
            <span
              className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow ${statusCfg.bg}`}
            >
              <span aria-hidden="true">{statusCfg.icon}</span>
              {statusCfg.label}
            </span>

            {/* Sexo — top-right */}
            {sexLabel && (
              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                {sexLabel}
              </span>
            )}

            {/* Escassez — bottom-left da foto */}
            {isLastOfColor && (
              <span className="absolute bottom-3 left-3 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-foreground)] shadow">
                Último desta cor
              </span>
            )}
            {!isLastOfColor && isAlmostGone && (
              <span className="absolute bottom-3 left-3 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-foreground)] shadow">
                Apenas 2 disponíveis
              </span>
            )}
          </div>
        </Link>

        {/* ── Glass info panel ────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-3 p-4 backdrop-blur-sm">
          {/* Nome e cor */}
          <div>
            {corLabel && (
              <Link
                href={`/filhotes/cor/${corKey}`}
                className="text-xs font-semibold uppercase tracking-widest text-zinc-400 transition hover:text-emerald-600"
              >
                {corLabel}
              </Link>
            )}
            <Link href={`/filhotes/${slug}`}>
              <h3 className="mt-0.5 text-base font-bold text-zinc-900 transition-colors group-hover:text-emerald-700">
                {name}
              </h3>
            </Link>
            {description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{description}</p>
            )}
          </div>

          {/* Preço */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="text-xl font-extrabold text-[var(--accent)]">
              {formatPrice(price)}
            </span>
            <span className="text-[10px] font-medium text-zinc-400">Documentação inclusa</span>
          </div>

          {/* CTA WhatsApp + Heart — linha com dois elementos */}
          {!isSold && (
            <div className="flex items-center gap-2">
              <PawConfettiButton
                href={waLink}
                rel="noreferrer"
                target="_blank"
                wrapperClassName="flex-1"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm"
                emojis="paw"
                count={14}
                aria-label={`Entrar em contato sobre ${name} via WhatsApp`}
              >
                <WhatsAppIcon
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                Tenho interesse
              </PawConfettiButton>

              <HeartBurstButton
                puppyId={id}
                size={18}
                className="h-11 w-11"
                aria-label={`Curtir ${name}`}
              />
            </div>
          )}

          <Link
            href={`/filhotes/${slug}`}
            className="text-center text-xs font-medium text-zinc-400 transition hover:text-emerald-600 hover:underline"
          >
            Ver galeria e detalhes →
          </Link>
        </div>
      </article>
    </TiltCard>
  );
}
