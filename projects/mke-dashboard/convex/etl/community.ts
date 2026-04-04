/**
 * Community resource data from ArcGIS and CKAN.
 * Libraries, parks, schools, food access, broadband.
 */

import { spatialCount, type Envelope } from "./arcgis";

const ARCGIS_BASE = "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";
const MKE_INDICATORS_BASE = "https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services";

const COMMUNITY_ENDPOINTS = {
  libraries: `${ARCGIS_BASE}/AGO/LibraryServices/MapServer/0`,
  parks: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/16`,
  schools: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/18`,
  daycares: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/19`,
  policeStations: `${ARCGIS_BASE}/MPD/MPD_stations/MapServer/0`,
  firehouses: `${ARCGIS_BASE}/MFD/MFD_RiskReduction/MapServer/0`,
  foodAccess: `${MKE_INDICATORS_BASE}/FoodAccess_2019/FeatureServer/0`,
  foodInsecurity: `${MKE_INDICATORS_BASE}/2023_Milwaukee_Food_Insecurity_Prevalence/FeatureServer/0`,
  broadband: `${MKE_INDICATORS_BASE}/2024_Milwaukee_County_Households_with_Broadband_Internet/FeatureServer/0`,
} as const;

export interface CommunityResources {
  libraryCount: number;
  parkCount: number;
  schoolCount: number;
  daycareCount: number;
  policeStationCount: number;
  firehouseCount: number;
}

/**
 * Count community resources within a neighborhood envelope.
 * Each query is independent — failures are caught individually.
 */
export async function fetchCommunityResources(
  envelope: Envelope,
): Promise<CommunityResources> {
  const [
    libraryCount,
    parkCount,
    schoolCount,
    daycareCount,
    policeStationCount,
    firehouseCount,
  ] = await Promise.all([
    spatialCount(COMMUNITY_ENDPOINTS.libraries, "1=1", envelope).catch(() => 0),
    spatialCount(COMMUNITY_ENDPOINTS.parks, "1=1", envelope).catch(() => 0),
    spatialCount(COMMUNITY_ENDPOINTS.schools, "1=1", envelope).catch(() => 0),
    spatialCount(COMMUNITY_ENDPOINTS.daycares, "1=1", envelope).catch(() => 0),
    spatialCount(COMMUNITY_ENDPOINTS.policeStations, "1=1", envelope).catch(() => 0),
    spatialCount(COMMUNITY_ENDPOINTS.firehouses, "1=1", envelope).catch(() => 0),
  ]);

  return {
    libraryCount,
    parkCount,
    schoolCount,
    daycareCount,
    policeStationCount,
    firehouseCount,
  };
}
