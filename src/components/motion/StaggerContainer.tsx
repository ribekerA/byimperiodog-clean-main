"use client";

/**
 * StaggerContainer + StaggerItem — anima filhos em cascata ao entrar na viewport.
 *
 * Uso:
 *   <StaggerContainer className="grid grid-cols-3 gap-4" stagger={0.1}>
 *     {items.map(item => (
 *       <StaggerItem key={item.id}>
 *         <Card>{item.content}</Card>
 *       </StaggerItem>
 *     ))}
 *   </StaggerContainer>
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** Variantes de cada item filho — herdadas via Framer Motion context */
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
    },
  },
};

// ─── StaggerContainer ──────────────────────────────────────────────────────────

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  /** Delay inicial antes do primeiro item começar */
  delay?: number;
  /** Margem para disparar um pouco antes de entrar na viewport */
  margin?: string;
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  delay = 0,
  margin = "-40px",
}: StaggerContainerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerItem ───────────────────────────────────────────────────────────────

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

/**
 * Deve ser filho direto de StaggerContainer.
 * As variantes são herdadas automaticamente via Framer Motion context.
 */
export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={ITEM_VARIANTS}>
      {children}
    </motion.div>
  );
}
