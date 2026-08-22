"use client";

/**
 * NotifyMeButton — Hooked loop: Investment phase.
 *
 * Exibido quando um filhote está reservado ou vendido.
 * O usuário deixa o WhatsApp → recebe notificação quando um da mesma
 * cor ficar disponível → retorna ao site → converte.
 *
 * Trigger externo programado: criadora envia mensagem quando nova ninhada chega.
 */

import { useRef, useState } from "react";

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
  const idempotencyKeyRef = useRef<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return;

    setLoading(true);
    try {
      idempotencyKeyRef.current ??= crypto.randomUUID();
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          telefone: digits,
          nome: "Notificação de disponibilidade",
          cor_preferida: color,
          consent_lgpd: true,
          consent_timestamp: new Date().toISOString(),
          consent_version: "1.0",
          page_type: "notify_me",
          page_intent: `notify_color_${color ?? "any"}`,
          // Fila de espera não é conversão do Ads (não há nome nem intenção de
          // compra declarada), mas o click id fica gravado: se a venda vier
          // depois, dá para importá-la como conversão offline.
          gclid: getClickId(),
        }),
        keepalive: true,
      });
      if (!response.ok) throw new Error("Falha ao registrar interesse");
      idempotencyKeyRef.current = null;
      sendGA4("notify_me_subscribe", { color: color ?? "any" });
      setStep("success");
    } catch {
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span aria-hidden="true">✅</span>
        <span>Combinado! Te avisamos quando um filhote {colorLabel ? `da cor ${colorLabel}` : ""} ficar disponível.</span>
      </div>
    );
  }

  if (step === "form") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold text-zinc-700">
          Deixe seu WhatsApp — avisamos quando um filhote {colorLabel ? `${colorLabel}` : ""} ficar disponível:
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
            {loading ? "..." : "Avisar"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="text-xs text-zinc-400 hover:text-zinc-600"
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
      <span aria-hidden="true">🔔</span>
      Avisar quando disponível
    </button>
  );
}
