"use client";

type Point = { label: string; value: number };

export function LineChart({ data, title }: { data: Point[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data
    .map((d, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - (d.value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</figcaption>
      <div className="relative h-44">
        <svg viewBox="0 0 100 100" role="img" aria-label={title} className="h-full w-full">
          <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
          {data.map((d, idx) => {
            const x = (idx / Math.max(data.length - 1, 1)) * 100;
            const y = 100 - (d.value / max) * 100;
            return <circle key={d.label} cx={x} cy={y} r="2" fill="#065f46" aria-hidden />;
          })}
        </svg>
        <div className="sr-only">
          {data.map((d) => (
            <div key={d.label}>
              {d.label}: {d.value}
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
