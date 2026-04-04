import type { CategoryTab, CategoryId } from "@/types/metrics";

// --- ArcGIS REST Endpoints (CORRECTED per research validation) ---

const ARCGIS_BASE =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";

export const ARCGIS_URLS = {
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

export const OPEN_DATA_BASE = "https://data.milwaukee.gov";

// --- CSV Direct Download URLs (from data.milwaukee.gov) ---

export const CSV_URLS = {
  /** WIBR Crime Data — daily, incident-level with lat/lng */
  crimeCurrent: "https://data.milwaukee.gov/dataset/e5feaad3-ee73-418c-b65d-ef810c199390/resource/87843297-a6fa-46d4-ba5d-cb342fb2d3bb/download/wibr.csv",
  /** 311 Service Requests — daily, with lat/lng */
  callCenter: "https://data.milwaukee.gov/dataset/a418ffb4-ce90-4a11-a489-d256a3e68a8b/resource/bf2b508a-5bfa-49da-8846-d87ffeee020a/download/callcenterdatacurrent.csv",
  /** Accela Vacant Buildings — weekly */
  vacantBuildings: "https://data.milwaukee.gov/dataset/a9d52246-c06e-4ec2-a58e-a53ea0a72ded/resource/46dca88b-fec0-48f1-bda6-7296249ea61f/download/accelavacantbuilding.csv",
  /** Building Permits — daily */
  buildingPermits: "https://data.milwaukee.gov/dataset/9bada2e0-fad5-4545-8674-1b2c8c4e9f2f/resource/828e9630-d7cb-42e4-960e-964eae916397/download/buildingpermits.csv",
  /** EMS Calls — for overdose filtering */
  emsCalls: "https://data.milwaukee.gov/dataset/1a8bef50-1253-45f0-8a4e-86f7bf515240/resource/06fd2a64-4348-461a-bda4-5e09b2500615/download/mfdopendataems.csv",
  /** Fire Calls detail */
  fireCalls: "https://data.milwaukee.gov/dataset/8735b4c2-4298-44d0-84c2-b734be52e30d/resource/cdf51c45-5fe3-415e-a08c-14ed134dcb64/download/mfdopendatafire.csv",
  /** Traffic Crashes */
  trafficCrashes: "https://data.milwaukee.gov/dataset/5fafe01d-dc55-4a41-8760-8ae52f7855f1/resource/8fffaa3a-b500-4561-8898-78a424bdacee/download/trafficaccident.csv",
  /** Liquor Licenses */
  liquorLicenses: "https://data.milwaukee.gov/dataset/1aba8821-f5f6-4031-b469-5c39c90e99c7/resource/45c027b5-fa66-4de2-aa7e-d9314292093d/download/liquorlicenses.csv",
  /** Library Locations */
  libraries: "https://data.milwaukee.gov/dataset/1b984aba-5cc1-47e3-8c64-999b6d26ceb6/resource/0590052a-6dd5-4cc1-a473-fd60eb00402b/download/librarylocations.csv",
  /** Delinquent Tax */
  delinquentTax: "https://data.milwaukee.gov/dataset/f376a61a-b279-4ff5-b6da-776a3df14ca0",
} as const;

// --- Map Defaults ---

export const MAP_CENTER = {
  longitude: -87.9065,
  latitude: 43.0389,
} as const;

export const MAP_ZOOM = 11.5;

// --- HOLC Redlining Grade Colors (15% opacity on map) ---

export const HOLC_COLORS = {
  A: "#22C55E", // Green — "Best"
  B: "#3B82F6", // Blue — "Still Desirable"
  C: "#EAB308", // Yellow — "Definitely Declining"
  D: "#EF4444", // Red — "Hazardous" (redlined)
} as const;

export const HOLC_OPACITY = 0.15;

// --- Category Definitions ---

export const CATEGORY_COLORS = {
  community: { light: "#1A6B52", dark: "#34D399" },
  publicSafety: { light: "#B84233", dark: "#F87171" },
  qualityOfLife: { light: "#2563EB", dark: "#60A5FA" },
  wellness: { light: "#7C3AED", dark: "#A78BFA" },
} as const;

export const DEFAULT_CATEGORIES: CategoryTab[] = [
  {
    id: "community",
    label: "Community",
    icon: "CircleDot",
    color: CATEGORY_COLORS.community.light,
    colorDark: CATEGORY_COLORS.community.dark,
    metricCount: 4,
  },
  {
    id: "publicSafety",
    label: "Public Safety",
    icon: "Shield",
    color: CATEGORY_COLORS.publicSafety.light,
    colorDark: CATEGORY_COLORS.publicSafety.dark,
    metricCount: 3,
  },
  {
    id: "qualityOfLife",
    label: "Quality of Life",
    icon: "Building2",
    color: CATEGORY_COLORS.qualityOfLife.light,
    colorDark: CATEGORY_COLORS.qualityOfLife.dark,
    metricCount: 5,
  },
  {
    id: "wellness",
    label: "Wellness",
    icon: "Heart",
    color: CATEGORY_COLORS.wellness.light,
    colorDark: CATEGORY_COLORS.wellness.dark,
    metricCount: 1,
  },
];

// --- Target Neighborhoods (Phase 1: 8 northside neighborhoods) ---
// Names match DCD neighborhood boundaries layer (NEIGHBORHD field, uppercase)

export const TARGET_NEIGHBORHOODS = [
  { name: "Amani", slug: "amani", dcdName: "AMANI" },
  { name: "Borchert Field", slug: "borchert-field", dcdName: "BORCHERT FIELD" },
  { name: "Franklin Heights", slug: "franklin-heights", dcdName: "FRANKLIN HEIGHTS" },
  { name: "Harambee", slug: "harambee", dcdName: "HARAMBEE" },
  { name: "Havenwoods", slug: "havenwoods", dcdName: "HAVENWOODS" },
  { name: "Lindsay Heights", slug: "lindsay-heights", dcdName: "LINDSAY PARK" },
  { name: "Metcalfe Park", slug: "metcalfe-park", dcdName: "METCALFE PARK" },
  { name: "Sherman Park", slug: "sherman-park", dcdName: "SHERMAN PARK" },
] as const;

export type NeighborhoodDef = (typeof TARGET_NEIGHBORHOODS)[number];

// --- Auth Tiers ---

export type AuthTier = "public" | "authenticated" | "city_official";

// --- MPROP Queries (CORRECTED per research validation) ---
// NOTE: TAX_DELQ, RAZE_STATUS, BI_VIOL have sentinel values in ArcGIS.
// Use alternative sources for those metrics.

export const MPROP_QUERIES = {
  /**
   * Vacant/undeveloped land parcels (11,414 citywide).
   * C_A_CLASS is a String field, not Integer — must use quotes.
   * Class 5 = "Undeveloped" in the assessor's classification.
   */
  vacantLand: "C_A_CLASS = '5'",
  /**
   * Tighter filter: vacant land with zero improvements (607 citywide).
   * Use this for "truly empty lots" vs. the broader undeveloped count.
   */
  vacantLandStrict: "C_A_CLASS IN ('2','5') AND C_A_IMPRV = '0'",
  ownerOccupied: "OWN_OCPD = 'O'",
  allProperties: "1=1",
} as const;

/**
 * Strong Neighborhoods has 1,552 vacant BUILDINGS (structures).
 * This is a different metric from vacant LAND parcels above.
 * Dashboard shows both: "Undeveloped Land" + "Vacant Buildings"
 */
