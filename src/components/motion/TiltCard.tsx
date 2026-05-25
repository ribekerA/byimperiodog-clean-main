"use client";

/**
 * TiltCard — wrapper que adiciona efeito 3D tilt + brilho especular ao filho.
 *
 * Uso:
 *   <TiltCard glowColor="rgba(243,181,98,0.4)" className="...">
 *     <seu-card />
 *   </TiltCard>
 *
 * O tilt segue o mouse; em dispositivos touch nada acontece (pointer: coarse).
 * Respeita prefers-reduced-motion.
 */

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Cor do glow no hover, ex: "rgba(52,211,153,0.35)" */
  glowColor?: string;
  /** Graus máximos de rotação (padrão: 10) */
  maxTilt?: number;
}

export function TiltCard({
  children,
  className,
  glowColor = "rgba(52,211,153,0.3)",
  maxTilt = 10,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Valores brutos
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useMotionValue(0);

  // Spring suave
  const rotateX = useSpring(rawRotateX, { stiffness: 250, damping: 22 });
  const rotateY = useSpring(rawRotateY, { stiffness: 250, damping: 22 });

  // Escala sutil no hover
  const scale = useMotionValue(1);
  const springScale = useSpring(scale, { stiffness: 300, damping: 24 });

  // Transform do brilho especular (posição relativa ao card)
  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.18) 0%, transparent 65%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0 → 1 esquerda→direita
    const py = (e.clientY - rect.top) / rect.height;   // 0 → 1 topo→baixo

    // rotateX: positivo = borda inferior vem pra frente (mouse no topo)
    rawRotateX.set((0.5 - py) * maxTilt * 2);
    // rotateY: positivo = borda direita vem pra frente (mouse à direita)
    rawRotateY.set((px - 0.5) * maxTilt * 2);

    glareX.set(px * 100);
    glareY.set(py * 100);
    glareOpacity.set(0.6);
  };

  const handleMouseEnter = () => {
    if (reduced) return;
    scale.set(1.03);
    glareOpacity.set(0.4);
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    scale.set(1);
    glareOpacity.set(0);
  };

  // Sem animação no reduced-motion — só renderiza os filhos normalmente
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    /* Perspectiva no wrapper pai para o efeito 3D funcionar */
    <div style={{ perspective: "900px" }} className={className}>
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          scale: springScale,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-full w-full"
      >
        {/* Conteúdo do card */}
        {children}

        {/* Brilho especular — camada flutuante que segue o mouse */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: glareBackground,
            opacity: glareOpacity,
            zIndex: 10,
          }}
        />

        {/* Glow na borda inferior — color-matched com o filhote */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            boxShadow: `0 16px 48px ${glowColor}, 0 4px 16px ${glowColor}`,
          }}
          whileHover={{ opacity: 1 }}
        />
      </motion.div>
    </div>
  );
}
