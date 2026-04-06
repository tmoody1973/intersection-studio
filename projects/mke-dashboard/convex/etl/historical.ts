/**
 * Historical data ingestion for year-over-year trends.
 * Fetches WIBR Crime Historical (883K records) and 311 Historical (175K records)
 * from CKAN, filtered by year to avoid memory issues.
 */

import type { Envelope } from "./arcgis";
import { stPlaneToWgs84, isInEnvelope } from "./coordinates";

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";

interface CkanResponse {
  success: boolean;
  result: {
    records: Record<string, unknown>[];
    total: number;
  };
}

const HISTORICAL_RESOURCES = {
  crimeHistorical: "395db729-a30a-4e53-ab66-faeb5e1899c8",
  service311Historical: "abdfe983-e856-40cd-bee2-85e78454344a",
} as const;

// --- Paginated CKAN fetch with year filter ---

async function ckanFetchFiltered(
  resourceId: string,
  filters: Record<string, string>,
  maxRecords = 200000,
): Promise<Record<string, unknown>[]> {
  const pageSize = 5000;
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;

  const filterStr = JSON.stringify(filters);

  while (offset < maxRecords) {
    const url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${pageSize}&offset=${offset}&filters=${encodeURIComponent(filterStr)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CKAN API failed: ${res.status}`);
    const data: CkanResponse = await res.json();
    if (!data.success || data.result.records.length === 0) break;
    allRecords.push(...data.result.records);
    if (allRecords.length >= data.result.total) break;
    offset += pageSize;
  }

  return allRecords;
}

// --- Historical Crime Count for a Year + Envelope ---

export async function fetchHistoricalCrimeCount(
  year: number,
  envelope: Envelope,
): Promise<number> {
  const records = await ckanFetchFiltered(
    HISTORICAL_RESOURCES.crimeHistorical,
    { ReportedYear: String(year) },
  );

  let count = 0;
  for (const row of records) {
    const x = Number(row["RoughX"] ?? 0);
    const y = Number(row["RoughY"] ?? 0);
    if (x === 0 || y === 0) continue;

    const { lat, lng } = stPlaneToWgs84(x, y);
    if (isInEnvelope(lat, lng, envelope)) count++;
  }

  return count;
}

// --- Historical 311 Count for a Year + ZIP codes ---

export async function fetchHistorical311Count(
  year: number,
  zipCodes: string[],
): Promise<number> {
  if (zipCodes.length === 0) return 0;

  // 311 historical doesn't have a clean year filter field,
  // so we fetch and filter client-side by date
  const records = await ckanFetchFiltered(
    HISTORICAL_RESOURCES.service311Historical,
    {},
    200000,
  );

  const zipSet = new Set(zipCodes);
  let count = 0;

  for (const row of records) {
    // Check year from date field
    const dateStr = String(row["CREATIONDATE"] ?? row["CreatedDate"] ?? "");
    if (!dateStr.startsWith(String(year))) continue;

    // Check ZIP from address
    const addr = String(row["OBJECTDESC"] ?? row["Address"] ?? "");
    const parts = addr.split(",");
    if (parts.length < 4) continue;
    const zip5 = parts[parts.length - 1].trim().substring(0, 5);
    if (zipSet.has(zip5)) count++;
  }

  return count;
}
