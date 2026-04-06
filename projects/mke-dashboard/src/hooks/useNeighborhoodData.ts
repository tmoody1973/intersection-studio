"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MetricCardProps, MetricTrend } from "@/types/metrics";
import { computeTrendDirection, type TrendPolarity } from "@/lib/metric-config";

// Metric ID → translation key mapping
const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  total_properties: { label: "totalProperties", unit: "parcels" },
  owner_occupied_rate: { label: "ownerOccupiedRate", unit: "percent" },
  avg_assessed_value: { label: "avgAssessedValue", unit: "dollars" },
  population: { label: "population", unit: "residents" },
  median_income: { label: "medianIncome", unit: "dollars" },
  libraries: { label: "libraries", unit: "locations" },
  schools: { label: "schools", unit: "schools" },
  parks: { label: "parks", unit: "parks" },
  daycares: { label: "daycares", unit: "centers" },
  crime_total: { label: "totalCrimes", unit: "incidents" },
  crime_violent: { label: "violentCrimes", unit: "incidents" },
  crime_property: { label: "propertyCrimes", unit: "incidents" },
  overdose_calls: { label: "overdoseCalls", unit: "calls" },
  traffic_crashes: { label: "trafficCrashes", unit: "incidents" },
  fire_incidents: { label: "fireIncidents", unit: "incidents" },
  police_stations: { label: "policeStations", unit: "stations" },
  firehouses: { label: "firehouses", unit: "stations" },
  vacant_buildings: { label: "vacantBuildings", unit: "buildings" },
  vacant_land: { label: "vacantLand", unit: "parcels" },
  foreclosures_city: { label: "foreclosuresCity", unit: "parcels" },
  foreclosures_bank: { label: "foreclosuresBank", unit: "parcels" },
  service_requests_311: { label: "serviceRequests311", unit: "requests" },
  building_permits: { label: "buildingPermits", unit: "permits" },
  property_sales: { label: "propertySales", unit: "sales" },
  median_sale_price: { label: "medianSalePrice", unit: "dollars" },
  liquor_licenses: { label: "liquorLicenses", unit: "licenses" },
  total_permit_investment: { label: "totalPermitInvestment", unit: "dollars" },
  new_construction: { label: "newConstruction", unit: "permits" },
  poverty_rate: { label: "povertyRate", unit: "percent" },
  unemployment: { label: "unemployment", unit: "percent" },
  median_home_value: { label: "medianHomeValue", unit: "dollars" },
  food_inspection: { label: "foodInspectionPassRate", unit: "percent" },
};

/** Polarity for each metric id — determines if up is good or bad */
const METRIC_POLARITY: Record<string, TrendPolarity> = {
  total_properties: "higher_is_better",
  owner_occupied_rate: "higher_is_better",
  avg_assessed_value: "higher_is_better",
  population: "higher_is_better",
  median_income: "higher_is_better",
  libraries: "higher_is_better",
  schools: "higher_is_better",
  parks: "higher_is_better",
  daycares: "higher_is_better",
  crime_total: "lower_is_better",
  crime_violent: "lower_is_better",
  crime_property: "lower_is_better",
  overdose_calls: "lower_is_better",
  traffic_crashes: "lower_is_better",
  fire_incidents: "lower_is_better",
  vacant_buildings: "lower_is_better",
  vacant_land: "lower_is_better",
  foreclosures_city: "lower_is_better",
  foreclosures_bank: "lower_is_better",
  service_requests_311: "lower_is_better",
  building_permits: "higher_is_better",
  property_sales: "higher_is_better",
  median_sale_price: "higher_is_better",
  total_permit_investment: "higher_is_better",
  new_construction: "higher_is_better",
  poverty_rate: "lower_is_better",
  unemployment: "lower_is_better",
  median_home_value: "higher_is_better",
  food_inspection: "higher_is_better",
  liquor_licenses: "higher_is_better",
  police_stations: "higher_is_better",
  firehouses: "higher_is_better",
};

/** Maps metric id → previousPeriod JSON field name */
const METRIC_TO_PREV_FIELD: Record<string, string> = {
  total_properties: "totalProperties",
  owner_occupied_rate: "ownerOccupiedRate",
  avg_assessed_value: "avgAssessedValue",
  population: "population",
  median_income: "medianIncome",
  crime_total: "crimeTotal",
  crime_violent: "crimeViolent",
  service_requests_311: "serviceRequests311",
  foreclosures_city: "foreclosureCityCount",
  foreclosures_bank: "foreclosureBankCount",
  vacant_buildings: "vacantBuildingCount",
  poverty_rate: "povertyRate",
  unemployment: "unemploymentRate",
  total_permit_investment: "totalPermitInvestment",
  property_sales: "propertySalesCount",
  median_sale_price: "medianSalePrice",
  libraries: "libraryCount",
  schools: "schoolCount",
  parks: "parkCount",
};

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

  const housingAge = useMemo(() => {
    if (!neighborhood?.housingAge) return null;
    try { return JSON.parse(neighborhood.housingAge) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.housingAge]);

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

  const previousPeriod = useMemo((): Record<string, number> | null => {
    if (!neighborhood?.previousPeriod) return null;
    try { return JSON.parse(neighborhood.previousPeriod) as Record<string, number>; } catch { return null; }
  }, [neighborhood?.previousPeriod]);

  const metrics = useMemo((): MetricCardProps[] => {
    if (!neighborhood) return [];

    const now = neighborhood.lastSyncAt
      ? new Date(neighborhood.lastSyncAt).toISOString()
      : new Date().toISOString();

    const computeTrend = (id: string, currentValue: number | null): MetricTrend | null => {
      if (currentValue == null || !previousPeriod) return null;
      const prevField = METRIC_TO_PREV_FIELD[id];
      if (!prevField) return null;
      const prev = previousPeriod[prevField];
      if (prev == null || prev === 0) return null;
      const rawChange = ((currentValue - prev) / prev) * 100;
      const polarity = METRIC_POLARITY[id];
      if (!polarity) return null;
      return {
        direction: computeTrendDirection(polarity, rawChange),
        percentage: Math.round(Math.abs(rawChange)),
        comparedTo: "vs. last sync",
      };
    };

    const m: MetricCardProps[] = [];
    const add = (id: string, fallbackLabel: string, value: number | null, fallbackUnit: string, category: MetricCardProps["category"], sourceName: string, extra?: Partial<MetricCardProps>) =>
      m.push({
        id,
        label: label(id, fallbackLabel),
        value,
        unit: unit(id, fallbackUnit),
        trend: computeTrend(id, value),
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
    // Use WIBR crimeTotal if available, fall back to ArcGIS part1CrimeCount
    // WIBR sometimes returns 0 during data refresh cycles — use ArcGIS in that case
    const crimeCount = (neighborhood.crimeTotal && neighborhood.crimeTotal > 0)
      ? neighborhood.crimeTotal
      : neighborhood.part1CrimeCount;
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

    // --- Development ---
    if (neighborhood.propertySalesCount != null && neighborhood.propertySalesCount > 0)
      add("property_sales", "Property Sales (2024)", neighborhood.propertySalesCount, "sales", "development", "Property Sales CKAN");

    if (neighborhood.medianSalePrice != null)
      add("median_sale_price", "Median Sale Price", neighborhood.medianSalePrice, "dollars", "development", "Property Sales CKAN");

    if (neighborhood.liquorLicenseCount != null && neighborhood.liquorLicenseCount > 0)
      add("liquor_licenses", "Liquor Licenses", neighborhood.liquorLicenseCount, "licenses", "development", "Liquor Licenses CKAN");

    if ((neighborhood as Record<string, unknown>).totalPermitInvestment != null)
      add("total_permit_investment", "Total Permit Investment", (neighborhood as Record<string, unknown>).totalPermitInvestment as number, "dollars", "development", "Building Permits CSV");

    if ((neighborhood as Record<string, unknown>).newConstructionCount != null && ((neighborhood as Record<string, unknown>).newConstructionCount as number) > 0)
      add("new_construction", "New Construction", (neighborhood as Record<string, unknown>).newConstructionCount as number, "permits", "development", "Building Permits CSV");

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
  }, [neighborhood, previousPeriod, label, unit]);

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
    housingAge,
    serviceRequestsByType,
    investmentByYear,
    permitsByYear,
    crimeTrend,
    serviceRequestsTrend,
    raw: neighborhood,
  };
}
