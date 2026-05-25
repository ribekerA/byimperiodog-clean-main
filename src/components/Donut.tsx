"use client";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";

type Row = { name: string; value: number };
const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#0ea5e9", "#84cc16"];

export default function Donut({ rows, title }: { rows: Row[]; title?: string }) {
  return (
    <div className="h-64 w-full">
      {title && <div className="mb-2 text-sm font-medium text-zinc-600">{title}</div>}
      <ResponsiveContainer>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={2}>
            {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={24} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
