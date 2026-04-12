import { action } from "./_generated/server";
import { v } from "convex/values";
import { callProxy } from "./lib/proxy";

/**
 * Search the GBrain knowledge graph.
 * Called from the dashboard's CommandPalette Brain tab.
 * This is an action (not a query) because it makes an HTTP call to Fly.io.
 */
export const searchBrain = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!args.query.trim()) return [];

    try {
      const result = await callProxy("/brain/query", { q: args.query }, 3000);
      // GBrain returns { results: [...] } or an array directly
      const raw = Array.isArray(result) ? result : ((result.results ?? []) as unknown[]);
      return raw.slice(0, 20);
    } catch (err) {
      console.error("Brain search failed:", err);
      return [];
    }
  },
});
