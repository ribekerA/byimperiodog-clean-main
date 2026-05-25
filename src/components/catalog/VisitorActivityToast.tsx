"use client";

/**
 * VisitorActivityToast — Notificações de atividade de outros visitantes.
 *
 * Mostra pop-ups periódicos como:
 *  "🐾 Larissa de São Paulo acabou de ver este filhote"
 *  "❤️ Fernanda de Campinas favoritou este filhote"
 *  "👀 Mariana de BH está vendo agora"
 *
 * Puramente client-side — não requer Supabase.
 * Intervalo: 35–70s entre notificações.
 * Cada toast visível por 5s.
 *
 * Posição: bottom-left (não conflita com sticky CTA no right).
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState, useCallback } from "react";

// ─── Dados ────────────────────────────────────────────────────────────────────

const NAMES = [
  "Larissa", "Fernanda", "Camila", "Ana Paula", "Beatriz",
  "Mariana", "Juliana", "Gabriela", "Letícia", "Rafaela",
  "Patrícia", "Natália", "Débora", "Carla", "Renata",
  "Vanessa", "Bruna", "Amanda", "Flávia", "Cristiane",
  "Rodrigo", "Felipe", "Lucas", "Pedro", "Guilherme",
];

const CITIES = [
  "São Paulo", "Campinas", "Belo Horizonte", "Rio de Janeiro",
  "Curitiba", "Porto Alegre", "Brasília", "Goiânia",
  "Ribeirão Preto", "São José dos Campos", "Santos", "Sorocaba",
  "Osasco", "Guarulhos", "Bauru", "Piracicaba", "Jundiaí",
];

const TEMPLATES = [
  (name: string, city: string) => `🐾 ${name} de ${city} acabou de ver este filhote`,
  (name: string, city: string) => `❤️ ${name} de ${city} favoritou este filhote`,
  (name: string, city: string) => `👀 ${name} de ${city} está vendo agora`,
  (name: string, city: string) => `✨ ${name} de ${city} mandou mensagem sobre este filhote`,
  (name: string, city: string) => `💬 ${name} de ${city} perguntou sobre disponibilidade`,
];

interface Toast {
  id: string;
  message: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  puppyId: string;
  /** Não exibir se filhote está vendido */
  isSold?: boolean;
  /** Delay inicial em ms (default: 18000 = 18s) */
  initialDelay?: number;
}

export default function VisitorActivityToast({
  puppyId,
  isSold,
  initialDelay = 18000,
}: Props) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instanceId        = useId();

  const showToast = useCallback(() => {
    // Gera mensagem pseudo-aleatória determinística por puppyId + timestamp
    const seed  = Date.now() + puppyId.length;
    const name  = NAMES[seed % NAMES.length];
    const city  = CITIES[(seed >> 3) % CITIES.length];
    const tmpl  = TEMPLATES[(seed >> 6) % TEMPLATES.length];

    const id = `${instanceId}-${Date.now()}`;
    setToast({ id, message: tmpl(name, city) });

    // Auto-hide depois de 5s
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 5000);
  }, [puppyId, instanceId]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = 35000 + Math.random() * 35000; // 35–70s
    timerRef.current = setTimeout(() => {
      if (!isSold) showToast();
      scheduleNext();
    }, delay);
  }, [isSold, showToast]);

  useEffect(() => {
    if (isSold) return;

    // Primeiro toast após initialDelay
    timerRef.current = setTimeout(() => {
      showToast();
      scheduleNext();
    }, initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSold, initialDelay, showToast, scheduleNext]);

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-4 z-50 w-72 max-w-[calc(100vw-2rem)] lg:bottom-8"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-zinc-100 bg-white/96 px-4 py-3 shadow-xl backdrop-blur-sm"
          >
            {/* Avatar placeholder */}
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base">
              🐾
            </div>

            <div className="flex-1">
              <p className="text-[13px] leading-snug text-zinc-700">
                {toast.message}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">agora mesmo</p>
            </div>

            {/* Barra de progresso da duração */}
            <motion.div
              className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl bg-emerald-400"
              initial={{ scaleX: 1, originX: 0 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
