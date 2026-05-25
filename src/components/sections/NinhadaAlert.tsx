"use client";

import { useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const CORES = [
  { value: "creme", label: "Creme" },
  { value: "laranja", label: "Laranja" },
  { value: "preto", label: "Preto" },
  { value: "wolf-sable", label: "Wolf Sable" },
  { value: "qualquer", label: "Qualquer cor" },
];

export default function NinhadaAlert() {
  const [name, setName] = useState("");
  const [cor, setCor] = useState("");

  const waLink =
    name.trim() && cor
      ? buildWhatsAppLink({
          message: `Olá! Sou ${name.trim()} e quero entrar na lista de espera para filhotes ${cor === "qualquer" ? "de qualquer cor" : `da cor ${CORES.find((c) => c.value === cor)?.label ?? cor}`}. Me avisem quando houver disponibilidade!`,
          utmSource: "site",
          utmMedium: "ninhada_alert",
          utmCampaign: "lista_espera",
          utmContent: cor,
        })
      : "#";

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-14 sm:px-12"
      aria-labelledby="ninhada-heading"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Lista de interesse</p>
        <h2 id="ninhada-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Seja o primeiro a saber da próxima ninhada
        </h2>
        <p className="mt-4 text-zinc-400">
          Filhotes disponíveis são reservados em horas. Entre na lista e receba um aviso direto no WhatsApp antes de qualquer anúncio.
        </p>

        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Formulário de lista de interesse"
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
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              Quero ser avisado — WhatsApp
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

        <p className="mt-4 text-xs text-zinc-500">Sem spam. Apenas um aviso quando houver disponibilidade.</p>
      </div>
    </section>
  );
}
