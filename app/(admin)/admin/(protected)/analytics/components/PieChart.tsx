"use client";

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Slice = { label: string; value: number; color?: string };

const PALETTE = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

const RADIAN = Math.PI / 180;

function CustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PieChart({ data, title }: { data: Slice[]; title: string }) {
  const total = data.reduce((acc, cur) => acc + cur.value, 0) || 1;
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color ?? PALETTE[i % PALETTE.length],
  }));

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <figcaption className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
        <span className="text-[11px] text-[var(--text-muted)]">Total: {total}</span>
      </figcaption>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={40}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={CustomLabel as any}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                padding: "6px 10px",
              }}
              formatter={(value: number, name: string) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
