"use client";

/**
 * CustomCursor — Cursor personalizado com rastro de patinhas 🐾
 *
 * Apenas em desktop (pointer: fine). Em mobile/touch: completamente inativo.
 *
 * Elementos:
 *  • Anel externo   — segue com spring lento (lag cinematográfico)
 *  • Ponto central  — segue precisamente
 *  • Rastro 🐾     — deixa patinhas ao longo do movimento
 *
 * Estados:
 *  • idle    — anel branco/esmeralda 28px + ponto 7px
 *  • hover   — anel cresce (44px) + vira esmeralda + ponto desaparece
 *  • click   — anel comprime (0.65x) + flash
 */

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TrailPoint {
  id: string;
  x: number;
  y: number;
  rotate: number;
  size: number;
  opacity: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Seletores de elementos interativos onde o cursor muda */
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, select, textarea, label, [tabindex]:not([tabindex="-1"])';

/** Distância mínima (px) entre pontos de rastro */
const TRAIL_MIN_DIST = 55;
/** Máximo de pontos no rastro simultaneamente */
const TRAIL_MAX = 12;
/** Duração de vida de cada patinha (ms) */
const TRAIL_TTL = 900;

// ─── Componente ───────────────────────────────────────────────────────────────

export function CustomCursor() {
  const [enabled, setEnabled]     = useState(false);
  const [visible, setVisible]     = useState(false);
  const [isHover, setIsHover]     = useState(false);
  const [isClick, setIsClick]     = useState(false);
  const [trail, setTrail]         = useState<TrailPoint[]>([]);

  const lastTrail = useRef({ x: -999, y: -999 });
  const instanceId = useId();

  // ── Posição raw do mouse ───────────────────────────────────────────────────
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  // ── Anel: spring lento (lag cinematográfico) ───────────────────────────────
  const ringX = useSpring(rawX, { stiffness: 75, damping: 17, restDelta: 0.001 });
  const ringY = useSpring(rawY, { stiffness: 75, damping: 17, restDelta: 0.001 });

  // ── Ponto: spring rápido (preciso) ────────────────────────────────────────
  const dotX = useSpring(rawX, { stiffness: 350, damping: 28, restDelta: 0.001 });
  const dotY = useSpring(rawY, { stiffness: 350, damping: 28, restDelta: 0.001 });

  // ── Gerador de ponto de rastro ────────────────────────────────────────────
  const addTrailPoint = useCallback((x: number, y: number) => {
    const dx = x - lastTrail.current.x;
    const dy = y - lastTrail.current.y;
    if (Math.hypot(dx, dy) < TRAIL_MIN_DIST) return;
    lastTrail.current = { x, y };

    const point: TrailPoint = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x,
      y,
      rotate: Math.random() * 360,
      size: 11 + Math.random() * 7,
      opacity: 0.55 + Math.random() * 0.35,
    };

    setTrail((prev) => [...prev.slice(-(TRAIL_MAX - 1)), point]);
    setTimeout(() => {
      setTrail((prev) => prev.filter((p) => p.id !== point.id));
    }, TRAIL_TTL);
  }, []);

  // ── Efeito principal ──────────────────────────────────────────────────────
  useEffect(() => {
    // Apenas em dispositivos com cursor fino (desktop)
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    setEnabled(true);

    // Esconde cursor nativo
    const styleTag = document.createElement("style");
    styleTag.id = "custom-cursor-hide";
    styleTag.textContent = `*, *::before, *::after { cursor: none !important; }`;
    document.head.appendChild(styleTag);

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setVisible(true);
      addTrailPoint(e.clientX, e.clientY);
    };

    const onEnter = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
        setIsHover(true);
      }
    };

    const onLeave = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
        setIsHover(false);
      }
    };

    const onDown = () => setIsClick(true);
    const onUp   = () => setIsClick(false);
    const onOut  = () => setVisible(false);
    const onOver = () => setVisible(true);

    document.addEventListener("mousemove",   onMove,  { passive: true });
    document.addEventListener("mouseover",   onEnter, { passive: true });
    document.addEventListener("mouseout",    onLeave, { passive: true });
    document.addEventListener("mousedown",   onDown,  { passive: true });
    document.addEventListener("mouseup",     onUp,    { passive: true });
    document.documentElement.addEventListener("mouseleave", onOut,  { passive: true });
    document.documentElement.addEventListener("mouseenter", onOver, { passive: true });

    return () => {
      document.getElementById("custom-cursor-hide")?.remove();
      document.removeEventListener("mousemove",   onMove);
      document.removeEventListener("mouseover",   onEnter);
      document.removeEventListener("mouseout",    onLeave);
      document.removeEventListener("mousedown",   onDown);
      document.removeEventListener("mouseup",     onUp);
      document.documentElement.removeEventListener("mouseleave", onOut);
      document.documentElement.removeEventListener("mouseenter", onOver);
    };
  }, [rawX, rawY, addTrailPoint]);

  if (!enabled) return null;

  return (
    <>
      {/* ── Rastro de patinhas ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {trail.map((pt) => (
          <motion.span
            key={`${instanceId}-${pt.id}`}
            aria-hidden="true"
            style={{
              position:     "fixed",
              top:          0,
              left:         0,
              x:            pt.x - pt.size / 2,
              y:            pt.y - pt.size / 2,
              fontSize:     pt.size,
              pointerEvents: "none",
              userSelect:   "none",
              zIndex:       9995,
              lineHeight:   1,
            }}
            initial={{ opacity: pt.opacity, scale: 1,   rotate: pt.rotate }}
            animate={{ opacity: 0,          scale: 0.3, rotate: pt.rotate + (Math.random() > 0.5 ? 30 : -30) }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRAIL_TTL / 1000, ease: "easeOut" }}
          >
            🐾
          </motion.span>
        ))}
      </AnimatePresence>

      {/* ── Anel externo (lag spring) ──────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          position:      "fixed",
          top:           0,
          left:          0,
          x:             ringX,
          y:             ringY,
          translateX:    "-50%",
          translateY:    "-50%",
          zIndex:        9997,
          pointerEvents: "none",
          userSelect:    "none",
          borderRadius:  "50%",
          border:        "1.5px solid",
          willChange:    "transform, width, height, opacity",
        }}
        animate={{
          width:       isHover ? 44 : 28,
          height:      isHover ? 44 : 28,
          opacity:     visible ? 1 : 0,
          scale:       isClick ? 0.62 : 1,
          borderColor: isHover
            ? "rgba(52, 211, 153, 0.85)"
            : "rgba(255, 255, 255, 0.65)",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      />

      {/* ── Ponto central (preciso) ────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          position:      "fixed",
          top:           0,
          left:          0,
          x:             dotX,
          y:             dotY,
          translateX:    "-50%",
          translateY:    "-50%",
          zIndex:        9999,
          pointerEvents: "none",
          userSelect:    "none",
          borderRadius:  "50%",
          backgroundColor: "rgb(52, 211, 153)",
          willChange:    "transform, width, height, opacity",
        }}
        animate={{
          width:   isHover ? 0 : isClick ? 12 : 7,
          height:  isHover ? 0 : isClick ? 12 : 7,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
      />
    </>
  );
}
