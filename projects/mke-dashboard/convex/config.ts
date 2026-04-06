/**
 * Single source of truth for all data source URLs, resource IDs,
 * and neighborhood definitions used by both Convex ETL and the frontend.
 */

// --- ArcGIS REST Endpoints ---

export const ARCGIS_BASE =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";

export const ARCGIS_ENDPOINTS = {
  // Property
  mprop: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/2`,
  foreclosedCityOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/13`,
  foreclosedBankOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/23`,
  governmentOwned: `${ARCGIS_BASE}/property/govt_owned/MapServer`,
  parks: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/16`,
  schools: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/18`,
  // Public Safety
  crimeMonthly: `${ARCGIS_BASE}/MPD/MPD_Monthly/MapServer`,
  policeStations: `${ARCGIS_BASE}/MPD/MPD_stations/MapServer/0`,
  policeDistricts: `${ARCGIS_BASE}/MPD/MPD_geography/MapServer/2`,
  firehouses: `${ARCGIS_BASE}/MFD/MFD_RiskReduction/MapServer/0`,
  // Planning
  neighborhoods: `${ARCGIS_BASE}/planning/special_districts/MapServer/4`,
  zoning: `${ARCGIS_BASE}/planning/zoning/MapServer/11`,
  // Development zone districts
  tidDistricts: `${ARCGIS_BASE}/planning/special_districts/MapServer/8`,
  bidDistricts: `${ARCGIS_BASE}/planning/special_districts/MapServer/3`,
  tinDistricts: `${ARCGIS_BASE}/planning/special_districts/MapServer/13`,
  opportunityZones: `${ARCGIS_BASE}/planning/special_districts/MapServer/9`,
  nidDistricts: `${ARCGIS_BASE}/planning/special_districts/MapServer/5`,
  // Quality of Life
  strongNeighborhoods: `${ARCGIS_BASE}/StrongNeighborhood/StrongNeighborhood/MapServer/0`,
  // Community
  libraries: `${ARCGIS_BASE}/AGO/LibraryServices/MapServer/0`,
  liquorLicenses: `${ARCGIS_BASE}/regulation/license/MapServer/0`,
  // DPW
  dpwForestry: `${ARCGIS_BASE}/DPW/DPW_forestry/MapServer`,
  dpwOperations: `${ARCGIS_BASE}/DPW/DPW_Operations/MapServer`,
  dpwSanitation: `${ARCGIS_BASE}/DPW/DPW_Sanitation/MapServer`,
  dpwStreetcar: `${ARCGIS_BASE}/DPW/DPW_streetcar/MapServer`,
  parkingMeters: `${ARCGIS_BASE}/DPW/ParkingMeters/MapServer`,
  pavingProgram: `${ARCGIS_BASE}/DPW/paving_program/MapServer`,
} as const;

// --- CKAN Datastore Resource IDs ---

export const CKAN_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";

export const CKAN_RESOURCE_IDS = {
  /** WIBR Crime Data (Current) — daily, ~5K records */
  crime: "87843297-a6fa-46d4-ba5d-cb342fb2d3bb",
  /** 311 Service Requests — daily */
  callCenter: "bf2b508a-5bfa-49da-8846-d87ffeee020a",
  /** Accela Vacant Buildings — weekly */
  vacantBuildings: "46dca88b-fec0-48f1-bda6-7296249ea61f",
  /** Building Permits — daily */
  buildingPermits: "828e9630-d7cb-42e4-960e-964eae916397",
  /** EMS Calls for Service Detail */
  emsCalls: "06fd2a64-4348-461a-bda4-5e09b2500615",
  /** Fire Calls detail */
  fireCalls: "cdf51c45-5fe3-415e-a08c-14ed134dcb64",
  /** Traffic Crashes */
  trafficCrashes: "8fffaa3a-b500-4561-8898-78a424bdacee",
  /** Liquor Licenses */
  liquorLicenses: "45c027b5-fa66-4de2-aa7e-d9314292093d",
  /** Library Locations */
  libraries: "0590052a-6dd5-4cc1-a473-fd60eb00402b",
} as const;

export const OPEN_DATA_BASE = "https://data.milwaukee.gov";

// --- Target Neighborhoods (Phase 1: 8 northside neighborhoods) ---
// Names match DCD neighborhood boundaries layer (NEIGHBORHD field, uppercase)

export const TARGET_NEIGHBORHOODS = [
  { name: "Amani", slug: "amani", dcdName: "AMANI" },
  { name: "Borchert Field", slug: "borchert-field", dcdName: "BORCHERT FIELD" },
  { name: "Franklin Heights", slug: "franklin-heights", dcdName: "FRANKLIN HEIGHTS" },
  { name: "Harambee", slug: "harambee", dcdName: "HARAMBEE" },
  { name: "Havenwoods", slug: "havenwoods", dcdName: "HAVENWOODS" },
  { name: "Lindsay Heights", slug: "lindsay-heights", dcdName: "NORTH DIVISION" },
  { name: "Metcalfe Park", slug: "metcalfe-park", dcdName: "METCALFE PARK" },
  { name: "Sherman Park", slug: "sherman-park", dcdName: "SHERMAN PARK" },
] as const;

export type NeighborhoodDef = (typeof TARGET_NEIGHBORHOODS)[number];

// --- Authoritative Census Tract Mappings ---
// Source: Data You Can Use Neighborhood Portraits (datayoucanuse.org)

export const NEIGHBORHOOD_CENSUS_TRACTS: Record<string, number[]> = {
  amani: [64, 65, 87, 88],
  "borchert-field": [66, 68],
  "franklin-heights": [47, 63, 64, 65],
  harambee: [67, 68, 69, 70, 71, 81, 84, 106, 1856, 1857],
  havenwoods: [11, 12, 19],
  "lindsay-heights": [84, 85, 86],
  "metcalfe-park": [62, 88, 89, 90, 98, 99],
  "sherman-park": [37, 38, 39, 48, 49, 50, 59, 60, 61, 62],
} as const;

// --- MPROP Queries ---

export const MPROP_QUERIES = {
  vacantLand: "C_A_CLASS = '5'",
  vacantLandStrict: "C_A_CLASS IN ('2','5') AND C_A_IMPRV = '0'",
  ownerOccupied: "OWN_OCPD = 'O'",
  allProperties: "1=1",
} as const;
