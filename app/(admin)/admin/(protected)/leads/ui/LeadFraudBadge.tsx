"use client";

import { ShieldAlert, ShieldCheck, ShieldQuestion, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

type Fraud = {
  score: number;
  reason: string;
  actions: string[];
  badge: "low" | "medium" | "high";
};

const palette: Record<Fraud["badge"], string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
};

export function LeadFraudBadge({ leadId }: { leadId: string }) {
  const [pending, start] = useTransition();
  const [fraud, setFraud] = useState<Fraud | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/admin/leads/fraud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao avaliar fraude");
        setFraud(json.fraud);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const icon =
    fraud?.badge === "high" ? (
      <ShieldAlert className="h-4 w-4" aria-hidden />
    ) : fraud?.badge === "medium" ? (
      <ShieldQuestion className="h-4 w-4" aria-hidden />
    ) : fraud?.badge === "low" ? (
      <ShieldCheck className="h-4 w-4" aria-hidden />
    ) : null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">FraudGuard AI</p>
            <p className="text-xs text-[var(--text-muted)]">Detecta padrões suspeitos no lead.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analisar"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}

      {fraud && (
        <div className="mt-3 space-y-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-semibold ${palette[fraud.badge]}`}>
            Score {fraud.score} / 100
          </span>
          <p className="text-sm text-[var(--text)]">{fraud.reason}</p>
          {fraud.actions.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--text-muted)]">
              {fraud.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
