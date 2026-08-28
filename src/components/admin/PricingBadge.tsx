"use client";

import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminFetch";

type PricingResult = {
  price_min_cents: number;
  price_ideal_cents: number;
  price_max_cents: number;
  prob_sale_at_current: number;
  alert: string;
  reasoning: string;
};

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

interface Props {
  puppyId: string;
  currentPriceCents?: number | null;
}

export default function PricingBadge({ puppyId, currentPriceCents }: Props) {
  const [data,    setData]    = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await adminFetch(`/api/admin/puppies/pricing?id=${puppyId}`);
      const json = await res.json();
      if (json.ok) setData(json);
    } catch {}
    finally { setLoading(false); }
  }, [puppyId]);

  useEffect(() => { if (open) load(); }, [load, open]);

  const diff = data && currentPriceCents
    ? currentPriceCents - data.price_ideal_cents
    : null;

  const alertColor =
    data?.alert === "acima_do_ideal" ? "text-rose-600" :
    data?.alert === "abaixo_do_ideal" ? "text-amber-600" :
    "text-[var(--brand)]";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:border-[var(--brand)] hover:bg-[var(--brand-tint-50)] hover:text-[var(--brand-hover)] transition"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : diff !== null ? (
          diff > 2000 ? <TrendingDown className="h-3 w-3 text-rose-500" /> :
          diff < -2000 ? <TrendingUp className="h-3 w-3 text-amber-500" /> :
          <Minus className="h-3 w-3 text-[var(--brand)]" />
        ) : (
          <span>✦</span>
        )}
        IA Preço
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando demanda...
            </div>
          ) : data ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Sugestão de preço — IA</p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-zinc-50 p-2">
                  <p className="text-[10px] text-zinc-400">Mínimo</p>
                  <p className="text-sm font-bold text-zinc-600">{fmt(data.price_min_cents)}</p>
                </div>
                <div className="rounded-xl bg-[var(--brand-tint-50)] p-2 ring-2 ring-[var(--brand-tint-200)]">
                  <p className="text-[10px] text-[var(--brand)] font-semibold">Ideal</p>
                  <p className="text-sm font-bold text-[var(--brand)]">{fmt(data.price_ideal_cents)}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <p className="text-[10px] text-zinc-400">Máximo</p>
                  <p className="text-sm font-bold text-zinc-600">{fmt(data.price_max_cents)}</p>
                </div>
              </div>

              {currentPriceCents && (
                <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                  Math.abs(diff ?? 0) <= 2000
                    ? "border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)] text-[var(--brand)]"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  Preço atual: {fmt(currentPriceCents)}
                  {diff !== null && ` (${diff > 0 ? "+" : ""}${fmt(diff)} vs ideal)`}
                </div>
              )}

              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <p className={`text-xs font-semibold ${alertColor}`}>{data.alert.replace(/_/g, " ")}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{data.reasoning}</p>
              </div>

              <p className="text-[10px] text-zinc-400">
                Prob. de venda no preço atual: {Math.round(data.prob_sale_at_current * 100)}%
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Não foi possível carregar sugestão.</p>
          )}
        </div>
      )}
    </div>
  );
}
