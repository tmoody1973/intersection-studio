import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Cached OpenRouter model list.
 * Fetched once daily, stored in a simple Convex table.
 * The dashboard reads from cache, not from OpenRouter on every render.
 */

export const listCached = query({
  args: {},
  handler: async (ctx) => {
    const cached = await ctx.db.query("modelCache").order("desc").first();
    if (cached) {
      return JSON.parse(cached.modelsJson) as Array<{
        id: string;
        name: string;
        pricingPrompt: number;
        pricingCompletion: number;
      }>;
    }
    // Fallback if no cache exists yet
    return [
      { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", pricingPrompt: 3, pricingCompletion: 15 },
      { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", pricingPrompt: 0.8, pricingCompletion: 4 },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", pricingPrompt: 0.1, pricingCompletion: 0.1 },
      { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek V3", pricingPrompt: 0.14, pricingCompletion: 0.28 },
      { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash", pricingPrompt: 0.15, pricingCompletion: 0.6 },
    ];
  },
});

/**
 * Fetch models from OpenRouter API and cache them.
 * Called by daily cron.
 */
export const refreshFromOpenRouter = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error("OpenRouter models fetch failed:", response.status);
        return;
      }

      const data = await response.json();
      const models = (data.data ?? [])
        .filter((m: any) =>
          // Only include models we'd actually use
          m.id.startsWith("anthropic/") ||
          m.id.startsWith("meta-llama/") ||
          m.id.startsWith("google/") ||
          m.id.startsWith("deepseek/") ||
          m.id.startsWith("openai/") ||
          m.id.startsWith("mistralai/")
        )
        .map((m: any) => ({
          id: m.id,
          name: m.name ?? m.id,
          pricingPrompt: parseFloat(m.pricing?.prompt ?? "0") * 1_000_000,
          pricingCompletion: parseFloat(m.pricing?.completion ?? "0") * 1_000_000,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      await ctx.runMutation(internal.models.saveCache, {
        modelsJson: JSON.stringify(models),
        count: models.length,
      });

      console.log(`Cached ${models.length} OpenRouter models`);
    } catch (error) {
      console.error("OpenRouter fetch error:", error);
    }
  },
});

export const saveCache = internalMutation({
  args: {
    modelsJson: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    // Delete old cache entries
    const old = await ctx.db.query("modelCache").collect();
    for (const entry of old) {
      await ctx.db.delete(entry._id);
    }
    // Insert fresh
    await ctx.db.insert("modelCache", {
      modelsJson: args.modelsJson,
      count: args.count,
      fetchedAt: Date.now(),
    });
  },
});
