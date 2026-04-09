import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Ensure the current user exists in the users table.
 * Called on first sign-in. Creates with "owner" role if first user,
 * "viewer" for subsequent users.
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) return existing._id;

    // First user gets "owner", everyone else gets "viewer"
    const userCount = (await ctx.db.query("users").collect()).length;

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? undefined,
      role: userCount === 0 ? "owner" : "viewer",
    });

    return userId;
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});
