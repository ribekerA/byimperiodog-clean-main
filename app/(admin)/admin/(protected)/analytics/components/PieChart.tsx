"use client";

type Slice = { label: string; value: number; color?: string };

const palette = ["#10b981", "#22c55e", "#34d399", "#6ee7b7", "#a7f3d0", "#bef264"];

export function PieChart({ data, title }: { data: Slice[]; title: string }) {
  const total = data.reduce((acc, cur) => acc + cur.value, 0) || 1;
  let currentAngle = 0;

  const slices = data.map((slice, idx) => {
    const angle = (slice.value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    const largeArc = angle > 180 ? 1 : 0;
    const radius = 50;
    const x1 = 50 + radius * Math.cos((Math.PI * start) / 180);
    const y1 = 50 + radius * Math.sin((Math.PI * start) / 180);
    const x2 = 50 + radius * Math.cos((Math.PI * end) / 180);
    const y2 = 50 + radius * Math.sin((Math.PI * end) / 180);
    const pathData = `M50,50 L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} z`;
    return { ...slice, pathData, color: slice.color ?? palette[idx % palette.length] };
  });

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</figcaption>
      <div className="flex gap-4">
        <svg viewBox="0 0 100 100" role="img" aria-label={title} className="h-40 w-40">
          {slices.map((slice) => (
            <path key={slice.label} d={slice.pathData} fill={slice.color} aria-hidden />
          ))}
        </svg>
        <div className="space-y-2 text-sm text-[var(--text)]">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
              <span className="font-semibold">{slice.label}</span>
              <span className="text-[var(--text-muted)]">{((slice.value / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sr-only">
        {slices.map((slice) => (
          <div key={slice.label}>
            {slice.label}: {slice.value}
          </div>
        ))}
      </div>
    </figure>
  );
}
