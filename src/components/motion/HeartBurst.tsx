"use client";

/**
 * HeartBurstButton — Botão de "curtir" com explosão de corações ao clicar.
 *
 * Estado:
 *   idle    — coração outline cinza
 *   liked   — coração sólido rosa + burst radial de mini-corações
 *   unliked — volta ao idle com spring leve
 *
 * Uso:
 *   <HeartBurstButton puppyId="abc123" />
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useId, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BurstParticle {
  id: string;
  angle: number;    // graus
  distance: number; // px
  size: number;
  delay: number;
  emoji: string;
}

interface HeartBurstButtonProps {
  puppyId?: string;
  initialLiked?: boolean;
  onLike?: (liked: boolean) => void;
  className?: string;
  size?: number;
}

// ─── Emojis do burst ─────────────────────────────────────────────────────────

const BURST_EMOJIS = ["❤️", "🧡", "💛", "💖", "🐾"];

function createBurstParticles(): BurstParticle[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `h-${i}`,
    angle: (360 / 10) * i + (Math.random() - 0.5) * 20,
    distance: 30 + Math.random() * 35,
    size: 8 + Math.random() * 8,
    delay: Math.random() * 0.06,
    emoji: BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)],
  }));
}

// ─── SVG heart ────────────────────────────────────────────────────────────────

function HeartIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function HeartBurstButton({
  puppyId,
  initialLiked = false,
  onLike,
  className = "",
  size = 20,
}: HeartBurstButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [burst, setBurst] = useState<BurstParticle[]>([]);
  const instanceId = useId();
  const reduced = useReducedMotion();

  const toggle = useCallback(() => {
    const next = !liked;
    setLiked(next);
    onLike?.(next);

    if (next && !reduced) {
      setBurst(createBurstParticles());
      setTimeout(() => setBurst([]), 1600);
    }
  }, [liked, onLike, reduced]);

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <motion.button
        type="button"
        aria-label={liked ? "Descurtir este filhote" : "Curtir este filhote"}
        aria-pressed={liked}
        onClick={toggle}
        className={`relative flex items-center justify-center rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400
          ${liked
            ? "text-pink-500 bg-pink-50 hover:bg-pink-100"
            : "text-zinc-400 bg-transparent hover:bg-zinc-100 hover:text-pink-400"
          } ${className}`}
        whileTap={{ scale: 0.82, transition: { type: "spring", stiffness: 500, damping: 16 } }}
        whileHover={{ scale: 1.12 }}
      >
        <motion.span
          key={liked ? "filled" : "outline"}
          initial={false}
          animate={
            liked
              ? { scale: [1, 1.4, 0.9, 1], rotate: [0, -12, 8, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <HeartIcon filled={liked} size={size} />
        </motion.span>
      </motion.button>

      {/* ── Burst particles ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {burst.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          return (
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
                willChange: "transform, opacity",
              }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [1, 1, 0],
                x: tx,
                y: ty,
                scale: [0.5, 1.2, 0.6],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.1,
                delay: p.delay,
                ease: [0.2, 0.8, 0.4, 1],
              }}
            >
              {p.emoji}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
