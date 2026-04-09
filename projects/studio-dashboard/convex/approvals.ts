import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateTransition } from "./lib/stateMachine";

/**
 * List pending approvals for the floating overlay.
 */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(10);

    const results = [];
    for (const approval of approvals) {
      const task = await ctx.db.get(approval.taskId);
      const agent = await ctx.db.get(approval.requestedByAgentId);
      results.push({
        ...approval,
        taskTitle: task?.title ?? "Unknown task",
        agentName: agent?.name ?? "Unknown agent",
      });
    }

    return results;
  },
});

/**
 * Resolve an approval (approve or reject). Owner-only.
 * Guarded: checks task is still in waiting_approval state before acting.
 */
export const resolve = mutation({
  args: {
    approvalId: v.id("approvals"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth + RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "owner") {
      throw new Error("Only owners can resolve approvals");
    }

    // Get approval
    const approval = await ctx.db.get(args.approvalId);
    if (!approval) throw new Error("Approval not found");

    // Guard: check approval is still pending
    if (approval.status !== "pending") {
      throw new Error(`This approval has already been ${approval.status}`);
    }

    // Guard: check task is still in waiting_approval
    const task = await ctx.db.get(approval.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "waiting_approval") {
      throw new Error("This task has already been resolved");
    }

    // Determine new task status
    const newTaskStatus = args.decision === "approved" ? "completed" : "failed";

    // Validate transition
    const transition = validateTransition(task.status, newTaskStatus, task.retryCount);
    if (!transition.valid) {
      throw new Error(`Cannot resolve: ${transition.reason}`);
    }

    // Update approval
    await ctx.db.patch(args.approvalId, {
      status: args.decision,
      decidedByTokenIdentifier: identity.tokenIdentifier,
      decisionReason: args.reason,
    });

    // Update task
    await ctx.db.patch(task._id, {
      status: newTaskStatus,
      ...(args.decision === "rejected"
        ? { errorMessage: args.reason ?? "Rejected by owner" }
        : {}),
    });

    // Log event
    await ctx.db.insert("events", {
      taskId: task._id,
      agentId: approval.requestedByAgentId,
      type: `approval.${args.decision}`,
      payload: JSON.stringify({
        reason: args.reason,
        decidedBy: identity.tokenIdentifier,
      }),
    });
  },
});
