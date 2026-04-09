import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Full-text search on thread entries.
 * Powers the Cmd+K command palette.
 */
export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const results = await ctx.db
      .query("threadEntries")
      .withSearchIndex("search_content", (q) => q.search("content", args.query))
      .take(20);

    const enriched = [];
    for (const entry of results) {
      let agentName: string | undefined;
      if (entry.agentId) {
        const agent = await ctx.db.get(entry.agentId);
        agentName = agent?.name;
      }
      enriched.push({
        ...entry,
        agentName,
      });
    }

    return enriched;
  },
});
