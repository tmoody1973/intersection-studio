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

export default http;
