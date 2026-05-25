"use client";

/**
 * PuppyStickyFloatingCTA — CTA flutuante que aparece ao rolar.
 *
 * Desktop: card compacto no canto inferior-direito com thumbnail, nome e preço
 * Mobile:  barra inferior full-width
 *
 * Aparece após scrollY > 380px com spring entrance.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  name: string;
  coverImage?: string;
  priceCents?: number;
  waLink: string;
  status: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatPrice(cents?: number) {
  if (!cents) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PuppyStickyFloatingCTA({ name, coverImage, priceCents, waLink, status }: Props) {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  const isSold = status === "sold" || status === "vendido";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isSold) return null;

  const price = formatPrice(priceCents);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ── Mobile: barra inferior ─────────────────────────────────────── */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/96 px-4 py-3 backdrop-blur-md lg:hidden"
            initial={{ y: reduced ? 0 : 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <PawConfettiButton
              href={waLink}
              rel="noreferrer"
              target="_blank"
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-lg hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              emojis="paw"
              count={12}
              aria-label={`Entrar em contato sobre ${name} via WhatsApp`}
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Tenho interesse em {name}
            </PawConfettiButton>
          </motion.div>

          {/* ── Desktop: card flutuante ────────────────────────────────────── */}
          <motion.div
            className="fixed bottom-6 right-6 z-40 hidden w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white/96 shadow-2xl backdrop-blur-md lg:block"
            initial={{ y: reduced ? 0 : 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: reduced ? 0 : 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            {/* Thumbnail */}
            {coverImage && (
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)" }}
                  aria-hidden="true"
                />
                <p className="absolute bottom-2 left-3 text-sm font-bold text-white drop-shadow">
                  {name}
                </p>
              </div>
            )}

            <div className="p-4">
              {/* Preço */}
              {price && (
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xl font-extrabold text-[var(--accent)]">{price}</p>
                  <p className="text-[11px] text-zinc-400">CBKC incluso</p>
                </div>
              )}

              {/* CTA */}
              <PawConfettiButton
                href={waLink}
                rel="noreferrer"
                target="_blank"
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                emojis="mixed"
                count={14}
                aria-label={`Entrar em contato sobre ${name} via WhatsApp`}
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                Falar sobre este filhote
              </PawConfettiButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
