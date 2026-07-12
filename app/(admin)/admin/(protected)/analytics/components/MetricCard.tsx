import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  description?: string;
  delta?: number;
  tone?: "good" | "bad" | "neutral" | "auto";
};

export function MetricCard({ label, value, description, delta, tone = "neutral" }: Props) {
  const resolvedTone =
    tone === "auto"
      ? delta === undefined
        ? "neutral"
        : delta > 5
        ? "good"
        : delta < -5
        ? "bad"
        : "neutral"
      : tone;

  const borderClass =
    resolvedTone === "good"
      ? "border-[var(--brand-tint-200)]"
      : resolvedTone === "bad"
      ? "border-rose-200"
      : "border-[var(--border)]";

  const badgeClass =
    resolvedTone === "good"
      ? "bg-[var(--brand-tint-50)] text-[var(--brand)]"
      : resolvedTone === "bad"
      ? "bg-rose-50 text-rose-700"
      : "bg-[var(--surface)] text-[var(--text-muted)]";

  const TrendIcon =
    delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className={`rounded-2xl border-2 ${borderClass} bg-white px-4 py-3 shadow-sm`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text)]">{value}</p>
      {(delta !== undefined || description) && (
        <div className="mt-1.5 flex items-center gap-2">
          {delta !== undefined && TrendIcon && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
              <TrendIcon className="h-3 w-3" aria-hidden />
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
            </span>
          )}
          {description && (
            <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
