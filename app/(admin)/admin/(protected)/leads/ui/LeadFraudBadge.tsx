"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";

import {
  ALERT,
  BADGE,
  BADGE_OK,
  BADGE_WARN,
  BUTTON,
  CARD,
  CARD_HEADER,
  CARD_NOTE,
  CARD_TITLE,
  postJson,
  readCached,
  writeCached,
} from "./cardStyles";

type Fraud = {
  score: number;
  reason: string;
  actions: string[];
  badge: "low" | "medium" | "high";
};

const LEVEL_LABEL: Record<Fraud["badge"], string> = {
  low: "Poucos sinais",
  medium: "Alguns sinais",
  high: "Muitos sinais",
};

const LEVEL_BADGE: Record<Fraud["badge"], string> = {
  low: BADGE_OK,
  medium: BADGE,
  high: BADGE_WARN,
};

const storageKey = (leadId: string) => `lead-fraud-v2-${leadId}`;

export function LeadFraudBadge({ leadId }: { leadId: string }) {
  const { push } = useToast();
  const [pending, start] = useTransition();
  const [fraud, setFraud] = useState<Fraud | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFraud(readCached<Fraud>(storageKey(leadId)));
  }, [leadId]);

  const run = () => {
    setError(null);
    start(async () => {
      try {
        const json = await postJson<{ fraud: Fraud }>(
          "/api/admin/leads/fraud",
          { leadId },
          "Não foi possível verificar o lead.",
        );
        setFraud(json.fraud);
        writeCached(storageKey(leadId), json.fraud);
        push({ type: "success", message: "Verificação concluída." });
      } catch (e) {
        const message = (e as Error).message;
        setError(message);
        push({ type: "error", message });
      }
    });
  };

  return (
    <section className={CARD} aria-labelledby="lead-sinais-titulo" aria-busy={pending}>
      <div className={CARD_HEADER}>
        <div className="min-w-0 flex-1">
          <h2 id="lead-sinais-titulo" className={CARD_TITLE}>
            Sinais de contato suspeito
          </h2>
          <p className={CARD_NOTE}>
            Regra fixa, sem modelo de IA: confere telefone, texto da mensagem, origem do acesso e pedidos repetidos do
            mesmo endereço de rede. É um indício para você conferir, não uma prova.
          </p>
        </div>
        <button type="button" onClick={run} disabled={pending} className={BUTTON}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {pending ? "Verificando…" : fraud ? "Verificar de novo" : "Verificar"}
        </button>
      </div>

      {error ? (
        <p role="alert" className={`${ALERT} mt-3`}>
          {error}
        </p>
      ) : null}

      {!fraud && !error ? (
        <p className="mt-3 text-sm text-[var(--text-muted)]">Ainda não verificado. Use o botão “Verificar”.</p>
      ) : null}

      {fraud ? (
        <div className="mt-3 space-y-2 text-sm text-[var(--text)]">
          <p className="flex flex-wrap items-center gap-2">
            <span className={LEVEL_BADGE[fraud.badge] ?? BADGE}>{LEVEL_LABEL[fraud.badge] ?? "Sem classificação"}</span>
            <span className="text-xs text-[var(--text-muted)]">Nota {fraud.score} de 100</span>
          </p>
          <p>{fraud.reason}</p>
          {fraud.actions.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {fraud.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
