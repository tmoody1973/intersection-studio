"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MetricCardProps } from "@/types/metrics";

// Metric ID → translation key mapping
const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  total_properties: { label: "totalProperties", unit: "parcels" },
  owner_occupied_rate: { label: "ownerOccupiedRate", unit: "percent" },
  avg_assessed_value: { label: "avgAssessedValue", unit: "dollars" },
  population: { label: "population", unit: "parcels" },
  median_income: { label: "medianIncome", unit: "dollars" },
  libraries: { label: "libraries", unit: "parcels" },
  schools: { label: "schools", unit: "schools" },
  parks: { label: "parks", unit: "parcels" },
  daycares: { label: "daycares", unit: "parcels" },
  crime_total: { label: "totalCrimes", unit: "incidents" },
  crime_violent: { label: "violentCrimes", unit: "incidents" },
  crime_property: { label: "propertyCrimes", unit: "incidents" },
  overdose_calls: { label: "overdoseCalls", unit: "calls" },
  traffic_crashes: { label: "trafficCrashes", unit: "incidents" },
  fire_incidents: { label: "fireIncidents", unit: "incidents" },
  police_stations: { label: "policeStations", unit: "parcels" },
  firehouses: { label: "firehouses", unit: "parcels" },
  vacant_buildings: { label: "vacantBuildings", unit: "buildings" },
  vacant_land: { label: "vacantLand", unit: "parcels" },
  foreclosures_city: { label: "foreclosuresCity", unit: "parcels" },
  foreclosures_bank: { label: "foreclosuresBank", unit: "parcels" },
  service_requests_311: { label: "serviceRequests311", unit: "parcels" },
  building_permits: { label: "buildingPermits", unit: "parcels" },
  poverty_rate: { label: "povertyRate", unit: "percent" },
  unemployment: { label: "unemployment", unit: "percent" },
  median_home_value: { label: "medianHomeValue", unit: "dollars" },
  food_inspection: { label: "foodInspectionPassRate", unit: "percent" },
};

export function useNeighborhoodData(slug: string) {
  const neighborhood = useQuery(api.neighborhoods.getBySlug, { slug });
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

  const housingAge = useMemo(() => {
    if (!neighborhood?.housingAge) return null;
    try { return JSON.parse(neighborhood.housingAge) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.housingAge]);

  const serviceRequestsByType = useMemo(() => {
    if (!neighborhood?.serviceRequestsByType) return null;
    try { return JSON.parse(neighborhood.serviceRequestsByType) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.serviceRequestsByType]);

  // Helper to get translated label, falling back to English
  const label = (id: string, fallback: string): string => {
    const key = METRIC_LABELS[id]?.label;
    if (!key) return fallback;
    try { return tm(key); } catch { return fallback; }
  };

  const unit = (id: string, fallback: string): string => {
    const key = METRIC_LABELS[id]?.unit;
    if (!key) return fallback;
    try { return tu(key); } catch { return fallback; }
  };

  const metrics = useMemo((): MetricCardProps[] => {
    if (!neighborhood) return [];

    const now = neighborhood.lastSyncAt
      ? new Date(neighborhood.lastSyncAt).toISOString()
      : new Date().toISOString();

    const m: MetricCardProps[] = [];
    const add = (id: string, fallbackLabel: string, value: number | null, fallbackUnit: string, category: MetricCardProps["category"], sourceName: string, extra?: Partial<MetricCardProps>) =>
      m.push({
        id,
        label: label(id, fallbackLabel),
        value,
        unit: unit(id, fallbackUnit),
        trend: null,
        category,
        source: { name: sourceName, lastUpdated: now },
        ...extra,
      });

    // --- Community ---
    if (neighborhood.totalProperties != null)
      add("total_properties", "Total Properties", neighborhood.totalProperties, "parcels", "community", "MPROP (spatial)");

    if (neighborhood.ownerOccupiedRate != null)
      add("owner_occupied_rate", "Owner-Occupied Rate", neighborhood.ownerOccupiedRate, "%", "community", "MPROP (spatial)");

    if (neighborhood.avgAssessedValue != null)
      add("avg_assessed_value", "Avg Assessed Value", Math.round(neighborhood.avgAssessedValue), "per parcel", "community", "MPROP (spatial)");

    if (neighborhood.population != null)
      add("population", "Population", neighborhood.population, "residents", "community", "Census ACS");

    if (neighborhood.medianIncome != null)
      add("median_income", "Median Household Income", neighborhood.medianIncome, "per year", "community", "Census ACS");

    if (neighborhood.libraryCount)
      add("libraries", "Libraries", neighborhood.libraryCount, "locations", "community", "MPL ArcGIS");

    if (neighborhood.schoolCount)
      add("schools", "Schools", neighborhood.schoolCount, "schools", "community", "MPROP Layer 18");

    if (neighborhood.parkCount)
      add("parks", "Parks", neighborhood.parkCount, "parks", "community", "MPROP Layer 16");

    if (neighborhood.daycareCount)
      add("daycares", "Daycare Centers", neighborhood.daycareCount, "centers", "community", "MPROP Layer 19");

    // --- Public Safety ---
    const crimeCount = neighborhood.crimeTotal ?? neighborhood.part1CrimeCount;
    if (crimeCount != null)
      add("crime_total", "Total Crimes", crimeCount, "incidents", "publicSafety", "WIBR Crime CSV (daily)");

    if (neighborhood.crimeViolent != null)
      add("crime_violent", "Violent Crimes", neighborhood.crimeViolent, "incidents", "publicSafety", "WIBR Crime CSV");

    if (neighborhood.crimeProperty != null)
      add("crime_property", "Property Crimes", neighborhood.crimeProperty, "incidents", "publicSafety", "WIBR Crime CSV");

    if (neighborhood.overdoseCount != null && neighborhood.overdoseCount > 0)
      add("overdose_calls", "Overdose Calls", neighborhood.overdoseCount, "calls", "publicSafety", "EMS Calls CSV");

    if (neighborhood.trafficCrashCount != null && neighborhood.trafficCrashCount > 0)
      add("traffic_crashes", "Traffic Crashes", neighborhood.trafficCrashCount, "crashes", "publicSafety", "Traffic Crash CSV");

    if (neighborhood.fireIncidentCount != null)
      add("fire_incidents", "Fire Incidents", neighborhood.fireIncidentCount, "incidents", "publicSafety", "MFD Dispatch");

    if (neighborhood.policeStationCount)
      add("police_stations", "Police Stations", neighborhood.policeStationCount, "stations", "publicSafety", "MPD ArcGIS");

    if (neighborhood.firehouseCount)
      add("firehouses", "Firehouses", neighborhood.firehouseCount, "stations", "publicSafety", "MFD ArcGIS");

    // --- Quality of Life ---
    if (neighborhood.vacantBuildingCount != null)
      add("vacant_buildings", "Vacant Buildings", neighborhood.vacantBuildingCount, "buildings", "qualityOfLife", "Accela Vacant Buildings");

    if (neighborhood.vacantLandCount != null && neighborhood.vacantLandCount > 0)
      add("vacant_land", "Vacant Land", neighborhood.vacantLandCount, "parcels", "qualityOfLife", "MPROP (spatial)");

    if (neighborhood.foreclosureCityCount != null)
      add("foreclosures_city", "Foreclosures (City)", neighborhood.foreclosureCityCount, "parcels", "qualityOfLife", "Foreclosed Properties");

    if (neighborhood.foreclosureBankCount != null)
      add("foreclosures_bank", "Foreclosures (Bank)", neighborhood.foreclosureBankCount, "parcels", "qualityOfLife", "Foreclosed Properties");

    if (neighborhood.serviceRequests311 != null)
      add("service_requests_311", "311 Service Requests", neighborhood.serviceRequests311, "requests", "qualityOfLife", "311 Call Center CSV");

    if (neighborhood.buildingPermitCount != null && neighborhood.buildingPermitCount > 0)
      add("building_permits", "Building Permits", neighborhood.buildingPermitCount, "permits", "qualityOfLife", "Building Permits CSV");

    // --- Wellness ---
    if (neighborhood.povertyRate != null)
      add("poverty_rate", "Poverty Rate", neighborhood.povertyRate, "%", "wellness", "Census ACS");

    if (neighborhood.unemploymentRate != null)
      add("unemployment", "Unemployment Rate", neighborhood.unemploymentRate, "%", "wellness", "Census ACS");

    if (neighborhood.medianHomeValue != null)
      add("median_home_value", "Median Home Value", neighborhood.medianHomeValue, "dollars", "wellness", "Census ACS");

    if (neighborhood.foodInspectionPassRate != null)
      add("food_inspection", "Food Inspection Pass Rate", neighborhood.foodInspectionPassRate, "%", "wellness", "Open Data Portal", {
        progress: { value: neighborhood.foodInspectionPassRate, label: "passing" },
      });

    return m;
  }, [neighborhood, label, unit]);

  return {
    metrics,
    isLoading,
    neighborhoodName: neighborhood?.name ?? slug,
    crimeByType,
    crimeByMonth,
    housingAge,
    serviceRequestsByType,
    raw: neighborhood,
  };
}
