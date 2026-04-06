import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public queries — no auth required.
 * These serve the main dashboard from Convex cache (<100ms).
 */

/** Get all neighborhoods with their latest metrics. */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("neighborhoods").collect();
  },
});

/** Get a single neighborhood by slug. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("neighborhoods")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

/** Get two neighborhoods for comparison view. */
export const compare = query({
  args: { slugA: v.string(), slugB: v.string() },
  handler: async (ctx, { slugA, slugB }) => {
    const [a, b] = await Promise.all([
      ctx.db
        .query("neighborhoods")
        .withIndex("by_slug", (q) => q.eq("slug", slugA))
        .first(),
      ctx.db
        .query("neighborhoods")
        .withIndex("by_slug", (q) => q.eq("slug", slugB))
        .first(),
    ]);
    return { a, b };
  },
});

/** Get year-over-year historical data for a neighborhood. */
export const getHistory = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("neighborhoodHistory")
      .withIndex("by_slug_year", (q) => q.eq("slug", slug))
      .collect();
  },
});

/** Get neighborhood names and slugs only (for selector dropdown). */
export const listNames = query({
  args: {},
  handler: async (ctx) => {
    const neighborhoods = await ctx.db.query("neighborhoods").collect();
    return neighborhoods.map((n) => ({
      name: n.name,
      slug: n.slug,
      lastSyncAt: n.lastSyncAt,
    }));
  },
});
