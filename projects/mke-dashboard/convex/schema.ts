import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * Pre-aggregated neighborhood metrics.
   * Synced from ArcGIS + Treasurer XLSX every 24h via cron.
   * Public queries — no auth required.
   */
  neighborhoods: defineTable({
    name: v.string(),
    slug: v.string(),
    // Boundary polygon (GeoJSON stringified — Convex doesn't support nested objects well)
    boundaryGeoJson: v.optional(v.string()),

    // Community metrics
    totalProperties: v.optional(v.number()),
    ownerOccupiedCount: v.optional(v.number()),
    ownerOccupiedRate: v.optional(v.number()),
    medianAssessedValue: v.optional(v.number()),

    // Public Safety metrics
    part1CrimeCount: v.optional(v.number()),
    part1CrimeByType: v.optional(v.string()), // JSON stringified breakdown
    crimeYoYChange: v.optional(v.number()),
    fireIncidentCount: v.optional(v.number()),

    // Quality of Life metrics
    vacantBuildingCount: v.optional(v.number()),
    taxDelinquentCount: v.optional(v.number()),
    foreclosureCityCount: v.optional(v.number()),
    foreclosureBankCount: v.optional(v.number()),
    avgAssessedValue: v.optional(v.number()),

    // Wellness metrics
    foodInspectionPassRate: v.optional(v.number()),

    // Trend data (previous period values for computing trends)
    previousPeriod: v.optional(v.string()), // JSON stringified previous metrics

    // Sync metadata
    lastSyncAt: v.number(), // Unix timestamp ms
    lastSyncStatus: v.string(), // "success" | "error" | "partial"
    lastSyncError: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  /**
   * User data — linked to Clerk via tokenIdentifier.
   */
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    savedNeighborhoods: v.array(v.string()), // slugs
    preferences: v.optional(v.string()), // JSON: { locale, theme, defaultNeighborhood }
    role: v.optional(v.string()), // "city_official" or undefined
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_token", ["tokenIdentifier"]),

  /**
   * Sync log — tracks each ArcGIS sync run.
   */
  syncLogs: defineTable({
    neighborhoodSlug: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.string(), // "running" | "success" | "error"
    error: v.optional(v.string()),
    metricsUpdated: v.optional(v.number()), // count of metrics changed
    source: v.string(), // "cron" | "manual"
  }).index("by_neighborhood", ["neighborhoodSlug"]),

  /**
   * AI chat history — persisted for authenticated users.
   */
  chatHistory: defineTable({
    tokenIdentifier: v.string(),
    neighborhoodSlug: v.string(),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["tokenIdentifier"])
    .index("by_neighborhood", ["neighborhoodSlug"]),

  /**
   * Community feedback — submitted via CopilotKit chat or UI.
   */
  feedback: defineTable({
    tokenIdentifier: v.optional(v.string()), // null for anonymous
    neighborhoodSlug: v.string(),
    metricId: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
    status: v.string(), // "new" | "reviewed" | "actioned"
    reviewedBy: v.optional(v.string()),
  }).index("by_neighborhood", ["neighborhoodSlug"]),
});
