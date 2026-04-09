import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List recent events for the activity feed.
 * Returns newest first, with agent name joined.
 */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const events = await ctx.db.query("events").order("desc").take(limit);

    const results = [];
    for (const event of events) {
      let agentName: string | undefined;
      if (event.agentId) {
        const agent = await ctx.db.get(event.agentId);
        agentName = agent?.name;
      }
      results.push({
        ...event,
        agentName,
      });
    }

    return results;
  },
});
