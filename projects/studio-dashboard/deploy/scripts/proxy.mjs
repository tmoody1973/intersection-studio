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
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);

// GBrain uses ~/.gbrain/ by default (symlinked to /opt/data/gbrain in start.sh)

// Write serialization — PGLite supports ONE writer at a time
let writeQueue = Promise.resolve();
function serializeWrite(fn) {
  writeQueue = writeQueue.then(fn).catch((err) => {
    console.error("Brain write error:", err.message);
  });
  return writeQueue;
}

// Bearer auth check
function verifyBearer(req) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === process.env.STUDIO_API_KEY && token !== "";
}

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
    // Brain health
    try {
      await execFileAsync("gbrain", ["doctor"], { timeout: 3000 });
      results["brain"] = "online";
    } catch {
      results["brain"] = "offline";
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

  // Brain query — concurrent reads OK
  if (url.pathname === "/brain/query" && req.method === "POST") {
    if (!verifyBearer(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const query = body.q || body.query || "";

    if (!query) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "query is required" }));
      return;
    }

    try {
      const { stdout } = await execFileAsync(
        "gbrain",
        ["query", query, "--limit", "10"],
        { timeout: 5000 }
      );
      // Parse gbrain text output: "[score] slug -- title\ncontent..."
      const results = stdout.trim().split(/\n(?=\[)/).map((block) => {
        const match = block.match(/^\[([0-9.]+)\]\s+(\S+)\s+--\s+(.*)/s);
        if (!match) return null;
        const [, score, source, rest] = match;
        const lines = rest.split("\n");
        const title = lines[0].trim();
        const snippet = lines.slice(1).join(" ").trim().slice(0, 300);
        return { score: parseFloat(score), source, title, snippet };
      }).filter(Boolean);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ results }));
    } catch (err) {
      if (err.killed) {
        res.writeHead(504, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Brain query timed out", timeout: 5000 }));
      } else {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Brain query failed", detail: err.message }));
      }
    }
    return;
  }

  // Brain write — serialized (ONE writer at a time)
  if (url.pathname === "/brain/write" && req.method === "POST") {
    if (!verifyBearer(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const { title, content, source, project } = body;

    if (!title || !content) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "title and content are required" }));
      return;
    }

    try {
      await serializeWrite(async () => {
        const args = ["write", "--title", title];
        if (source) args.push("--source", source);
        if (project) args.push("--project", project);
        args.push("--stdin");

        await execFileAsync("gbrain", args, {
          timeout: 10000,
          input: content,
        });
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "written", title }));
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Brain write failed", detail: err.message }));
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

      // Determine if this is an external request (via Fly.io edge) or
      // an internal request (agent-to-agent delegation via localhost).
      // Only external requests need keep-alive to prevent Fly.io's 60s idle timeout.
      const isInternal = req.headers.host?.startsWith("localhost") ||
                         req.headers.host?.startsWith("127.0.0.1");

      if (isInternal) {
        // Internal: simple forward, no streaming tricks needed
        res.writeHead(proxyRes.status, {
          "Content-Type": proxyRes.headers.get("content-type") ?? "application/json",
        });
        const responseBody = await proxyRes.text();
        res.end(responseBody);
      } else {
        // External: stream with keep-alive to survive Fly.io's 60s idle timeout
        res.writeHead(proxyRes.status, {
          "Content-Type": proxyRes.headers.get("content-type") ?? "application/json",
          "Transfer-Encoding": "chunked",
        });

        let keepAliveTimer = null;
        const resetKeepAlive = () => {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          keepAliveTimer = setInterval(() => {
            if (!res.writableEnded) res.write(" ");
          }, 30000);
        };
        resetKeepAlive();

        try {
          const reader = proxyRes.body?.getReader();
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
              resetKeepAlive();
            }
          } else {
            const text = await proxyRes.text();
            res.write(text);
          }
        } finally {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          res.end();
        }
      }
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
      }
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
