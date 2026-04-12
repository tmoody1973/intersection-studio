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

/**
 * Get a single agent with full details for the editor.
 */
export const getAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const status = await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", agent._id))
      .unique();

    return {
      ...agent,
      status: status?.status ?? "offline",
      lastHeartbeatAt: status?.lastHeartbeatAt ?? 0,
      currentTaskCount: status?.currentTaskCount ?? 0,
      dailySpendCents: status?.dailySpendCents ?? 0,
    };
  },
});

/**
 * Update an agent's soul markdown. Owner-only.
 */
export const updateSoul = mutation({
  args: {
    agentId: v.id("agents"),
    soulMarkdown: v.string(),
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
      throw new Error("Only owners can edit agent souls");
    }

    await ctx.db.patch(args.agentId, { soulMarkdown: args.soulMarkdown });

    await ctx.db.insert("events", {
      agentId: args.agentId,
      type: "agent.soul_updated",
      payload: JSON.stringify({
        contentLength: args.soulMarkdown.length,
      }),
    });
  },
});

/**
 * Update an agent's configuration. Owner-only.
 */
export const updateConfig = mutation({
  args: {
    agentId: v.id("agents"),
    maxDailyBudgetCents: v.optional(v.number()),
    maxConcurrentTasks: v.optional(v.number()),
    defaultTimeoutMinutes: v.optional(v.number()),
    reportsTo: v.optional(v.id("agents")),
    delegationPermissions: v.optional(v.array(v.id("agents"))),
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
      throw new Error("Only owners can update agent config");
    }

    const { agentId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    if (updates.maxDailyBudgetCents !== undefined)
      patch.maxDailyBudgetCents = updates.maxDailyBudgetCents;
    if (updates.maxConcurrentTasks !== undefined)
      patch.maxConcurrentTasks = updates.maxConcurrentTasks;
    if (updates.defaultTimeoutMinutes !== undefined)
      patch.defaultTimeoutMinutes = updates.defaultTimeoutMinutes;
    if (updates.reportsTo !== undefined) patch.reportsTo = updates.reportsTo;
    if (updates.delegationPermissions !== undefined)
      patch.delegationPermissions = updates.delegationPermissions;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(agentId, patch);
    }

    await ctx.db.insert("events", {
      agentId,
      type: "agent.config_updated",
      payload: JSON.stringify(Object.keys(patch)),
    });
  },
});

/**
 * Update an agent's allowed tools. Owner-only.
 */
export const updateTools = mutation({
  args: {
    agentId: v.id("agents"),
    allowedTools: v.array(v.string()),
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
      throw new Error("Only owners can update agent tools");
    }

    await ctx.db.patch(args.agentId, { allowedTools: args.allowedTools });

    await ctx.db.insert("events", {
      agentId: args.agentId,
      type: "agent.tools_updated",
      payload: JSON.stringify({ tools: args.allowedTools }),
    });
  },
});
