"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MetricCardProps } from "@/types/metrics";

/**
 * Hook to get neighborhood metrics from Convex (live ArcGIS data).
 * Falls back to empty state if data hasn't synced yet.
 */
export function useNeighborhoodData(slug: string): {
  metrics: MetricCardProps[];
  isLoading: boolean;
  neighborhoodName: string;
} {
  const neighborhood = useQuery(api.neighborhoods.getBySlug, { slug });
  const isLoading = neighborhood === undefined;

  const metrics = useMemo((): MetricCardProps[] => {
    if (!neighborhood) return [];

    const now = neighborhood.lastSyncAt
      ? new Date(neighborhood.lastSyncAt).toISOString()
      : new Date().toISOString();

    const result: MetricCardProps[] = [];

    // --- Community ---
    if (neighborhood.totalProperties != null) {
      result.push({
        id: "total_properties",
        label: "Total Properties",
        value: neighborhood.totalProperties,
        unit: "parcels (citywide)",
        trend: null,
        category: "community",
        source: { name: "MPROP REST", lastUpdated: now },
      });
    }

    if (neighborhood.ownerOccupiedRate != null) {
      result.push({
        id: "owner_occupied_rate",
        label: "Owner-Occupied Rate",
        value: neighborhood.ownerOccupiedRate,
        unit: "%",
        trend: null,
        category: "community",
        source: { name: "MPROP REST", lastUpdated: now },
      });
    }

    if (neighborhood.avgAssessedValue != null) {
      result.push({
        id: "avg_assessed_value_community",
        label: "Avg Assessed Value",
        value: Math.round(neighborhood.avgAssessedValue),
        unit: "per parcel",
        trend: null,
        category: "community",
        source: { name: "MPROP REST", lastUpdated: now },
      });
    }

    // --- Public Safety ---
    if (neighborhood.part1CrimeCount != null) {
      result.push({
        id: "part1_crimes",
        label: "Part 1 Crimes",
        value: neighborhood.part1CrimeCount,
        unit: "incidents",
        trend: null,
        category: "publicSafety",
        source: { name: "MPD Monthly", lastUpdated: now },
      });
    }

    if (neighborhood.fireIncidentCount != null) {
      result.push({
        id: "fire_incidents",
        label: "Fire Incidents",
        value: neighborhood.fireIncidentCount,
        unit: "incidents",
        trend: null,
        category: "publicSafety",
        source: { name: "MFD Dispatch", lastUpdated: now },
      });
    }

    // --- Quality of Life ---
    if (neighborhood.vacantBuildingCount != null) {
      result.push({
        id: "vacant_buildings",
        label: "Vacant Buildings",
        value: neighborhood.vacantBuildingCount,
        unit: "buildings (citywide)",
        trend: null,
        category: "qualityOfLife",
        source: { name: "Strong Neighborhoods", lastUpdated: now },
      });
    }

    if (neighborhood.taxDelinquentCount != null) {
      result.push({
        id: "tax_delinquent",
        label: "Tax-Delinquent Properties",
        value: neighborhood.taxDelinquentCount,
        unit: "parcels",
        trend: null,
        category: "qualityOfLife",
        source: { name: "City Treasurer", lastUpdated: now },
      });
    }

    if (neighborhood.foreclosureCityCount != null) {
      result.push({
        id: "foreclosures_city",
        label: "Foreclosures (City-Owned)",
        value: neighborhood.foreclosureCityCount,
        unit: "parcels (citywide)",
        trend: null,
        category: "qualityOfLife",
        source: { name: "Foreclosed Properties", lastUpdated: now },
      });
    }

    if (neighborhood.foreclosureBankCount != null) {
      result.push({
        id: "foreclosures_bank",
        label: "Foreclosures (Bank-Owned)",
        value: neighborhood.foreclosureBankCount,
        unit: "parcels (citywide)",
        trend: null,
        category: "qualityOfLife",
        source: { name: "Foreclosed Properties", lastUpdated: now },
      });
    }

    if (neighborhood.avgAssessedValue != null) {
      result.push({
        id: "avg_assessed_value_qol",
        label: "Avg Assessed Value",
        value: Math.round(neighborhood.avgAssessedValue),
        unit: "per parcel",
        trend: null,
        category: "qualityOfLife",
        source: { name: "MPROP REST", lastUpdated: now },
      });
    }

    // --- Wellness ---
    if (neighborhood.foodInspectionPassRate != null) {
      result.push({
        id: "food_inspection_pass_rate",
        label: "Food Inspection Pass Rate",
        value: neighborhood.foodInspectionPassRate,
        unit: "%",
        trend: null,
        category: "wellness",
        source: { name: "Open Data Portal", lastUpdated: now },
        progress: {
          value: neighborhood.foodInspectionPassRate,
          label: "passing",
        },
      });
    }

    return result;
  }, [neighborhood]);

  return {
    metrics,
    isLoading,
    neighborhoodName: neighborhood?.name ?? slug,
  };
}
