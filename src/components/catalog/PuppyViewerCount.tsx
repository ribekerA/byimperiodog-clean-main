"use client";

/**
 * PuppyViewerCount — "X pessoas vendo agora" com Supabase Realtime Presence.
 *
 * Estratégia:
 *  1. Gera sessionId único por visit (localStorage)
 *  2. Tenta conectar ao canal de Presence do Supabase
 *  3. Se Supabase disponível: usa contagem real + mínimo simulado
 *  4. Se indisponível: fallback para simulação orgânica convincente
 *
 * Visual:
 *  • Ponto pulsante verde
 *  • Número com spring transition
 *  • Ícone de chama 🔥 quando > 6 pessoas
 *  • Destaque transitório quando número sobe
 */

import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useId, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  puppyId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Gera contagem base determinística a partir do puppyId (3–12) */
function seedCount(puppyId: string) {
  const seed = puppyId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 3 + (seed % 10);
}

/** Gera ou recupera sessionId persistente */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "byid_sid";
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PuppyViewerCount({ puppyId }: Props) {
  const [count, setCount]       = useState<number | null>(null);
  const [highlight, setHighlight] = useState(false);
  const prevRef                 = useRef<number | null>(null);
  const instanceId              = useId();

  useEffect(() => {
    const base = seedCount(puppyId);
    setCount(base);
    prevRef.current = base;

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // ── Tentativa de Supabase Realtime Presence ──────────────────────────
    let channel: RealtimeChannel | null = null;
    let supabase: ReturnType<typeof createClient> | null = null;
    let connected = false;

    if (supabaseUrl && supabaseAnon && !supabaseAnon.includes("placeholder")) {
      try {
        supabase = createClient(supabaseUrl, supabaseAnon, {
          auth: { persistSession: false },
        });

        const sessionId = getSessionId();
        channel = supabase.channel(`puppy-viewers-${puppyId}`, {
          config: { presence: { key: sessionId } },
        });

        channel.on("presence", { event: "sync" }, () => {
          if (!channel) return;
          const state = channel.presenceState();
          const realCount = Object.keys(state).length;
          // Usa o maior entre a contagem real e a base mínima simulada
          const newCount = Math.max(realCount, base);
          setCount((prev) => {
            if (prev !== null && newCount > prev) {
              setHighlight(true);
              setTimeout(() => setHighlight(false), 1200);
            }
            return newCount;
          });
          prevRef.current = newCount;
        });

        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            connected = true;
            await channel!.track({
              user:       sessionId,
              entered_at: Date.now(),
              puppy_id:   puppyId,
            });
          }
        });
      } catch {
        // Supabase indisponível — continua com simulação
      }
    }

    // ── Simulação orgânica (sempre ativa como base/fallback) ────────────
    const simulateInterval = setInterval(
      () => {
        setCount((prev) => {
          if (prev === null) return base;
          // Se Supabase conectado, flutuação pequena; senão, mais orgânica
          const range  = connected ? 1 : 2;
          const delta  = Math.random() < 0.55 ? 1 : -1;
          const noise  = Math.random() < 0.15 ? (Math.random() < 0.5 ? 1 : -1) : 0;
          const next   = Math.max(3, Math.min(18, prev + delta * range + noise));

          if (next > (prevRef.current ?? prev)) {
            setHighlight(true);
            setTimeout(() => setHighlight(false), 1200);
          }
          prevRef.current = next;
          return next;
        });
      },
      connected ? 35000 : 22000 + Math.random() * 18000
    );

    return () => {
      clearInterval(simulateInterval);
      if (channel) channel.unsubscribe();
    };
  }, [puppyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === null) return null;

  const isHot = count >= 7;

  return (
    <motion.div
      className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-colors ${
        highlight
          ? "bg-emerald-50 ring-1 ring-emerald-200"
          : isHot
          ? "bg-amber-50 ring-1 ring-amber-100"
          : "bg-zinc-50"
      }`}
      animate={{ backgroundColor: highlight ? "#ecfdf5" : isHot ? "#fffbeb" : "#fafafa" }}
      transition={{ duration: 0.4 }}
    >
      {/* Dot pulsante */}
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>

      {/* Número com spring */}
      <span className="text-zinc-600">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.strong
            key={`${instanceId}-${count}`}
            className={`font-bold ${isHot ? "text-amber-700" : "text-zinc-900"}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            {isHot && <span aria-hidden="true">🔥 </span>}
            {count} {count === 1 ? "pessoa" : "pessoas"}
          </motion.strong>
        </AnimatePresence>
        {" "}
        {count === 1 ? "está vendo" : "estão vendo"} este filhote agora
      </span>
    </motion.div>
  );
}
