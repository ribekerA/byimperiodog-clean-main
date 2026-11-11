"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cn } from "@/lib/cn";

/**
 * Pede os numeros de novo ao servidor, sem recarregar a pagina.
 *
 * O aviso para leitor de tela e um so e discreto: fala "atualizando" e depois
 * a hora da nova leitura. Nada e anunciado ao abrir a tela.
 */
export function RefreshButton({ generatedAt, timeLabel }: { generatedAt: string; timeLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [requestedFrom, setRequestedFrom] = useState<string | null>(null);

  const refreshed = requestedFrom !== null && requestedFrom !== generatedAt && !pending;
  const message = pending ? "Atualizando os dados." : refreshed ? `Dados atualizados às ${timeLabel}.` : "";

  return (
    <>
      <button
        type="button"
        className="btn-outline text-sm"
        aria-disabled={pending}
        onClick={() => {
          if (pending) return;
          setRequestedFrom(generatedAt);
          startTransition(() => router.refresh());
        }}
      >
        <RefreshCw
          aria-hidden="true"
          className={cn("mr-2 h-4 w-4", pending && "animate-spin motion-reduce:animate-none")}
        />
        {pending ? "Atualizando…" : "Atualizar"}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
