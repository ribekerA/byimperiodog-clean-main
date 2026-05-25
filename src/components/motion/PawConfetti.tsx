"use client";

/**
 * PawConfettiButton — Botão com explosão de patinhas 🐾 ao clicar.
 *
 * Renderiza <a> ou <button> com spring physics (whileTap) e dispara
 * 14 partículas de pata em trajetórias radiais com gravidade simulada.
 *
 * Props:
 *   href?        — se fornecido, renderiza <a target="_blank">
 *   onClick?     — callback adicional
 *   className    — classes do elemento filho
 *   children     — conteúdo interno
 *   disabled?    — desabilita confetti + pointer events
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useId, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Particle {
  id: string;
  /** deslocamento final X  (px, relativo ao centro do botão) */
  dx: number;
  /** deslocamento final Y  (px, para cima = negativo) */
  dy: number;
  rotate: number;
  size: number;
  color: string;
  /** delay de saída (0-0.15s) */
  delay: number;
  /** emoji — pode ser 🐾 ou ❤️ */
  emoji: string;
}

interface PawConfettiButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  /** Classe aplicada ao wrapper <div> externo (útil para flex-1, etc.) */
  wrapperClassName?: string;
  children: React.ReactNode;
  disabled?: boolean;
  /** Quantas partículas lançar (default: 14) */
  count?: number;
  /** "paw" | "heart" | "mixed" (default: "paw") */
  emojis?: "paw" | "heart" | "mixed";
  rel?: string;
  target?: string;
  "aria-label"?: string;
}

// ─── Paleta e configuração ────────────────────────────────────────────────────

const PAW_EMOJIS = ["🐾"];
const HEART_EMOJIS = ["❤️", "🧡", "💛"];
const MIXED_EMOJIS = ["🐾", "❤️", "🐾", "💛", "🐾", "🧡"];

const COLORS = [
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#a78bfa", // violet
  "#f9a8d4", // pink
  "#e2e8f0", // slate
];

// ─── Factory de partículas ────────────────────────────────────────────────────

function createParticles(count: number, emojis: "paw" | "heart" | "mixed"): Particle[] {
  const pool =
    emojis === "heart" ? HEART_EMOJIS :
    emojis === "mixed" ? MIXED_EMOJIS :
    PAW_EMOJIS;

  return Array.from({ length: count }, (_, i) => {
    // Distribuição angular uniforme com leve bias para cima
    const angle = (Math.PI / count) * i * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const velocity = 55 + Math.random() * 70; // px
    const gravity = 30 + Math.random() * 40;  // "queda" adicional
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - gravity;

    return {
      id: `p-${i}-${Math.random().toString(36).slice(2, 7)}`,
      dx,
      dy,
      rotate: (Math.random() - 0.5) * 540,
      size: 12 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.08,
      emoji: pool[Math.floor(Math.random() * pool.length)],
    };
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PawConfettiButton({
  href,
  onClick,
  className,
  wrapperClassName,
  children,
  disabled,
  count = 14,
  emojis = "paw",
  rel,
  target,
  "aria-label": ariaLabel,
}: PawConfettiButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instanceId = useId();
  const reduced = useReducedMotion();

  const burst = useCallback(() => {
    if (disabled || reduced) return;

    // Limpa partículas anteriores
    if (timerRef.current) clearTimeout(timerRef.current);
    setParticles(createParticles(count, emojis));
    timerRef.current = setTimeout(() => setParticles([]), 2000);
    onClick?.();
  }, [disabled, reduced, count, emojis, onClick]);

  const springHover  = { scale: 1.03, transition: { type: "spring" as const, stiffness: 360, damping: 20 } };
  const springTap    = { scale: 0.94, transition: { type: "spring" as const, stiffness: 400, damping: 18 } };
  const interactive  = !disabled && !reduced;

  return (
    // Wrapper relativo — partículas ficam overflow:visible acima do botão
    <div style={{ position: "relative" }} className={wrapperClassName}>
        {href ? (
          <motion.a
            href={disabled ? undefined : href}
            rel={rel ?? "noreferrer"}
            target={target ?? "_blank"}
            aria-label={ariaLabel}
            className={className}
            onClick={burst}
            {...(interactive ? { whileHover: springHover, whileTap: springTap } : {})}
          >
            {children}
          </motion.a>
        ) : (
          <motion.button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={className}
            onClick={burst}
            {...(interactive ? { whileHover: springHover, whileTap: springTap } : {})}
          >
            {children}
          </motion.button>
        )}

        {/* ── Partículas de confetti ─────────────────────────────────────────── */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={`${instanceId}-${p.id}`}
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                fontSize: p.size,
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 50,
                lineHeight: 1,
                filter: `drop-shadow(0 1px 2px ${p.color}88)`,
                willChange: "transform, opacity",
              }}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{
                opacity: [1, 1, 0],
                x: p.dx,
                y: p.dy,
                rotate: p.rotate,
                scale: [1, 1.1, 0.4],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: p.delay,
                ease: [0.16, 0.84, 0.44, 1],
              }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
    </div>
  );
}
