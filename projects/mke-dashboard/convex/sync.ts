import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  ENDPOINTS,
  spatialCount,
  spatialStats,
  spatialFeatures,
  fetchNeighborhoodBoundary,
  buildEnvelopeFromGeoJSON,
  type Envelope,
} from "./etl/arcgis";
import {
  fetchCrimeData,
  fetch311Data,
  fetchVacantBuildingData,
  fetchPermitData,
  fetchOverdoseCount,
  fetchTrafficCrashCount,
} from "./etl/csv";
import {
  fetchHistoricalCrimeCount,
  fetchHistorical311Count,
} from "./etl/historical";
import {
  fetchAllTracts,
  aggregateForNeighborhood,
} from "./etl/census";
import { fetchCommunityResources } from "./etl/community";
import { fetchPropertySales, fetchLiquorLicenses, fetchPermitInvestmentFromCache } from "./etl/economic";
import { fetchDevelopmentZones } from "./etl/zones";

/**
 * DCD neighborhood names (uppercase, matching the boundaries layer).
 */
/**
 * Census tract assignments per neighborhood.
 * These are CURATED — not from spatial queries (which grab adjacent tracts).
 * Short codes (e.g., 47) → padded to 6-digit FIPS (004700) in aggregation.
 * Population cross-checked against known neighborhood estimates.
 */
const NEIGHBORHOODS: Array<{ name: string; slug: string; dcdName: string; censusTracts: number[] }> = [
  { name: "Amani", slug: "amani", dcdName: "AMANI", censusTracts: [64, 65, 87] },                    // ~4,800
  { name: "Borchert Field", slug: "borchert-field", dcdName: "BORCHERT FIELD", censusTracts: [66] },  // ~1,800
  { name: "Franklin Heights", slug: "franklin-heights", dcdName: "FRANKLIN HEIGHTS", censusTracts: [47, 63, 64] }, // ~7,000
  { name: "Harambee", slug: "harambee", dcdName: "HARAMBEE", censusTracts: [67, 68, 69, 70, 71, 81, 84, 106, 1856, 1857] }, // ~17,200 (Data You Can Use: ~18,000)
  { name: "Havenwoods", slug: "havenwoods", dcdName: "HAVENWOODS", censusTracts: [11, 12, 19] },     // ~8,800
  { name: "Lindsay Heights", slug: "lindsay-heights", dcdName: "NORTH DIVISION", censusTracts: [84, 85, 86] }, // ~2,800
  { name: "Metcalfe Park", slug: "metcalfe-park", dcdName: "METCALFE PARK", censusTracts: [88, 89] }, // ~2,700
  { name: "Sherman Park", slug: "sherman-park", dcdName: "SHERMAN PARK", censusTracts: [48, 49, 50, 59, 60, 61] }, // ~19,800
];

// ---------------------------------------------------------------------------
// Phase 1: Property (MPROP spatial queries)
// ---------------------------------------------------------------------------

interface PropertyPhaseResult {
  totalProperties: number;
  ownerOccupiedCount: number;
  ownerOccupiedRate: number;
  avgAssessedValue: number | undefined;
  vacantLandCount: number;
  vacantBuildingCount: number;
  foreclosureCityCount: number;
  foreclosureBankCount: number;
  housingAge: string | undefined;
  censusTracts: string;
  neighborhoodZips: string[];
  neighborhoodTaxkeys: Set<string>;
  population: number | undefined;
  medianIncome: number | undefined;
  povertyRate: number | undefined;
  unemploymentRate: number | undefined;
  medianHomeValue: number | undefined;
}

async function syncPropertyPhase(
  envelope: Envelope,
  nhDef: { censusTracts: number[] },
): Promise<PropertyPhaseResult> {
  // MPROP metrics (spatial)
  const [totalProperties, ownerOccupiedCount, avgAssessedValue] =
    await Promise.all([
      spatialCount(ENDPOINTS.mprop, "1=1", envelope),
      spatialCount(ENDPOINTS.mprop, "OWN_OCPD = 'O'", envelope),
      spatialStats(ENDPOINTS.mprop, "C_A_TOTAL", "avg", "C_A_TOTAL > 0", envelope),
    ]);

  const ownerOccupiedRate =
    totalProperties > 0
      ? Math.round((ownerOccupiedCount / totalProperties) * 100)
      : 0;

  // Vacant land (spatial)
  const vacantLandCount = await spatialCount(
    ENDPOINTS.mprop,
    "C_A_CLASS = '5'",
    envelope,
  );

  // Vacant buildings from Strong Neighborhoods (spatial)
  const vacantBuildingCount = await spatialCount(
    ENDPOINTS.strongNeighborhoods,
    "1=1",
    envelope,
  );

  // Foreclosures (spatial)
  const [foreclosureCityCount, foreclosureBankCount] = await Promise.all([
    spatialCount(ENDPOINTS.foreclosedCityOwned, "1=1", envelope),
    spatialCount(ENDPOINTS.foreclosedBankOwned, "1=1", envelope),
  ]);

  // Housing age distribution (spatial) — sample up to 2000 parcels
  let housingAge: string | undefined;
  try {
    const yrBuiltRecords = await spatialFeatures(
      ENDPOINTS.mprop,
      "YR_BUILT IS NOT NULL AND YR_BUILT <> '0'",
      "YR_BUILT",
      envelope,
      2000,
    );
    const decades: Record<string, number> = {};
    for (const r of yrBuiltRecords) {
      const yr = parseInt(String(r.YR_BUILT), 10);
      if (yr > 1800 && yr < 2030) {
        const decade = `${Math.floor(yr / 10) * 10}s`;
        decades[decade] = (decades[decade] ?? 0) + 1;
      }
    }
    housingAge = JSON.stringify(decades);
  } catch {
    housingAge = undefined;
  }

  // Census tracts (hardcoded) + ZIP codes and taxkeys from MPROP
  const tractCodes: string[] = nhDef.censusTracts.map((t) => String(t * 100));
  const censusTracts = JSON.stringify(tractCodes);

  let neighborhoodZips: string[] = [];
  let neighborhoodTaxkeys = new Set<string>();
  try {
    const tractRecords = await spatialFeatures(
      ENDPOINTS.mprop,
      "GEO_TRACT IS NOT NULL",
      "GEO_ZIP_CODE,TAXKEY",
      envelope,
      5000,
    );
    neighborhoodZips = [
      ...new Set(
        tractRecords
          .map((r) => String(r.GEO_ZIP_CODE ?? ""))
          .filter((z) => z.length >= 5),
      ),
    ];
    neighborhoodTaxkeys = new Set(
      tractRecords
        .map((r) => String(r.TAXKEY ?? ""))
        .filter((t) => t.length > 0),
    );
  } catch {
    // ZIP/taxkey lookup failed — 311 filtering will be limited
  }

  // Census ACS demographics (using HARDCODED tract codes)
  let demographics: {
    population?: number;
    medianIncome?: number;
    povertyRate?: number;
    unemploymentRate?: number;
    medianHomeValue?: number;
  } = {};
  try {
    const curatedTracts = nhDef.censusTracts.map((t) =>
      String(t * 100).padStart(6, "0"),
    );
    if (curatedTracts.length > 0) {
      const allTracts = await fetchAllTracts();
      const agg = aggregateForNeighborhood(curatedTracts, allTracts);
      demographics = {
        population: agg.population || undefined,
        medianIncome: agg.medianIncome ?? undefined,
        povertyRate: agg.povertyRate ?? undefined,
        unemploymentRate: agg.unemploymentRate ?? undefined,
        medianHomeValue: agg.medianHomeValue ?? undefined,
      };
    }
  } catch (e) {
    console.error("Census ACS fetch failed:", e);
  }

  return {
    totalProperties,
    ownerOccupiedCount,
    ownerOccupiedRate,
    avgAssessedValue: avgAssessedValue ?? undefined,
    vacantLandCount,
    vacantBuildingCount,
    foreclosureCityCount,
    foreclosureBankCount,
    housingAge,
    censusTracts,
    neighborhoodZips,
    neighborhoodTaxkeys,
    population: demographics.population,
    medianIncome: demographics.medianIncome,
    povertyRate: demographics.povertyRate,
    unemploymentRate: demographics.unemploymentRate,
    medianHomeValue: demographics.medianHomeValue,
  };
}

// ---------------------------------------------------------------------------
// Phase 2: Crime (WIBR CKAN + ArcGIS MPD Monthly)
// ---------------------------------------------------------------------------

interface CrimePhaseResult {
  crimeTotal: number | undefined;
  crimeViolent: number | undefined;
  crimeProperty: number | undefined;
  crimeByType: string | undefined;
  crimeByMonth: string | undefined;
  part1CrimeCount: number;
  part1CrimeByType: string;
  overdoseCount: number | undefined;
  trafficCrashCount: number | undefined;
}

async function syncCrimePhase(envelope: Envelope): Promise<CrimePhaseResult> {
  // ArcGIS MPD Monthly crime layers
  let part1CrimeCount = 0;
  const crimeByTypeArcgis: Record<string, number> = {};
  const crimeTypes = [
    "Homicide", "Arson", "Sexual Assault", "Criminal Damage",
    "Robbery", "Burglary", "Theft", "Vehicle Theft",
    "Locked Vehicle", "Assault",
  ];

  for (let batch = 0; batch < crimeTypes.length; batch += 3) {
    const batchTypes = crimeTypes.slice(batch, batch + 3);
    const counts = await Promise.all(
      batchTypes.map((_, i) =>
        spatialCount(
          `${ENDPOINTS.crimeMonthly}/${batch + i}`,
          "1=1",
          envelope,
        ).catch(() => 0),
      ),
    );
    batchTypes.forEach((type, i) => {
      crimeByTypeArcgis[type] = counts[i];
      part1CrimeCount += counts[i];
    });
  }

  // WIBR CSV crime data
  let crimeData: { total?: number; violent?: number; property?: number; byType?: string; byMonth?: string } = {};
  try {
    const crime = await fetchCrimeData(envelope);
    crimeData = {
      total: crime.total,
      violent: crime.violent,
      property: crime.property,
      byType: JSON.stringify(crime.byType),
      byMonth: JSON.stringify(crime.byMonth),
    };
  } catch (e) {
    console.error("Crime CSV fetch failed:", e);
  }

  // Vacant buildings from Accela CSV
  let csvVacantCount: number | undefined;
  try {
    const vb = await fetchVacantBuildingData(envelope);
    csvVacantCount = vb.total;
  } catch (e) {
    console.error("Vacant buildings CSV fetch failed:", e);
  }

  // EMS / Safety
  let overdoseCount: number | undefined;
  try {
    overdoseCount = await fetchOverdoseCount(envelope);
  } catch (e) {
    console.error("EMS/overdose CSV fetch failed:", e);
  }

  let trafficCrashCount: number | undefined;
  try {
    trafficCrashCount = await fetchTrafficCrashCount(envelope);
  } catch (e) {
    console.error("Traffic crash CSV fetch failed:", e);
  }

  return {
    crimeTotal: crimeData.total,
    crimeViolent: crimeData.violent,
    crimeProperty: crimeData.property,
    crimeByType: crimeData.byType,
    crimeByMonth: crimeData.byMonth,
    part1CrimeCount,
    part1CrimeByType: JSON.stringify(crimeByTypeArcgis),
    overdoseCount,
    trafficCrashCount,
  };
}

// ---------------------------------------------------------------------------
// Phase 3: Economic (taxkey-based joins — depends on taxkeys from property)
// ---------------------------------------------------------------------------

interface EconomicPhaseResult {
  propertySalesCount: number | undefined;
  medianSalePrice: number | undefined;
  totalSalesVolume: number | undefined;
  liquorLicenseCount: number | undefined;
  totalPermitInvestment: number | undefined;
  newConstructionCount: number | undefined;
  buildingPermitCount: number | undefined;
  investmentByYear: string | undefined;
  permitsByYear: string | undefined;
  buildingPermitsByType: string | undefined;
  serviceRequests311: number | undefined;
  serviceRequestsByType: string | undefined;
  serviceRequestsByMonth: string | undefined;
}

async function syncEconomicPhase(
  envelope: Envelope,
  neighborhoodTaxkeys: Set<string>,
  neighborhoodZips: string[],
  maiCacheMap: Map<string, string> | undefined,
): Promise<EconomicPhaseResult> {
  // 311 Service Requests
  let serviceRequests: { total?: number; byType?: string; byMonth?: string } = {};
  try {
    const sr = await fetch311Data(envelope, neighborhoodZips);
    serviceRequests = {
      total: sr.total,
      byType: JSON.stringify(sr.byType),
      byMonth: JSON.stringify(sr.byMonth),
    };
  } catch (e) {
    console.error("311 CSV fetch failed:", e);
  }

  // Building Permits (Accela)
  let permitData: { total?: number; byType?: string } = {};
  try {
    const permits = await fetchPermitData(envelope);
    permitData = {
      total: permits.total,
      byType: JSON.stringify(permits.byType),
    };
  } catch (e) {
    console.error("Permits CSV fetch failed:", e);
  }

  // Property Sales
  let propertySalesCount: number | undefined;
  let medianSalePrice: number | undefined;
  let totalSalesVolume: number | undefined;
  try {
    if (neighborhoodTaxkeys.size > 0) {
      const sales = await fetchPropertySales(neighborhoodTaxkeys);
      propertySalesCount = sales.totalSales || undefined;
      medianSalePrice = sales.medianSalePrice ?? undefined;
      totalSalesVolume = sales.totalVolume || undefined;
    }
  } catch (e) {
    console.error("Property sales fetch failed:", e);
  }

  // Liquor Licenses
  let liquorLicenseCount: number | undefined;
  try {
    if (neighborhoodTaxkeys.size > 0) {
      const licenses = await fetchLiquorLicenses(neighborhoodTaxkeys);
      liquorLicenseCount = licenses.totalLicenses || undefined;
    }
  } catch (e) {
    console.error("Liquor licenses fetch failed:", e);
  }

  // Building permit investment (MAI cache → taxkey matching)
  let totalPermitInvestment: number | undefined;
  let newConstructionCount: number | undefined;
  let buildingPermitCount: number | undefined;
  let investmentByYear: string | undefined;
  let permitsByYear: string | undefined;
  try {
    if (neighborhoodTaxkeys.size > 0) {
      const permits = await fetchPermitInvestmentFromCache(neighborhoodTaxkeys, maiCacheMap);
      totalPermitInvestment = permits.totalPermitInvestment || undefined;
      newConstructionCount = permits.newConstructionCount || undefined;
      buildingPermitCount = permits.permitCount || undefined;
      investmentByYear = Object.keys(permits.investmentByYear).length > 0
        ? JSON.stringify(permits.investmentByYear) : undefined;
      permitsByYear = Object.keys(permits.permitsByYear).length > 0
        ? JSON.stringify(permits.permitsByYear) : undefined;
    }
  } catch (e) {
    console.error("Permit investment fetch failed:", e);
  }

  return {
    propertySalesCount,
    medianSalePrice,
    totalSalesVolume,
    liquorLicenseCount,
    totalPermitInvestment,
    newConstructionCount,
    buildingPermitCount: buildingPermitCount ?? permitData.total,
    investmentByYear,
    permitsByYear,
    buildingPermitsByType: permitData.byType,
    serviceRequests311: serviceRequests.total,
    serviceRequestsByType: serviceRequests.byType,
    serviceRequestsByMonth: serviceRequests.byMonth,
  };
}

// ---------------------------------------------------------------------------
// Phase 4: Community (libraries, parks, schools, zones, Census)
// ---------------------------------------------------------------------------

interface CommunityPhaseResult {
  libraryCount: number | undefined;
  parkCount: number | undefined;
  schoolCount: number | undefined;
  daycareCount: number | undefined;
  policeStationCount: number | undefined;
  firehouseCount: number | undefined;
  tidDistricts: string | undefined;
  bidDistricts: string | undefined;
  tinDistricts: string | undefined;
  opportunityZones: string | undefined;
  nidDistricts: string | undefined;
}

async function syncCommunityPhase(envelope: Envelope): Promise<CommunityPhaseResult> {
  // Community resources
  let community = { libraryCount: 0, parkCount: 0, schoolCount: 0, daycareCount: 0, policeStationCount: 0, firehouseCount: 0 };
  try {
    community = await fetchCommunityResources(envelope);
  } catch (e) {
    console.error("Community resources fetch failed:", e);
  }

  // Development zones
  let zoneData: { tidDistricts?: string; bidDistricts?: string; tinDistricts?: string; opportunityZones?: string; nidDistricts?: string } = {};
  try {
    const zones = await fetchDevelopmentZones(envelope);
    zoneData = zones;
  } catch (e) {
    console.error("Development zones fetch failed:", e);
  }

  return {
    libraryCount: community.libraryCount || undefined,
    parkCount: community.parkCount || undefined,
    schoolCount: community.schoolCount || undefined,
    daycareCount: community.daycareCount || undefined,
    policeStationCount: community.policeStationCount || undefined,
    firehouseCount: community.firehouseCount || undefined,
    tidDistricts: zoneData.tidDistricts,
    bidDistricts: zoneData.bidDistricts,
    tinDistricts: zoneData.tinDistricts,
    opportunityZones: zoneData.opportunityZones,
    nidDistricts: zoneData.nidDistricts,
  };
}

// ---------------------------------------------------------------------------
// Source health: protect against zero-count overwrites
// ---------------------------------------------------------------------------

interface SourceHealthEntry {
  lastGoodCount: number;
  lastGoodAt: number;
}

type SourceHealthMap = Record<string, SourceHealthEntry>;

/**
 * Fields where a zero value should be checked against source health.
 * If the new value is 0 but previous was >0, keep the previous value.
 */
const HEALTH_TRACKED_FIELDS = [
  "crimeTotal",
  "crimeViolent",
  "serviceRequests311",
  "vacantBuildingCount",
  "part1CrimeCount",
  "overdoseCount",
  "trafficCrashCount",
  "totalPermitInvestment",
  "propertySalesCount",
] as const;

type HealthTrackedField = typeof HEALTH_TRACKED_FIELDS[number];

function applySourceHealth(
  newData: Record<string, unknown>,
  existing: Record<string, unknown> | null,
  existingHealthJson: string | undefined,
): { data: Record<string, unknown>; sourceHealth: string } {
  const health: SourceHealthMap = existingHealthJson
    ? JSON.parse(existingHealthJson) as SourceHealthMap
    : {};
  const now = Date.now();

  for (const field of HEALTH_TRACKED_FIELDS) {
    const newVal = newData[field] as number | undefined;
    const existingVal = existing ? (existing[field] as number | undefined) : undefined;

    // Update lastKnownGood when source returns >0
    if (newVal !== undefined && newVal > 0) {
      health[field] = { lastGoodCount: newVal, lastGoodAt: now };
    }

    // If new value is 0/undefined but we had a good value before, keep previous
    if (
      (newVal === undefined || newVal === 0) &&
      existingVal !== undefined &&
      existingVal > 0 &&
      health[field]?.lastGoodCount !== undefined &&
      health[field].lastGoodCount > 0
    ) {
      console.warn(
        `Source health: ${field} returned ${newVal ?? "undefined"} but lastKnownGood was ${health[field].lastGoodCount}. Keeping previous value ${existingVal}.`,
      );
      newData[field] = existingVal;
    }
  }

  return { data: newData, sourceHealth: JSON.stringify(health) };
}

// ---------------------------------------------------------------------------
// Main sync orchestrator
// ---------------------------------------------------------------------------

/**
 * Sync a single neighborhood using SPATIAL ENVELOPE queries.
 * Runs 4 independent phases — each can fail without breaking others.
 */
export const syncNeighborhood = internalAction({
  args: {
    name: v.string(),
    slug: v.string(),
    source: v.string(),
  },
  handler: async (ctx, { name, slug, source }) => {
    const startedAt = Date.now();

    await ctx.runMutation(internal.sync.logSyncStart, {
      neighborhoodSlug: slug,
      startedAt,
      source,
    });

    try {
      const nhDef = NEIGHBORHOODS.find((n) => n.slug === slug);
      if (!nhDef) throw new Error(`Unknown neighborhood slug: ${slug}`);

      // Boundary + envelope — needed by all phases
      const boundaryGeoJson = await fetchNeighborhoodBoundary(nhDef.dcdName);
      const envelope = buildEnvelopeFromGeoJSON(boundaryGeoJson);

      const phaseErrors: string[] = [];

      // Phase 1: Property (must run first — produces taxkeys/zips for phase 3)
      let propertyResult: PropertyPhaseResult | null = null;
      try {
        propertyResult = await syncPropertyPhase(envelope, nhDef);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        phaseErrors.push(`property: ${msg}`);
        console.error(`[${slug}] Property phase failed:`, e);
      }

      // Phases 2, 3, 4 can run in parallel
      const taxkeys = propertyResult?.neighborhoodTaxkeys ?? new Set<string>();
      const zips = propertyResult?.neighborhoodZips ?? [];

      // Read MAI cache for permit investment ETL
      let maiCacheMap: Map<string, string> | undefined;
      try {
        const cacheJson: string | null = await ctx.runQuery(
          internal.maiCache.getMaiCache,
          {},
        );
        if (cacheJson) {
          const parsed = JSON.parse(cacheJson) as Record<string, string>;
          maiCacheMap = new Map(Object.entries(parsed));
        }
      } catch {
        // Cache not available — will fall back to full MAI download
      }

      const [crimeResult, economicResult, communityResult] = await Promise.all([
        syncCrimePhase(envelope).catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          phaseErrors.push(`crime: ${msg}`);
          console.error(`[${slug}] Crime phase failed:`, e);
          return null;
        }),
        syncEconomicPhase(envelope, taxkeys, zips, maiCacheMap).catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          phaseErrors.push(`economic: ${msg}`);
          console.error(`[${slug}] Economic phase failed:`, e);
          return null;
        }),
        syncCommunityPhase(envelope).catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          phaseErrors.push(`community: ${msg}`);
          console.error(`[${slug}] Community phase failed:`, e);
          return null;
        }),
      ]);

      // Upsert with all available data
      await ctx.runMutation(internal.sync.upsertNeighborhood, {
        name,
        slug,
        boundaryGeoJson,
        envelopeJson: JSON.stringify(envelope),
        // Property phase
        ...(propertyResult ? {
          totalProperties: propertyResult.totalProperties,
          ownerOccupiedCount: propertyResult.ownerOccupiedCount,
          ownerOccupiedRate: propertyResult.ownerOccupiedRate,
          medianAssessedValue: propertyResult.avgAssessedValue,
          avgAssessedValue: propertyResult.avgAssessedValue,
          vacantLandCount: propertyResult.vacantLandCount,
          vacantBuildingCount: propertyResult.vacantBuildingCount,
          foreclosureCityCount: propertyResult.foreclosureCityCount,
          foreclosureBankCount: propertyResult.foreclosureBankCount,
          housingAge: propertyResult.housingAge,
          censusTracts: propertyResult.censusTracts,
          population: propertyResult.population,
          medianIncome: propertyResult.medianIncome,
          povertyRate: propertyResult.povertyRate,
          unemploymentRate: propertyResult.unemploymentRate,
          medianHomeValue: propertyResult.medianHomeValue,
        } : {}),
        // Crime phase
        ...(crimeResult ? {
          crimeTotal: crimeResult.crimeTotal,
          crimeViolent: crimeResult.crimeViolent,
          crimeProperty: crimeResult.crimeProperty,
          crimeByType: crimeResult.crimeByType,
          crimeByMonth: crimeResult.crimeByMonth,
          part1CrimeCount: crimeResult.part1CrimeCount,
          part1CrimeByType: crimeResult.part1CrimeByType,
          overdoseCount: crimeResult.overdoseCount,
          trafficCrashCount: crimeResult.trafficCrashCount,
        } : {}),
        // Economic phase
        ...(economicResult ? {
          propertySalesCount: economicResult.propertySalesCount,
          medianSalePrice: economicResult.medianSalePrice,
          totalSalesVolume: economicResult.totalSalesVolume,
          liquorLicenseCount: economicResult.liquorLicenseCount,
          totalPermitInvestment: economicResult.totalPermitInvestment,
          newConstructionCount: economicResult.newConstructionCount,
          buildingPermitCount: economicResult.buildingPermitCount,
          buildingPermitsByType: economicResult.buildingPermitsByType,
          investmentByYear: economicResult.investmentByYear,
          permitsByYear: economicResult.permitsByYear,
          serviceRequests311: economicResult.serviceRequests311,
          serviceRequestsByType: economicResult.serviceRequestsByType,
          serviceRequestsByMonth: economicResult.serviceRequestsByMonth,
        } : {}),
        // Community phase
        ...(communityResult ? {
          libraryCount: communityResult.libraryCount,
          parkCount: communityResult.parkCount,
          schoolCount: communityResult.schoolCount,
          daycareCount: communityResult.daycareCount,
          policeStationCount: communityResult.policeStationCount,
          firehouseCount: communityResult.firehouseCount,
          tidDistricts: communityResult.tidDistricts,
          bidDistricts: communityResult.bidDistricts,
          tinDistricts: communityResult.tinDistricts,
          opportunityZones: communityResult.opportunityZones,
          nidDistricts: communityResult.nidDistricts,
        } : {}),
        // Sync metadata
        lastSyncAt: Date.now(),
        lastSyncStatus: phaseErrors.length > 0 ? "partial" : "success",
      });

      const status = phaseErrors.length > 0 ? "partial" : "success";
      await ctx.runMutation(internal.sync.logSyncComplete, {
        neighborhoodSlug: slug,
        startedAt,
        status,
        error: phaseErrors.length > 0 ? phaseErrors.join("; ") : undefined,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.sync.logSyncComplete, {
        neighborhoodSlug: slug,
        startedAt,
        status: "error",
        error: errorMsg,
      });
      throw error;
    }
  },
});

export const upsertNeighborhood = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    boundaryGeoJson: v.optional(v.string()),
    envelopeJson: v.optional(v.string()),
    // MPROP
    totalProperties: v.optional(v.number()),
    ownerOccupiedCount: v.optional(v.number()),
    ownerOccupiedRate: v.optional(v.number()),
    medianAssessedValue: v.optional(v.number()),
    avgAssessedValue: v.optional(v.number()),
    vacantLandCount: v.optional(v.number()),
    vacantBuildingCount: v.optional(v.number()),
    foreclosureCityCount: v.optional(v.number()),
    foreclosureBankCount: v.optional(v.number()),
    housingAge: v.optional(v.string()),
    censusTracts: v.optional(v.string()),
    // Economic
    propertySalesCount: v.optional(v.number()),
    medianSalePrice: v.optional(v.number()),
    totalSalesVolume: v.optional(v.number()),
    liquorLicenseCount: v.optional(v.number()),
    totalPermitInvestment: v.optional(v.number()),
    newConstructionCount: v.optional(v.number()),
    investmentByYear: v.optional(v.string()),
    permitsByYear: v.optional(v.string()),
    // Development Zones
    tidDistricts: v.optional(v.string()),
    bidDistricts: v.optional(v.string()),
    tinDistricts: v.optional(v.string()),
    opportunityZones: v.optional(v.string()),
    nidDistricts: v.optional(v.string()),
    // Community Resources
    libraryCount: v.optional(v.number()),
    parkCount: v.optional(v.number()),
    schoolCount: v.optional(v.number()),
    daycareCount: v.optional(v.number()),
    policeStationCount: v.optional(v.number()),
    firehouseCount: v.optional(v.number()),
    // Crime (WIBR CSV)
    crimeTotal: v.optional(v.number()),
    crimeViolent: v.optional(v.number()),
    crimeProperty: v.optional(v.number()),
    crimeByType: v.optional(v.string()),
    crimeByMonth: v.optional(v.string()),
    // Crime (ArcGIS MPD — legacy/fallback)
    part1CrimeCount: v.optional(v.number()),
    part1CrimeByType: v.optional(v.string()),
    // Demographics (Census ACS)
    population: v.optional(v.number()),
    medianIncome: v.optional(v.number()),
    povertyRate: v.optional(v.number()),
    unemploymentRate: v.optional(v.number()),
    medianHomeValue: v.optional(v.number()),
    // 311 Service Requests
    serviceRequests311: v.optional(v.number()),
    serviceRequestsByType: v.optional(v.string()),
    serviceRequestsByMonth: v.optional(v.string()),
    // Building Permits
    buildingPermitCount: v.optional(v.number()),
    buildingPermitsByType: v.optional(v.string()),
    // EMS / Safety
    overdoseCount: v.optional(v.number()),
    trafficCrashCount: v.optional(v.number()),
    // Sync
    lastSyncAt: v.number(),
    lastSyncStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("neighborhoods")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      // Apply source health protection before overwriting
      const existingRecord = existing as unknown as Record<string, unknown>;
      const { data: protectedData, sourceHealth } = applySourceHealth(
        { ...args } as Record<string, unknown>,
        existingRecord,
        existingRecord.sourceHealth as string | undefined,
      );

      const previousPeriod = JSON.stringify({
        totalProperties: existing.totalProperties,
        ownerOccupiedRate: existing.ownerOccupiedRate,
        part1CrimeCount: existing.part1CrimeCount,
        vacantBuildingCount: existing.vacantBuildingCount,
        foreclosureCityCount: existing.foreclosureCityCount,
        avgAssessedValue: existing.avgAssessedValue,
        crimeTotal: existing.crimeTotal,
        crimeViolent: existing.crimeViolent,
        serviceRequests311: existing.serviceRequests311,
        foreclosureBankCount: existing.foreclosureBankCount,
        population: existing.population,
        medianIncome: existing.medianIncome,
        povertyRate: existing.povertyRate,
        unemploymentRate: existing.unemploymentRate,
        totalPermitInvestment: (existing as Record<string, unknown>).totalPermitInvestment as number | undefined,
        propertySalesCount: existing.propertySalesCount,
        medianSalePrice: existing.medianSalePrice,
        libraryCount: existing.libraryCount,
        schoolCount: existing.schoolCount,
        parkCount: existing.parkCount,
        snapshotAt: existing.lastSyncAt,
      });

      // Only spread the fields that are valid for the schema
      await ctx.db.patch(existing._id, { ...args, previousPeriod, sourceHealth });
    } else {
      await ctx.db.insert("neighborhoods", {
        ...args,
        previousPeriod: undefined,
        lastSyncError: undefined,
        crimeYoYChange: undefined,
        fireIncidentCount: undefined,
        taxDelinquentCount: undefined,
        foodInspectionPassRate: undefined,
        sourceHealth: undefined,
      });
    }
  },
});

export const logSyncStart = internalMutation({
  args: {
    neighborhoodSlug: v.string(),
    startedAt: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", { ...args, status: "running" });
  },
});

export const logSyncComplete = internalMutation({
  args: {
    neighborhoodSlug: v.string(),
    startedAt: v.number(),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { neighborhoodSlug, startedAt, status, error }) => {
    const logs = await ctx.db
      .query("syncLogs")
      .withIndex("by_neighborhood", (q) =>
        q.eq("neighborhoodSlug", neighborhoodSlug),
      )
      .collect();
    const runningLog = logs.find(
      (l) => l.startedAt === startedAt && l.status === "running",
    );
    if (runningLog) {
      await ctx.db.patch(runningLog._id, { completedAt: Date.now(), status, error });
    }
  },
});

// --- Historical Data Sync ---

const HISTORY_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

/**
 * Sync historical year-over-year data for all neighborhoods.
 * Fetches WIBR Crime Historical + 311 Historical from CKAN,
 * one year at a time to manage data volume (883K+ crime records).
 */
export const syncHistory = internalAction({
  args: {
    slug: v.optional(v.string()),
  },
  handler: async (ctx, { slug }) => {
    const targets = slug
      ? NEIGHBORHOODS.filter((n) => n.slug === slug)
      : NEIGHBORHOODS;

    for (const nh of targets) {
      // Fetch boundary envelope
      const boundaryGeoJson = await fetchNeighborhoodBoundary(nh.dcdName);
      const envelope = buildEnvelopeFromGeoJSON(boundaryGeoJson);

      // Get ZIP codes for 311 filtering
      let neighborhoodZips: string[] = [];
      try {
        const tractRecords = await spatialFeatures(
          ENDPOINTS.mprop,
          "GEO_TRACT IS NOT NULL",
          "GEO_ZIP_CODE",
          envelope,
          5000,
        );
        neighborhoodZips = [
          ...new Set(
            tractRecords
              .map((r) => String(r.GEO_ZIP_CODE ?? ""))
              .filter((z) => z.length >= 5),
          ),
        ];
      } catch {
        // ZIP lookup failed — 311 will be skipped
      }

      // Process one year at a time to avoid memory issues
      for (const year of HISTORY_YEARS) {
        let crimeTotal: number | undefined;
        try {
          crimeTotal = await fetchHistoricalCrimeCount(year, envelope);
        } catch (e) {
          console.error(`Crime historical fetch failed for ${nh.slug}/${year}:`, e);
        }

        let serviceRequests311: number | undefined;
        try {
          if (neighborhoodZips.length > 0) {
            serviceRequests311 = await fetchHistorical311Count(year, neighborhoodZips);
          }
        } catch (e) {
          console.error(`311 historical fetch failed for ${nh.slug}/${year}:`, e);
        }

        // Only upsert if we got at least one data point
        if (crimeTotal !== undefined || serviceRequests311 !== undefined) {
          await ctx.runMutation(internal.sync.upsertHistory, {
            slug: nh.slug,
            year,
            crimeTotal,
            serviceRequests311,
          });
        }
      }
    }
  },
});

/** Public wrapper to trigger syncHistory from CLI */
export const runSyncHistory = action({
  args: { slug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.sync.syncHistory, { slug: args.slug });
  },
});

export const upsertHistory = internalMutation({
  args: {
    slug: v.string(),
    year: v.number(),
    crimeTotal: v.optional(v.number()),
    serviceRequests311: v.optional(v.number()),
    population: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("neighborhoodHistory")
      .withIndex("by_slug_year", (q) =>
        q.eq("slug", args.slug).eq("year", args.year),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.crimeTotal !== undefined ? { crimeTotal: args.crimeTotal } : {}),
        ...(args.serviceRequests311 !== undefined ? { serviceRequests311: args.serviceRequests311 } : {}),
        ...(args.population !== undefined ? { population: args.population } : {}),
      });
    } else {
      await ctx.db.insert("neighborhoodHistory", {
        slug: args.slug,
        year: args.year,
        crimeTotal: args.crimeTotal,
        serviceRequests311: args.serviceRequests311,
        population: args.population,
      });
    }
  },
});
