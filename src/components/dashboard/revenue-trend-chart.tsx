"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendPoint {
  day: string;
  revenue: number;
  orders: number;
}

export function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E31E24" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#E31E24" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6C757D" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#6C757D" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value ?? 0))}
          contentStyle={{ borderRadius: 10, border: "1px solid #E9ECEF", fontSize: 13 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#E31E24" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
