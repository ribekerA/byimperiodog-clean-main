"use client";

/**
 * "Conte o que você procura" — captura de preferência.
 *
 * Este componente era uma fila de espera de estoque: aparecia quando um
 * filhote estava "reservado" ou "vendido", prometia avisar "quando um da mesma
 * cor ficar disponível" e chamava a si mesmo de gatilho externo programado.
 * Três problemas de uma vez:
 *
 *  • O site não publica mais status de filhote, então não existe mais o
 *    momento em que ele aparecia.
 *  • A promessa era de aviso automático. Nenhuma rotina do site envia esse
 *    aviso — quem responde é o atendimento humano, quando puder. Prometer
 *    notificação no site e não ter quem a dispare é dívida com o cliente.
 *  • "Ficar disponível" reintroduzia estoque público por outra porta.
 *
 * O que ficou é o que a operação realmente faz: a pessoa conta a cor que
 * procura e deixa o WhatsApp; a equipe fala com ela. Sem prazo prometido,
 * sem fila, sem posição reservada.
 */

import { useState } from "react";

import { getClickId } from "@/lib/gclid";
import { sendGA4 } from "@/lib/track";

interface Props {
  color?: string;
  colorLabel?: string;
}

type Step = "idle" | "form" | "success";

export default function NotifyMeButton({ color, colorLabel }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return;

    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: digits,
          nome: "Preferência informada pelo site",
          cor_preferida: color,
          consent_lgpd: true,
          consent_timestamp: new Date().toISOString(),
          consent_version: "1.0",
          page_type: "preferencia",
          page_intent: `preferencia_cor_${color ?? "qualquer"}`,
          // Preferência informada não é conversão do Ads (não há nome nem intenção
          // de compra declarada), mas o click id fica gravado: se a venda vier
          // depois, dá para importá-la como conversão offline.
          gclid: getClickId(),
        }),
        keepalive: true,
      });
      sendGA4("preferencia_informada", { color: color ?? "any" });
      setStep("success");
    } catch {
      setStep("success"); // graceful — salva localmente mesmo se falhar
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span aria-hidden="true">✅</span>
        {/* Não prometemos prazo nem aviso automático: nada no site dispara essa
            mensagem, quem responde é a equipe. */}
        <span>
          Anotado{colorLabel ? `: você procura um filhote ${colorLabel}` : ""}. A equipe fala com você pelo WhatsApp.
        </span>
      </div>
    );
  }

  if (step === "form") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold text-zinc-700">
          Deixe seu WhatsApp e a equipe fala com você sobre{" "}
          {colorLabel ? `os filhotes ${colorLabel}` : "a combinação que você procura"}:
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="11999887766"
            aria-label="Seu WhatsApp com DDD"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            required
          />
          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, "").length < 10}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {loading ? "..." : "Enviar"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="text-xs text-zinc-500 hover:text-zinc-600"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep("form")}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <span aria-hidden="true">💬</span>
      Conte o que você procura
    </button>
  );
}
