"use client";

/**
 * SpringButton — Wrapper de spring physics para botões e links.
 *
 * Adiciona whileTap + whileHover com spring configurável.
 * Suporta renderização como <button>, <a> ou <div>.
 *
 * Uso:
 *   <SpringButton>Clique aqui</SpringButton>
 *   <SpringButton as="a" href="...">Link com spring</SpringButton>
 *   <SpringButton preset="bouncy">CTA épico</SpringButton>
 */

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

// ─── Presets de spring ────────────────────────────────────────────────────────

const PRESETS = {
  /** Padrão: pressão precisa com leve overshoot */
  default: {
    tapScale:   0.94,
    hoverScale: 1.03,
    tapSpring:   { type: "spring" as const, stiffness: 400, damping: 18 },
    hoverSpring: { type: "spring" as const, stiffness: 360, damping: 22 },
  },
  /** Mole e fluido */
  soft: {
    tapScale:   0.91,
    hoverScale: 1.04,
    tapSpring:   { type: "spring" as const, stiffness: 260, damping: 16 },
    hoverSpring: { type: "spring" as const, stiffness: 220, damping: 18 },
  },
  /** Rápido e preciso */
  snappy: {
    tapScale:   0.96,
    hoverScale: 1.02,
    tapSpring:   { type: "spring" as const, stiffness: 600, damping: 24 },
    hoverSpring: { type: "spring" as const, stiffness: 500, damping: 26 },
  },
  /** Saltitante — ideal para CTAs principais */
  bouncy: {
    tapScale:   0.90,
    hoverScale: 1.06,
    tapSpring:   { type: "spring" as const, stiffness: 340, damping: 12 },
    hoverSpring: { type: "spring" as const, stiffness: 280, damping: 10 },
  },
} as const;

type Preset = keyof typeof PRESETS;

// ─── Componente (renderização condicional por `as`) ───────────────────────────

interface BaseProps {
  preset?: Preset;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
}

interface AnchorProps extends BaseProps {
  as: "a";
  href: string;
  target?: string;
  rel?: string;
}

interface ButtonProps extends BaseProps {
  as?: "button";
  type?: "button" | "submit" | "reset";
  href?: never;
}

type SpringButtonProps = AnchorProps | ButtonProps;

export function SpringButton(props: SpringButtonProps) {
  const reduced = useReducedMotion();
  const { preset = "default", children, className, disabled, onClick } = props;
  const cfg = PRESETS[preset];

  const motionProps = disabled || reduced
    ? {}
    : {
        whileHover: {
          scale: cfg.hoverScale,
          transition: cfg.hoverSpring,
        },
        whileTap: {
          scale: cfg.tapScale,
          transition: cfg.tapSpring,
        },
      };

  if (props.as === "a") {
    return (
      <motion.a
        href={props.href}
        target={props.target}
        rel={props.rel}
        className={className}
        onClick={onClick}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }

  const buttonProps = props as ButtonProps;
  return (
    <motion.button
      type={buttonProps.type ?? "button"}
      disabled={disabled}
      className={className}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
