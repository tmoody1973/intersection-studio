"use client";

import { useMemo } from "react";
import { GenericChart } from "@/components/charts/GenericChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { MetricCard } from "./MetricCard";
import type { MetricCardProps, CategoryId } from "@/types/metrics";

interface ZoneInfo {
  name: string;
  type: string;
  active: boolean;
}

interface TrendDataPoint {
  year: number;
  value: number;
}

interface CategoryViewProps {
  category: CategoryId;
  metrics: MetricCardProps[];
  crimeByType?: Record<string, number> | null;
  crimeByMonth?: Record<string, number> | null;
  serviceRequestsByType?: Record<string, number> | null;
  housingAge?: Record<string, number> | null;
  zoneInfo?: ZoneInfo[];
  investmentByYear?: Record<string, number> | null;
  permitsByYear?: Record<string, number> | null;
  crimeTrend?: TrendDataPoint[] | null;
  serviceRequestsTrend?: TrendDataPoint[] | null;
  onAskAI?: (id: string, label: string) => void;
}

/**
 * Category-specific view with indicators + charts + metric cards.
 * Matches Kensington Dashboard pattern: data visualizations per tab.
 */
export function CategoryView({
  category,
  metrics,
  crimeByType,
  crimeByMonth,
  serviceRequestsByType,
  housingAge,
  zoneInfo,
  investmentByYear,
  permitsByYear,
  crimeTrend,
  serviceRequestsTrend,
  onAskAI,
}: CategoryViewProps) {
  const filteredMetrics = metrics.filter((m) => m.category === category);

  // Prepare chart data
  const crimeTypeChartData = useMemo(() => {
    if (!crimeByType) return null;
    return Object.entries(crimeByType)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name: formatCrimeType(name), value }));
  }, [crimeByType]);

  const crimeMonthChartData = useMemo(() => {
    if (!crimeByMonth) return null;
    return Object.entries(crimeByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        month: formatMonth(month),
        value,
      }));
  }, [crimeByMonth]);

  const serviceRequestChartData = useMemo(() => {
    if (!serviceRequestsByType) return null;
    return Object.entries(serviceRequestsByType)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name: truncate(name, 25), value }));
  }, [serviceRequestsByType]);

  const housingAgeChartData = useMemo(() => {
    if (!housingAge) return null;
    return Object.entries(housingAge)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([decade, value]) => ({ decade, value }));
  }, [housingAge]);

  if (filteredMetrics.length === 0) {
    return (
      <div className="rounded-lg border border-limestone/20 bg-white/50 p-8 text-center dark:bg-[#292524]/50">
        <p className="text-sm text-foundry">
          No data available for this category yet.
        </p>
        <p className="mt-1 text-xs text-limestone">
          More data sources will be added as city partnerships develop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMetrics.map((metric, index) => (
          <MetricCard
            key={metric.id}
            {...metric}
            index={index}
            onAskAI={onAskAI}
          />
        ))}
      </div>

      {/* Category-specific charts */}
      {category === "publicSafety" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {crimeTypeChartData && crimeTypeChartData.length > 0 && (
              <GenericChart
                title="Crime by Type"
                subtitle="Breakdown of reported incidents"
                chartType="horizontal-bar"
                data={crimeTypeChartData}
                xAxisKey="name"
                yAxisKey="value"
                color="#B84233"
                height={Math.max(220, crimeTypeChartData.length * 28)}
              />
            )}
            {crimeMonthChartData && crimeMonthChartData.length > 1 && (
              <GenericChart
                title="Crime Trend by Month"
                chartType="area"
                data={crimeMonthChartData}
                xAxisKey="month"
                yAxisKey="value"
                color="#B84233"
              />
            )}
          </div>
          {crimeTrend && (
            <TrendChart
              title="Crime Year-over-Year (2020-2025)"
              data={crimeTrend}
              lowerIsBetter
            />
          )}
        </div>
      )}

      {category === "qualityOfLife" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {serviceRequestChartData && serviceRequestChartData.length > 0 && (
              <GenericChart
                title="311 Requests by Type"
                subtitle="What residents are reporting to the city"
                chartType="horizontal-bar"
                data={serviceRequestChartData}
                xAxisKey="name"
                yAxisKey="value"
                color="#2563EB"
                height={Math.max(220, serviceRequestChartData.length * 28)}
              />
            )}
            {housingAgeChartData && housingAgeChartData.length > 0 && (
              <GenericChart
                title="Housing Age Distribution"
                chartType="bar"
                data={housingAgeChartData}
                xAxisKey="decade"
                yAxisKey="value"
                color="#2563EB"
              />
            )}
          </div>
          {serviceRequestsTrend && (
            <TrendChart
              title="311 Requests Year-over-Year (2020-2025)"
              data={serviceRequestsTrend}
              lowerIsBetter
            />
          )}
        </div>
      )}

      {/* Community tab: metric cards are sufficient, no chart needed */}

      {category === "wellness" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredMetrics.length >= 2 && (
            <GenericChart
              title="Wellness Indicators"
              chartType="bar"
              data={filteredMetrics.map((m) => ({
                name: m.label,
                value: m.value ?? 0,
              }))}
              xAxisKey="name"
              yAxisKey="value"
              color="#7C3AED"
            />
          )}
        </div>
      )}

      {category === "development" && (
        <div className="space-y-4">
          {/* Investment timeline charts */}
          {(investmentByYear || permitsByYear) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {permitsByYear && Object.keys(permitsByYear).length > 1 && (
                <GenericChart
                  title="Building Permits by Year"
                  chartType="area"
                  data={Object.entries(permitsByYear)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([year, count]) => ({ year, count }))}
                  xAxisKey="year"
                  yAxisKey="count"
                  color="#C4960C"
                />
              )}
              {investmentByYear && Object.keys(investmentByYear).length > 1 && (
                <GenericChart
                  title="Construction Investment by Year ($)"
                  chartType="area"
                  data={Object.entries(investmentByYear)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([year, amount]) => ({ year, amount: Math.round(amount / 1000) }))}
                  xAxisKey="year"
                  yAxisKey="amount"
                  color="#1A6B52"
                />
              )}
            </div>
          )}

          {/* Development metrics chart */}
          {filteredMetrics.length >= 2 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <GenericChart
                title="Development Indicators"
                chartType="bar"
                data={filteredMetrics.map((m) => ({
                  name: m.label,
                  value: m.value ?? 0,
                }))}
                xAxisKey="name"
                yAxisKey="value"
                color="#C4960C"
              />
            </div>
          )}

          {/* Zone info cards */}
          {zoneInfo && zoneInfo.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foundry dark:text-limestone">
                Development Zones
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {zoneInfo.map((zone) => (
                  <div
                    key={`${zone.type}-${zone.name}`}
                    className="rounded-lg border border-limestone/20 bg-white/50 p-4 dark:bg-[#292524]/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#C4960C]" />
                      <span className="text-xs font-medium uppercase tracking-wider text-iron">
                        {zone.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foundry dark:text-limestone">
                      {zone.name}
                    </p>
                    <p className="mt-0.5 text-xs text-limestone">
                      {zone.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function formatCrimeType(type: string): string {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${year?.slice(2)}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
