/**
 * ArcGIS REST query helpers for Convex server-side actions.
 * These run in Convex's serverless environment, not the browser.
 */

const ARCGIS_BASE =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";

export const ENDPOINTS = {
  mprop: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/2`,
  foreclosedCityOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/13`,
  foreclosedBankOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/23`,
  neighborhoods: `${ARCGIS_BASE}/planning/special_districts/MapServer/4`,
  strongNeighborhoods: `${ARCGIS_BASE}/StrongNeighborhood/StrongNeighborhood/MapServer/0`,
  crimeMonthly: `${ARCGIS_BASE}/MPD/MPD_Monthly/MapServer`,
} as const;

interface QueryParams {
  where?: string;
  outFields?: string;
  returnCountOnly?: boolean;
  returnGeometry?: boolean;
  geometry?: string;
  geometryType?: string;
  spatialRel?: string;
  outSR?: number;
  resultOffset?: number;
  resultRecordCount?: number;
  f?: "json" | "geojson";
}

function buildUrl(serviceUrl: string, params: QueryParams): string {
  const url = new URL(`${serviceUrl}/query`);
  const sp = new URLSearchParams();

  sp.set("where", params.where ?? "1=1");
  sp.set("f", params.f ?? "json");

  if (params.outFields) sp.set("outFields", params.outFields);
  if (params.returnCountOnly) sp.set("returnCountOnly", "true");
  if (params.returnGeometry === false) sp.set("returnGeometry", "false");
  if (params.geometry) sp.set("geometry", params.geometry);
  if (params.geometryType) sp.set("geometryType", params.geometryType);
  if (params.spatialRel) sp.set("spatialRel", params.spatialRel);
  if (params.outSR) sp.set("outSR", String(params.outSR));
  if (params.resultOffset) sp.set("resultOffset", String(params.resultOffset));
  if (params.resultRecordCount)
    sp.set("resultRecordCount", String(params.resultRecordCount));

  url.search = sp.toString();
  return url.toString();
}

/** Count records matching a WHERE clause. */
export async function queryCount(
  serviceUrl: string,
  where: string,
): Promise<number> {
  const url = buildUrl(serviceUrl, { where, returnCountOnly: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
  const data = await res.json();
  return data.count ?? 0;
}

/** Fetch features as JSON. */
export async function queryFeatures(
  serviceUrl: string,
  params: QueryParams,
): Promise<{
  features: Array<{ attributes: Record<string, unknown> }>;
  exceededTransferLimit?: boolean;
}> {
  const url = buildUrl(serviceUrl, { ...params, returnGeometry: false });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
  return res.json();
}

/** Fetch neighborhood boundary as GeoJSON. */
export async function fetchNeighborhoodBoundary(
  neighborhoodName: string,
): Promise<string> {
  const url = buildUrl(ENDPOINTS.neighborhoods, {
    where: `NEIGHBORHD = '${neighborhoodName}'`,
    f: "geojson",
  });
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch boundary for ${neighborhoodName}`);
  const geojson = await res.json();
  return JSON.stringify(geojson);
}

/**
 * Spatial query: count features within a neighborhood boundary polygon.
 * Uses the ArcGIS geometry parameter with esriSpatialRelIntersects.
 */
export async function spatialCount(
  serviceUrl: string,
  where: string,
  boundaryGeometry: string,
): Promise<number> {
  const url = buildUrl(serviceUrl, {
    where,
    returnCountOnly: true,
    geometry: boundaryGeometry,
    geometryType: "esriGeometryPolygon",
    spatialRel: "esriSpatialRelIntersects",
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS spatial query failed: ${res.status}`);
  const data = await res.json();
  return data.count ?? 0;
}

/**
 * Fetch aggregate statistics for numeric fields within a boundary.
 * Uses the ArcGIS statistics query.
 */
export async function queryStats(
  serviceUrl: string,
  field: string,
  statType: "avg" | "sum" | "count" | "min" | "max",
  where: string,
): Promise<number | null> {
  const url = new URL(`${serviceUrl}/query`);
  const sp = new URLSearchParams({
    where,
    outStatistics: JSON.stringify([
      {
        statisticType: statType,
        onStatisticField: field,
        outStatisticFieldName: `${statType}_${field}`,
      },
    ]),
    f: "json",
  });
  url.search = sp.toString();

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const value = data.features?.[0]?.attributes?.[`${statType}_${field}`];
  return typeof value === "number" ? value : null;
}
