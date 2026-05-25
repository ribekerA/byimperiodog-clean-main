"use client";

/**
 * ScrollReveal — wrapper invisível que anima os filhos ao entrarem na viewport.
 *
 * Uso:
 *   <ScrollReveal variant="fadeUp" delay={0.1}>
 *     <h2>Título da seção</h2>
 *   </ScrollReveal>
 *
 * Variantes disponíveis:
 *   fadeUp | fadeIn | scaleIn | slideLeft | slideRight
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export type RevealVariant = "fadeUp" | "fadeIn" | "scaleIn" | "slideLeft" | "slideRight";

const VARIANTS: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
};

export interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  /** Margem negativa faz a animação disparar um pouco antes de entrar na tela */
  margin?: string;
}

export function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.65,
  className,
  once = true,
  margin = "-60px",
}: ScrollRevealProps) {
  const reduced = useReducedMotion();

  // Respeita a preferência de sistema por menos movimento
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={VARIANTS[variant]}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}
