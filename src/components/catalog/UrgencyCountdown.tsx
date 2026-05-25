"use client";

/**
 * UrgencyCountdown — Temporizador de reserva "⏰ Reserva expira em X"
 *
 * Exibido apenas quando status === "reserved".
 *
 * Lógica:
 *  • Derivamos um "reservado em" determinístico a partir do puppyId
 *    (hash → offset entre 2h e 22h atrás)
 *  • Contagem regressiva de 24h a partir desse ponto
 *  • Se expirou: mostra aviso de contato para confirmar
 *  • Se restam < 3h: fundo vermelho pulsante (alta urgência)
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  puppyId: string;
  status: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deriva um timestamp de "reservado em" determinístico.
 * O offset em ms fica entre 2h e 22h atrás.
 */
function deriveReservedAt(puppyId: string): number {
  const seed = puppyId.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const HOUR = 60 * 60 * 1000;
  const offsetMs = (2 + (seed % 20)) * HOUR; // 2h–21h atrás
  return Date.now() - offsetMs;
}

function calcTimeLeft(reservedAt: number): TimeLeft {
  const RESERVATION_WINDOW = 24 * 60 * 60 * 1000; // 24h
  const expiresAt = reservedAt + RESERVATION_WINDOW;
  const remaining = expiresAt - Date.now();

  if (remaining <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours        = Math.floor(totalSeconds / 3600);
  const minutes      = Math.floor((totalSeconds % 3600) / 60);
  const seconds      = totalSeconds % 60;

  return { hours, minutes, seconds, expired: false };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function UrgencyCountdown({ puppyId, status }: Props) {
  const isReserved = status === "reserved" || status === "reservado";
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [reservedAt] = useState(() =>
    typeof window !== "undefined" ? deriveReservedAt(puppyId) : 0
  );

  useEffect(() => {
    if (!isReserved) return;
    if (!reservedAt) return;

    const tick = () => setTimeLeft(calcTimeLeft(reservedAt));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isReserved, reservedAt]);

  if (!isReserved || !timeLeft) return null;

  const isUrgent = !timeLeft.expired && timeLeft.hours < 3;
  const isCritical = !timeLeft.expired && timeLeft.hours === 0 && timeLeft.minutes < 30;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`overflow-hidden rounded-xl border px-4 py-3 ${
          timeLeft.expired
            ? "border-zinc-200 bg-zinc-50"
            : isCritical
            ? "border-red-200 bg-red-50"
            : isUrgent
            ? "border-orange-200 bg-orange-50"
            : "border-amber-200 bg-amber-50"
        }`}
        aria-live="polite"
        aria-label={
          timeLeft.expired
            ? "Reserva expirada"
            : `Reserva expira em ${timeLeft.hours}h ${timeLeft.minutes}m`
        }
      >
        {timeLeft.expired ? (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span aria-hidden="true">⚠️</span>
            <span>
              Reserva expirada.{" "}
              <strong className="font-semibold text-zinc-900">
                Entre em contato para confirmar disponibilidade.
              </strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <motion.span
                aria-hidden="true"
                animate={isCritical ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                ⏰
              </motion.span>
              <span className={isCritical ? "text-red-700" : isUrgent ? "text-orange-700" : "text-amber-800"}>
                Reserva expira em
              </span>
            </div>

            {/* Contador */}
            <div
              className={`flex items-center gap-1 font-mono text-lg font-bold tabular-nums ${
                isCritical ? "text-red-700" : isUrgent ? "text-orange-700" : "text-amber-800"
              }`}
            >
              {isCritical ? (
                // Últimos 30min: mostra mm:ss pulsante
                <motion.span
                  animate={{ opacity: [1, 0.65, 1] }}
                  transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
                >
                  {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </motion.span>
              ) : (
                <span>
                  {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m
                </span>
              )}
            </div>
          </div>
        )}

        {/* Barra de progresso */}
        {!timeLeft.expired && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10">
            <motion.div
              className={`h-full rounded-full ${
                isCritical ? "bg-red-500" : isUrgent ? "bg-orange-500" : "bg-amber-500"
              }`}
              initial={{ width: "100%" }}
              animate={{
                width: `${Math.min(
                  100,
                  ((timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds) / (24 * 3600)) * 100
                )}%`,
              }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
