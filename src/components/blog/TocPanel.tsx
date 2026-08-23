"use client";

import { useState } from "react";

import type { TocItem } from "@/lib/blog/mdx/toc";

import TocNav from "./Toc";


/**
 * Sumário do artigo — instância ÚNICA no DOM.
 * Mobile: cartão recolhido, abre no clique.
 * Desktop (lg+): navegação fixa da coluna lateral, sempre visível.
 * Antes existiam dois <TocNav> (um "mobile", um "sidebar"), o que duplicava
 * o bloco "No artigo" no HTML público.
 */
export default function TocPanel({ toc }: { toc: TocItem[] }) {
  const [open, setOpen] = useState(false);

  if (!toc?.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface-subtle px-5 py-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="toc-panel"
        // A linha do rótulo tem 21px de altura — abaixo dos 24px mínimos de
        // alvo de toque (WCAG 2.2 AA). O `py-1.5` sobe para 33px e o `-my-1.5`
        // devolve o espaço em margem negativa, então a caixa do cartão fica
        // com o mesmo desenho de antes: cresce a área do dedo, não o layout.
        className="-my-1.5 flex w-full items-center justify-between gap-2 py-1.5 text-sm font-semibold text-text lg:hidden"
      >
        <span>Neste artigo</span>
        <span aria-hidden className="text-xs leading-none text-text-muted">
          {open ? "▴" : "▾"}
        </span>
      </button>
      <div
        id="toc-panel"
        className={
          open
            ? "mt-4 border-t border-border pt-3 lg:mt-0 lg:border-0 lg:pt-0"
            : "hidden lg:block"
        }
      >
        {/* No mobile o rótulo já é o botão "Neste artigo"; no desktop mantemos "No artigo". */}
        <TocNav toc={toc} labelClassName="hidden lg:block" />
      </div>
    </div>
  );
}
