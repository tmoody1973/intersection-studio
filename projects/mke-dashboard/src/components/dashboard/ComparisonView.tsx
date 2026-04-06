"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "../../../convex/_generated/api";
import { TARGET_NEIGHBORHOODS } from "@/lib/constants";

interface ComparisonViewProps {
  onClose: () => void;
  initialSlugA?: string;
  initialSlugB?: string;
}

interface MetricDef {
  key: string;
  label: string;
  format: (v: number | null | undefined) => string;
}

const METRICS: MetricDef[] = [
  { key: "population", label: "Population", format: (v) => v?.toLocaleString() ?? "—" },
  { key: "medianIncome", label: "Median Income", format: (v) => v != null ? `$${v.toLocaleString()}` : "—" },
  { key: "povertyRate", label: "Poverty Rate", format: (v) => v != null ? `${v}%` : "—" },
  { key: "crimeTotal", label: "Total Crimes", format: (v) => v?.toLocaleString() ?? "—" },
  { key: "foreclosureCityCount", label: "Foreclosures (City)", format: (v) => v?.toLocaleString() ?? "—" },
  { key: "vacantBuildingCount", label: "Vacant Buildings", format: (v) => v?.toLocaleString() ?? "—" },
  { key: "serviceRequests311", label: "311 Requests", format: (v) => v?.toLocaleString() ?? "—" },
  { key: "buildingPermitCount", label: "Building Permits", format: (v) => v?.toLocaleString() ?? "—" },
  { key: "medianSalePrice", label: "Median Sale Price", format: (v) => v != null ? `$${v.toLocaleString()}` : "—" },
];

const COLORS = {
  a: "#2563EB",
  b: "#15803D",
  avg: "#9CA3AF",
} as const;

function getMetricValue(data: Record<string, unknown> | null | undefined, key: string): number | null {
  if (!data) return null;
  const val = data[key];
  return typeof val === "number" ? val : null;
}

export function ComparisonView({ onClose, initialSlugA = "harambee", initialSlugB = "sherman-park" }: ComparisonViewProps) {
  const [slugA, setSlugA] = useState(initialSlugA);
  const [slugB, setSlugB] = useState(initialSlugB);

  const comparison = useQuery(api.neighborhoods.compare, { slugA, slugB });
  const allNeighborhoods = useQuery(api.neighborhoods.getAll);

  const cityAverages = useMemo(() => {
    if (!allNeighborhoods || allNeighborhoods.length === 0) return null;
    const avgs: Record<string, number | null> = {};
    for (const metric of METRICS) {
      const values = allNeighborhoods
        .map((n) => getMetricValue(n as Record<string, unknown>, metric.key))
        .filter((v): v is number => v !== null);
      avgs[metric.key] = values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;
    }
    return avgs;
  }, [allNeighborhoods]);

  const nameA = TARGET_NEIGHBORHOODS.find((n) => n.slug === slugA)?.name ?? slugA;
  const nameB = TARGET_NEIGHBORHOODS.find((n) => n.slug === slugB)?.name ?? slugB;

  const chartData = useMemo(() => {
    if (!comparison?.a && !comparison?.b) return [];
    return METRICS.map((metric) => ({
      metric: metric.label,
      [nameA]: getMetricValue(comparison?.a as Record<string, unknown> | null, metric.key),
      [nameB]: getMetricValue(comparison?.b as Record<string, unknown> | null, metric.key),
      "City Avg": cityAverages ? cityAverages[metric.key] : null,
    }));
  }, [comparison, cityAverages, nameA, nameB]);

  const isLoading = comparison === undefined || allNeighborhoods === undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-limestone/20 bg-white p-6 shadow-2xl dark:bg-[#292524]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-iron">Compare Neighborhoods</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-limestone hover:bg-limestone/10 hover:text-iron"
            aria-label="Close comparison"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* Selectors */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-limestone/30 bg-white px-3 py-2 text-sm text-iron focus:border-lakeshore focus:outline-none focus:ring-1 focus:ring-lakeshore dark:bg-[#292524]"
            value={slugA}
            onChange={(e) => setSlugA(e.target.value)}
            aria-label="Neighborhood A"
          >
            {TARGET_NEIGHBORHOODS.map((n) => (
              <option key={n.slug} value={n.slug}>{n.name}</option>
            ))}
          </select>

          <span className="text-sm font-medium text-limestone">vs</span>

          <select
            className="rounded-lg border border-limestone/30 bg-white px-3 py-2 text-sm text-iron focus:border-lakeshore focus:outline-none focus:ring-1 focus:ring-lakeshore dark:bg-[#292524]"
            value={slugB}
            onChange={(e) => setSlugB(e.target.value)}
            aria-label="Neighborhood B"
          >
            {TARGET_NEIGHBORHOODS.map((n) => (
              <option key={n.slug} value={n.slug}>{n.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-limestone/30 border-t-lakeshore" />
          </div>
        ) : (
          <>
            {/* Grouped Bar Chart */}
            <div className="mb-6 rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                    <XAxis dataKey="metric" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip formatter={(value) => typeof value === "number" ? value.toLocaleString() : "—"} />
                    <Legend />
                    <Bar dataKey={nameA} fill={COLORS.a} radius={[3, 3, 0, 0]} />
                    <Bar dataKey={nameB} fill={COLORS.b} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="City Avg" fill={COLORS.avg} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-lg border border-limestone/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-limestone/20 bg-limestone/5">
                    <th className="px-4 py-3 text-left font-medium text-limestone">Metric</th>
                    <th className="px-4 py-3 text-right font-medium" style={{ color: COLORS.a }}>{nameA}</th>
                    <th className="px-4 py-3 text-right font-medium" style={{ color: COLORS.b }}>{nameB}</th>
                    <th className="px-4 py-3 text-right font-medium" style={{ color: COLORS.avg }}>City Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric) => {
                    const valA = getMetricValue(comparison?.a as Record<string, unknown> | null, metric.key);
                    const valB = getMetricValue(comparison?.b as Record<string, unknown> | null, metric.key);
                    const valAvg = cityAverages ? cityAverages[metric.key] : null;
                    return (
                      <tr key={metric.key} className="border-b border-limestone/10 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-iron">{metric.label}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-iron">{metric.format(valA)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-iron">{metric.format(valB)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-limestone">{metric.format(valAvg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
