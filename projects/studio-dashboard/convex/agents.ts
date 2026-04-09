import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all agents with their status (joined query).
 * Powers the org chart in the dashboard.
 */
export const listWithStatus = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const results = [];

    for (const agent of agents) {
      const status = await ctx.db
        .query("agentStatus")
        .withIndex("by_agentId", (q) => q.eq("agentId", agent._id))
        .unique();

      results.push({
        ...agent,
        status: status?.status ?? "offline",
        lastHeartbeatAt: status?.lastHeartbeatAt ?? 0,
        currentTaskCount: status?.currentTaskCount ?? 0,
        dailySpendCents: status?.dailySpendCents ?? 0,
      });
    }

    return results;
  },
});

/**
 * Update an agent's model. Owner-only action.
 * Powers the per-agent model picker dropdown.
 */
export const updateModel = mutation({
  args: {
    agentId: v.id("agents"),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "owner") {
      throw new Error("Only owners can change agent models");
    }

    await ctx.db.patch(args.agentId, { model: args.model });

    await ctx.db.insert("events", {
      agentId: args.agentId,
      type: "agent.model_changed",
      payload: JSON.stringify({ newModel: args.model }),
    });
  },
});
