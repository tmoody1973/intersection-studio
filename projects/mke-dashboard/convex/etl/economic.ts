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

// --- Liquor Licenses ---

export interface LiquorLicenseAggregation {
  totalLicenses: number;
}

// --- Building Permits (Investment) ---

export interface PermitInvestmentAggregation {
  totalPermitInvestment: number;
  newConstructionCount: number;
}

/**
 * Aggregate building permit investment from CKAN.
 * Permits lack coordinates, so this returns citywide totals for now.
 */
export async function fetchPermitInvestment(): Promise<PermitInvestmentAggregation> {
  const records = await ckanFetchAll(
    "828e9630-d7cb-42e4-960e-964eae916397",
    10000,
  );

  let totalPermitInvestment = 0;
  let newConstructionCount = 0;

  for (const r of records) {
    const cost = Number(r["Construction Total Cost"] ?? 0);
    if (cost > 0) {
      totalPermitInvestment += cost;
    }
    const permitType = String(r["Permit_Type"] ?? "");
    if (permitType === "New Construction") {
      newConstructionCount++;
    }
  }

  return {
    totalPermitInvestment: Math.round(totalPermitInvestment),
    newConstructionCount,
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
