import type { CategoryTab, CategoryId } from "@/types/metrics";

// --- ArcGIS REST Endpoints (CORRECTED per research validation) ---

const ARCGIS_BASE =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";

export const ARCGIS_URLS = {
  mprop: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/2`,
  foreclosedCityOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/13`,
  foreclosedBankOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/23`,
  governmentOwned: `${ARCGIS_BASE}/property/govt_owned/MapServer`,
  crimeMonthly: `${ARCGIS_BASE}/MPD/MPD_Monthly/MapServer`,
  neighborhoods: `${ARCGIS_BASE}/planning/special_districts/MapServer/4`,
  strongNeighborhoods: `${ARCGIS_BASE}/StrongNeighborhood/StrongNeighborhood/MapServer/0`,
  dpwForestry: `${ARCGIS_BASE}/DPW/DPW_forestry/MapServer`,
  dpwOperations: `${ARCGIS_BASE}/DPW/DPW_Operations/MapServer`,
  dpwSanitation: `${ARCGIS_BASE}/DPW/DPW_Sanitation/MapServer`,
  dpwStreetcar: `${ARCGIS_BASE}/DPW/DPW_streetcar/MapServer`,
  parkingMeters: `${ARCGIS_BASE}/DPW/ParkingMeters/MapServer`,
  pavingProgram: `${ARCGIS_BASE}/DPW/paving_program/MapServer`,
} as const;

export const OPEN_DATA_BASE = "https://data.milwaukee.gov";

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
