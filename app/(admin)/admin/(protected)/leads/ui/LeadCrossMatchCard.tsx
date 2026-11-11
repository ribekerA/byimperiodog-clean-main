"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
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

type Suggestion = {
  suggestion_type: "match" | "upsell" | "fallback";
  puppyId: string | null;
  puppyName?: string | null;
  reasoning: string;
  probability_of_acceptance: number;
  alternatives: { id: string; name: string | null; score: number }[];
};

const TYPE_LABEL: Record<Suggestion["suggestion_type"], string> = {
  match: "Combina com o pedido",
  upsell: "Combina, com preço acima da mediana",
  fallback: "Sem combinação forte",
};

const TYPE_BADGE: Record<Suggestion["suggestion_type"], string> = {
  match: BADGE_OK,
  upsell: BADGE_WARN,
  fallback: BADGE,
};

const LINK =
  "font-semibold text-[var(--brand)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]";

const storageKey = (leadId: string) => `lead-crossmatch-v2-${leadId}`;

export function LeadCrossMatchCard({ leadId }: { leadId: string }) {
  const { push } = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Suggestion | null>(null);

  useEffect(() => {
    setData(readCached<Suggestion>(storageKey(leadId)));
  }, [leadId]);

  const run = () => {
    setError(null);
    start(async () => {
      try {
        const json = await postJson<{ suggestion: Suggestion }>(
          "/api/admin/leads/crossmatch",
          { leadId },
          "Não foi possível comparar o pedido com o estoque.",
        );
        setData(json.suggestion);
        writeCached(storageKey(leadId), json.suggestion);
        push({ type: "success", message: "Comparação com o estoque concluída." });
      } catch (e) {
        const message = (e as Error).message;
        setError(message);
        push({ type: "error", message });
      }
    });
  };

  return (
    <section className={CARD} aria-labelledby="lead-cruzamento-titulo" aria-busy={pending}>
      <div className={CARD_HEADER}>
        <div className="min-w-0 flex-1">
          <h2 id="lead-cruzamento-titulo" className={CARD_TITLE}>
            Cruzamento com o estoque
          </h2>
          <p className={CARD_NOTE}>
            Regra fixa, sem modelo de IA: compara a cor e o sexo pedidos com os filhotes disponíveis e reservados.
          </p>
        </div>
        <button type="button" onClick={run} disabled={pending} className={BUTTON}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {pending ? "Comparando…" : data ? "Comparar de novo" : "Comparar"}
        </button>
      </div>

      {error ? (
        <p role="alert" className={`${ALERT} mt-3`}>
          {error}
        </p>
      ) : null}

      {!data && !error ? (
        <p className="mt-3 text-sm text-[var(--text-muted)]">Ainda não comparado. Use o botão “Comparar”.</p>
      ) : null}

      {data ? (
        <div className="mt-3 space-y-2 text-sm text-[var(--text)]">
          <p className="flex flex-wrap items-center gap-2">
            <span className={TYPE_BADGE[data.suggestion_type]}>{TYPE_LABEL[data.suggestion_type]}</span>
            {data.puppyId ? (
              <span className="text-xs text-[var(--text-muted)]">Nota {data.probability_of_acceptance} de 100</span>
            ) : null}
          </p>
          {data.puppyId ? (
            <p>
              <Link href={`/admin/puppies/edit/${data.puppyId}`} className={LINK}>
                {data.puppyName || "Filhote sem nome"}
              </Link>
            </p>
          ) : null}
          <p className="text-[var(--text-muted)]">{data.reasoning}</p>
          {data.alternatives.length > 1 ? (
            <div>
              <h3 className="text-sm font-semibold">Três maiores notas</h3>
              <ul className="mt-1 divide-y divide-[var(--border)]">
                {data.alternatives.map((alt) => (
                  <li key={alt.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/admin/puppies/edit/${alt.id}`} className={`${LINK} min-w-0 truncate`}>
                      {alt.name || "Filhote sem nome"}
                    </Link>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">Nota {alt.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
