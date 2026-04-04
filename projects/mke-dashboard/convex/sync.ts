import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  ENDPOINTS,
  queryCount,
  queryStats,
  fetchNeighborhoodBoundary,
} from "./etl/arcgis";

/**
 * Sync a single neighborhood's metrics from ArcGIS.
 *
 * Current approach: MPROP metrics are citywide (the NEIGHBORHOOD field uses
 * assessor numeric codes, not DCD names). Per-neighborhood filtering requires
 * a census tract → DCD neighborhood mapping that will be built in Phase 3.
 *
 * For now: citywide totals are real ArcGIS data. Vacancy and foreclosure
 * counts are also citywide from their respective layers.
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
      // 1. Fetch neighborhood boundary GeoJSON (for map display)
      let boundaryGeoJson: string | undefined;
      try {
        boundaryGeoJson = await fetchNeighborhoodBoundary(name);
      } catch {
        boundaryGeoJson = undefined;
      }

      // 2. Query MPROP citywide metrics
      // NOTE: These are citywide until we build tract→neighborhood mapping
      const [totalProperties, ownerOccupiedCount, avgAssessedValue] =
        await Promise.all([
          queryCount(ENDPOINTS.mprop, "1=1"),
          queryCount(ENDPOINTS.mprop, "OWN_OCPD = 'O'"),
          queryStats(ENDPOINTS.mprop, "C_A_TOTAL", "avg", "C_A_TOTAL > 0"),
        ]);

      const ownerOccupiedRate =
        totalProperties > 0
          ? Math.round((ownerOccupiedCount / totalProperties) * 100)
          : 0;

      // 3. Vacancy from Strong Neighborhoods (citywide)
      let vacantBuildingCount: number | undefined;
      try {
        vacantBuildingCount = await queryCount(
          ENDPOINTS.strongNeighborhoods,
          "1=1",
        );
      } catch {
        vacantBuildingCount = undefined;
      }

      // 4. Foreclosures (citywide, split by type)
      let foreclosureCityCount: number | undefined;
      let foreclosureBankCount: number | undefined;
      try {
        [foreclosureCityCount, foreclosureBankCount] = await Promise.all([
          queryCount(ENDPOINTS.foreclosedCityOwned, "1=1"),
          queryCount(ENDPOINTS.foreclosedBankOwned, "1=1"),
        ]);
      } catch {
        foreclosureCityCount = undefined;
        foreclosureBankCount = undefined;
      }

      // 5. Upsert neighborhood record
      await ctx.runMutation(internal.sync.upsertNeighborhood, {
        name,
        slug,
        boundaryGeoJson,
        totalProperties,
        ownerOccupiedCount,
        ownerOccupiedRate,
        medianAssessedValue: avgAssessedValue ?? undefined,
        avgAssessedValue: avgAssessedValue ?? undefined,
        vacantBuildingCount,
        foreclosureCityCount,
        foreclosureBankCount,
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
    totalProperties: v.optional(v.number()),
    ownerOccupiedCount: v.optional(v.number()),
    ownerOccupiedRate: v.optional(v.number()),
    medianAssessedValue: v.optional(v.number()),
    part1CrimeCount: v.optional(v.number()),
    part1CrimeByType: v.optional(v.string()),
    vacantBuildingCount: v.optional(v.number()),
    foreclosureCityCount: v.optional(v.number()),
    foreclosureBankCount: v.optional(v.number()),
    avgAssessedValue: v.optional(v.number()),
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
      await ctx.db.patch(runningLog._id, {
        completedAt: Date.now(),
        status,
        error,
      });
    }
  },
});
