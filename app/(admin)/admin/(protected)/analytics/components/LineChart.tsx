"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Point = { label: string; value: number };

export function LineChart({ data, title }: { data: Point[]; title: string }) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));
  const avg = data.length ? Math.round(data.reduce((a, d) => a + d.value, 0) / data.length) : 0;

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <figcaption className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
        {avg > 0 && (
          <span className="text-[11px] text-[var(--text-muted)]">
            Média: <strong className="text-[var(--text)]">{avg}</strong>/dia
          </span>
        )}
      </figcaption>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                padding: "6px 10px",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 2 }}
              formatter={(value: number) => [value, "Leads"]}
            />
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke="#d1fae5"
                strokeDasharray="4 3"
                label={{ value: `Média ${avg}`, position: "right", fontSize: 10, fill: "#6ee7b7" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#065f46", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
