import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Batch-save session events from the browser's event accumulator.
 * Called on AG-UI stream completion to persist the timeline for replay.
 */
export const batchSave = mutation({
  args: {
    events: v.array(
      v.object({
        sessionId: v.string(),
        taskId: v.id("tasks"),
        eventType: v.string(),
        data: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    for (const event of args.events) {
      await ctx.db.insert("sessionEvents", event);
    }

    return { saved: args.events.length };
  },
});

/**
 * Query session events for timeline replay.
 */
export const bySession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessionEvents")
      .withIndex("by_session_and_time", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

/**
 * Query session events by task (for replay from task detail).
 */
export const byTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessionEvents")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();
  },
});
