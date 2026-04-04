import type { CategoryId } from "@/types/metrics";

/**
 * Metric registry: defines polarity, categories, sources, and trend semantics.
 * The component receives "improving"/"worsening" — this config determines which direction is which.
 */

export type TrendPolarity = "lower_is_better" | "higher_is_better";

export interface MetricDefinition {
  id: string;
  category: CategoryId;
  labelKey: string;
  unitKey: string;
  polarity: TrendPolarity;
  sourceName: string;
  /** How to fetch this metric */
  sourceType: "arcgis" | "convex_cache" | "open_data" | "manual";
  /** Phase in which this metric becomes available */
  phase: 1 | 2 | 3;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // Community (4 metrics)
  {
    id: "total_properties",
    category: "community",
    labelKey: "metrics.totalProperties",
    unitKey: "units.parcels",
    polarity: "higher_is_better",
    sourceName: "MPROP REST",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "owner_occupied_rate",
    category: "community",
    labelKey: "metrics.ownerOccupiedRate",
    unitKey: "units.percent",
    polarity: "higher_is_better",
    sourceName: "MPROP REST",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "median_assessed_value",
    category: "community",
    labelKey: "metrics.medianAssessedValue",
    unitKey: "units.dollars",
    polarity: "higher_is_better",
    sourceName: "MPROP REST",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "schools",
    category: "community",
    labelKey: "metrics.schools",
    unitKey: "units.schools",
    polarity: "higher_is_better",
    sourceName: "Community Resources",
    sourceType: "manual",
    phase: 2,
  },

  // Public Safety (3 metrics)
  {
    id: "part1_crimes",
    category: "publicSafety",
    labelKey: "metrics.part1Crimes",
    unitKey: "units.incidents",
    polarity: "lower_is_better",
    sourceName: "MPD Monthly",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "fire_incidents",
    category: "publicSafety",
    labelKey: "metrics.fireIncidents",
    unitKey: "units.incidents",
    polarity: "lower_is_better",
    sourceName: "MFD Dispatch",
    sourceType: "open_data",
    phase: 1,
  },
  {
    id: "overdose_calls",
    category: "publicSafety",
    labelKey: "metrics.overdoseCalls",
    unitKey: "units.calls",
    polarity: "lower_is_better",
    sourceName: "MFD Dispatch",
    sourceType: "open_data",
    phase: 2, // Stretch goal — needs call-type filtering pipeline
  },

  // Quality of Life (5 metrics)
  {
    id: "vacant_buildings",
    category: "qualityOfLife",
    labelKey: "metrics.vacantBuildings",
    unitKey: "units.buildings",
    polarity: "lower_is_better",
    sourceName: "Strong Neighborhoods",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "tax_delinquent",
    category: "qualityOfLife",
    labelKey: "metrics.taxDelinquent",
    unitKey: "units.parcels",
    polarity: "lower_is_better",
    sourceName: "City Treasurer XLSX",
    sourceType: "convex_cache", // ETL from Treasurer monthly XLSX
    phase: 1,
  },
  {
    id: "foreclosures_city",
    category: "qualityOfLife",
    labelKey: "metrics.foreclosuresCity",
    unitKey: "units.parcels",
    polarity: "lower_is_better",
    sourceName: "Foreclosed Properties",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "foreclosures_bank",
    category: "qualityOfLife",
    labelKey: "metrics.foreclosuresBank",
    unitKey: "units.parcels",
    polarity: "lower_is_better",
    sourceName: "Foreclosed Properties",
    sourceType: "arcgis",
    phase: 1,
  },
  {
    id: "avg_assessed_value",
    category: "qualityOfLife",
    labelKey: "metrics.avgAssessedValue",
    unitKey: "units.dollars",
    polarity: "higher_is_better",
    sourceName: "MPROP REST",
    sourceType: "arcgis",
    phase: 1,
  },

  // Wellness (1 metric)
  {
    id: "food_inspection_pass_rate",
    category: "wellness",
    labelKey: "metrics.foodInspectionPassRate",
    unitKey: "units.percent",
    polarity: "higher_is_better",
    sourceName: "Open Data Portal",
    sourceType: "open_data",
    phase: 1,
  },
];

/**
 * Given a metric's polarity and a raw change direction,
 * compute the semantic trend direction.
 */
export function computeTrendDirection(
  polarity: TrendPolarity,
  rawChange: number,
): "improving" | "worsening" | "stable" {
  const threshold = 2; // Less than 2% change = stable
  if (Math.abs(rawChange) < threshold) return "stable";

  if (polarity === "lower_is_better") {
    return rawChange < 0 ? "improving" : "worsening";
  }
  return rawChange > 0 ? "improving" : "worsening";
}
