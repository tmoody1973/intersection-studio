import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Send a message to a Hermes agent and get a response.
 * Proxies through Convex so the frontend doesn't need the Fly.io URL or API key.
 * Logs the conversation to the project thread.
 */
export const sendMessage = action({
  args: {
    agentId: v.id("agents"),
    message: v.string(),
    projectId: v.optional(v.id("projects")),
    conversationId: v.string(), // groups messages in a conversation
  },
  handler: async (ctx, args) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get agent details
    const agent = await ctx.runQuery(api.chat.getAgentForChat, {
      agentId: args.agentId,
    }) as { name: string; hermesProfileId: string; soulMarkdown?: string } | null;
    if (!agent) throw new Error("Agent not found");

    // Get ALL projects so the agent knows what the studio is working on
    const allProjects = await ctx.runQuery(api.chat.getAllProjects) as Array<{
      _id: string; name: string; phase: string; description: string;
      taskCounts: { total: number; completed: number; running: number };
    }>;

    let projectContext = "";

    if (allProjects.length > 0) {
      const projectList = allProjects.map((p) =>
        `- "${p.name}" (${p.phase} phase): ${p.description.slice(0, 200)}${p.taskCounts.total > 0 ? ` [${p.taskCounts.completed}/${p.taskCounts.total} tasks done]` : ""}`
      ).join("\n");
      projectContext += `\n\n## Active Studio Projects\n${projectList}`;
    }

    // If scoped to a specific project, add detailed context
    if (args.projectId) {
      const projectDetail = await ctx.runQuery(api.chat.getFullProjectContext, {
        projectId: args.projectId,
      }) as {
        name: string; phase: string; description: string;
        sources: Array<{ name: string; type: string; content?: string; url?: string }>;
        recentThread: Array<{ type: string; content: string; agentName?: string }>;
        designDoc?: string; ceoPlan?: string; engPlan?: string;
      } | null;

      if (projectDetail) {
        projectContext += `\n\n## Current Project: ${projectDetail.name} (${projectDetail.phase} phase)`;
        projectContext += `\nDescription: ${projectDetail.description}`;

        if (projectDetail.sources.length > 0) {
          projectContext += `\n\n### Project Sources`;
          for (const s of projectDetail.sources) {
            projectContext += `\n- [${s.type}] ${s.name}: ${(s.content || s.url || "").slice(0, 500)}`;
          }
        }

        if (projectDetail.recentThread.length > 0) {
          projectContext += `\n\n### Recent Decisions & Findings`;
          for (const t of projectDetail.recentThread.slice(-15)) {
            projectContext += `\n- [${t.type}] ${t.agentName ? t.agentName + ": " : ""}${t.content.slice(0, 300)}`;
          }
        }

        if (projectDetail.designDoc) {
          projectContext += `\n\n### Design Doc Summary\n${projectDetail.designDoc.slice(0, 1000)}`;
        }
        if (projectDetail.ceoPlan) {
          projectContext += `\n\n### CEO Plan Summary\n${projectDetail.ceoPlan.slice(0, 1000)}`;
        }
      }
    }

    // Get recent conversation history for this session
    const history = await ctx.runQuery(api.chat.getConversationHistory, {
      conversationId: args.conversationId,
      limit: 20,
    }) as Array<{ role: string; content: string }>;

    // Build messages array for Hermes
    const systemPrompt = [
      agent.soulMarkdown || `You are ${agent.name}, an agent at Intersection Studio.`,
      "",
      `You are having a direct conversation with Tarik, the studio's lead and principal architect.`,
      `This is an informal working session, not a formal task. Be conversational, share your thinking, push back if you disagree, and ask clarifying questions.`,
      projectContext,
    ].join("\n");

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add the new user message
    messages.push({ role: "user", content: args.message });

    // Call Hermes
    const hermesUrl = process.env.HERMES_API_URL;
    const studioKey = process.env.STUDIO_API_KEY;

    if (!hermesUrl || !studioKey) {
      throw new Error("HERMES_API_URL or STUDIO_API_KEY not configured");
    }

    const response: Response = await fetch(`${hermesUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${studioKey}`,
        "Content-Type": "application/json",
        "X-Agent-Profile": agent.hermesProfileId,
      },
      body: JSON.stringify({
        model: "hermes-agent",
        messages,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Agent ${agent.name} returned ${response.status}: ${err}`);
    }

    const result: any = await response.json();
    const assistantContent: string =
      result.choices?.[0]?.message?.content ?? "No response";

    // Save both messages to conversation history
    await ctx.runMutation(api.chat.saveMessages, {
      conversationId: args.conversationId,
      agentId: args.agentId,
      projectId: args.projectId,
      userMessage: args.message,
      assistantMessage: assistantContent,
    });

    // Log to project thread if project-scoped
    if (args.projectId) {
      await ctx.runMutation(api.chat.logToThread, {
        projectId: args.projectId,
        agentId: args.agentId,
        userMessage: args.message,
        assistantMessage: assistantContent,
      });
    }

    return {
      content: assistantContent,
      usage: result.usage,
    };
  },
});

// Need to import api for self-referencing
import { api } from "./_generated/api";

/**
 * Internal queries used by sendMessage action.
 */
export const getAgentForChat = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.agentId);
  },
});

export const getProjectContext = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.projectId);
  },
});

/**
 * Get all projects with task counts for the agent's awareness.
 */
export const getAllProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").collect();
    const results = [];
    for (const p of projects) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId", (q) => q.eq("projectId", p._id))
        .collect();
      results.push({
        ...p,
        taskCounts: {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === "completed").length,
          running: tasks.filter((t) => t.status === "running" || t.status === "queued").length,
        },
      });
    }
    return results;
  },
});

/**
 * Get full project context: sources, thread, plans.
 */
export const getFullProjectContext = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    // Get sources
    const sources = await ctx.db
      .query("projectSources")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .collect();

    // Get thread entries from tasks in this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .collect();

    const threadIds = new Set(tasks.map((t) => t.threadId));
    // Also include chat threads
    threadIds.add(`chat-${project._id}`);

    const allEntries = [];
    for (const tid of threadIds) {
      const entries = await ctx.db
        .query("threadEntries")
        .withIndex("by_threadId", (q) => q.eq("threadId", tid))
        .order("desc")
        .take(15);
      for (const e of entries) {
        let agentName: string | undefined;
        if (e.agentId) {
          const agent = await ctx.db.get(e.agentId);
          agentName = agent?.name;
        }
        allEntries.push({ ...e, agentName });
      }
    }

    return {
      name: project.name,
      phase: project.phase,
      description: project.description,
      sources: sources.map((s) => ({
        name: s.name,
        type: s.type,
        content: s.content,
        url: s.url,
      })),
      recentThread: allEntries
        .sort((a, b) => a._creationTime - b._creationTime)
        .slice(-15),
      designDoc: project.designDoc,
      ceoPlan: project.ceoPlan,
      engPlan: project.engPlan,
    };
  },
});

export const getConversationHistory = query({
  args: {
    conversationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    return messages.slice(-(args.limit ?? 20));
  },
});

/**
 * Save user + assistant messages to conversation history.
 */
export const saveMessages = mutation({
  args: {
    conversationId: v.string(),
    agentId: v.id("agents"),
    projectId: v.optional(v.id("projects")),
    userMessage: v.string(),
    assistantMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      conversationId: args.conversationId,
      agentId: args.agentId,
      projectId: args.projectId,
      role: "user",
      content: args.userMessage,
    });
    await ctx.db.insert("chatMessages", {
      conversationId: args.conversationId,
      agentId: args.agentId,
      projectId: args.projectId,
      role: "assistant",
      content: args.assistantMessage,
    });
  },
});

/**
 * Log conversation to project thread as institutional memory.
 */
export const logToThread = mutation({
  args: {
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    userMessage: v.string(),
    assistantMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Find or create thread for this project's conversations
    const project = await ctx.db.get(args.projectId);
    if (!project) return;

    const threadId = `chat-${args.projectId}`;

    await ctx.db.insert("threadEntries", {
      threadId,
      agentId: args.agentId,
      type: "finding",
      content: `[Chat] Q: ${args.userMessage.slice(0, 200)}\nA: ${args.assistantMessage.slice(0, 500)}`,
    });
  },
});

/**
 * List conversations for an agent (for chat history sidebar).
 */
export const listConversations = query({
  args: {
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    // Get distinct conversation IDs with their last message
    const allMessages = await ctx.db
      .query("chatMessages")
      .order("desc")
      .take(200);

    const conversations = new Map<
      string,
      {
        conversationId: string;
        agentId: string;
        projectId?: string;
        lastMessage: string;
        lastAt: number;
        messageCount: number;
      }
    >();

    for (const msg of allMessages) {
      if (args.agentId && msg.agentId !== args.agentId) continue;
      if (conversations.has(msg.conversationId)) {
        const c = conversations.get(msg.conversationId)!;
        c.messageCount++;
        continue;
      }
      conversations.set(msg.conversationId, {
        conversationId: msg.conversationId,
        agentId: msg.agentId as string,
        projectId: msg.projectId as string | undefined,
        lastMessage: msg.content.slice(0, 100),
        lastAt: msg._creationTime,
        messageCount: 1,
      });
    }

    return Array.from(conversations.values()).slice(0, 20);
  },
});
