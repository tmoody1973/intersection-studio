import { internalAction, internalMutation } from "./_generated/server";
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

/**
 * DCD neighborhood names (uppercase, matching the boundaries layer).
 */
const NEIGHBORHOODS: Array<{ name: string; slug: string; dcdName: string }> = [
  { name: "Amani", slug: "amani", dcdName: "AMANI" },
  { name: "Borchert Field", slug: "borchert-field", dcdName: "BORCHERT FIELD" },
  { name: "Franklin Heights", slug: "franklin-heights", dcdName: "FRANKLIN HEIGHTS" },
  { name: "Harambee", slug: "harambee", dcdName: "HARAMBEE" },
  { name: "Havenwoods", slug: "havenwoods", dcdName: "HAVENWOODS" },
  { name: "Lindsay Heights", slug: "lindsay-heights", dcdName: "LINDSAY PARK" },
  { name: "Metcalfe Park", slug: "metcalfe-park", dcdName: "METCALFE PARK" },
  { name: "Sherman Park", slug: "sherman-park", dcdName: "SHERMAN PARK" },
];

/**
 * Sync a single neighborhood using SPATIAL ENVELOPE queries.
 * Each metric is filtered to the neighborhood's bounding box.
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
      // 1. Find the DCD name for this neighborhood
      const nhDef = NEIGHBORHOODS.find((n) => n.slug === slug);
      if (!nhDef) throw new Error(`Unknown neighborhood slug: ${slug}`);

      // 2. Fetch boundary and build envelope
      const boundaryGeoJson = await fetchNeighborhoodBoundary(nhDef.dcdName);
      const envelope = buildEnvelopeFromGeoJSON(boundaryGeoJson);

      // 3. MPROP metrics (spatial)
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

      // 4. Vacant land (spatial)
      const vacantLandCount = await spatialCount(
        ENDPOINTS.mprop,
        "C_A_CLASS = '5'",
        envelope,
      );

      // 5. Vacant buildings from Strong Neighborhoods (spatial)
      const vacantBuildingCount = await spatialCount(
        ENDPOINTS.strongNeighborhoods,
        "1=1",
        envelope,
      );

      // 6. Foreclosures (spatial)
      const [foreclosureCityCount, foreclosureBankCount] = await Promise.all([
        spatialCount(ENDPOINTS.foreclosedCityOwned, "1=1", envelope),
        spatialCount(ENDPOINTS.foreclosedBankOwned, "1=1", envelope),
      ]);

      // 7. Housing age distribution (spatial) — sample up to 2000 parcels
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

      // 8. Crime by type (spatial across MPD layers)
      let part1CrimeCount = 0;
      const crimeByType: Record<string, number> = {};
      const crimeTypes = [
        "Homicide", "Arson", "Sexual Assault", "Criminal Damage",
        "Robbery", "Burglary", "Theft", "Vehicle Theft",
        "Locked Vehicle", "Assault",
      ];

      // Query crime layers in parallel (batches of 3 to avoid hammering)
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
          crimeByType[type] = counts[i];
          part1CrimeCount += counts[i];
        });
      }

      // 9. Census tracts in this neighborhood (for future ACS queries)
      let censusTracts: string | undefined;
      try {
        const tractRecords = await spatialFeatures(
          ENDPOINTS.mprop,
          "GEO_TRACT IS NOT NULL",
          "GEO_TRACT",
          envelope,
          5000,
        );
        const tracts = [
          ...new Set(tractRecords.map((r) => String(r.GEO_TRACT))),
        ];
        censusTracts = JSON.stringify(tracts);
      } catch {
        censusTracts = undefined;
      }

      // 10. CSV Data Sources (daily updated, point-in-envelope)
      // Each wrapped in try/catch — CSV failures don't break the sync

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

      let serviceRequests: { total?: number; byType?: string; byMonth?: string } = {};
      try {
        const sr = await fetch311Data(envelope);
        serviceRequests = {
          total: sr.total,
          byType: JSON.stringify(sr.byType),
          byMonth: JSON.stringify(sr.byMonth),
        };
      } catch (e) {
        console.error("311 CSV fetch failed:", e);
      }

      let csvVacantCount: number | undefined;
      try {
        const vb = await fetchVacantBuildingData(envelope);
        csvVacantCount = vb.total;
      } catch (e) {
        console.error("Vacant buildings CSV fetch failed:", e);
      }

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

      // 11. Upsert with ALL data sources
      await ctx.runMutation(internal.sync.upsertNeighborhood, {
        name,
        slug,
        boundaryGeoJson,
        envelopeJson: JSON.stringify(envelope),
        // MPROP (ArcGIS spatial)
        totalProperties,
        ownerOccupiedCount,
        ownerOccupiedRate,
        medianAssessedValue: avgAssessedValue ?? undefined,
        avgAssessedValue: avgAssessedValue ?? undefined,
        vacantLandCount,
        vacantBuildingCount: csvVacantCount ?? vacantBuildingCount,
        foreclosureCityCount,
        foreclosureBankCount,
        housingAge,
        censusTracts,
        // Crime (WIBR CSV — more detailed than ArcGIS MPD)
        crimeTotal: crimeData.total,
        crimeViolent: crimeData.violent,
        crimeProperty: crimeData.property,
        crimeByType: crimeData.byType,
        crimeByMonth: crimeData.byMonth,
        part1CrimeCount, // Keep ArcGIS crime as fallback
        part1CrimeByType: JSON.stringify(crimeByType),
        // 311 Service Requests
        serviceRequests311: serviceRequests.total,
        serviceRequestsByType: serviceRequests.byType,
        serviceRequestsByMonth: serviceRequests.byMonth,
        // Building Permits
        buildingPermitCount: permitData.total,
        buildingPermitsByType: permitData.byType,
        // EMS / Safety
        overdoseCount,
        trafficCrashCount,
        // Sync
        lastSyncAt: Date.now(),
        lastSyncStatus: "success",
      });

      await ctx.runMutation(internal.sync.logSyncComplete, {
        neighborhoodSlug: slug,
        startedAt,
        status: "success",
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
    // Crime (WIBR CSV)
    crimeTotal: v.optional(v.number()),
    crimeViolent: v.optional(v.number()),
    crimeProperty: v.optional(v.number()),
    crimeByType: v.optional(v.string()),
    crimeByMonth: v.optional(v.string()),
    // Crime (ArcGIS MPD — legacy/fallback)
    part1CrimeCount: v.optional(v.number()),
    part1CrimeByType: v.optional(v.string()),
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
      const previousPeriod = JSON.stringify({
        totalProperties: existing.totalProperties,
        ownerOccupiedRate: existing.ownerOccupiedRate,
        part1CrimeCount: existing.part1CrimeCount,
        vacantBuildingCount: existing.vacantBuildingCount,
        foreclosureCityCount: existing.foreclosureCityCount,
        avgAssessedValue: existing.avgAssessedValue,
        snapshotAt: existing.lastSyncAt,
      });
      await ctx.db.patch(existing._id, { ...args, previousPeriod });
    } else {
      await ctx.db.insert("neighborhoods", {
        ...args,
        previousPeriod: undefined,
        lastSyncError: undefined,
        crimeYoYChange: undefined,
        fireIncidentCount: undefined,
        taxDelinquentCount: undefined,
        foodInspectionPassRate: undefined,
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
