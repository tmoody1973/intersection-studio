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

// --- Types ---

export interface Envelope {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference: { wkid: number };
}

interface QueryParams {
  where?: string;
  outFields?: string;
  returnCountOnly?: boolean;
  returnGeometry?: boolean;
  geometry?: string;
  geometryType?: string;
  inSR?: number;
  spatialRel?: string;
  outSR?: number;
  resultOffset?: number;
  resultRecordCount?: number;
  outStatistics?: string;
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
  if (params.inSR) sp.set("inSR", String(params.inSR));
  if (params.spatialRel) sp.set("spatialRel", params.spatialRel);
  if (params.outSR) sp.set("outSR", String(params.outSR));
  if (params.resultOffset) sp.set("resultOffset", String(params.resultOffset));
  if (params.resultRecordCount)
    sp.set("resultRecordCount", String(params.resultRecordCount));
  if (params.outStatistics) sp.set("outStatistics", params.outStatistics);

  url.search = sp.toString();
  return url.toString();
}

// --- Non-spatial queries ---

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

/** Fetch features as JSON (no geometry). */
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

// --- Spatial queries (per-neighborhood) ---

/**
 * Build an ArcGIS envelope from a GeoJSON boundary.
 * Takes a GeoJSON FeatureCollection (from fetchNeighborhoodBoundary),
 * computes the bounding box, and returns an ArcGIS envelope.
 */
export function buildEnvelopeFromGeoJSON(geojsonString: string): Envelope {
  const geojson = JSON.parse(geojsonString);
  const coords: number[][] = [];

  for (const feature of geojson.features ?? []) {
    const geometry = feature.geometry;
    if (geometry?.type === "Polygon") {
      for (const ring of geometry.coordinates) {
        coords.push(...ring);
      }
    } else if (geometry?.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          coords.push(...ring);
        }
      }
    }
  }

  if (coords.length === 0) {
    throw new Error("No coordinates found in GeoJSON");
  }

  const lons = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);

  return {
    xmin: Math.min(...lons),
    ymin: Math.min(...lats),
    xmax: Math.max(...lons),
    ymax: Math.max(...lats),
    spatialReference: { wkid: 4326 },
  };
}

/**
 * Count features within a spatial envelope.
 * Uses esriGeometryEnvelope which is faster than polygon intersection
 * and avoids ArcGIS geometry format issues.
 */
export async function spatialCount(
  serviceUrl: string,
  where: string,
  envelope: Envelope,
): Promise<number> {
  const url = buildUrl(serviceUrl, {
    where,
    returnCountOnly: true,
    geometry: JSON.stringify(envelope),
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    inSR: 4326,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS spatial query failed: ${res.status}`);
  const data = await res.json();
  return data.count ?? 0;
}

/**
 * Get aggregate statistics within a spatial envelope.
 */
export async function spatialStats(
  serviceUrl: string,
  field: string,
  statType: "avg" | "sum" | "count" | "min" | "max",
  where: string,
  envelope: Envelope,
): Promise<number | null> {
  const url = buildUrl(serviceUrl, {
    where,
    geometry: JSON.stringify(envelope),
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    inSR: 4326,
    outStatistics: JSON.stringify([
      {
        statisticType: statType,
        onStatisticField: field,
        outStatisticFieldName: `${statType}_${field}`,
      },
    ]),
  });
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const value = data.features?.[0]?.attributes?.[`${statType}_${field}`];
  return typeof value === "number" ? value : null;
}

/**
 * Fetch features within a spatial envelope (with fields).
 */
export async function spatialFeatures(
  serviceUrl: string,
  where: string,
  outFields: string,
  envelope: Envelope,
  limit = 2000,
): Promise<Array<Record<string, unknown>>> {
  const url = buildUrl(serviceUrl, {
    where,
    outFields,
    returnGeometry: false,
    geometry: JSON.stringify(envelope),
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    inSR: 4326,
    resultRecordCount: limit,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS spatial query failed: ${res.status}`);
  const data = await res.json();
  return (data.features ?? []).map(
    (f: { attributes: Record<string, unknown> }) => f.attributes,
  );
}

// --- Boundary ---

/** Fetch neighborhood boundary as GeoJSON string. */
export async function fetchNeighborhoodBoundary(
  dcdName: string,
): Promise<string> {
  const url = buildUrl(ENDPOINTS.neighborhoods, {
    where: `NEIGHBORHD = '${dcdName}'`,
    f: "geojson",
  });
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch boundary for ${dcdName}`);
  const geojson = await res.json();
  return JSON.stringify(geojson);
}

/** Non-spatial stats (for backward compat). */
export async function queryStats(
  serviceUrl: string,
  field: string,
  statType: "avg" | "sum" | "count" | "min" | "max",
  where: string,
): Promise<number | null> {
  const url = buildUrl(serviceUrl, {
    where,
    outStatistics: JSON.stringify([
      {
        statisticType: statType,
        onStatisticField: field,
        outStatisticFieldName: `${statType}_${field}`,
      },
    ]),
  });
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const value = data.features?.[0]?.attributes?.[`${statType}_${field}`];
  return typeof value === "number" ? value : null;
}
