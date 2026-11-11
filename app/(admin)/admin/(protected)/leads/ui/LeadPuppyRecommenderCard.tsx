"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";

import {
  ALERT,
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

type Recommendation = {
  puppyIdIdeal: string | null;
  top3Matches: { id: string; name: string; score: number; reason: string }[];
  reasoningText: string;
  score: number;
  upsellOpportunity: boolean;
};

const LINK =
  "inline-flex min-h-[44px] items-center font-semibold text-[var(--brand)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]";

const storageKey = (leadId: string) => `lead-recommend-v2-${leadId}`;

export function LeadPuppyRecommenderCard({ leadId }: { leadId: string }) {
  const { push } = useToast();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRec(readCached<Recommendation>(storageKey(leadId)));
  }, [leadId]);

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        const json = await postJson<{ recommendation: Recommendation }>(
          "/api/admin/leads/recommend",
          { leadId },
          "Não foi possível recomendar um filhote.",
        );
        setRec(json.recommendation);
        writeCached(storageKey(leadId), json.recommendation);
        push({ type: "success", message: "Recomendação atualizada." });
      } catch (e) {
        const message = (e as Error).message;
        setError(message);
        push({ type: "error", message });
      }
    });
  };

  return (
    <section className={CARD} aria-labelledby="lead-recomendacao-titulo" aria-busy={pending}>
      <div className={CARD_HEADER}>
        <div className="min-w-0 flex-1">
          <h2 id="lead-recomendacao-titulo" className={CARD_TITLE}>
            Recomendação de filhote
          </h2>
          <p className={CARD_NOTE}>
            Regra fixa, sem modelo de IA: dá pontos por cor, sexo, cidade e preço perto do orçamento, só entre os
            filhotes disponíveis.
          </p>
        </div>
        <button type="button" onClick={run} disabled={pending} className={BUTTON}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {pending ? "Recomendando…" : rec ? "Recomendar de novo" : "Recomendar"}
        </button>
      </div>

      {error ? (
        <p role="alert" className={`${ALERT} mt-3`}>
          {error}
        </p>
      ) : null}

      {!rec && !error ? (
        <p className="mt-3 text-sm text-[var(--text-muted)]">Ainda sem recomendação. Use o botão “Recomendar”.</p>
      ) : null}

      {rec ? (
        <div className="mt-3 space-y-3 text-sm text-[var(--text)]">
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
            <p>{rec.reasoningText}</p>
            {rec.upsellOpportunity ? (
              <p className="mt-2">
                <span className={BADGE_WARN}>Preço acima do orçamento citado pelo lead</span>
              </p>
            ) : null}
          </div>
          {rec.top3Matches.length ? (
            <div>
              <h3 className="text-sm font-semibold">Três melhores opções</h3>
              <ol className="mt-1 divide-y divide-[var(--border)]">
                {rec.top3Matches.map((match) => (
                  <li key={match.id} className="flex flex-wrap items-center justify-between gap-x-3 py-1">
                    <div className="min-w-0">
                      <Link href={`/admin/puppies/edit/${match.id}`} className={LINK}>
                        {match.name}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)]">Pontuou por: {match.reason}.</p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">Nota {match.score}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
