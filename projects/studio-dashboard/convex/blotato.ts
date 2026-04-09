import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Publish a post via Blotato API after approval.
 * Called when an approval for a social media post is granted.
 *
 * Flow: Social agent draft → needs_approval → user approves → this action fires
 *
 * Blotato API: https://help.blotato.com/api/start
 */
export const publishPost = internalAction({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BLOTATO_API_KEY;
    if (!apiKey) {
      console.error("BLOTATO_API_KEY not configured");
      await ctx.runMutation(internal.blotato.logPublishResult, {
        taskId: args.taskId,
        success: false,
        error: "Blotato API key not configured",
      });
      return;
    }

    try {
      const response = await fetch("https://api.blotato.com/api/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: args.platform ?? "linkedin",
          content: args.content,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        await ctx.runMutation(internal.blotato.logPublishResult, {
          taskId: args.taskId,
          success: false,
          error: `Blotato ${response.status}: ${errorText.slice(0, 200)}`,
        });
        return;
      }

      const result = await response.json();
      await ctx.runMutation(internal.blotato.logPublishResult, {
        taskId: args.taskId,
        success: true,
        postId: result.id ?? result.postId,
      });
    } catch (error) {
      await ctx.runMutation(internal.blotato.logPublishResult, {
        taskId: args.taskId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

export const logPublishResult = internalMutation({
  args: {
    taskId: v.id("tasks"),
    success: v.boolean(),
    postId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      taskId: args.taskId,
      type: args.success ? "blotato.published" : "blotato.failed",
      payload: JSON.stringify({
        postId: args.postId,
        error: args.error,
      }),
    });

    if (!args.success) {
      const task = await ctx.db.get(args.taskId);
      if (task) {
        await ctx.db.patch(task._id, {
          errorMessage: `Blotato publish failed: ${args.error}`,
        });
      }
    }
  },
});
