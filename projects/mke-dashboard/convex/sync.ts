import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  ENDPOINTS,
  queryCount,
  queryStats,
  spatialCount,
  fetchNeighborhoodBoundary,
} from "./etl/arcgis";

/**
 * Sync a single neighborhood's metrics from ArcGIS + external sources.
 * Called by the cron job or manually by city officials.
 */
export const syncNeighborhood = internalAction({
  args: {
    name: v.string(),
    slug: v.string(),
    source: v.string(), // "cron" | "manual"
  },
  handler: async (ctx, { name, slug, source }) => {
    const startedAt = Date.now();

    // Log sync start
    await ctx.runMutation(internal.sync.logSyncStart, {
      neighborhoodSlug: slug,
      startedAt,
      source,
    });

    try {
      // 1. Fetch neighborhood boundary
      const boundaryGeoJson = await fetchNeighborhoodBoundary(name);

      // Parse boundary to extract geometry for spatial queries
      const boundary = JSON.parse(boundaryGeoJson);
      const geometry =
        boundary.features?.[0]?.geometry
          ? JSON.stringify(boundary.features[0].geometry)
          : undefined;

      if (!geometry) {
        throw new Error(`No boundary geometry found for ${name}`);
      }

      // 2. Query MPROP metrics within boundary
      const [totalProperties, ownerOccupiedCount, avgAssessedValue] =
        await Promise.all([
          spatialCount(ENDPOINTS.mprop, "1=1", geometry),
          spatialCount(ENDPOINTS.mprop, "OWN_OCPD = 'O'", geometry),
          queryStats(ENDPOINTS.mprop, "C_A_TOTAL", "avg", "1=1"),
        ]);

      const ownerOccupiedRate =
        totalProperties > 0
          ? Math.round((ownerOccupiedCount / totalProperties) * 100)
          : 0;

      // 3. Query vacancy from Strong Neighborhoods
      const vacantBuildingCount = await spatialCount(
        ENDPOINTS.strongNeighborhoods,
        "1=1",
        geometry,
      );

      // 4. Query foreclosures
      const [foreclosureCityCount, foreclosureBankCount] = await Promise.all([
        spatialCount(ENDPOINTS.foreclosedCityOwned, "1=1", geometry),
        spatialCount(ENDPOINTS.foreclosedBankOwned, "1=1", geometry),
      ]);

      // 5. Query crime (aggregate across all 10 layers)
      // MPD Monthly has layers 0-9 for different crime types
      let part1CrimeCount = 0;
      const crimeByType: Record<string, number> = {};
      const crimeTypes = [
        "Homicide",
        "Arson",
        "Sexual Assault",
        "Criminal Damage",
        "Robbery",
        "Burglary",
        "Theft",
        "Vehicle Theft",
        "Locked Vehicle",
        "Assault",
      ];

      for (let i = 0; i < crimeTypes.length; i++) {
        try {
          const count = await spatialCount(
            `${ENDPOINTS.crimeMonthly}/${i}`,
            "1=1",
            geometry,
          );
          crimeByType[crimeTypes[i]] = count;
          part1CrimeCount += count;
        } catch {
          // Some layers may not respond — skip
          crimeByType[crimeTypes[i]] = 0;
        }
      }

      // 6. Upsert neighborhood record
      await ctx.runMutation(internal.sync.upsertNeighborhood, {
        name,
        slug,
        boundaryGeoJson,
        totalProperties,
        ownerOccupiedCount,
        ownerOccupiedRate,
        medianAssessedValue: avgAssessedValue ?? undefined,
        part1CrimeCount,
        part1CrimeByType: JSON.stringify(crimeByType),
        vacantBuildingCount,
        foreclosureCityCount,
        foreclosureBankCount,
        avgAssessedValue: avgAssessedValue ?? undefined,
        lastSyncAt: Date.now(),
        lastSyncStatus: "success",
      });

      // Log sync success
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

/** Internal mutation: upsert a neighborhood's metrics. */
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
      // Save current metrics as previousPeriod before overwriting
      const previousPeriod = JSON.stringify({
        totalProperties: existing.totalProperties,
        ownerOccupiedRate: existing.ownerOccupiedRate,
        part1CrimeCount: existing.part1CrimeCount,
        vacantBuildingCount: existing.vacantBuildingCount,
        foreclosureCityCount: existing.foreclosureCityCount,
        avgAssessedValue: existing.avgAssessedValue,
        snapshotAt: existing.lastSyncAt,
      });

      await ctx.db.patch(existing._id, {
        ...args,
        previousPeriod,
      });
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

/** Log sync start. */
export const logSyncStart = internalMutation({
  args: {
    neighborhoodSlug: v.string(),
    startedAt: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", {
      ...args,
      status: "running",
    });
  },
});

/** Log sync completion. */
export const logSyncComplete = internalMutation({
  args: {
    neighborhoodSlug: v.string(),
    startedAt: v.number(),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { neighborhoodSlug, startedAt, status, error }) => {
    // Find the running log entry
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

// Need this import for internal references
import { internal } from "./_generated/api";
