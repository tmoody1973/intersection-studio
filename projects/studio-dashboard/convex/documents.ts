import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const DOCUMENT_TYPES = [
  "case_study",
  "social_post",
  "prd",
  "design_doc",
  "research",
  "other",
] as const;

/**
 * List documents, filterable by project and/or type.
 * Server-side project name join to avoid N+1 on the client.
 */
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let docs;

    if (args.projectId) {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId!))
        .order("desc")
        .take(100);
    } else if (args.type) {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_type", (q) =>
          q.eq(
            "type",
            args.type as
              | "case_study"
              | "social_post"
              | "prd"
              | "design_doc"
              | "research"
              | "other",
          ),
        )
        .order("desc")
        .take(100);
    } else {
      docs = await ctx.db.query("documents").order("desc").take(100);
    }

    const enriched = [];
    for (const doc of docs) {
      const project = doc.projectId
        ? await ctx.db.get(doc.projectId)
        : null;
      enriched.push({
        ...doc,
        projectName: project?.name ?? "Unscoped",
      });
    }

    return enriched;
  },
});

/**
 * Get a single document by ID.
 */
export const get = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;

    const project = doc.projectId
      ? await ctx.db.get(doc.projectId)
      : null;
    const agent = doc.createdByAgent
      ? await ctx.db.get(doc.createdByAgent)
      : null;

    return {
      ...doc,
      projectName: project?.name ?? "Unscoped",
      agentName: agent?.name,
    };
  },
});

/**
 * Create a document.
 * Called by auto-save (from applyCallbackResult) and manual creation.
 *
 * Idempotency guard: if taskId is provided, check for existing document
 * with that taskId before inserting. Returns existing doc ID if found.
 */
export const create = internalMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    type: v.union(
      v.literal("case_study"),
      v.literal("social_post"),
      v.literal("prd"),
      v.literal("design_doc"),
      v.literal("research"),
      v.literal("other"),
    ),
    title: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("done"),
      v.literal("handed_off"),
    ),
    createdByAgent: v.optional(v.id("agents")),
    createdByUser: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotency: if taskId provided, check for existing document
    if (args.taskId) {
      const existing = await ctx.db
        .query("documents")
        .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId!))
        .unique();
      if (existing) {
        return existing._id;
      }
    }

    return await ctx.db.insert("documents", {
      projectId: args.projectId,
      taskId: args.taskId,
      type: args.type,
      title: args.title,
      body: args.body,
      status: args.status,
      createdByAgent: args.createdByAgent,
      createdByUser: args.createdByUser,
    });
  },
});

/**
 * Update a document's type. Owner-only.
 * Used for reclassifying auto-saved documents (default type is "other").
 */
export const updateType = mutation({
  args: {
    documentId: v.id("documents"),
    type: v.union(
      v.literal("case_study"),
      v.literal("social_post"),
      v.literal("prd"),
      v.literal("design_doc"),
      v.literal("research"),
      v.literal("other"),
    ),
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
      throw new Error("Only owners can update documents");
    }

    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    await ctx.db.patch(args.documentId, { type: args.type });
  },
});

/**
 * Update a document's status. Owner-only.
 * Transitions: draft → done → handed_off
 */
export const updateStatus = mutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("draft"),
      v.literal("done"),
      v.literal("handed_off"),
    ),
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
      throw new Error("Only owners can update documents");
    }

    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    // Validate transition
    const validTransitions: Record<string, string[]> = {
      draft: ["done", "handed_off"],
      done: ["handed_off"],
      handed_off: [], // terminal
    };

    if (!validTransitions[doc.status]?.includes(args.status)) {
      throw new Error(
        `Cannot transition from ${doc.status} to ${args.status}`,
      );
    }

    await ctx.db.patch(args.documentId, { status: args.status });
  },
});

/**
 * List recent documents across all projects.
 * Powers the home page "Recent Documents" section.
 * Server-side project name join.
 */
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").order("desc").take(10);

    const enriched = [];
    for (const doc of docs) {
      const project = doc.projectId
        ? await ctx.db.get(doc.projectId)
        : null;
      const agent = doc.createdByAgent
        ? await ctx.db.get(doc.createdByAgent)
        : null;
      enriched.push({
        ...doc,
        projectName: project?.name ?? "Unscoped",
        agentName: agent?.name,
      });
    }

    return enriched;
  },
});
