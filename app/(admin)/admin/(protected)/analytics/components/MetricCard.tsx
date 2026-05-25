type Props = {
  label: string;
  value: string | number;
  description?: string;
};

export function MetricCard({ label, value, description }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--text)]">{value}</p>
      {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
    </div>
  );
}
