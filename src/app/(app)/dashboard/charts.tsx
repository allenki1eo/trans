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
import type { Theme } from "@/lib/theme/theme";

// Each mode's series colors are separately validated with the dataviz
// six-checks against that mode's card surface (dark #14171a, light #ffffff).
const PALETTES = {
  dark: {
    series1: "#3987e5", // revenue / positive profit
    series2: "#008300", // expenses
    negative: "#e66767", // negative profit (diverging red pole)
    ink: "#898781",
    grid: "#2c2c2a",
    cursorFill: "rgba(255,255,255,0.04)",
    cursorStroke: "rgba(255,255,255,0.15)",
    dotStroke: "#14171a",
    tooltip: {
      backgroundColor: "#1c1f24",
      border: "1px solid #2c2f36",
      borderRadius: 6,
      fontSize: 12,
      color: "#eceae4",
    },
  },
  light: {
    series1: "#2a78d6",
    series2: "#008300",
    negative: "#e34948",
    ink: "#6f6d66",
    grid: "#e1e0d9",
    cursorFill: "rgba(0,0,0,0.04)",
    cursorStroke: "rgba(0,0,0,0.2)",
    dotStroke: "#ffffff",
    tooltip: {
      backgroundColor: "#ffffff",
      border: "1px solid #e1e0d9",
      borderRadius: 6,
      fontSize: 12,
      color: "#1a1c20",
    },
  },
} as const satisfies Record<Theme, unknown>;

function compactTZS(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export function RevenueExpensesChart({
  data,
  labels,
  mode = "dark",
}: {
  data: Array<{ name: string; revenue: number; expenses: number }>;
  labels: { revenue: string; expenses: string };
  mode?: Theme;
}) {
  const P = PALETTES[mode];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2}>
        <CartesianGrid stroke={P.grid} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: P.ink, fontSize: 12 }}
          axisLine={{ stroke: P.grid }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={compactTZS}
          tick={{ fill: P.ink, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: P.cursorFill }}
          contentStyle={P.tooltip}
          formatter={(value: number | string, name: string) => [formatTZS(Number(value)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: P.ink }} iconType="circle" iconSize={8} />
        <Bar
          dataKey="revenue"
          name={labels.revenue}
          fill={P.series1}
          radius={[4, 4, 0, 0]}
          barSize={28}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expenses"
          name={labels.expenses}
          fill={P.series2}
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
  mode = "dark",
}: {
  data: Array<{ month: string; revenue: number; expenses: number }>;
  labels: { revenue: string; expenses: string };
  mode?: Theme;
}) {
  const P = PALETTES[mode];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="trend-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.series1} stopOpacity={0.25} />
            <stop offset="100%" stopColor={P.series1} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trend-expenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.series2} stopOpacity={0.25} />
            <stop offset="100%" stopColor={P.series2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={P.grid} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: P.ink, fontSize: 12 }}
          axisLine={{ stroke: P.grid }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={compactTZS}
          tick={{ fill: P.ink, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: P.cursorStroke, strokeWidth: 1 }}
          contentStyle={P.tooltip}
          formatter={(value: number | string, name: string) => [formatTZS(Number(value)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: P.ink }} iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="revenue"
          name={labels.revenue}
          stroke={P.series1}
          strokeWidth={2}
          fill="url(#trend-revenue)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: P.dotStroke }}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name={labels.expenses}
          stroke={P.series2}
          strokeWidth={2}
          fill="url(#trend-expenses)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: P.dotStroke }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitByCustomerChart({
  data,
  label,
  mode = "dark",
}: {
  data: Array<{ name: string; profit: number }>;
  label: string;
  mode?: Theme;
}) {
  const P = PALETTES[mode];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke={P.grid} strokeWidth={1} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={compactTZS}
          tick={{ fill: P.ink, fontSize: 12 }}
          axisLine={{ stroke: P.grid }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: P.ink, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: P.cursorFill }}
          contentStyle={P.tooltip}
          formatter={(value: number | string) => [formatTZS(Number(value)), label]}
        />
        <Bar dataKey="profit" name={label} radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.profit >= 0 ? P.series1 : P.negative} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
