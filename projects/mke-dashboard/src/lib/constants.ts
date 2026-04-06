import type { CategoryTab, CategoryId } from "@/types/metrics";

// --- ArcGIS REST Endpoints ---
// Source of truth: convex/config.ts (ARCGIS_ENDPOINTS)
// Duplicated here because Next.js and Convex have different module resolution.
// If URLs change, update convex/config.ts first, then sync here.

import {
  ARCGIS_ENDPOINTS,
  OPEN_DATA_BASE,
  TARGET_NEIGHBORHOODS,
  NEIGHBORHOOD_CENSUS_TRACTS,
  MPROP_QUERIES,
} from "../../convex/config";
import type { NeighborhoodDef } from "../../convex/config";

export const ARCGIS_URLS = ARCGIS_ENDPOINTS;
export { OPEN_DATA_BASE, TARGET_NEIGHBORHOODS, NEIGHBORHOOD_CENSUS_TRACTS, MPROP_QUERIES };
export type { NeighborhoodDef };

// --- CSV Direct Download URLs (from data.milwaukee.gov) ---
// These are direct download links, separate from the CKAN API resource IDs in convex/config.ts.

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
  development: { light: "#C4960C", dark: "#FCD34D" },
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
  {
    id: "development",
    label: "Development",
    icon: "Landmark",
    color: CATEGORY_COLORS.development.light,
    colorDark: CATEGORY_COLORS.development.dark,
    metricCount: 4,
  },
];

// --- Auth Tiers ---

export type AuthTier = "public" | "authenticated" | "city_official";
