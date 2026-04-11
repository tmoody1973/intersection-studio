/**
 * Minimal routing proxy for Hermes agents.
 * Listens on port 3000 (exposed to Fly.io HTTP service).
 * Routes requests to the correct agent's API server based on
 * the X-Agent-Profile header or a profile path parameter.
 *
 * Routes:
 *   POST /v1/chat/completions  (X-Agent-Profile: ceo)  → localhost:8650
 *   GET  /health                                         → checks all agents
 *   GET  /health/:profile                                → checks one agent
 */

import { createServer } from "node:http";

const AGENT_PORTS = {
  "ceo": 8650,
  "creative-director": 8651,
  "engineering-lead": 8652,
  "content-lead": 8653,
  "project-manager": 8654,
  "visual-designer": 8655,
  "frontend-dev": 8656,
  "backend-dev": 8657,
  "content-writer": 8658,
  "social-media": 8659,
  "qa-reviewer": 8660,
  "data-analyst": 8661,
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check — all agents
  if (url.pathname === "/health" && req.method === "GET") {
    const results = {};
    for (const [name, port] of Object.entries(AGENT_PORTS)) {
      try {
        const r = await fetch(`http://localhost:${port}/v1/models`, {
          headers: { "Authorization": `Bearer ${process.env.STUDIO_API_KEY}` },
          signal: AbortSignal.timeout(3000),
        });
        results[name] = r.ok ? "online" : "error";
      } catch {
        results[name] = "offline";
      }
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(results));
    return;
  }

  // Health check — single agent
  const healthMatch = url.pathname.match(/^\/health\/([a-z-]+)$/);
  if (healthMatch && req.method === "GET") {
    const profile = healthMatch[1];
    const port = AGENT_PORTS[profile];
    if (!port) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: `Unknown profile: ${profile}` }));
      return;
    }
    try {
      const r = await fetch(`http://localhost:${port}/v1/models`, {
        headers: { "Authorization": `Bearer ${process.env.STUDIO_API_KEY}` },
        signal: AbortSignal.timeout(3000),
      });
      res.writeHead(r.ok ? 200 : 502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ profile, status: r.ok ? "online" : "error" }));
    } catch {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ profile, status: "offline" }));
    }
    return;
  }

  // Proxy — route by X-Agent-Profile header
  if (url.pathname.startsWith("/v1/")) {
    const profile = req.headers["x-agent-profile"] ?? "ceo";
    const port = AGENT_PORTS[profile];

    if (!port) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Unknown profile: ${profile}` }));
      return;
    }

    // Read the request body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    try {
      const proxyRes = await fetch(`http://localhost:${port}${url.pathname}`, {
        method: req.method,
        headers: {
          "Authorization": req.headers["authorization"] ?? "",
          "Content-Type": "application/json",
        },
        body: req.method !== "GET" ? body : undefined,
        signal: AbortSignal.timeout(300000), // 5 min — agents use tools (web search, etc.)
      });

      // Forward response
      res.writeHead(proxyRes.status, {
        "Content-Type": proxyRes.headers.get("content-type") ?? "application/json",
      });
      const responseBody = await proxyRes.text();
      res.end(responseBody);
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Agent unavailable",
        profile,
        detail: err.message,
      }));
    }
    return;
  }

  // Fallback
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Routing proxy listening on port ${PORT}`);
  console.log(`Configured agents: ${Object.keys(AGENT_PORTS).join(", ")}`);
});
