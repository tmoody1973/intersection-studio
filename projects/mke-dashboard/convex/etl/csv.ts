/**
 * Milwaukee Open Data ingestion via CKAN Datastore API.
 * Uses JSON API (not raw CSV) to avoid S3 redirect issues.
 * Coordinates are in Wisconsin State Plane (WKID 32054) — converted to WGS84.
 */

import type { Envelope } from "./arcgis";

// --- CKAN Datastore API ---

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";

interface CkanResponse {
  success: boolean;
  result: {
    records: Record<string, unknown>[];
    total: number;
  };
}

async function ckanFetch(
  resourceId: string,
  limit: number,
  offset = 0,
): Promise<CkanResponse> {
  const url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CKAN API failed: ${res.status}`);
  return res.json();
}

async function ckanFetchAll(
  resourceId: string,
  maxRecords = 10000,
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;

  while (offset < maxRecords) {
    const data = await ckanFetch(resourceId, pageSize, offset);
    if (!data.success || data.result.records.length === 0) break;
    allRecords.push(...data.result.records);
    if (allRecords.length >= data.result.total) break;
    offset += pageSize;
  }

  return allRecords;
}

// --- State Plane to WGS84 (Milwaukee area approximation) ---

function stPlaneToWgs84(x: number, y: number): { lat: number; lng: number } {
  const refX = 2530700;
  const refY = 393200;
  const refLng = -87.9065;
  const refLat = 43.0389;
  const ftPerDegLng = 263260;
  const ftPerDegLat = 364567;

  return {
    lng: refLng + (x - refX) / ftPerDegLng,
    lat: refLat + (y - refY) / ftPerDegLat,
  };
}

function isInEnvelope(lat: number, lng: number, env: Envelope): boolean {
  return lng >= env.xmin && lng <= env.xmax && lat >= env.ymin && lat <= env.ymax;
}

// --- CKAN Resource IDs ---

const RESOURCES = {
  /** WIBR Crime Data (Current) — daily, ~5K records */
  crime: "87843297-a6fa-46d4-ba5d-cb342fb2d3bb",
  /** Accela Vacant Buildings — weekly */
  vacantBuildings: "46dca88b-fec0-48f1-bda6-7296249ea61f",
  /** EMS Calls for Service Detail */
  emsCalls: "06fd2a64-4348-461a-bda4-5e09b2500615",
  /** Traffic Crashes */
  trafficCrashes: "8fffaa3a-b500-4561-8898-78a424bdacee",
} as const;

// --- Crime Data (WIBR) ---

export interface CrimeAggregation {
  total: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
  violent: number;
  property: number;
}

const CRIME_COLUMNS = [
  "Arson", "AssaultOffense", "Burglary", "CriminalDamage",
  "Homicide", "LockedVehicle", "Robbery", "SexOffense", "Theft", "VehicleTheft",
] as const;

const VIOLENT_CRIMES = new Set(["Homicide", "AssaultOffense", "Robbery", "SexOffense"]);

export async function fetchCrimeData(envelope: Envelope): Promise<CrimeAggregation> {
  const records = await ckanFetchAll(RESOURCES.crime, 10000);

  const result: CrimeAggregation = {
    total: 0, byType: {}, byMonth: {}, violent: 0, property: 0,
  };

  for (const row of records) {
    const x = Number(row["RoughX"] ?? 0);
    const y = Number(row["RoughY"] ?? 0);
    if (x === 0 || y === 0) continue;

    const { lat, lng } = stPlaneToWgs84(x, y);
    if (!isInEnvelope(lat, lng, envelope)) continue;

    for (const col of CRIME_COLUMNS) {
      const val = String(row[col] ?? "");
      if (val === "1" || val === "true" || val === "True") {
        result.total++;
        result.byType[col] = (result.byType[col] ?? 0) + 1;
        if (VIOLENT_CRIMES.has(col)) result.violent++;
        else result.property++;
      }
    }

    const dateStr = String(row["ReportedDateTime"] ?? "");
    const month = dateStr.substring(0, 7);
    if (month.length === 7) {
      result.byMonth[month] = (result.byMonth[month] ?? 0) + 1;
    }
  }

  return result;
}

// --- Vacant Buildings (Accela) ---

export interface VacantBuildingAggregation {
  total: number;
}

export async function fetchVacantBuildingData(
  envelope: Envelope,
): Promise<VacantBuildingAggregation> {
  const records = await ckanFetchAll(RESOURCES.vacantBuildings, 5000);

  let total = 0;
  for (const row of records) {
    // Try various coordinate field names
    let lat = Number(row["Latitude"] ?? row["latitude"] ?? row["Y"] ?? 0);
    let lng = Number(row["Longitude"] ?? row["longitude"] ?? row["X"] ?? 0);

    // If coordinates look like State Plane, convert
    if (lat > 100000 || lng > 100000) {
      const x = lng > lat ? lng : Number(row["X"] ?? row["RoughX"] ?? 0);
      const y = lng > lat ? lat : Number(row["Y"] ?? row["RoughY"] ?? 0);
      ({ lat, lng } = stPlaneToWgs84(x, y));
    }

    if (lat === 0 || lng === 0) continue;
    if (isInEnvelope(lat, lng, envelope)) total++;
  }

  return { total };
}

// --- EMS / Overdose ---

export async function fetchOverdoseCount(envelope: Envelope): Promise<number> {
  const records = await ckanFetchAll(RESOURCES.emsCalls, 10000);

  const overdoseKeywords = ["overdose", "narcan", "naloxone", "opioid"];
  let count = 0;

  for (const row of records) {
    let lat = Number(row["Latitude"] ?? row["latitude"] ?? 0);
    let lng = Number(row["Longitude"] ?? row["longitude"] ?? 0);

    if (lat > 100000 || lng > 100000) {
      const x = Number(row["X"] ?? row["RoughX"] ?? 0);
      const y = Number(row["Y"] ?? row["RoughY"] ?? 0);
      if (x > 0 && y > 0) ({ lat, lng } = stPlaneToWgs84(x, y));
    }

    if (lat === 0 || lng === 0) continue;
    if (!isInEnvelope(lat, lng, envelope)) continue;

    const nature = String(
      row["Nature"] ?? row["NatureOfCall"] ?? row["CallType"] ?? "",
    ).toLowerCase();
    if (overdoseKeywords.some((kw) => nature.includes(kw))) count++;
  }

  return count;
}

// --- Traffic Crashes ---

export async function fetchTrafficCrashCount(envelope: Envelope): Promise<number> {
  const records = await ckanFetchAll(RESOURCES.trafficCrashes, 10000);

  let count = 0;
  for (const row of records) {
    let lat = Number(row["LATITUDE"] ?? row["Latitude"] ?? row["latitude"] ?? 0);
    let lng = Number(row["LONGITUDE"] ?? row["Longitude"] ?? row["longitude"] ?? 0);

    if (lat > 100000 || lng > 100000) {
      const x = Number(row["X"] ?? row["RoughX"] ?? 0);
      const y = Number(row["Y"] ?? row["RoughY"] ?? 0);
      if (x > 0 && y > 0) ({ lat, lng } = stPlaneToWgs84(x, y));
    }

    if (lat === 0 || lng === 0) continue;
    if (isInEnvelope(lat, lng, envelope)) count++;
  }

  return count;
}

// --- 311 Service Requests (ZIP-based filtering) ---

export interface ServiceRequestAggregation {
  total: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
}

/**
 * Fetch 311 service requests filtered by ZIP codes.
 * 311 data has no lat/lng but has addresses with ZIP codes.
 * We get the ZIPs for a neighborhood from MPROP spatial query.
 */
export async function fetch311Data(
  _envelope: Envelope,
  zipCodes?: string[],
): Promise<ServiceRequestAggregation> {
  if (!zipCodes || zipCodes.length === 0) {
    return { total: 0, byType: {}, byMonth: {} };
  }

  const records = await ckanFetchAll(
    "bf2b508a-5bfa-49da-8846-d87ffeee020a", // 311 current
    5000,
  );

  const zipSet = new Set(zipCodes);
  const result: ServiceRequestAggregation = { total: 0, byType: {}, byMonth: {} };

  for (const row of records) {
    const addr = String(row["OBJECTDESC"] ?? "");
    // Extract ZIP from address: "5155 N 72ND ST, MILWAUKEE, WI, 53218-3945"
    const parts = addr.split(",");
    if (parts.length < 4) continue;
    const zip5 = parts[parts.length - 1].trim().substring(0, 5);
    if (!zipSet.has(zip5)) continue;

    result.total++;

    const title = String(row["TITLE"] ?? "Other");
    result.byType[title] = (result.byType[title] ?? 0) + 1;

    const dateStr = String(row["CREATIONDATE"] ?? "");
    const month = dateStr.substring(0, 7);
    if (month.length === 7) {
      result.byMonth[month] = (result.byMonth[month] ?? 0) + 1;
    }
  }

  return result;
}

export interface PermitAggregation {
  total: number;
  byType: Record<string, number>;
}

export async function fetchPermitData(
  _envelope: Envelope,
): Promise<PermitAggregation> {
  return { total: 0, byType: {} };
}
