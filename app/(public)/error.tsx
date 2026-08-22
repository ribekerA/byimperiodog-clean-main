"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Erro nao tratado em qualquer pagina publica caia na tela padrao do Next, em
 * ingles e sem nenhuma saida. Este boundary mantem o Header e o Footer, explica
 * em portugues o que aconteceu e oferece as duas acoes que resolvem o caso:
 * tentar de novo (reset) e falar com a criadora.
 *
 * Nao mostra a mensagem tecnica do erro: em producao ela ja vem ofuscada pelo
 * Next e, mesmo assim, texto de exceção na tela nao ajuda quem esta comprando
 * um filhote. O `digest` fica no console para quem for investigar.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[erro-publico]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-20 sm:px-8">
      <h1 className="text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
        Algo falhou ao carregar esta página
      </h1>
      <p className="text-base leading-relaxed text-[var(--text-muted)]">
        O problema é nosso, não seu. Tente carregar de novo — se continuar assim, fale com a
        criadora pelo WhatsApp que respondemos por lá.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Tentar novamente
        </button>
        <Link
          href="/contato"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--text)] transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          Falar com a criadora
        </Link>
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        <Link href="/" className="font-semibold text-emerald-700 underline underline-offset-4">
          Voltar para a página inicial
        </Link>
      </p>
    </div>
  );
}
