/**
 * Economic data from CKAN Datastore API.
 * Property sales, building permits, liquor licenses.
 * Joined to neighborhoods via taxkey → MPROP spatial match.
 */

import type { Envelope } from "./arcgis";

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";

async function ckanFetchAll(
  resourceId: string,
  maxRecords = 10000,
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  let offset = 0;

  while (offset < maxRecords) {
    const url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CKAN fetch failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || data.result.records.length === 0) break;
    all.push(...data.result.records);
    if (all.length >= data.result.total) break;
    offset += pageSize;
  }

  return all;
}

// --- Property Sales ---

export interface PropertySalesAggregation {
  totalSales: number;
  medianSalePrice: number | null;
  totalVolume: number;
  byType: Record<string, number>;
}

/**
 * Fetch property sales data and aggregate for a neighborhood.
 * Uses taxkey to match parcels within the neighborhood.
 * Property sales have a `taxkey` field that matches MPROP.
 */
export async function fetchPropertySales(
  neighborhoodTaxkeys: Set<string>,
): Promise<PropertySalesAggregation> {
  // 2024 property sales
  const records = await ckanFetchAll(
    "01651dab-2be7-40c6-a9d6-31254fe02e29",
    10000,
  );

  const prices: number[] = [];
  const byType: Record<string, number> = {};
  let totalVolume = 0;

  for (const r of records) {
    const taxkey = String(r["taxkey"] ?? "");
    if (!taxkey || !neighborhoodTaxkeys.has(taxkey)) continue;

    const price = Number(r["Sale_price"] ?? 0);
    if (price > 0) {
      prices.push(price);
      totalVolume += price;
    }

    const propType = String(r["PropType"] ?? "Other");
    byType[propType] = (byType[propType] ?? 0) + 1;
  }

  // Compute median
  prices.sort((a, b) => a - b);
  const medianSalePrice =
    prices.length > 0
      ? prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)]
      : null;

  return {
    totalSales: prices.length,
    medianSalePrice: medianSalePrice ? Math.round(medianSalePrice) : null,
    totalVolume: Math.round(totalVolume),
    byType,
  };
}

// --- Sale Price History (multi-year median by Sale_date) ---

function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute median sale price per year for a neighborhood.
 * Parses Sale_date (format "MM/DD/YYYY") from the property sales dataset.
 * Returns e.g. { "2020": 95000, "2021": 100000, ..., "2024": 138000 }
 */
export async function fetchSalesPriceHistory(
  neighborhoodTaxkeys: Set<string>,
): Promise<Record<string, number>> {
  const records = await ckanFetchAll(
    "01651dab-2be7-40c6-a9d6-31254fe02e29",
    10000,
  );

  const pricesByYear: Record<string, number[]> = {};

  for (const r of records) {
    const taxkey = String(r["taxkey"] ?? "");
    if (!taxkey || !neighborhoodTaxkeys.has(taxkey)) continue;

    const price = Number(r["Sale_price"] ?? 0);
    if (price <= 0) continue;

    const dateStr = String(r["Sale_date"] ?? "");
    // Format: "MM/DD/YYYY" or "YYYY-MM-DD"
    let year: string | null = null;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3 && parts[2].length === 4) year = parts[2];
    } else if (dateStr.length >= 4) {
      year = dateStr.substring(0, 4);
    }

    if (!year || isNaN(parseInt(year)) || parseInt(year) < 2000) continue;

    if (!pricesByYear[year]) pricesByYear[year] = [];
    pricesByYear[year].push(price);
  }

  const result: Record<string, number> = {};
  for (const [year, prices] of Object.entries(pricesByYear)) {
    prices.sort((a, b) => a - b);
    result[year] = Math.round(computeMedian(prices));
  }

  return result;
}

// --- Liquor Licenses ---

export interface LiquorLicenseAggregation {
  totalLicenses: number;
}

// --- Building Permits (Investment) ---

export interface PermitInvestmentAggregation {
  totalPermitInvestment: number;
  newConstructionCount: number;
  permitCount: number;
  investmentByYear: Record<string, number>;
  permitsByYear: Record<string, number>;
}

/**
 * Build address → taxkey lookup from the Master Address Index (MAI).
 * MAI has 334K records: HSE_NBR + DIR + STREET + STTYPE → TAXKEY.
 * We normalize addresses to match permit format.
 *
 * @deprecated Use fetchPermitInvestmentFromCache with MAI cache instead.
 */
async function buildAddressToTaxkeyMap(): Promise<Map<string, string>> {
  const records = await ckanFetchAll(
    "9f905487-720e-4f30-ae70-b5ec8a2a65a1", // MAI
    350000, // ~334K records
  );

  const map = new Map<string, string>();
  for (const r of records) {
    const hse = String(r["HSE_NBR"] ?? "").trim();
    const dir = String(r["DIR"] ?? "").trim();
    const street = String(r["STREET"] ?? "").trim();
    const sttype = String(r["STTYPE"] ?? "").trim();
    const taxkey = String(r["TAXKEY"] ?? "").trim();

    if (!hse || !street || !taxkey) continue;

    // Normalize: "612 W ABBOTT AV"
    const key = `${hse} ${dir} ${street} ${sttype}`.replace(/\s+/g, " ").trim().toUpperCase();
    map.set(key, taxkey);
  }

  return map;
}

/**
 * Normalize a permit address to match MAI format.
 * Permit: "2033 S 24TH ST" → "2033 S 24TH ST"
 */
function normalizePermitAddress(addr: string): string {
  return addr.replace(/,.*$/, "").replace(/\s+/g, " ").trim().toUpperCase();
}

/**
 * Aggregate building permit investment for a neighborhood.
 * Uses MAI (Master Address Index) to geocode permit addresses to taxkeys,
 * then filters by the neighborhood's taxkey set.
 */
export async function fetchPermitInvestment(
  neighborhoodTaxkeys: Set<string>,
): Promise<PermitInvestmentAggregation> {
  // 1. Build address → taxkey lookup from MAI
  const addrToTaxkey = await buildAddressToTaxkeyMap();

  // 2. Fetch all permits
  const permits = await ckanFetchAll(
    "828e9630-d7cb-42e4-960e-964eae916397",
    20000,
  );

  let totalPermitInvestment = 0;
  let newConstructionCount = 0;
  let permitCount = 0;
  const investmentByYear: Record<string, number> = {};
  const permitsByYear: Record<string, number> = {};

  for (const r of permits) {
    const addr = normalizePermitAddress(String(r["Address"] ?? ""));
    if (!addr) continue;

    const taxkey = addrToTaxkey.get(addr);
    if (!taxkey || !neighborhoodTaxkeys.has(taxkey)) continue;

    permitCount++;
    const cost = Number(r["Construction Total Cost"] ?? 0);
    if (cost > 0) {
      totalPermitInvestment += cost;
    }

    const permitType = String(r["Permit Type"] ?? "");
    if (permitType.toLowerCase().includes("new construction")) {
      newConstructionCount++;
    }

    // Timeline: aggregate by year from Date Issued
    const dateStr = String(r["Date Issued"] ?? r["Date Opened"] ?? "");
    const year = dateStr.substring(0, 4);
    if (year.length === 4 && parseInt(year) > 2000) {
      permitsByYear[year] = (permitsByYear[year] ?? 0) + 1;
      if (cost > 0) {
        investmentByYear[year] = (investmentByYear[year] ?? 0) + cost;
      }
    }
  }

  return {
    totalPermitInvestment: Math.round(totalPermitInvestment),
    newConstructionCount,
    permitCount,
    investmentByYear,
    permitsByYear,
  };
}

/**
 * Aggregate building permit investment using a pre-built MAI cache.
 * If cachedMap is provided, uses it; otherwise falls back to downloading MAI.
 */
export async function fetchPermitInvestmentFromCache(
  neighborhoodTaxkeys: Set<string>,
  cachedMap?: Map<string, string>,
): Promise<PermitInvestmentAggregation> {
  // Use cache if available, otherwise fall back to full download
  const addrToTaxkey = cachedMap ?? await buildAddressToTaxkeyMap();

  const permits = await ckanFetchAll(
    "828e9630-d7cb-42e4-960e-964eae916397",
    20000,
  );

  let totalPermitInvestment = 0;
  let newConstructionCount = 0;
  let permitCount = 0;
  const investmentByYear: Record<string, number> = {};
  const permitsByYear: Record<string, number> = {};

  for (const r of permits) {
    const addr = normalizePermitAddress(String(r["Address"] ?? ""));
    if (!addr) continue;

    const taxkey = addrToTaxkey.get(addr);
    if (!taxkey || !neighborhoodTaxkeys.has(taxkey)) continue;

    permitCount++;
    const cost = Number(r["Construction Total Cost"] ?? 0);
    if (cost > 0) {
      totalPermitInvestment += cost;
    }

    const permitType = String(r["Permit Type"] ?? "");
    if (permitType.toLowerCase().includes("new construction")) {
      newConstructionCount++;
    }

    const dateStr = String(r["Date Issued"] ?? r["Date Opened"] ?? "");
    const year = dateStr.substring(0, 4);
    if (year.length === 4 && parseInt(year) > 2000) {
      permitsByYear[year] = (permitsByYear[year] ?? 0) + 1;
      if (cost > 0) {
        investmentByYear[year] = (investmentByYear[year] ?? 0) + cost;
      }
    }
  }

  return {
    totalPermitInvestment: Math.round(totalPermitInvestment),
    newConstructionCount,
    permitCount,
    investmentByYear,
    permitsByYear,
  };
}

// --- Liquor Licenses ---

/**
 * Count liquor licenses in a neighborhood via taxkey matching.
 */
export async function fetchLiquorLicenses(
  neighborhoodTaxkeys: Set<string>,
): Promise<LiquorLicenseAggregation> {
  const records = await ckanFetchAll(
    "45c027b5-fa66-4de2-aa7e-d9314292093d",
    5000,
  );

  let count = 0;
  for (const r of records) {
    const taxkey = String(r["TAXKEY_NUMBER"] ?? "");
    if (taxkey && neighborhoodTaxkeys.has(taxkey)) count++;
  }

  return { totalLicenses: count };
}
