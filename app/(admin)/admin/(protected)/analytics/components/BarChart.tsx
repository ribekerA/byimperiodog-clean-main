"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Item = { label: string; value: number };

export function BarChart({ data, title }: { data: Item[]; title: string }) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <figcaption className="mb-3 text-sm font-semibold text-[var(--text)]">{title}</figcaption>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={data.length > 5 ? -30 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 40 : 20}
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
              cursor={{ fill: "rgba(16,185,129,0.07)" }}
              formatter={(value: number) => [value, "Qtd."]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value === max ? "#059669" : "#10b981"}
                  opacity={entry.value === max ? 1 : 0.75}
                />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
