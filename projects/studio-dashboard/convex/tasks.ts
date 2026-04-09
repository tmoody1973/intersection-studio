import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { validateTransition } from "./lib/stateMachine";
import { detectCircularDelegation } from "./lib/delegation";

/**
 * Create a new task. Public mutation — requires Clerk auth.
 * Only "owner" role can create tasks (RBAC).
 */
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    ownerAgentId: v.id("agents"),
    priority: v.optional(v.string()),
    budgetCents: v.optional(v.number()),
    parentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // RBAC check
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.role !== "owner") {
      throw new Error("Only owners can create tasks");
    }

    // Budget check
    const agent = await ctx.db.get(args.ownerAgentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Circular delegation check (if this is a delegated task)
    if (args.parentTaskId) {
      const isCircular = await detectCircularDelegation(
        ctx,
        args.parentTaskId,
        args.ownerAgentId,
      );
      if (isCircular) {
        throw new Error("Circular delegation detected");
      }
    }

    // Generate thread ID
    const threadId = args.parentTaskId
      ? (await ctx.db.get(args.parentTaskId))?.threadId ?? crypto.randomUUID()
      : crypto.randomUUID();

    // Create task
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      createdBy: identity.tokenIdentifier,
      ownerAgentId: args.ownerAgentId,
      status: "queued",
      priority: args.priority ?? "normal",
      budgetCents: args.budgetCents,
      spentCents: 0,
      parentTaskId: args.parentTaskId,
      threadId,
      retryCount: 0,
    });

    // Log event
    await ctx.db.insert("events", {
      taskId,
      agentId: args.ownerAgentId,
      type: "task.created",
      payload: JSON.stringify({
        title: args.title,
        priority: args.priority ?? "normal",
        createdBy: identity.tokenIdentifier,
      }),
    });

    // Append initial thread entry
    await ctx.db.insert("threadEntries", {
      threadId,
      type: "constraint",
      content: `Task created: ${args.title}\n\n${args.description}`,
    });

    // Schedule dispatch
    await ctx.scheduler.runAfter(0, internal.tasks.dispatchTask, { taskId });

    return taskId;
  },
});

/**
 * Dispatch a queued task to its assigned Hermes agent on Fly.io.
 * Internal action — uses HTTP to call the Hermes API.
 */
export const dispatchTask = internalAction({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    // Read task + agent
    const task = await ctx.runQuery(internal.tasks.getTaskWithAgent, {
      taskId: args.taskId,
    });
    if (!task) {
      console.error("Task not found for dispatch:", args.taskId);
      return;
    }
    if (task.status !== "queued") {
      console.warn("Task not in queued state:", args.taskId, task.status);
      return;
    }

    // Check agent status
    const agentStatus = await ctx.runQuery(internal.tasks.getAgentStatus, {
      agentId: task.ownerAgentId,
    });
    if (agentStatus && agentStatus.status === "offline") {
      console.warn("Agent offline, keeping task queued:", task.agentName);
      return;
    }

    // Transition to running
    const taskRunId = await ctx.runMutation(
      internal.tasks.markTaskDispatched,
      {
        taskId: args.taskId,
        agentId: task.ownerAgentId,
      },
    );
    if (!taskRunId) return;

    // Read thread context for the agent
    const threadEntries = await ctx.runQuery(
      internal.tasks.getThreadEntries,
      { threadId: task.threadId },
    );
    const threadContext = threadEntries
      .map((e) => `[${e.type}] ${e.content}`)
      .join("\n\n");

    // Build the Hermes API request
    const hermesUrl = process.env.HERMES_API_URL;
    const studioApiKey = process.env.STUDIO_API_KEY;
    const callbackUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

    if (!hermesUrl || !studioApiKey || !callbackUrl) {
      console.error("Missing env vars: HERMES_API_URL, STUDIO_API_KEY, or NEXT_PUBLIC_CONVEX_SITE_URL");
      await ctx.runMutation(internal.tasks.markTaskFailed, {
        taskId: args.taskId,
        taskRunId,
        errorMessage: "Server configuration error",
        errorClass: "ConfigurationError",
      });
      return;
    }

    // Call Hermes API
    const systemPrompt = [
      task.agentSoul ?? `You are ${task.agentName}, an agent at Intersection Studio.`,
      "",
      "## Thread Context (previous decisions and findings)",
      threadContext,
      "",
      "## Your Task",
      task.description,
      "",
      "## Response Format",
      "Respond with a JSON object:",
      '{ "status": "completed" | "needs_approval" | "failed",',
      '  "result": "your output text",',
      '  "approvalRequest": { "action": "what needs approval", "reason": "why" } }',
    ].join("\n");

    try {
      const response = await fetch(
        `${hermesUrl}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${studioApiKey}`,
            "Content-Type": "application/json",
            "X-Agent-Profile": task.hermesProfileId,
          },
          body: JSON.stringify({
            model: "hermes-agent",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: task.description },
            ],
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!response.ok) {
        const errorClass =
          response.status === 429
            ? "RateLimitError"
            : response.status === 503
              ? "ServiceUnavailable"
              : "HermesApiError";

        await ctx.runMutation(internal.tasks.markTaskFailed, {
          taskId: args.taskId,
          taskRunId,
          errorMessage: `Hermes returned ${response.status}: ${response.statusText}`,
          errorClass,
        });
        return;
      }

      // For fire-and-callback: Hermes will call back /hermes-callback
      // when the task completes. The response here is just the initial ack.
      // For simple tasks that complete synchronously, we process the
      // response directly.
      const result = await response.json();

      if (result.choices?.[0]?.message?.content) {
        // Synchronous completion — process inline
        const content = result.choices[0].message.content;

        // Try to parse as structured response
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { status: "completed", result: content };
        }

        await ctx.runMutation(internal.callbacks.applyCallbackResult, {
          taskRunId: taskRunId as string,
          status: parsed.status ?? "completed",
          result: parsed.result ?? content,
          costCents: result.usage
            ? Math.ceil(
                (result.usage.prompt_tokens * 0.003 +
                  result.usage.completion_tokens * 0.015) /
                  1000,
              )
            : undefined,
          tokenUsage: result.usage
            ? JSON.stringify({
                input: result.usage.prompt_tokens,
                output: result.usage.completion_tokens,
              })
            : undefined,
          approvalReason: parsed.approvalRequest?.reason,
          errorClass: parsed.status === "failed" ? "AgentFailureError" : undefined,
          errorMessage:
            parsed.status === "failed" ? parsed.result : undefined,
        });
      }
    } catch (error) {
      const errorClass =
        error instanceof TypeError && error.message.includes("fetch")
          ? "NetworkError"
          : error instanceof DOMException && error.name === "TimeoutError"
            ? "TimeoutError"
            : "UnknownError";

      await ctx.runMutation(internal.tasks.markTaskFailed, {
        taskId: args.taskId,
        taskRunId,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
        errorClass,
      });
    }
  },
});

// --- Internal queries and mutations used by dispatchTask ---

export const getTaskWithAgent = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    const agent = await ctx.db.get(task.ownerAgentId);
    if (!agent) return null;
    return {
      ...task,
      agentName: agent.name,
      hermesProfileId: agent.hermesProfileId,
      agentSoul: agent.description,
    };
  },
});

export const getAgentStatus = internalQuery({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .unique();
  },
});

export const getThreadEntries = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threadEntries")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
  },
});

export const markTaskDispatched = internalMutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status !== "queued") return null;

    const transition = validateTransition(task.status, "running", task.retryCount);
    if (!transition.valid) {
      console.error("Cannot dispatch:", transition.reason);
      return null;
    }

    await ctx.db.patch(args.taskId, { status: "running" });

    const taskRunId = await ctx.db.insert("taskRuns", {
      taskId: args.taskId,
      agentId: args.agentId,
      status: "running",
      startedAt: Date.now(),
      hmacVerified: false,
    });

    await ctx.db.insert("events", {
      taskId: args.taskId,
      agentId: args.agentId,
      type: "task.run.started",
      payload: JSON.stringify({ taskRunId }),
    });

    return taskRunId;
  },
});

export const markTaskFailed = internalMutation({
  args: {
    taskId: v.id("tasks"),
    taskRunId: v.id("taskRuns"),
    errorMessage: v.string(),
    errorClass: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskRunId, {
      status: "failed",
      finishedAt: Date.now(),
      errorMessage: args.errorMessage,
    });

    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    await ctx.db.patch(args.taskId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });

    await ctx.db.insert("events", {
      taskId: args.taskId,
      type: "task.run.failed",
      payload: JSON.stringify({
        errorClass: args.errorClass,
        errorMessage: args.errorMessage,
      }),
    });
  },
});

// --- Public queries for the dashboard ---

export const listTasks = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(50);
    }
    return await ctx.db.query("tasks").order("desc").take(50);
  },
});

export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});
