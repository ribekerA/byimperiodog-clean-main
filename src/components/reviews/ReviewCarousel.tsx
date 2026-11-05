"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function ReviewCarousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const update = () => setEdges({ start: list.scrollLeft < 2, end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 2 });
    update();
    list.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => { list.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);
  const move = (direction: number) => {
    const list = ref.current;
    if (!list) return;
    const card = list.firstElementChild as HTMLElement | null;
    list.scrollBy({ left: direction * ((card?.offsetWidth ?? list.clientWidth) + 20), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return (
    <div className="min-w-0">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-emerald-950">Veja o que as famílias dizem</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" aria-label="Depoimento anterior" aria-controls={id} disabled={edges.start} onClick={() => move(-1)} className="h-11 w-11 rounded-full border border-emerald-900/20 bg-white text-xl text-emerald-950 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">←</button>
          <button type="button" aria-label="Próximo depoimento" aria-controls={id} disabled={edges.end} onClick={() => move(1)} className="h-11 w-11 rounded-full border border-emerald-900/20 bg-white text-xl text-emerald-950 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">→</button>
        </div>
      </div>
      {/* Foco permite rolar a região com as setas do teclado. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <ul ref={ref} id={id} tabIndex={0} aria-label="Depoimentos de clientes" className="flex snap-x snap-mandatory gap-5 overflow-x-auto rounded-2xl pb-5 [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800">
        {children}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-zinc-600">Uma seleção de avaliações do Google e relatos enviados pelas famílias. Cada card identifica sua origem. Consulte todas as avaliações e os dados atuais no Google.</p>
    </div>
  );
}
