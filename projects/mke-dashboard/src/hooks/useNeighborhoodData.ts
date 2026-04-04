"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MetricCardProps } from "@/types/metrics";

/**
 * Hook to get per-neighborhood metrics from Convex.
 * Data comes from: ArcGIS spatial queries + CSV point-in-envelope + Census ACS.
 */
export function useNeighborhoodData(slug: string) {
  const neighborhood = useQuery(api.neighborhoods.getBySlug, { slug });
  const isLoading = neighborhood === undefined;

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

  const metrics = useMemo((): MetricCardProps[] => {
    if (!neighborhood) return [];

    const now = neighborhood.lastSyncAt
      ? new Date(neighborhood.lastSyncAt).toISOString()
      : new Date().toISOString();

    const m: MetricCardProps[] = [];
    const add = (props: Omit<MetricCardProps, "trend"> & { trend?: MetricCardProps["trend"] }) =>
      m.push({ trend: null, ...props });

    // --- Community ---
    if (neighborhood.totalProperties != null)
      add({ id: "total_properties", label: "Total Properties", value: neighborhood.totalProperties, unit: "parcels", category: "community", source: { name: "MPROP (spatial)", lastUpdated: now } });

    if (neighborhood.ownerOccupiedRate != null)
      add({ id: "owner_occupied_rate", label: "Owner-Occupied Rate", value: neighborhood.ownerOccupiedRate, unit: "%", category: "community", source: { name: "MPROP (spatial)", lastUpdated: now } });

    if (neighborhood.avgAssessedValue != null)
      add({ id: "avg_assessed_value", label: "Avg Assessed Value", value: Math.round(neighborhood.avgAssessedValue), unit: "per parcel", category: "community", source: { name: "MPROP (spatial)", lastUpdated: now } });

    if (neighborhood.population != null)
      add({ id: "population", label: "Population", value: neighborhood.population, unit: "residents", category: "community", source: { name: "Census ACS", lastUpdated: now } });

    if (neighborhood.medianIncome != null)
      add({ id: "median_income", label: "Median Household Income", value: neighborhood.medianIncome, unit: "per year", category: "community", source: { name: "Census ACS", lastUpdated: now } });

    // Community resources
    if (neighborhood.libraryCount)
      add({ id: "libraries", label: "Libraries", value: neighborhood.libraryCount, unit: "locations", category: "community", source: { name: "MPL ArcGIS", lastUpdated: now } });

    if (neighborhood.schoolCount)
      add({ id: "schools", label: "Schools", value: neighborhood.schoolCount, unit: "schools", category: "community", source: { name: "MPROP Layer 18", lastUpdated: now } });

    if (neighborhood.parkCount)
      add({ id: "parks", label: "Parks", value: neighborhood.parkCount, unit: "parks", category: "community", source: { name: "MPROP Layer 16", lastUpdated: now } });

    if (neighborhood.daycareCount)
      add({ id: "daycares", label: "Daycare Centers", value: neighborhood.daycareCount, unit: "centers", category: "community", source: { name: "MPROP Layer 19", lastUpdated: now } });

    // --- Public Safety ---
    const crimeCount = neighborhood.crimeTotal ?? neighborhood.part1CrimeCount;
    if (crimeCount != null)
      add({ id: "crime_total", label: "Total Crimes", value: crimeCount, unit: "incidents", category: "publicSafety", source: { name: "WIBR Crime CSV (daily)", lastUpdated: now } });

    if (neighborhood.crimeViolent != null)
      add({ id: "crime_violent", label: "Violent Crimes", value: neighborhood.crimeViolent, unit: "incidents", category: "publicSafety", source: { name: "WIBR Crime CSV", lastUpdated: now } });

    if (neighborhood.crimeProperty != null)
      add({ id: "crime_property", label: "Property Crimes", value: neighborhood.crimeProperty, unit: "incidents", category: "publicSafety", source: { name: "WIBR Crime CSV", lastUpdated: now } });

    if (neighborhood.overdoseCount != null && neighborhood.overdoseCount > 0)
      add({ id: "overdose_calls", label: "Overdose Calls", value: neighborhood.overdoseCount, unit: "calls", category: "publicSafety", source: { name: "EMS Calls CSV", lastUpdated: now } });

    if (neighborhood.trafficCrashCount != null && neighborhood.trafficCrashCount > 0)
      add({ id: "traffic_crashes", label: "Traffic Crashes", value: neighborhood.trafficCrashCount, unit: "crashes", category: "publicSafety", source: { name: "Traffic Crash CSV", lastUpdated: now } });

    if (neighborhood.fireIncidentCount != null)
      add({ id: "fire_incidents", label: "Fire Incidents", value: neighborhood.fireIncidentCount, unit: "incidents", category: "publicSafety", source: { name: "MFD Dispatch", lastUpdated: now } });

    if (neighborhood.policeStationCount)
      add({ id: "police_stations", label: "Police Stations", value: neighborhood.policeStationCount, unit: "stations", category: "publicSafety", source: { name: "MPD ArcGIS", lastUpdated: now } });

    if (neighborhood.firehouseCount)
      add({ id: "firehouses", label: "Firehouses", value: neighborhood.firehouseCount, unit: "stations", category: "publicSafety", source: { name: "MFD ArcGIS", lastUpdated: now } });

    // --- Quality of Life ---
    if (neighborhood.vacantBuildingCount != null)
      add({ id: "vacant_buildings", label: "Vacant Buildings", value: neighborhood.vacantBuildingCount, unit: "buildings", category: "qualityOfLife", source: { name: "Accela Vacant Buildings (weekly)", lastUpdated: now } });

    if (neighborhood.vacantLandCount != null && neighborhood.vacantLandCount > 0)
      add({ id: "vacant_land", label: "Vacant Land", value: neighborhood.vacantLandCount, unit: "parcels", category: "qualityOfLife", source: { name: "MPROP (spatial)", lastUpdated: now } });

    if (neighborhood.foreclosureCityCount != null)
      add({ id: "foreclosures_city", label: "Foreclosures (City)", value: neighborhood.foreclosureCityCount, unit: "parcels", category: "qualityOfLife", source: { name: "Foreclosed Properties (spatial)", lastUpdated: now } });

    if (neighborhood.foreclosureBankCount != null)
      add({ id: "foreclosures_bank", label: "Foreclosures (Bank)", value: neighborhood.foreclosureBankCount, unit: "parcels", category: "qualityOfLife", source: { name: "Foreclosed Properties (spatial)", lastUpdated: now } });

    if (neighborhood.serviceRequests311 != null)
      add({ id: "service_requests_311", label: "311 Service Requests", value: neighborhood.serviceRequests311, unit: "requests", category: "qualityOfLife", source: { name: "311 Call Center CSV (daily)", lastUpdated: now } });

    if (neighborhood.buildingPermitCount != null && neighborhood.buildingPermitCount > 0)
      add({ id: "building_permits", label: "Building Permits", value: neighborhood.buildingPermitCount, unit: "permits", category: "qualityOfLife", source: { name: "Building Permits CSV (daily)", lastUpdated: now } });

    // --- Wellness ---
    if (neighborhood.povertyRate != null)
      add({ id: "poverty_rate", label: "Poverty Rate", value: neighborhood.povertyRate, unit: "%", category: "wellness", source: { name: "Census ACS", lastUpdated: now } });

    if (neighborhood.unemploymentRate != null)
      add({ id: "unemployment", label: "Unemployment Rate", value: neighborhood.unemploymentRate, unit: "%", category: "wellness", source: { name: "Census ACS", lastUpdated: now } });

    if (neighborhood.medianHomeValue != null)
      add({ id: "median_home_value", label: "Median Home Value", value: neighborhood.medianHomeValue, unit: "dollars", category: "wellness", source: { name: "Census ACS", lastUpdated: now } });

    if (neighborhood.sviScore != null)
      add({ id: "svi_score", label: "Social Vulnerability Index", value: neighborhood.sviScore, unit: "score (0-1)", category: "wellness", source: { name: "CDC SVI", lastUpdated: now } });

    if (neighborhood.foodInspectionPassRate != null)
      add({ id: "food_inspection", label: "Food Inspection Pass Rate", value: neighborhood.foodInspectionPassRate, unit: "%", category: "wellness", source: { name: "Open Data Portal", lastUpdated: now }, progress: { value: neighborhood.foodInspectionPassRate, label: "passing" } });

    return m;
  }, [neighborhood]);

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
