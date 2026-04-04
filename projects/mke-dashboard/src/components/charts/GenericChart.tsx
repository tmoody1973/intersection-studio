"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

const CHART_COLORS = [
  "#1A6B52", "#B84233", "#2563EB", "#7C3AED",
  "#C4960C", "#15803D", "#D97706", "#1D4ED8",
];

interface ChartProps {
  title: string;
  chartType: "bar" | "line" | "area" | "pie";
  data: Array<Record<string, unknown>>;
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
}

export function GenericChart({
  title,
  chartType,
  data,
  xAxisKey,
  yAxisKey,
  color = "#1A6B52",
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
        <h3 className="font-display text-base font-semibold text-iron">{title}</h3>
        <p className="mt-2 text-xs text-limestone">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
      <h3 className="mb-3 font-display text-base font-semibold text-iron">
        {title}
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke={color}
                fill={color}
                fillOpacity={0.15}
              />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
      <div className="mb-3 h-4 w-40 rounded bg-limestone/30" />
      <div className="h-48 rounded bg-limestone/10" />
    </div>
  );
}
