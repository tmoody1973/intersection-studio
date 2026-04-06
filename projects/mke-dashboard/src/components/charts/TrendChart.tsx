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
  /** If true, a declining line is good (crime, vacancy). Color turns green. */
  lowerIsBetter?: boolean;
}

export function TrendChart({
  title,
  data,
  color = "#1A6B52",
  currentYear,
  lowerIsBetter = false,
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
        <h3 className="font-display text-base font-semibold text-iron">{title}</h3>
        <p className="mt-2 text-xs text-limestone">No historical data available</p>
      </div>
    );
  }

  // Filter out years with 0 (partial year data)
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => a.year - b.year);
  if (sorted.length < 2) return null;

  const latestYear = currentYear ?? sorted[sorted.length - 1].year;
  const latestPoint = sorted.find((d) => d.year === latestYear);

  // Compute multi-year trajectory
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalChange = first.value > 0
    ? ((last.value - first.value) / first.value) * 100
    : 0;
  const isImproving = lowerIsBetter ? totalChange < 0 : totalChange > 0;

  // Use green when improving, red when worsening
  const lineColor = isImproving ? "#15803D" : "#B91C1C";

  const trajectoryText = (() => {
    const direction = totalChange > 0 ? "up" : "down";
    const pct = Math.abs(totalChange).toFixed(0);
    const qualifier = isImproving ? "improved" : "worsened";
    return `${qualifier} ${pct}% (${direction}) from ${first.year} to ${last.year}`;
  })();

  // Peak and low points for context
  const peak = sorted.reduce((max, d) => (d.value > max.value ? d : max), sorted[0]);
  const low = sorted.reduce((min, d) => (d.value < min.value ? d : min), sorted[0]);

  return (
    <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
      <div className="mb-3">
        <h3 className="font-display text-base font-semibold text-iron">{title}</h3>
        <p className={`text-xs font-medium ${isImproving ? "text-positive" : "text-critical"}`}>
          {isImproving ? "↓" : "↑"} {trajectoryText}
        </p>
        <p className="text-[10px] text-limestone">
          Peak: {peak.value.toLocaleString()} ({peak.year}) · Low: {low.value.toLocaleString()} ({low.year})
        </p>
      </div>
      <div className="h-52 w-full">
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
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ r: 4, fill: lineColor }}
              activeDot={{ r: 6 }}
            />
            {latestPoint && (
              <ReferenceDot
                x={latestPoint.year}
                y={latestPoint.value}
                r={7}
                fill={lineColor}
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
