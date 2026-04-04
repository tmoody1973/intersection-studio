import type { MetricCardProps } from "@/types/metrics";

/**
 * Sample metrics using real Milwaukee data from Phase 1 research.
 * These will be replaced by Convex queries in Sprint 2.
 */
export const SAMPLE_METRICS: MetricCardProps[] = [
  // --- Community ---
  {
    id: "total_properties",
    label: "Total Properties",
    value: 4218,
    unit: "parcels",
    trend: { direction: "stable", percentage: 0, comparedTo: "vs. Q4 2025" },
    category: "community",
    source: { name: "MPROP REST", lastUpdated: "2026-04-01T00:00:00Z" },
  },
  {
    id: "owner_occupied_rate",
    label: "Owner-Occupied Rate",
    value: 61,
    unit: "% of residential",
    trend: { direction: "stable", percentage: 0, comparedTo: "vs. 2024" },
    category: "community",
    source: { name: "MPROP REST", lastUpdated: "2026-04-01T00:00:00Z" },
  },
  {
    id: "median_assessed_value",
    label: "Median Assessed Value",
    value: 67400,
    unit: "per parcel",
    trend: { direction: "improving", percentage: 4, comparedTo: "vs. 2024" },
    category: "community",
    source: { name: "MPROP REST", lastUpdated: "2026-04-01T00:00:00Z" },
  },
  {
    id: "schools",
    label: "Schools",
    value: 7,
    unit: "schools",
    trend: null,
    category: "community",
    source: { name: "Community Resources", lastUpdated: "2026-01-01T00:00:00Z" },
  },

  // --- Public Safety ---
  {
    id: "part1_crimes",
    label: "Part 1 Crimes",
    value: 847,
    unit: "incidents",
    trend: { direction: "worsening", percentage: 12, comparedTo: "vs. 2024" },
    category: "publicSafety",
    source: { name: "MPD Monthly", lastUpdated: "2026-03-31T00:00:00Z" },
  },
  {
    id: "fire_incidents",
    label: "Fire Incidents",
    value: 19,
    unit: "incidents",
    trend: { direction: "stable", percentage: 1, comparedTo: "vs. Q1 2025" },
    category: "publicSafety",
    source: { name: "MFD Dispatch", lastUpdated: "2026-04-03T00:00:00Z" },
  },
  {
    id: "overdose_calls",
    label: "Overdose Calls",
    value: null,
    unit: "calls",
    trend: null,
    category: "publicSafety",
    source: { name: "MFD Dispatch", lastUpdated: "" },
    state: "empty",
    errorMessage: "Coming soon — requires dispatch call-type filtering pipeline",
  },

  // --- Quality of Life ---
  {
    id: "vacant_buildings",
    label: "Vacant Buildings",
    value: 1552,
    unit: "buildings (citywide)",
    trend: { direction: "improving", percentage: 3, comparedTo: "vs. 2024" },
    category: "qualityOfLife",
    source: { name: "Strong Neighborhoods", lastUpdated: "2026-04-01T00:00:00Z" },
  },
  {
    id: "tax_delinquent",
    label: "Tax-Delinquent Properties",
    value: 89,
    unit: "parcels",
    trend: { direction: "worsening", percentage: 7, comparedTo: "vs. Q4 2025" },
    category: "qualityOfLife",
    source: { name: "City Treasurer XLSX", lastUpdated: "2026-03-05T00:00:00Z" },
  },
  {
    id: "foreclosures_city",
    label: "Foreclosures (City-Owned)",
    value: 928,
    unit: "parcels (citywide)",
    trend: { direction: "improving", percentage: 20, comparedTo: "vs. 2024" },
    category: "qualityOfLife",
    source: { name: "Foreclosed Properties", lastUpdated: "2026-04-03T00:00:00Z" },
  },
  {
    id: "foreclosures_bank",
    label: "Foreclosures (Bank-Owned)",
    value: 228,
    unit: "parcels (citywide)",
    trend: { direction: "stable", percentage: 0, comparedTo: "vs. 2024" },
    category: "qualityOfLife",
    source: { name: "Foreclosed Properties", lastUpdated: "2026-04-03T00:00:00Z" },
  },
  {
    id: "avg_assessed_value",
    label: "Avg Assessed Value",
    value: 67400,
    unit: "per parcel",
    trend: { direction: "improving", percentage: 4, comparedTo: "vs. 2024" },
    category: "qualityOfLife",
    source: { name: "MPROP REST", lastUpdated: "2026-04-01T00:00:00Z" },
  },

  // --- Wellness ---
  {
    id: "food_inspection_pass_rate",
    label: "Food Inspection Pass Rate",
    value: 91,
    unit: "% of inspections",
    trend: { direction: "stable", percentage: 1, comparedTo: "vs. 2024" },
    category: "wellness",
    source: { name: "Open Data Portal", lastUpdated: "2026-03-15T00:00:00Z" },
    progress: { value: 91, label: "passing" },
  },
];
