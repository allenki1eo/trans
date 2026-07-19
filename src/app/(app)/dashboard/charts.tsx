"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTZS } from "@/lib/format";

// Validated against the app surface #14171a (dataviz six-checks, dark mode).
const SERIES_1 = "#3987e5"; // revenue / positive profit
const SERIES_2 = "#008300"; // expenses
const NEGATIVE = "#e66767"; // negative profit (diverging red pole)
const INK_MUTED = "#898781";
const GRID = "#2c2c2a";

const tooltipStyle = {
  backgroundColor: "#1c1f24",
  border: "1px solid #2c2f36",
  borderRadius: 6,
  fontSize: 12,
  color: "#eceae4",
};

function compactTZS(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export function RevenueExpensesChart({
  data,
  labels,
}: {
  data: Array<{ name: string; revenue: number; expenses: number }>;
  labels: { revenue: string; expenses: string };
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2}>
        <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={compactTZS}
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={tooltipStyle}
          formatter={(value: number | string, name: string) => [formatTZS(Number(value)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: INK_MUTED }} iconType="circle" iconSize={8} />
        <Bar
          dataKey="revenue"
          name={labels.revenue}
          fill={SERIES_1}
          radius={[4, 4, 0, 0]}
          barSize={28}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expenses"
          name={labels.expenses}
          fill={SERIES_2}
          radius={[4, 4, 0, 0]}
          barSize={28}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({
  data,
  labels,
}: {
  data: Array<{ month: string; revenue: number; expenses: number }>;
  labels: { revenue: string; expenses: string };
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="trend-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.25} />
            <stop offset="100%" stopColor={SERIES_1} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trend-expenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_2} stopOpacity={0.25} />
            <stop offset="100%" stopColor={SERIES_2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={compactTZS}
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
          contentStyle={tooltipStyle}
          formatter={(value: number | string, name: string) => [formatTZS(Number(value)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: INK_MUTED }} iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="revenue"
          name={labels.revenue}
          stroke={SERIES_1}
          strokeWidth={2}
          fill="url(#trend-revenue)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#14171a" }}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name={labels.expenses}
          stroke={SERIES_2}
          strokeWidth={2}
          fill="url(#trend-expenses)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#14171a" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitByCustomerChart({
  data,
  label,
}: {
  data: Array<{ name: string; profit: number }>;
  label: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke={GRID} strokeWidth={1} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={compactTZS}
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={tooltipStyle}
          formatter={(value: number | string) => [formatTZS(Number(value)), label]}
        />
        <Bar dataKey="profit" name={label} radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.profit >= 0 ? SERIES_1 : NEGATIVE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
