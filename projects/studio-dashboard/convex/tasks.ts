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
 * Create a goal — describe what you want, CEO agent routes it automatically.
 * This is the Paperclip-style delegation: you state the goal, the system figures out who does it.
 * The CEO receives the goal, breaks it down, and delegates to the right agents.
 */
export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    priority: v.optional(v.string()),
    skillHint: v.optional(v.string()), // e.g. "hackathon-brainstorm"
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
    if (!user || user.role !== "owner") throw new Error("Only owners can create goals");

    // Find the CEO agent
    const ceo = await ctx.db
      .query("agents")
      .withIndex("by_hermesProfileId", (q) => q.eq("hermesProfileId", "ceo"))
      .unique();
    if (!ceo) throw new Error("CEO agent not found");

    const threadId = crypto.randomUUID();

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      createdBy: identity.tokenIdentifier,
      ownerAgentId: ceo._id,
      projectId: args.projectId,
      status: "queued",
      priority: args.priority ?? "normal",
      spentCents: 0,
      threadId,
      retryCount: 0,
      skillHint: args.skillHint,
    });

    await ctx.db.insert("events", {
      taskId,
      agentId: ceo._id,
      type: "goal.created",
      payload: JSON.stringify({
        title: args.title,
        priority: args.priority ?? "normal",
      }),
    });

    await ctx.db.insert("threadEntries", {
      threadId,
      type: "constraint",
      content: `Goal: ${args.title}\n\n${args.description}\n\nRouted to CEO for delegation.`,
    });

    await ctx.scheduler.runAfter(0, internal.tasks.dispatchTask, { taskId });

    return taskId;
  },
});

/**
 * Create a new task. Public mutation — requires Clerk auth.
 * Only "owner" role can create tasks (RBAC).
 */
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    ownerAgentId: v.id("agents"),
    projectId: v.optional(v.id("projects")),
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
      projectId: args.projectId,
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

    // Fetch thread context and brain context in parallel
    const { callProxy } = await import("./lib/proxy");
    const [threadEntries, brainResults] = await Promise.all([
      ctx.runQuery(internal.tasks.getThreadEntries, { threadId: task.threadId }),
      callProxy("/brain/query", { q: `${task.title} ${task.description}` }, 5000)
        .then((r) => {
          const raw = Array.isArray(r) ? r : ((r.results ?? []) as Record<string, unknown>[]);
          return raw.slice(0, 5);
        })
        .catch((err) => {
          console.warn("Brain query failed (proceeding without):", err instanceof Error ? err.message : err);
          return [];
        }),
    ]);

    const threadContext = threadEntries
      .map((e: { type: string; content: string }) => `[${e.type}] ${e.content}`)
      .join("\n\n");

    // Build brain context section (capped at ~2000 tokens)
    let brainContext = "";
    if (brainResults.length > 0) {
      const brainSnippets = brainResults.map((r: Record<string, unknown>) => {
        const title = (r.title as string) || "Untitled";
        const content = ((r.content as string) || (r.snippet as string) || "").slice(0, 400);
        return `- ${title}: ${content}`;
      });
      brainContext = "\n\n## Brain Context (cross-project institutional memory)\n" + brainSnippets.join("\n");
    }

    // Build the Hermes API request
    const hermesUrl = process.env.HERMES_API_URL;
    const studioApiKey = process.env.STUDIO_API_KEY;

    if (!hermesUrl || !studioApiKey) {
      console.error("Missing env vars: HERMES_API_URL or STUDIO_API_KEY");
      await ctx.runMutation(internal.tasks.markTaskFailed, {
        taskId: args.taskId,
        taskRunId,
        errorMessage: "Server configuration error",
        errorClass: "ConfigurationError",
      });
      return;
    }

    // Build instructions with STUDIO_CONTEXT for the plugin's pre_llm_call hook.
    // The plugin extracts this metadata to fetch project context from Convex.
    const studioContext = JSON.stringify({
      taskRunId: taskRunId,
      projectId: task.projectId,
      threadId: task.threadId,
    });

    const skillInstruction = task.skillHint
      ? `\n## Skill\nUse the /${task.skillHint} skill to complete this task. Follow all phases in the skill.\n`
      : "";

    const instructions = [
      `<!-- STUDIO_CONTEXT: ${studioContext} -->`,
      "",
      // Hermes loads SOUL.md natively. We add task-specific context here.
      "## Thread Context (previous decisions and findings)",
      threadContext,
      brainContext,
      skillInstruction,
      "## Available Agents (for delegation)",
      "Use the delegate_to_agent tool to delegate subtasks to the right agent:",
      "- creative-director: Visual identity, brand, design",
      "- engineering-lead: Technical architecture, code review",
      "- content-lead: Content strategy, writing direction",
      "- content-writer: Blog posts, case studies, drafts",
      "- visual-designer: UI/UX, mockups",
      "- frontend-dev / backend-dev: Code implementation",
      "- social-media: Social posts, publishing",
      "- data-analyst: Data research, metrics, APIs",
      "- qa-reviewer: Quality checks",
      "",
      "## Response Format",
      "When done, respond with a JSON object:",
      '{ "status": "completed" | "needs_approval" | "failed",',
      '  "result": "your FULL output document — do not truncate or summarize",',
      '  "approvalRequest": { "action": "what needs approval", "reason": "why" } }',
      "",
      "IMPORTANT: Include the complete deliverable in the result field.",
      "This becomes the project artifact that Tarik reviews and downloads.",
      "",
      "You can use report_progress to send intermediate findings,",
      "delegate_to_agent to assign work to other agents,",
      "and request_approval when you need owner sign-off.",
    ].join("\n");

    // Use /v1/responses (stateful API) with named conversations matching threadId.
    // This gives us: server-side history, multi-turn tool execution, and
    // the agent's full toolset (web, terminal, file, memory, delegation, skills).
    try {
      const response = await fetch(
        `${hermesUrl}/v1/responses`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${studioApiKey}`,
            "Content-Type": "application/json",
            "X-Agent-Profile": task.hermesProfileId,
          },
          body: JSON.stringify({
            model: "hermes-agent",
            input: task.description,
            instructions,
            conversation: task.threadId,
            store: true,
          }),
          signal: AbortSignal.timeout(120_000), // longer timeout for tool-augmented tasks
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

      // /v1/responses returns a stateful response with output array.
      // The output contains tool calls, tool results, and the final message.
      const result = await response.json();

      // Extract the final text output from the response
      const outputItems = result.output ?? [];
      const messageItem = outputItems.find(
        (item: any) => item.type === "message" && item.role === "assistant",
      );
      const content = messageItem?.content?.[0]?.text
        ?? messageItem?.content
        ?? result.output_text
        ?? "";

      if (content) {
        // Try to parse as structured response
        let parsed;
        try {
          // Look for JSON in the content (may be wrapped in markdown code block)
          const jsonMatch = content.match(/\{[\s\S]*"status"[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { status: "completed", result: content };
        } catch {
          parsed = { status: "completed", result: content };
        }

        await ctx.runMutation(internal.callbacks.applyCallbackResult, {
          taskRunId: taskRunId as string,
          status: parsed.status ?? "completed",
          result: parsed.result ?? content,
          costCents: result.usage
            ? Math.ceil(
                (result.usage.input_tokens * 0.003 +
                  result.usage.output_tokens * 0.015) /
                  1000,
              )
            : undefined,
          tokenUsage: result.usage
            ? JSON.stringify({
                input: result.usage.input_tokens,
                output: result.usage.output_tokens,
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
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const agent = await ctx.db.get(task.ownerAgentId);
    const agentStatusDoc = await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", task.ownerAgentId))
      .unique();

    const runs = await ctx.db
      .query("taskRuns")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(10);

    const threadEntries = await ctx.db
      .query("threadEntries")
      .withIndex("by_threadId", (q) => q.eq("threadId", task.threadId))
      .order("asc")
      .take(50);

    return {
      ...task,
      agentName: agent?.name ?? "Unknown",
      agentStatus: agentStatusDoc?.status ?? "offline",
      runs,
      threadEntries,
    };
  },
});

/**
 * List tasks for the Kanban board.
 * Groups by status, with agent name joined. Supports project filtering.
 */
export const listForKanban = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let tasks;
    if (args.projectId) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(200);
    } else {
      tasks = await ctx.db.query("tasks").order("desc").take(200);
    }

    // Filter out archived tasks
    const activeTasks = tasks.filter((t) => t.status !== "archived");

    const enriched = [];
    for (const task of activeTasks) {
      const agent = await ctx.db.get(task.ownerAgentId);
      const agentStatusDoc = await ctx.db
        .query("agentStatus")
        .withIndex("by_agentId", (q) => q.eq("agentId", task.ownerAgentId))
        .unique();

      // Get latest run for cost/timing
      const latestRun = await ctx.db
        .query("taskRuns")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .order("desc")
        .first();

      enriched.push({
        ...task,
        agentName: agent?.name ?? "Unknown",
        agentStatus: agentStatusDoc?.status ?? "offline",
        costCents: latestRun?.costCents ?? 0,
        startedAt: latestRun?.startedAt,
        finishedAt: latestRun?.finishedAt,
      });
    }

    return enriched;
  },
});

/**
 * Cancel a task. Owner-only.
 */
export const cancelTask = mutation({
  args: { taskId: v.id("tasks") },
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
      throw new Error("Only owners can cancel tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const transition = validateTransition(task.status, "cancelled", task.retryCount);
    if (!transition.valid) {
      throw new Error(`Cannot cancel: ${transition.reason}`);
    }

    await ctx.db.patch(args.taskId, { status: "cancelled" });

    await ctx.db.insert("events", {
      taskId: args.taskId,
      agentId: task.ownerAgentId,
      type: "task.cancelled",
      payload: JSON.stringify({ cancelledBy: identity.tokenIdentifier }),
    });
  },
});

/**
 * Archive a completed/failed/cancelled task. Owner-only.
 * Archived tasks are hidden from the Kanban but preserved in the database.
 */
export const archiveTask = mutation({
  args: { taskId: v.id("tasks") },
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
      throw new Error("Only owners can archive tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!["completed", "failed", "cancelled"].includes(task.status)) {
      throw new Error("Can only archive completed, failed, or cancelled tasks");
    }

    await ctx.db.patch(args.taskId, { status: "archived" });

    await ctx.db.insert("events", {
      taskId: args.taskId,
      agentId: task.ownerAgentId,
      type: "task.archived",
      payload: JSON.stringify({ archivedBy: identity.tokenIdentifier }),
    });
  },
});

/**
 * Delete a task and its related data. Owner-only.
 * Permanently removes: task, task runs, delegations, and related events.
 * Thread entries are preserved (they're part of project memory).
 */
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
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
      throw new Error("Only owners can delete tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (task.status === "running") {
      throw new Error("Cannot delete a running task — cancel it first");
    }

    // Delete task runs
    const runs = await ctx.db
      .query("taskRuns")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const run of runs) {
      await ctx.db.delete(run._id);
    }

    // Delete delegations
    const delegationsFrom = await ctx.db
      .query("delegations")
      .withIndex("by_parentTaskId", (q) => q.eq("parentTaskId", args.taskId))
      .collect();
    for (const d of delegationsFrom) {
      await ctx.db.delete(d._id);
    }
    const delegationsTo = await ctx.db
      .query("delegations")
      .withIndex("by_childTaskId", (q) => q.eq("childTaskId", args.taskId))
      .collect();
    for (const d of delegationsTo) {
      await ctx.db.delete(d._id);
    }

    // Delete related events
    const events = await ctx.db
      .query("events")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const e of events) {
      await ctx.db.delete(e._id);
    }

    // Delete approvals
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const a of approvals) {
      await ctx.db.delete(a._id);
    }

    // Delete the task itself
    await ctx.db.delete(args.taskId);
  },
});

/**
 * Retry a failed task. Owner-only.
 */
export const retryTask = mutation({
  args: { taskId: v.id("tasks") },
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
      throw new Error("Only owners can retry tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const transition = validateTransition(task.status, "queued", task.retryCount);
    if (!transition.valid) {
      throw new Error(`Cannot retry: ${transition.reason}`);
    }

    await ctx.db.patch(args.taskId, {
      status: "queued",
      retryCount: task.retryCount + 1,
      errorMessage: undefined,
    });

    await ctx.db.insert("events", {
      taskId: args.taskId,
      agentId: task.ownerAgentId,
      type: "task.auto_retry",
      payload: JSON.stringify({ retriedBy: identity.tokenIdentifier }),
    });

    await ctx.scheduler.runAfter(0, internal.tasks.dispatchTask, {
      taskId: args.taskId,
    });
  },
});
