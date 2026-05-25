"use client";
import { useEffect, useState } from "react";

const EVENTS = [
  { city: "Campinas", state: "SP", color: "Creme", sex: "Fêmea", time: "há 12 min" },
  { city: "São Paulo", state: "SP", color: "Laranja", sex: "Macho", time: "há 28 min" },
  { city: "Belo Horizonte", state: "MG", color: "Preto", sex: "Fêmea", time: "há 45 min" },
  { city: "Curitiba", state: "PR", color: "Wolf Sable", sex: "Macho", time: "há 1h" },
  { city: "Rio de Janeiro", state: "RJ", color: "Creme", sex: "Macho", time: "há 2h" },
  { city: "Atibaia", state: "SP", color: "Laranja", sex: "Fêmea", time: "há 3h" },
  { city: "Jundiaí", state: "SP", color: "Preto", sex: "Macho", time: "há 4h" },
  { city: "Santos", state: "SP", color: "Creme", sex: "Fêmea", time: "há 5h" },
  { city: "Sorocaba", state: "SP", color: "Wolf Sable", sex: "Fêmea", time: "há 6h" },
  { city: "Florianópolis", state: "SC", color: "Laranja", sex: "Macho", time: "hoje cedo" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function RecentSalesPopup() {
  const [event, setEvent] = useState<(typeof EVENTS)[0] | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Primeiro aparecimento entre 15s e 30s
    const firstDelay = 15_000 + Math.random() * 15_000;

    const show = () => {
      setEvent(pick(EVENTS));
      setVisible(true);
      setTimeout(() => setVisible(false), 7_000);
    };

    const firstTimer = setTimeout(() => {
      show();
      // Depois repete a cada 40–70s
      const interval = setInterval(() => show(), 40_000 + Math.random() * 30_000);
      return () => clearInterval(interval);
    }, firstDelay);

    return () => clearTimeout(firstTimer);
  }, []);

  if (!visible || !event) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-24 left-4 z-50 flex max-w-[280px] items-start gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-xl sm:bottom-8"
    >
      {/* Avatar inicial */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-bold text-emerald-700">
        {event.city[0]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-800 leading-snug">
          Família de <span className="text-emerald-700">{event.city}/{event.state}</span> reservou
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {event.sex} <span className="font-medium text-zinc-700">{event.color}</span> · {event.time}
        </p>
        {/* barra de progresso */}
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ animation: "shrink-bar 7s linear forwards" }}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => setVisible(false)}
        className="ml-1 shrink-0 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes shrink-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
