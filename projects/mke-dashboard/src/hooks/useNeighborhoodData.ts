"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MetricCardProps, MetricTrend } from "@/types/metrics";
import { computeTrendDirection } from "@/lib/metric-config";
import { METRIC_REGISTRY } from "@/lib/metric-registry";

export function useNeighborhoodData(slug: string) {
  const neighborhood = useQuery(api.neighborhoods.getBySlug, { slug });
  const historyRaw = useQuery(api.neighborhoods.getHistory, { slug });
  const isLoading = neighborhood === undefined;
  const tm = useTranslations("metrics");
  const tu = useTranslations("units");

  const crimeByType = useMemo(() => {
    const src = neighborhood?.crimeByType ?? neighborhood?.part1CrimeByType;
    if (!src) return null;
    try { return JSON.parse(src) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.crimeByType, neighborhood?.part1CrimeByType]);

  const crimeByMonth = useMemo(() => {
    if (!neighborhood?.crimeByMonth) return null;
    try { return JSON.parse(neighborhood.crimeByMonth) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.crimeByMonth]);

  const crimeByHour = useMemo(() => {
    if (!neighborhood?.crimeByHour) return null;
    try { return JSON.parse(neighborhood.crimeByHour) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.crimeByHour]);

  const housingAge = useMemo(() => {
    if (!neighborhood?.housingAge) return null;
    try { return JSON.parse(neighborhood.housingAge) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.housingAge]);

  const salePriceByYear = useMemo(() => {
    if (!neighborhood?.salePriceByYear) return null;
    try { return JSON.parse(neighborhood.salePriceByYear) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.salePriceByYear]);

  const investmentByYear = useMemo(() => {
    if (!neighborhood?.investmentByYear) return null;
    try { return JSON.parse(neighborhood.investmentByYear) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.investmentByYear]);

  const permitsByYear = useMemo(() => {
    if (!neighborhood?.permitsByYear) return null;
    try { return JSON.parse(neighborhood.permitsByYear) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.permitsByYear]);

  const serviceRequestsByType = useMemo(() => {
    if (!neighborhood?.serviceRequestsByType) return null;
    try { return JSON.parse(neighborhood.serviceRequestsByType) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.serviceRequestsByType]);

  const previousPeriod = useMemo((): Record<string, number> | null => {
    if (!neighborhood?.previousPeriod) return null;
    try { return JSON.parse(neighborhood.previousPeriod) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.previousPeriod]);

  const metrics = useMemo((): MetricCardProps[] => {
    if (!neighborhood) return [];

    const now = neighborhood.lastSyncAt
      ? new Date(neighborhood.lastSyncAt).toISOString()
      : new Date().toISOString();

    // Cast to Record for dynamic field access
    const data = neighborhood as Record<string, unknown>;

    const m: MetricCardProps[] = [];

    for (const metric of METRIC_REGISTRY) {
      // Special case: crime_total uses WIBR with ArcGIS fallback
      let value: number | null;
      if (metric.sourceField === "__crimeTotal") {
        const crimeTotal = data["crimeTotal"] as number | undefined;
        const part1 = data["part1CrimeCount"] as number | undefined;
        value = (crimeTotal && crimeTotal > 0) ? crimeTotal : (part1 ?? null);
      } else {
        const raw = data[metric.sourceField];
        value = typeof raw === "number" ? raw : null;
      }

      if (value == null) continue;
      if (metric.skipZero && value === 0) continue;

      // Round avgAssessedValue
      if (metric.id === "avg_assessed_value") value = Math.round(value);

      // Compute trend from previousPeriod
      let trend: MetricTrend | null = null;
      if (previousPeriod && metric.previousPeriodField) {
        const prev = previousPeriod[metric.previousPeriodField];
        if (prev != null && prev !== 0) {
          const rawChange = ((value - prev) / prev) * 100;
          trend = {
            direction: computeTrendDirection(metric.polarity, rawChange),
            percentage: Math.round(Math.abs(rawChange)),
            comparedTo: "vs. last sync",
          };
        }
      }

      // Translate label and unit with fallbacks
      let label: string;
      try { label = tm(metric.translationKey); } catch { label = metric.fallbackLabel; }
      let unit: string;
      try { unit = tu(metric.unitKey); } catch { unit = metric.fallbackUnit; }

      const card: MetricCardProps = {
        id: metric.id,
        label,
        value,
        unit,
        trend,
        category: metric.category,
        source: { name: metric.sourceName, lastUpdated: now },
      };

      // Merge extra props (e.g., progress bar for food inspection)
      if (metric.extra) {
        Object.assign(card, metric.extra(value));
      }

      m.push(card);
    }

    return m;
  }, [neighborhood, previousPeriod, tm, tu]);

  // Year-over-year historical trends
  const crimeTrend = useMemo(() => {
    if (!historyRaw) return null;
    const points = historyRaw
      .filter((h) => h.crimeTotal != null)
      .map((h) => ({ year: h.year, value: h.crimeTotal as number }))
      .sort((a, b) => a.year - b.year);
    return points.length >= 2 ? points : null;
  }, [historyRaw]);

  const serviceRequestsTrend = useMemo(() => {
    if (!historyRaw) return null;
    const points = historyRaw
      .filter((h) => h.serviceRequests311 != null)
      .map((h) => ({ year: h.year, value: h.serviceRequests311 as number }))
      .sort((a, b) => a.year - b.year);
    return points.length >= 2 ? points : null;
  }, [historyRaw]);

  return {
    metrics,
    isLoading,
    neighborhoodName: neighborhood?.name ?? slug,
    crimeByType,
    crimeByMonth,
    crimeByHour,
    housingAge,
    serviceRequestsByType,
    resolutionRate: neighborhood?.serviceRequestsResolutionRate ?? null,
    avgResolutionDays: neighborhood?.serviceRequestsAvgDays ?? null,
    salePriceByYear,
    investmentByYear,
    permitsByYear,
    crimeTrend,
    serviceRequestsTrend,
    raw: neighborhood,
  };
}
