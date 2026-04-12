import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all sources for a project.
 */
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("projectSources")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(100);

    const enriched = [];
    for (const source of sources) {
      let fileUrl: string | null = null;
      if (source.storageId) {
        fileUrl = await ctx.storage.getUrl(source.storageId);
      }
      enriched.push({ ...source, fileUrl });
    }

    return enriched;
  },
});

/**
 * Add a text source to a project. Owner-only.
 */
export const addText = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    content: v.string(),
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
      throw new Error("Only owners can add sources");
    }

    const sourceId = await ctx.db.insert("projectSources", {
      projectId: args.projectId,
      type: "text",
      name: args.name,
      content: args.content,
    });

    // Also create a thread entry so agents can access this context
    const project = await ctx.db.get(args.projectId);
    if (project) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
        .first();

      const threadId = tasks?.threadId ?? `project-${project.slug}`;
      await ctx.db.insert("threadEntries", {
        threadId,
        type: "finding",
        content: `[Source: ${args.name}]\n\n${args.content}`,
      });
    }

    return sourceId;
  },
});

/**
 * Add a URL source to a project. Owner-only.
 */
export const addUrl = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
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
      throw new Error("Only owners can add sources");
    }

    return await ctx.db.insert("projectSources", {
      projectId: args.projectId,
      type: "url",
      name: args.name,
      url: args.url,
    });
  },
});

/**
 * Generate an upload URL for file sources.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save a file source after upload. Owner-only.
 */
export const addFile = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
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
      throw new Error("Only owners can add sources");
    }

    return await ctx.db.insert("projectSources", {
      projectId: args.projectId,
      type: "file",
      name: args.name,
      storageId: args.storageId,
      mimeType: args.mimeType,
    });
  },
});

/**
 * Remove a source. Owner-only.
 */
export const remove = mutation({
  args: { sourceId: v.id("projectSources") },
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
      throw new Error("Only owners can remove sources");
    }

    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    // Delete the file from storage if it exists
    if (source.storageId) {
      await ctx.storage.delete(source.storageId);
    }

    await ctx.db.delete(args.sourceId);
  },
});
