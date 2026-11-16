// Cabecalho padrao das telas do painel.
//
// Cada tela tinha o seu: uma com cartao branco, outra com h1 solto, outra com
// "Console" em caixa alta. O mesmo bloco em todas faz a pessoa achar titulo,
// explicacao e botao principal sempre no mesmo lugar.

import type { ReactNode } from "react";

export function CabecalhoPagina({
  sobretitulo,
  titulo,
  descricao,
  acoes,
  icone,
}: {
  sobretitulo?: string;
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icone ? (
          <div
            className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-sm sm:flex"
            aria-hidden
          >
            {icone}
          </div>
        ) : null}
        <div className="min-w-0">
          {sobretitulo ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">{sobretitulo}</p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">{titulo}</h1>
          {descricao ? <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">{descricao}</p> : null}
        </div>
      </div>
      {acoes ? <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{acoes}</div> : null}
    </header>
  );
}
