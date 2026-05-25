"use client";

type Item = { label: string; value: number };

export function BarChart({ data, title }: { data: Item[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</figcaption>
      <div className="flex items-end gap-3" role="img" aria-label={title}>
        {data.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <div
              className="w-10 rounded-t bg-emerald-500 text-center text-xs font-semibold text-white"
              style={{ height: `${(item.value / max) * 140}px` }}
              aria-hidden
            />
            <span className="text-[11px] text-[var(--text-muted)]">{item.label}</span>
            <span className="text-xs font-semibold text-[var(--text)]">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="sr-only">
        {data.map((d) => (
          <div key={d.label}>
            {d.label}: {d.value}
          </div>
        ))}
      </div>
    </figure>
  );
}
