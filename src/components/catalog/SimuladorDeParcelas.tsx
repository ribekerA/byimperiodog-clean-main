"use client";

/**
 * "Ver parcelas" da ficha do filhote.
 *
 * Mostra o valor no PIX e, para cada quantidade de parcelas com taxa
 * cadastrada em domain/pricing.TAXAS_CARTAO, o valor das parcelas.
 * A taxa da maquininha já está dentro do valor e não aparece, e o total do
 * cartão também não: decisões do usuário em 25/11/2026.
 *
 * Sem nenhuma taxa cadastrada, o componente não renderiza nada.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import {
  formatarPrecoComCentavos,
  opcoesNoCartao,
  textoDasParcelas,
  textoNoCartao,
} from "@/domain/pricing";

export function SimuladorDeParcelas({ priceCents }: { priceCents: number }) {
  const resumo = textoNoCartao(priceCents);
  if (!resumo) return null;
  const opcoes = opcoesNoCartao(priceCents);

  return (
    <Dialog.Root>
      <p className="mt-0.5 text-sm text-zinc-600">
        ou {resumo}.{" "}
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Ver parcelas
          </button>
        </Dialog.Trigger>
      </p>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[121] max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl focus:outline-none sm:p-6">
          <Dialog.Title className="pr-8 text-lg font-semibold text-zinc-900">Simulação de parcelas</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-zinc-600">
            No PIX: <strong className="text-zinc-900">{formatarPrecoComCentavos(priceCents)}</strong>
          </Dialog.Description>

          <h3 className="mt-4 border-b border-zinc-200 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Cartão de crédito
          </h3>
          <ul className="text-sm">
            {opcoes.map((opcao) => (
              <li key={opcao.parcelas} className="border-b border-zinc-100 py-2.5 font-medium text-zinc-900 last:border-0">
                {textoDasParcelas(opcao)}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Simulação para o valor desta página. Disponibilidade e condições são confirmadas no atendimento e no
            contrato.
          </p>

          <Dialog.Close
            className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Fechar simulação"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
