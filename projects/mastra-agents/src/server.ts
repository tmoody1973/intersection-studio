import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { MastraServer } from "@mastra/hono";
import type { HonoBindings, HonoVariables } from "@mastra/hono";
import { mastra } from "./mastra";
import { ingestDocument, queryBrain } from "./tools/brain";

const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables }>();

// CORS for dashboard browser requests (includes Vercel preview deployments)
app.use("/*", cors({
  origin: (origin) => {
    if (!origin) return "http://localhost:3000";
    if (origin === "http://localhost:3000") return origin;
    if (origin === "https://intersection-studio.vercel.app") return origin;
    // Allow Vercel preview deployments
    if (/^https:\/\/intersection-studio[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
    return null;
  },
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Bearer token auth middleware — protects ALL routes
const API_KEY = process.env.COPILOTKIT_API_KEY;
app.use("/*", async (c, next) => {
  // Skip auth for health check and OPTIONS (CORS preflight)
  if (c.req.path === "/health" || c.req.method === "OPTIONS") {
    return next();
  }

  if (!API_KEY) {
    console.error("COPILOTKIT_API_KEY not configured — rejecting request");
    return c.json({ error: "Server authentication not configured" }, 500);
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== API_KEY) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  return next();
});

const server = new MastraServer({ app, mastra });

await server.init();

// Custom health endpoint (no auth required)
app.get("/health", (c) => {
  const agents = Object.keys(mastra.listAgents());
  return c.json({ status: "ok", agents, timestamp: new Date().toISOString() });
});

// Brain API: ingest a document
app.post("/api/brain/ingest", async (c) => {
  try {
    const body = await c.req.json();
    const { text, title, source, projectId, type } = body;

    if (!text || !title) {
      return c.json({ error: "text and title are required" }, 400);
    }

    const result = await ingestDocument({ text, title, source: source ?? "upload", projectId, type });
    return c.json({ success: true, chunks: result.chunks });
  } catch (err) {
    console.error("Ingest error:", err);
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// Brain API: query for relevant context
app.post("/api/brain/query", async (c) => {
  const body = await c.req.json();
  const { query, topK, projectId } = body;

  if (!query) {
    return c.json({ error: "query is required" }, 400);
  }

  const results = await queryBrain({ query, topK, projectId });
  return c.json({ results });
});

const port = Number(process.env.PORT) || 4111;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Mastra server running on http://localhost:${port}`);
  console.log(`Agents: ${Object.keys(mastra.listAgents()).join(", ")}`);
  console.log(`Auth: ${API_KEY ? "enabled" : "WARNING — no COPILOTKIT_API_KEY set"}`);
  console.log(`Try: curl http://localhost:${port}/health`);
});
