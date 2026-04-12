import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { verifyHmacSignature } from "./lib/hmac";
import { validateTransition, shouldRetry } from "./lib/stateMachine";

/**
 * Hermes callback response shape (from design doc).
 */
interface HermesCallbackPayload {
  taskRunId: string;
  status: "completed" | "needs_approval" | "delegate" | "failed";
  result?: string;
  costCents?: number;
  tokenUsage?: { input: number; output: number };
  delegations?: Array<{
    to: string;
    task: string;
    reason: string;
  }>;
  approvalRequest?: {
    action: string;
    reason: string;
  };
  errorClass?: string;
  errorMessage?: string;
}

/**
 * Step 1: Verify HMAC + parse JSON (runs in action — can use Web Crypto).
 * Then delegates to the internal mutation for database writes.
 */
export const processHermesCallback = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify HMAC
    const secret = process.env.HERMES_CALLBACK_SECRET;
    if (!secret) {
      console.error("HERMES_CALLBACK_SECRET not configured");
      return;
    }

    if (!args.signature) {
      console.error("Missing HMAC signature");
      return;
    }

    const valid = await verifyHmacSignature(args.body, args.signature, secret);
    if (!valid) {
      console.error("HMAC verification failed");
      await ctx.runMutation(internal.callbacks.logEvent, {
        type: "security.hmac_failed",
        payload: JSON.stringify({
          hasSignature: !!args.signature,
          bodyLength: args.body.length,
        }),
      });
      return;
    }

    // 2. Parse JSON
    let payload: HermesCallbackPayload;
    try {
      payload = JSON.parse(args.body);
    } catch {
      console.error("Malformed JSON in callback body");
      await ctx.runMutation(internal.callbacks.logEvent, {
        type: "error.json_parse",
        payload: JSON.stringify({ bodyPreview: args.body.slice(0, 200) }),
      });
      return;
    }

    // 3. Delegate to mutation for database writes
    await ctx.runMutation(internal.callbacks.applyCallbackResult, {
      taskRunId: payload.taskRunId,
      status: payload.status,
      result: payload.result,
      costCents: payload.costCents,
      tokenUsage: payload.tokenUsage
        ? JSON.stringify(payload.tokenUsage)
        : undefined,
      approvalReason: payload.approvalRequest?.reason,
      delegations: payload.delegations
        ? JSON.stringify(payload.delegations)
        : undefined,
      errorClass: payload.errorClass,
      errorMessage: payload.errorMessage,
    });
  },
});

/**
 * Step 2: Apply the verified callback result to the database.
 * This is a mutation (transactional, deterministic).
 */
export const applyCallbackResult = internalMutation({
  args: {
    taskRunId: v.string(),
    status: v.string(),
    result: v.optional(v.string()),
    costCents: v.optional(v.number()),
    tokenUsage: v.optional(v.string()),
    approvalReason: v.optional(v.string()),
    delegations: v.optional(v.string()), // JSON array of {to, task, reason}
    errorClass: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Find task run
    const taskRunId = ctx.db.normalizeId("taskRuns", args.taskRunId);
    if (!taskRunId) {
      console.error("Invalid taskRunId format:", args.taskRunId);
      return;
    }

    const taskRun = await ctx.db.get(taskRunId);
    if (!taskRun) {
      console.error("Task run not found:", args.taskRunId);
      return;
    }

    // 2. Duplicate callback check (idempotency)
    if (taskRun.status !== "running") {
      console.warn(
        "Duplicate callback for task run:",
        args.taskRunId,
        "status:",
        taskRun.status,
      );
      return;
    }

    // 3. Get parent task
    const task = await ctx.db.get(taskRun.taskId);
    if (!task) {
      console.error("Task not found for run:", args.taskRunId);
      return;
    }

    // 4. Stale parent check
    if (task.status === "cancelled") {
      await ctx.db.patch(taskRunId, {
        status: "cancelled",
        finishedAt: Date.now(),
        errorMessage: "Parent task was cancelled",
      });
      await ctx.db.insert("events", {
        taskId: task._id,
        agentId: taskRun.agentId,
        type: "task.run.cancelled_stale_parent",
        payload: JSON.stringify({ taskRunId: args.taskRunId }),
      });
      return;
    }

    // 5. Map Hermes status to task status
    const newRunStatus = args.status === "failed" ? "failed" : "succeeded";
    const newTaskStatus =
      args.status === "needs_approval"
        ? "waiting_approval"
        : args.status === "failed"
          ? "failed"
          : "completed";

    // 6. Validate state transition
    const transition = validateTransition(
      task.status,
      newTaskStatus,
      task.retryCount,
    );
    if (!transition.valid) {
      console.error("Invalid state transition:", transition.reason);
      await ctx.db.insert("events", {
        taskId: task._id,
        type: "error.invalid_transition",
        payload: JSON.stringify({
          from: task.status,
          to: newTaskStatus,
          reason: transition.reason,
        }),
      });
      return;
    }

    // 7. Update task run
    await ctx.db.patch(taskRunId, {
      status: newRunStatus,
      finishedAt: Date.now(),
      costCents: args.costCents,
      tokenUsage: args.tokenUsage,
      resultPayload: args.result
        ? JSON.stringify({ result: args.result })
        : undefined,
      errorMessage: args.errorMessage,
      hmacVerified: true,
    });

    // 8. Update task
    const taskPatch: Record<string, unknown> = {
      status: newTaskStatus,
      spentCents: task.spentCents + (args.costCents ?? 0),
    };
    if (args.result) {
      taskPatch.resultSummary = args.result.slice(0, 500);
      taskPatch.resultFull = args.result; // full deliverable, not truncated
    }
    if (args.errorMessage) {
      taskPatch.errorMessage = args.errorMessage;
    }
    await ctx.db.patch(task._id, taskPatch);

    // 9. Auto-save deliverable as document
    if (newTaskStatus === "completed" && args.result) {
      const existingDoc = await ctx.db
        .query("documents")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .unique();
      if (!existingDoc) {
        await ctx.db.insert("documents", {
          projectId: task.projectId,
          taskId: task._id,
          type: "other",
          title: task.title,
          body: args.result,
          status: "draft",
          createdByAgent: taskRun.agentId,
        });
      }
    }

    // 10. If needs_approval: create approval with 60-min expiry (renumbered from 9)
    if (args.status === "needs_approval" && args.approvalReason) {
      await ctx.db.insert("approvals", {
        taskId: task._id,
        requestedByAgentId: taskRun.agentId,
        reason: args.approvalReason,
        status: "pending",
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
    }

    // 10. Auto-retry for transient errors
    if (
      args.status === "failed" &&
      args.errorClass &&
      shouldRetry(args.errorClass, task.retryCount)
    ) {
      await ctx.db.patch(task._id, {
        status: "queued",
        retryCount: task.retryCount + 1,
        errorMessage: `Retrying after ${args.errorClass}: ${args.errorMessage ?? "unknown"}`,
      });
      await ctx.db.insert("events", {
        taskId: task._id,
        agentId: taskRun.agentId,
        type: "task.auto_retry",
        payload: JSON.stringify({
          errorClass: args.errorClass,
          retryCount: task.retryCount + 1,
        }),
      });
      return;
    }

    // 11. Append thread entry
    await ctx.db.insert("threadEntries", {
      threadId: task.threadId,
      agentId: taskRun.agentId,
      type: args.status === "failed" ? "finding" : "artifact",
      content:
        args.result ?? args.errorMessage ?? `Task ${args.status}`,
    });

    // 12. Insert audit event
    await ctx.db.insert("events", {
      taskId: task._id,
      agentId: taskRun.agentId,
      type: `task.run.${newRunStatus}`,
      payload: JSON.stringify({
        costCents: args.costCents,
        hasResult: !!args.result,
        status: args.status,
      }),
    });
  },
});

/**
 * Helper: log an event without requiring a task or agent context.
 * Used by the action for security/error events.
 */
export const logEvent = internalMutation({
  args: {
    type: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      type: args.type,
      payload: args.payload,
    });
  },
});
