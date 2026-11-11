"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";

import { ALERT, BUTTON, CARD, CARD_HEADER, CARD_NOTE, CARD_TITLE, postJson } from "./cardStyles";

type SuggestedPuppy = { puppy_id: string; name: string; reason: string };

function text(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "Não identificado";
}

function suggested(value: unknown): SuggestedPuppy[] {
  if (!Array.isArray(value)) return [];
  const list: SuggestedPuppy[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.puppy_id !== "string" || !row.puppy_id) continue;
    list.push({
      puppy_id: row.puppy_id,
      name: typeof row.name === "string" && row.name ? row.name : "Filhote sem nome",
      reason: typeof row.reason === "string" ? row.reason : "",
    });
  }
  return list;
}

function alerts(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
}

type Props = { leadId: string; initial?: Record<string, unknown> | null };

export function LeadIntelCard({ leadId, initial }: Props) {
  const { push } = useToast();
  const [insight, setInsight] = useState<Record<string, unknown> | null>(initial ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        const json = await postJson<{ insight: Record<string, unknown> }>(
          "/api/admin/leads/intel",
          { leadId, force: true },
          "Não foi possível analisar o lead.",
        );
        setInsight(json.insight ?? null);
        push({ type: "success", message: "Análise atualizada." });
      } catch (e) {
        const message = (e as Error).message;
        setError(message);
        push({ type: "error", message });
      }
    });
  };

  const puppies = suggested(insight?.suggested_puppies);
  const alertList = alerts(insight?.alerts);

  return (
    <section className={CARD} aria-labelledby="lead-analise-titulo" aria-busy={pending}>
      <div className={CARD_HEADER}>
        <div className="min-w-0 flex-1">
          <h2 id="lead-analise-titulo" className={CARD_TITLE}>
            Análise do lead
          </h2>
          <p className={CARD_NOTE}>
            Regras fixas leem a mensagem e o pedido do lead. Se a chave da OpenAI estiver configurada no servidor, a
            mensagem do lead também é enviada à OpenAI para classificar intenção e urgência.
          </p>
        </div>
        <button type="button" onClick={run} disabled={pending} className={BUTTON}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {pending ? "Analisando…" : insight ? "Analisar de novo" : "Analisar"}
        </button>
      </div>

      {error ? (
        <p role="alert" className={`${ALERT} mt-3`}>
          {error}
        </p>
      ) : null}

      {insight ? (
        <div className="mt-3 space-y-4">
          <dl className="grid gap-2 sm:grid-cols-2">
            <Info label="Intenção" value={text(insight.intent)} />
            <Info label="Urgência" value={text(insight.urgency)} />
            <Info label="Risco de perda" value={text(insight.risk)} />
            <Info label="Nota" value={typeof insight.score === "number" ? `${insight.score} de 100` : "Sem nota"} />
            <Info label="Tom da mensagem" value={text(insight.emotional_tone)} />
            <Info label="Orçamento citado" value={text(insight.budget_inferred)} />
            <Info label="Cor desejada" value={text(insight.desired_color)} />
            <Info label="Sexo desejado" value={text(insight.desired_sex)} />
            <Info label="Cidade" value={text(insight.desired_city)} />
            <Info label="Prazo" value={text(insight.desired_timeframe)} />
          </dl>

          {typeof insight.next_step === "string" && insight.next_step ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Próximo passo sugerido</h3>
              <p className="text-sm text-[var(--text-muted)]">{insight.next_step}</p>
            </div>
          ) : null}

          {alertList.length ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Pontos de atenção</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {alertList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {puppies.length ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Filhotes sugeridos pela regra</h3>
              <ul className="mt-1 space-y-2 text-sm text-[var(--text)]">
                {puppies.map((item) => (
                  <li key={item.puppy_id} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
                    <span className="font-semibold">{item.name}</span>
                    {item.reason ? <span className="block text-xs text-[var(--text-muted)]">{item.reason}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Este lead ainda não foi analisado. Use o botão “Analisar”.
        </p>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="text-sm font-semibold text-[var(--text)]">{value}</dd>
    </div>
  );
}
