import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { verifyHmacSignature } from "./lib/hmac";

/**
 * Endpoints called by the Hermes studio-dashboard plugin.
 * All endpoints verify HMAC signatures before processing.
 */

async function verifyRequest(
  body: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env.HERMES_CALLBACK_SECRET;
  if (!secret) {
    console.error("HERMES_CALLBACK_SECRET not configured");
    return false;
  }
  if (!signature) {
    console.error("Missing HMAC signature");
    return false;
  }
  return await verifyHmacSignature(body, signature, secret);
}

/**
 * Get project context for the pre_llm_call hook.
 */
export const getProjectContext = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const valid = await verifyRequest(args.body, args.signature);
    if (!valid) {
      return { error: "HMAC verification failed" };
    }

    let payload;
    try {
      payload = JSON.parse(args.body);
    } catch {
      return { error: "Invalid JSON" };
    }

    const { projectId, taskRunId } = payload;
    if (!projectId) {
      return { error: "projectId required" };
    }

    const result: Record<string, unknown> = await ctx.runQuery(
      internal.pluginEndpoints.queryProjectContext,
      {
        projectId,
        taskRunId: taskRunId ?? undefined,
      },
    );

    return result;
  },
});

export const queryProjectContext = internalQuery({
  args: {
    projectId: v.id("projects"),
    taskRunId: v.optional(v.id("taskRuns")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { error: "Project not found" };
    }

    // Get sources
    const sources = await ctx.db
      .query("projectSources")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .take(20);

    const sourcesData = sources.map((s) => ({
      type: s.type,
      name: s.name,
      content: s.content,
      url: s.url,
    }));

    // Get thread entries via task run
    let threadEntries: Array<{ type: string; content: string }> = [];
    if (args.taskRunId) {
      const taskRun = await ctx.db.get(args.taskRunId);
      if (taskRun) {
        const task = await ctx.db.get(taskRun.taskId);
        if (task) {
          const entries = await ctx.db
            .query("threadEntries")
            .withIndex("by_threadId", (q) => q.eq("threadId", task.threadId))
            .order("desc")
            .take(20);

          threadEntries = entries.reverse().map((e) => ({
            type: e.type,
            content: e.content,
          }));
        }
      }
    }

    return {
      phase: project.phase,
      name: project.name,
      description: project.description,
      sources: sourcesData,
      thread: threadEntries,
    };
  },
});

/**
 * Log tool usage from the post_tool_call hook.
 */
export const logToolUsage = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const valid = await verifyRequest(args.body, args.signature);
    if (!valid) return;

    let payload;
    try {
      payload = JSON.parse(args.body);
    } catch {
      return;
    }

    const { taskRunId, toolName, args: toolArgs, resultPreview } = payload;
    if (!taskRunId || !toolName) return;

    await ctx.runMutation(internal.pluginEndpoints.insertToolEvent, {
      taskRunId,
      toolName,
      toolArgs: toolArgs ?? "",
      resultPreview: resultPreview ?? "",
    });
  },
});

export const insertToolEvent = internalMutation({
  args: {
    taskRunId: v.id("taskRuns"),
    toolName: v.string(),
    toolArgs: v.string(),
    resultPreview: v.string(),
  },
  handler: async (ctx, args) => {
    const taskRun = await ctx.db.get(args.taskRunId);
    if (!taskRun) return;

    await ctx.db.insert("events", {
      taskId: taskRun.taskId,
      agentId: taskRun.agentId,
      type: "agent.tool_used",
      payload: JSON.stringify({
        tool: args.toolName,
        args: args.toolArgs.slice(0, 200),
        result: args.resultPreview.slice(0, 200),
      }),
    });
  },
});

/**
 * Report progress from the report_progress tool.
 */
export const reportProgress = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const valid = await verifyRequest(args.body, args.signature);
    if (!valid) return;

    let payload;
    try {
      payload = JSON.parse(args.body);
    } catch {
      return;
    }

    const { taskRunId, type, content } = payload;
    if (!taskRunId || !content) return;

    await ctx.runMutation(internal.pluginEndpoints.insertProgressEntry, {
      taskRunId,
      entryType: type ?? "finding",
      content,
    });
  },
});

export const insertProgressEntry = internalMutation({
  args: {
    taskRunId: v.id("taskRuns"),
    entryType: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const taskRun = await ctx.db.get(args.taskRunId);
    if (!taskRun) return;

    const task = await ctx.db.get(taskRun.taskId);
    if (!task) return;

    await ctx.db.insert("threadEntries", {
      threadId: task.threadId,
      agentId: taskRun.agentId,
      type: args.entryType,
      content: args.content,
    });

    await ctx.db.insert("events", {
      taskId: taskRun.taskId,
      agentId: taskRun.agentId,
      type: "agent.progress_reported",
      payload: JSON.stringify({
        entryType: args.entryType,
        contentLength: args.content.length,
      }),
    });
  },
});
