/**
 * ArcGIS REST query helpers.
 * All Milwaukee ArcGIS endpoints have CORS: * — client-side fetching works.
 * We still proxy through /api/arcgis for caching + data joining.
 */

interface ArcGISQueryParams {
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

interface ArcGISCountResponse {
  count: number;
}

interface ArcGISFeatureResponse {
  features: Array<{
    attributes: Record<string, unknown>;
    geometry?: Record<string, unknown>;
  }>;
  exceededTransferLimit?: boolean;
}

interface ArcGISGeoJSONResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: Record<string, unknown>;
  }>;
}

function buildQueryUrl(
  serviceUrl: string,
  params: ArcGISQueryParams,
): string {
  const url = new URL(`${serviceUrl}/query`);
  const searchParams = new URLSearchParams();

  searchParams.set("where", params.where ?? "1=1");
  searchParams.set("f", params.f ?? "json");

  if (params.outFields) searchParams.set("outFields", params.outFields);
  if (params.returnCountOnly) searchParams.set("returnCountOnly", "true");
  if (params.returnGeometry === false)
    searchParams.set("returnGeometry", "false");
  if (params.geometry) searchParams.set("geometry", params.geometry);
  if (params.geometryType)
    searchParams.set("geometryType", params.geometryType);
  if (params.spatialRel) searchParams.set("spatialRel", params.spatialRel);
  if (params.outSR) searchParams.set("outSR", String(params.outSR));
  if (params.resultOffset)
    searchParams.set("resultOffset", String(params.resultOffset));
  if (params.resultRecordCount)
    searchParams.set("resultRecordCount", String(params.resultRecordCount));

  url.search = searchParams.toString();
  return url.toString();
}

export async function queryCount(
  serviceUrl: string,
  where: string,
): Promise<number> {
  const url = buildQueryUrl(serviceUrl, { where, returnCountOnly: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
  const data: ArcGISCountResponse = await res.json();
  return data.count;
}

export async function queryFeatures(
  serviceUrl: string,
  params: ArcGISQueryParams,
): Promise<ArcGISFeatureResponse> {
  const url = buildQueryUrl(serviceUrl, params);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
  return res.json();
}

export async function queryGeoJSON(
  serviceUrl: string,
  params: Omit<ArcGISQueryParams, "f">,
): Promise<ArcGISGeoJSONResponse> {
  const url = buildQueryUrl(serviceUrl, { ...params, f: "geojson" });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS GeoJSON query failed: ${res.status}`);
  return res.json();
}

/**
 * Paginated query — fetches all features across multiple pages.
 * Checks `exceededTransferLimit` flag and uses `resultOffset`.
 */
export async function queryAllFeatures(
  serviceUrl: string,
  params: ArcGISQueryParams,
  pageSize = 2000,
): Promise<ArcGISFeatureResponse["features"]> {
  const allFeatures: ArcGISFeatureResponse["features"] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await queryFeatures(serviceUrl, {
      ...params,
      resultOffset: offset,
      resultRecordCount: pageSize,
    });

    allFeatures.push(...response.features);
    hasMore = response.exceededTransferLimit === true;
    offset += pageSize;
  }

  return allFeatures;
}
