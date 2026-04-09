import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { shouldRetry } from "./lib/stateMachine";

/**
 * Check all agents' health, enforce timeouts, and expire approvals.
 *
 * Runs every 2 minutes via cron. The staggering happens inside
 * this function (sequential iteration with short delays) rather
 * than 12 separate crons, since Convex actions handle the async work.
 */
export const checkAllAgents = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. Get all agents
    const agents = await ctx.runQuery(internal.heartbeat.listAgents);

    // 2. Check each agent's health (sequential to avoid burst)
    for (const agent of agents) {
      try {
        await ctx.runMutation(internal.heartbeat.updateAgentHealth, {
          agentId: agent._id,
          isOnline: true, // TODO: actual Fly.io health check when deployed
        });
      } catch (error) {
        console.error(`Health check failed for ${agent.name}:`, error);
        await ctx.runMutation(internal.heartbeat.updateAgentHealth, {
          agentId: agent._id,
          isOnline: false,
          errorMessage: error instanceof Error ? error.message : "Health check failed",
        });
      }
    }

    // 3. Check for timed-out tasks
    await ctx.runMutation(internal.heartbeat.enforceTimeouts);

    // 4. Check for expired approvals
    await ctx.runMutation(internal.heartbeat.expireApprovals);
  },
});

// --- Internal queries ---

export const listAgents = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// --- Internal mutations ---

export const updateAgentHealth = internalMutation({
  args: {
    agentId: v.id("agents"),
    isOnline: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .unique();

    if (!status) return;

    await ctx.db.patch(status._id, {
      status: args.isOnline ? "online" : "offline",
      lastHeartbeatAt: Date.now(),
      errorMessage: args.errorMessage,
    });
  },
});

/**
 * Scan running tasks and enforce per-agent timeouts.
 * If a task has been running longer than its agent's defaultTimeoutMinutes,
 * mark it failed and trigger auto-retry if eligible.
 */
export const enforceTimeouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all running task runs
    const runningRuns = await ctx.db
      .query("taskRuns")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();

    const now = Date.now();

    for (const run of runningRuns) {
      // Get the agent's timeout setting
      const agent = await ctx.db.get(run.agentId);
      if (!agent) continue;

      const timeoutMs = agent.defaultTimeoutMinutes * 60 * 1000;
      const elapsed = now - run.startedAt;

      if (elapsed <= timeoutMs) continue;

      // Timed out! Mark the run as failed
      await ctx.db.patch(run._id, {
        status: "failed",
        finishedAt: now,
        errorMessage: `Timed out after ${agent.defaultTimeoutMinutes} minutes`,
      });

      // Get the parent task
      const task = await ctx.db.get(run.taskId);
      if (!task || task.status !== "running") continue;

      // Check if we should auto-retry
      if (shouldRetry("TimeoutError", task.retryCount)) {
        await ctx.db.patch(task._id, {
          status: "queued",
          retryCount: task.retryCount + 1,
          errorMessage: `Timed out, retrying (attempt ${task.retryCount + 2})`,
        });

        await ctx.db.insert("events", {
          taskId: task._id,
          agentId: run.agentId,
          type: "task.timeout_retry",
          payload: JSON.stringify({
            elapsed: Math.round(elapsed / 1000),
            timeoutMinutes: agent.defaultTimeoutMinutes,
            retryCount: task.retryCount + 1,
          }),
        });

        // Re-dispatch
        await ctx.scheduler.runAfter(
          0,
          internal.tasks.dispatchTask,
          { taskId: task._id },
        );
      } else {
        // Max retries exhausted
        await ctx.db.patch(task._id, {
          status: "failed",
          errorMessage: `Timed out after ${agent.defaultTimeoutMinutes} minutes (no retries left)`,
        });

        await ctx.db.insert("events", {
          taskId: task._id,
          agentId: run.agentId,
          type: "task.timeout_final",
          payload: JSON.stringify({
            elapsed: Math.round(elapsed / 1000),
            timeoutMinutes: agent.defaultTimeoutMinutes,
          }),
        });
      }
    }
  },
});

/**
 * Expire approvals that have been pending for more than their expiresAt time.
 * Default: 60 minutes. Marks the approval as rejected and the task as failed.
 */
export const expireApprovals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const pendingApprovals = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const now = Date.now();

    for (const approval of pendingApprovals) {
      if (now < approval.expiresAt) continue;

      // Expire the approval
      await ctx.db.patch(approval._id, {
        status: "rejected",
        decisionReason: "Expired after 60 minutes",
      });

      // Mark the task as failed
      const task = await ctx.db.get(approval.taskId);
      if (task && task.status === "waiting_approval") {
        await ctx.db.patch(task._id, {
          status: "failed",
          errorMessage: "Approval expired after 60 minutes",
        });

        await ctx.db.insert("events", {
          taskId: task._id,
          agentId: approval.requestedByAgentId,
          type: "approval.expired",
          payload: JSON.stringify({
            approvalId: approval._id,
            reason: approval.reason,
          }),
        });
      }
    }
  },
});

/**
 * Reset daily spend counters for all agents. Runs at midnight UTC.
 */
export const resetDailySpend = internalMutation({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db.query("agentStatus").collect();
    for (const status of statuses) {
      await ctx.db.patch(status._id, { dailySpendCents: 0 });
    }
  },
});
