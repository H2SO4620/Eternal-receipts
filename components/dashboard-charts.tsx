"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { SpendingStats } from "@/lib/types";

const PIE_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#84cc16",
];

interface Props {
  stats: SpendingStats;
}

export function SpendingCharts({ stats }: Props) {
  const pieData = Object.entries(stats.by_category).map(([name, value]) => ({
    name,
    value: Math.round(value / 100),
  }));

  const barData = stats.by_month.map((m) => ({
    month: m.month,
    amount: Math.round(m.total_cents / 100),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Monthly Spending</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
              formatter={(v: unknown) => [`$${v}`, "Spent"]}
            />
            <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">By Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
              formatter={(v: unknown) => [`$${v}`, "Spent"]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
