"use client";

import { useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Particolor faltava aqui. É uma das cinco cores divulgadas e tem tabela de
// preço própria em src/domain/pricing.ts; quem procurava particolor não tinha
// como dizer isso neste formulário e caía em "Qualquer cor".
const CORES = [
  { value: "branco", label: "Branco" },
  { value: "creme", label: "Creme" },
  { value: "laranja", label: "Laranja" },
  { value: "particolor", label: "Particolor" },
  { value: "preto", label: "Preto" },
  { value: "qualquer", label: "Qualquer cor" },
];

export default function NinhadaAlert() {
  const [name, setName] = useState("");
  const [cor, setCor] = useState("");

  const baseWaLink =
    name.trim() && cor
      ? buildWhatsAppLink({
          // Era "quero entrar na lista de espera... me avisem quando houver
          // disponibilidade". Lista de espera é uma fila sobre estoque, e o
          // aviso era uma promessa de que alguém avisaria. O que a pessoa faz
          // aqui é contar o que procura; o retorno acontece na conversa.
          message: `Olá! Sou ${name.trim()} e procuro um Spitz Alemão Anão ${cor === "qualquer" ? "de qualquer cor" : `da cor ${CORES.find((c) => c.value === cor)?.label ?? cor}`}. Gostaria de conhecer as opções atuais.`,
          utmSource: "site",
          utmMedium: "ninhada_alert",
          utmCampaign: "lista_espera",
          utmContent: cor,
        })
      : "#";
  const waLink = useWhatsAppLink(baseWaLink);

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-14 sm:px-12"
      aria-labelledby="ninhada-heading"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-xl text-center">
        {/* O título era "Seja o primeiro a saber da próxima ninhada" e o texto
            dizia que "a disponibilidade pode mudar rapidamente conforme as
            reservas". As duas frases vendiam pressa: uma prometia prioridade
            numa fila que não existe, a outra insinuava concorrência por um
            estoque que o site não publica. O que este bloco realmente faz é
            abrir uma conversa a partir da cor que a pessoa procura. */}
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Preferências</p>
        <h2 id="ninhada-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Conte o que você procura
        </h2>
        <p className="mt-4 text-zinc-400">
          Diga a cor que você tem em mente e fale com a equipe pelo WhatsApp. É no atendimento
          que você conhece as opções atuais e tira dúvidas sobre valores e documentação.
        </p>

        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Formulário de preferências de cor"
        >
          <div>
            <label htmlFor="ninhada-name" className="mb-1.5 block text-left text-sm font-medium text-zinc-300">
              Seu nome
            </label>
            <input
              id="ninhada-name"
              type="text"
              placeholder="Ex: Maria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3.5 text-white placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              autoComplete="given-name"
            />
          </div>

          <fieldset>
            <legend className="sr-only">Cor preferida</legend>
            <div className="flex flex-wrap gap-2">
              {CORES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCor(c.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    cor === c.value
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-emerald-500 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          {name.trim() && cor ? (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-700"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Falar pelo WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex min-h-[52px] w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl bg-zinc-700 px-6 text-base font-semibold text-white opacity-60 shadow-lg"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              {!name.trim() ? "Preencha seu nome primeiro" : "Selecione uma cor"}
            </button>
          )}
        </form>

        {/* Prometia "apenas um aviso quando houver disponibilidade" — um SLA de
            retorno que ninguém garantiu. O formulário não cadastra nada: ele
            monta a primeira mensagem da conversa e abre o WhatsApp. */}
        <p className="mt-4 text-xs text-zinc-400">
          Nada é cadastrado aqui: o botão abre o WhatsApp com a sua mensagem já escrita.
        </p>
      </div>
    </section>
  );
}
