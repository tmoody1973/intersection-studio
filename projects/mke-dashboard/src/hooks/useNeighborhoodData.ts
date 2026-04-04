"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MetricCardProps } from "@/types/metrics";

/**
 * Hook to get per-neighborhood metrics from Convex (live ArcGIS spatial data).
 */
export function useNeighborhoodData(slug: string): {
  metrics: MetricCardProps[];
  isLoading: boolean;
  neighborhoodName: string;
  crimeByType: Record<string, number> | null;
  housingAge: Record<string, number> | null;
  censusTracts: string[] | null;
} {
  const neighborhood = useQuery(api.neighborhoods.getBySlug, { slug });
  const isLoading = neighborhood === undefined;

  const crimeByType = useMemo(() => {
    if (!neighborhood?.part1CrimeByType) return null;
    try {
      return JSON.parse(neighborhood.part1CrimeByType) as Record<string, number>;
    } catch {
      return null;
    }
  }, [neighborhood?.part1CrimeByType]);

  const housingAge = useMemo(() => {
    if (!neighborhood?.housingAge) return null;
    try {
      return JSON.parse(neighborhood.housingAge) as Record<string, number>;
    } catch {
      return null;
    }
  }, [neighborhood?.housingAge]);

  const censusTracts = useMemo(() => {
    if (!neighborhood?.censusTracts) return null;
    try {
      return JSON.parse(neighborhood.censusTracts) as string[];
    } catch {
      return null;
    }
  }, [neighborhood?.censusTracts]);

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
        unit: "parcels",
        trend: null,
        category: "community",
        source: { name: "MPROP REST (spatial)", lastUpdated: now },
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
        source: { name: "MPROP REST (spatial)", lastUpdated: now },
      });
    }

    if (neighborhood.avgAssessedValue != null) {
      result.push({
        id: "avg_assessed_value",
        label: "Avg Assessed Value",
        value: Math.round(neighborhood.avgAssessedValue),
        unit: "per parcel",
        trend: null,
        category: "community",
        source: { name: "MPROP REST (spatial)", lastUpdated: now },
      });
    }

    if (neighborhood.population != null) {
      result.push({
        id: "population",
        label: "Population",
        value: neighborhood.population,
        unit: "residents",
        trend: null,
        category: "community",
        source: { name: "Census ACS 5-Year", lastUpdated: now },
      });
    }

    if (neighborhood.medianIncome != null) {
      result.push({
        id: "median_income",
        label: "Median Household Income",
        value: neighborhood.medianIncome,
        unit: "per year",
        trend: null,
        category: "community",
        source: { name: "Census ACS 5-Year", lastUpdated: now },
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
        source: { name: "MPD Monthly (spatial)", lastUpdated: now },
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
        unit: "buildings",
        trend: null,
        category: "qualityOfLife",
        source: { name: "Strong Neighborhoods (spatial)", lastUpdated: now },
      });
    }

    if (neighborhood.vacantLandCount != null && neighborhood.vacantLandCount > 0) {
      result.push({
        id: "vacant_land",
        label: "Vacant Land Parcels",
        value: neighborhood.vacantLandCount,
        unit: "parcels",
        trend: null,
        category: "qualityOfLife",
        source: { name: "MPROP REST (spatial)", lastUpdated: now },
      });
    }

    if (neighborhood.foreclosureCityCount != null) {
      result.push({
        id: "foreclosures_city",
        label: "Foreclosures (City-Owned)",
        value: neighborhood.foreclosureCityCount,
        unit: "parcels",
        trend: null,
        category: "qualityOfLife",
        source: { name: "Foreclosed Properties (spatial)", lastUpdated: now },
      });
    }

    if (neighborhood.foreclosureBankCount != null) {
      result.push({
        id: "foreclosures_bank",
        label: "Foreclosures (Bank-Owned)",
        value: neighborhood.foreclosureBankCount,
        unit: "parcels",
        trend: null,
        category: "qualityOfLife",
        source: { name: "Foreclosed Properties (spatial)", lastUpdated: now },
      });
    }

    // --- Wellness ---
    if (neighborhood.sviScore != null) {
      result.push({
        id: "svi_score",
        label: "Social Vulnerability Index",
        value: neighborhood.sviScore,
        unit: "score (0-1)",
        trend: null,
        category: "wellness",
        source: { name: "CDC SVI", lastUpdated: now },
      });
    }

    if (neighborhood.povertyRate != null) {
      result.push({
        id: "poverty_rate",
        label: "Poverty Rate",
        value: neighborhood.povertyRate,
        unit: "%",
        trend: null,
        category: "wellness",
        source: { name: "Census ACS 5-Year", lastUpdated: now },
      });
    }

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
    crimeByType,
    housingAge,
    censusTracts,
  };
}
