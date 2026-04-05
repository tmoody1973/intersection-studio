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
    boundaryGeoJson: v.optional(v.string()),
    envelopeJson: v.optional(v.string()), // ArcGIS envelope for spatial queries

    // Community metrics (per-neighborhood via spatial query)
    totalProperties: v.optional(v.number()),
    ownerOccupiedCount: v.optional(v.number()),
    ownerOccupiedRate: v.optional(v.number()),
    medianAssessedValue: v.optional(v.number()),

    // Public Safety metrics (from WIBR CSV + ArcGIS)
    crimeTotal: v.optional(v.number()),
    crimeViolent: v.optional(v.number()),
    crimeProperty: v.optional(v.number()),
    crimeByType: v.optional(v.string()), // JSON: {"Theft": 120, "Assault": 45, ...}
    crimeByMonth: v.optional(v.string()), // JSON: {"2026-01": 30, "2026-02": 25, ...}
    part1CrimeCount: v.optional(v.number()), // Legacy (ArcGIS MPD Monthly)
    part1CrimeByType: v.optional(v.string()), // Legacy
    crimeYoYChange: v.optional(v.number()),
    fireIncidentCount: v.optional(v.number()),
    overdoseCount: v.optional(v.number()),
    trafficCrashCount: v.optional(v.number()),

    // Quality of Life metrics
    vacantBuildingCount: v.optional(v.number()),
    vacantLandCount: v.optional(v.number()),
    taxDelinquentCount: v.optional(v.number()),
    foreclosureCityCount: v.optional(v.number()),
    foreclosureBankCount: v.optional(v.number()),
    avgAssessedValue: v.optional(v.number()),
    housingAge: v.optional(v.string()),
    serviceRequests311: v.optional(v.number()),
    serviceRequestsByType: v.optional(v.string()), // JSON
    serviceRequestsByMonth: v.optional(v.string()), // JSON
    buildingPermitCount: v.optional(v.number()),
    buildingPermitsByType: v.optional(v.string()), // JSON

    // Demographics (Census ACS, by tract → aggregated)
    population: v.optional(v.number()),
    medianIncome: v.optional(v.number()),
    povertyRate: v.optional(v.number()),
    unemploymentRate: v.optional(v.number()),
    raceBreakdown: v.optional(v.string()), // JSON
    medianHomeValue: v.optional(v.number()),

    // Economic / Housing
    propertySalesCount: v.optional(v.number()),
    medianSalePrice: v.optional(v.number()),
    totalSalesVolume: v.optional(v.number()),
    propertySalesByType: v.optional(v.string()), // JSON
    liquorLicenseCount: v.optional(v.number()),
    totalPermitInvestment: v.optional(v.number()),
    newConstructionCount: v.optional(v.number()),
    investmentByYear: v.optional(v.string()), // JSON: {"2020": 5000000, ...}
    permitsByYear: v.optional(v.string()), // JSON: {"2020": 45, ...}

    // Development Zones (ArcGIS special_districts)
    tidDistricts: v.optional(v.string()), // JSON
    bidDistricts: v.optional(v.string()), // JSON
    tinDistricts: v.optional(v.string()), // JSON
    opportunityZones: v.optional(v.string()), // JSON
    nidDistricts: v.optional(v.string()), // JSON

    // Community Resources
    libraryCount: v.optional(v.number()),
    parkCount: v.optional(v.number()),
    schoolCount: v.optional(v.number()),
    daycareCount: v.optional(v.number()),
    policeStationCount: v.optional(v.number()),
    firehouseCount: v.optional(v.number()),

    // Wellness metrics
    foodInspectionPassRate: v.optional(v.number()),
    sviScore: v.optional(v.number()),

    // Census tract mapping (for ACS lookups)
    censusTracts: v.optional(v.string()), // JSON: ["140100", "140200", ...]

    // Trend data
    previousPeriod: v.optional(v.string()),

    // Sync metadata
    lastSyncAt: v.number(),
    lastSyncStatus: v.string(),
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
