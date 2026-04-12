import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Hermes callback endpoint.
 *
 * Fly.io Hermes calls this when a task completes (or fails).
 * The raw body + signature are passed to an internal action for
 * HMAC verification (needs Web Crypto), which then calls an
 * internal mutation for database writes.
 *
 * Always returns 200 to be idempotent.
 */
http.route({
  path: "/hermes-callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("X-HMAC-Signature") ?? "";
    const body = await req.text();

    try {
      await ctx.runAction(internal.callbacks.processHermesCallback, {
        body,
        signature,
      });
    } catch (error) {
      console.error("Callback processing error:", error);
    }

    return new Response("OK", { status: 200 });
  }),
});

/**
 * Project context endpoint.
 *
 * Called by the studio-dashboard Hermes plugin (pre_llm_call hook)
 * to fetch project sources, thread entries, and phase for context injection.
 * HMAC-authenticated.
 */
http.route({
  path: "/project-context",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("X-HMAC-Signature") ?? "";
    const body = await req.text();

    try {
      const result = await ctx.runAction(
        internal.pluginEndpoints.getProjectContext,
        { body, signature },
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Project context error:", error);
      return new Response(
        JSON.stringify({ error: "Internal error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }),
});

/**
 * Tool usage log endpoint.
 *
 * Called by the studio-dashboard plugin (post_tool_call hook)
 * to log agent tool usage to the activity feed.
 */
http.route({
  path: "/hermes-tool-log",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("X-HMAC-Signature") ?? "";
    const body = await req.text();

    try {
      await ctx.runAction(internal.pluginEndpoints.logToolUsage, {
        body,
        signature,
      });
    } catch (error) {
      console.error("Tool log error:", error);
    }

    return new Response("OK", { status: 200 });
  }),
});

/**
 * Progress report endpoint.
 *
 * Called by the studio-dashboard plugin (report_progress tool)
 * to add thread entries mid-task.
 */
http.route({
  path: "/hermes-progress",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("X-HMAC-Signature") ?? "";
    const body = await req.text();

    try {
      await ctx.runAction(internal.pluginEndpoints.reportProgress, {
        body,
        signature,
      });
    } catch (error) {
      console.error("Progress report error:", error);
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
