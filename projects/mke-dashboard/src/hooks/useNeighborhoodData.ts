"use client";

import { useMemo } from "react";
import { SAMPLE_METRICS } from "@/data/sample-metrics";
import type { MetricCardProps } from "@/types/metrics";

/**
 * Hook to get neighborhood metrics.
 *
 * TODO (Sprint 2): Replace with Convex useQuery once the backend is connected.
 * ```
 * import { useQuery } from "convex/react";
 * import { api } from "../../convex/_generated/api";
 * const neighborhood = useQuery(api.neighborhoods.getBySlug, { slug });
 * ```
 *
 * For now, returns sample data regardless of the slug.
 */
export function useNeighborhoodData(slug: string): {
  metrics: MetricCardProps[];
  isLoading: boolean;
  neighborhoodName: string;
} {
  const metrics = useMemo(() => {
    // When Convex is wired, transform the neighborhood record into MetricCardProps[]
    // For now, return sample data
    return SAMPLE_METRICS;
  }, [slug]);

  const nameMap: Record<string, string> = {
    harambee: "Harambee",
    "sherman-park": "Sherman Park",
    "metcalfe-park": "Metcalfe Park",
    "lindsay-heights": "Lindsay Heights",
    amani: "Amani",
    "borchert-field": "Borchert Field",
    "franklin-heights": "Franklin Heights",
    havenwoods: "Havenwoods",
  };

  return {
    metrics,
    isLoading: false,
    neighborhoodName: nameMap[slug] ?? slug,
  };
}
