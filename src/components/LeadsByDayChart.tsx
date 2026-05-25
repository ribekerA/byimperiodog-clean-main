"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { day: string; total: number };

export default function LeadsByDayChart({ rows }: { rows: Row[] }) {
  const data = rows.map(r => ({ day: String(r.day).slice(5), total: Number(r.total || 0) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="#71717a" fontSize={12}/>
          <YAxis stroke="#71717a" fontSize={12}/>
          <Tooltip />
          <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#g)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
