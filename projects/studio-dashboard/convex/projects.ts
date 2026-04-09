import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all projects, newest first.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").collect();

    const enriched = [];
    for (const project of projects) {
      // Count tasks per status
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
        .collect();

      const taskCounts = {
        total: tasks.length,
        queued: tasks.filter((t) => t.status === "queued").length,
        running: tasks.filter((t) => t.status === "running").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        failed: tasks.filter((t) => t.status === "failed").length,
      };

      enriched.push({ ...project, taskCounts });
    }

    return enriched;
  },
});

/**
 * Get a single project with its tasks.
 */
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .order("desc")
      .collect();

    return { ...project, tasks };
  },
});

/**
 * Create a new project. Owner-only.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    budgetCents: v.optional(v.number()),
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
      throw new Error("Only owners can create projects");
    }

    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      slug,
      description: args.description,
      phase: "research",
      createdBy: identity.tokenIdentifier,
      budgetCents: args.budgetCents,
      spentCents: 0,
    });

    await ctx.db.insert("events", {
      type: "project.created",
      payload: JSON.stringify({ projectId, name: args.name, slug }),
    });

    return projectId;
  },
});

/**
 * Advance a project to the next Bumwad phase. Owner-only.
 */
export const advancePhase = mutation({
  args: {
    projectId: v.id("projects"),
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
      throw new Error("Only owners can advance project phases");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const phases = [
      "research",
      "schematic",
      "design_dev",
      "refinement",
      "construction",
      "complete",
    ];
    const currentIndex = phases.indexOf(project.phase);
    if (currentIndex === -1 || currentIndex >= phases.length - 1) {
      throw new Error("Project is already complete");
    }

    const nextPhase = phases[currentIndex + 1];
    await ctx.db.patch(args.projectId, { phase: nextPhase });

    await ctx.db.insert("events", {
      type: "project.phase_advanced",
      payload: JSON.stringify({
        projectId: args.projectId,
        from: project.phase,
        to: nextPhase,
      }),
    });

    return nextPhase;
  },
});

/**
 * Store a plan artifact from a gstack review. Owner-only.
 * Called after running /office-hours, /plan-ceo-review, etc.
 */
export const storePlan = mutation({
  args: {
    projectId: v.id("projects"),
    planType: v.union(
      v.literal("designDoc"),
      v.literal("ceoPlan"),
      v.literal("engPlan"),
      v.literal("designPlan"),
    ),
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
      throw new Error("Only owners can store plans");
    }

    await ctx.db.patch(args.projectId, {
      [args.planType]: args.content,
    });

    await ctx.db.insert("events", {
      type: "project.plan_stored",
      payload: JSON.stringify({
        projectId: args.projectId,
        planType: args.planType,
        contentLength: args.content.length,
      }),
    });
  },
});
