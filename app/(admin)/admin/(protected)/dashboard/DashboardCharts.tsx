"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type DayPoint = { label: string; value: number };
type StatusCount = { label: string; value: number };

const STATUS_COLORS: Record<string, string> = {
  available: "#10b981",
  reserved: "#f59e0b",
  sold: "#3b82f6",
};
const STATUS_LABELS: Record<string, string> = {
  available: "Disponíveis",
  reserved: "Reservados",
  sold: "Vendidos",
};

export function LeadsTrendChart({ data }: { data: DayPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-[var(--text-muted)]">
        Sem dados de tendência.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label.slice(5),
    value: d.value,
  }));

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              padding: "5px 10px",
            }}
            formatter={(value: number) => [value, "Leads"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="url(#sparkGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#065f46", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PuppyStatusDonut({ available, reserved, sold }: { available: number; reserved: number; sold: number }) {
  const total = available + reserved + sold;
  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-[var(--text-muted)]">
        Sem filhotes cadastrados.
      </div>
    );
  }

  const data = [
    { key: "available", label: STATUS_LABELS.available, value: available },
    { key: "reserved",  label: STATUS_LABELS.reserved,  value: reserved },
    { key: "sold",      label: STATUS_LABELS.sold,       value: sold },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius={32}
            outerRadius={56}
            paddingAngle={2}
            dataKey="value"
            nameKey="label"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "#e5e7eb"} stroke="white" strokeWidth={1} />
            ))}
          </Pie>
          <Pie data={[{ value: 1 }]} cx="40%" cy="50%" innerRadius={0} outerRadius={20} fill="transparent" dataKey="value">
            <Cell fill="transparent" />
          </Pie>
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, right: 0, top: "50%", transform: "translateY(-50%)", position: "absolute" }}
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
              padding: "5px 10px",
            }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(0)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
