"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

interface TrendDataPoint {
  year: number;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  color?: string;
  currentYear?: number;
}

export function TrendChart({
  title,
  data,
  color = "#1A6B52",
  currentYear,
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
        <h3 className="font-display text-base font-semibold text-iron">{title}</h3>
        <p className="mt-2 text-xs text-limestone">No historical data available</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const latestYear = currentYear ?? sorted[sorted.length - 1].year;
  const latestPoint = sorted.find((d) => d.year === latestYear);

  // Calculate YoY change for subtitle
  const yoyLabel = (() => {
    if (sorted.length < 2) return null;
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    if (previous.value === 0) return null;
    const pctChange = ((latest.value - previous.value) / previous.value) * 100;
    const sign = pctChange >= 0 ? "+" : "";
    return `${sign}${pctChange.toFixed(1)}% from ${previous.year}`;
  })();

  return (
    <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
      <div className="mb-3">
        <h3 className="font-display text-base font-semibold text-iron">{title}</h3>
        {yoyLabel && (
          <p className="text-xs text-limestone">{yoyLabel}</p>
        )}
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sorted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              tickFormatter={(y: number) => String(y)}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(val) => [Number(val).toLocaleString(), "Count"]}
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
            />
            {latestPoint && (
              <ReferenceDot
                x={latestPoint.year}
                y={latestPoint.value}
                r={6}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
