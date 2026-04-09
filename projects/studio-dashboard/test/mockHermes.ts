/**
 * Mock Hermes HTTP server for E2E testing.
 *
 * Simulates the Hermes Agent API on Fly.io.
 * Configurable responses: success, failure, timeout, garbage JSON,
 * duplicate callbacks, out-of-order callbacks.
 *
 * Usage:
 *   const mock = new MockHermes({ port: 8650 });
 *   mock.setResponse("ceo", { status: "completed", result: "Done!" });
 *   await mock.start();
 *   // ... run tests ...
 *   await mock.stop();
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from "http";
import { generateHmacSignature } from "../convex/lib/hmac";

export interface MockResponse {
  status: "completed" | "needs_approval" | "failed";
  result?: string;
  costCents?: number;
  tokenUsage?: { input: number; output: number };
  approvalRequest?: { action: string; reason: string };
  errorClass?: string;
  errorMessage?: string;
  /** Simulate delay in ms before responding */
  delayMs?: number;
  /** Return garbage instead of JSON */
  returnGarbage?: boolean;
  /** Return this HTTP status code */
  httpStatus?: number;
  /** Don't respond at all (simulate timeout) */
  hang?: boolean;
}

export class MockHermes {
  private server: Server | null = null;
  private port: number;
  private responses: Map<string, MockResponse> = new Map();
  private callbackUrl: string;
  private callbackSecret: string;
  private requestLog: Array<{ profile: string; body: string; timestamp: number }> = [];

  constructor(opts: {
    port?: number;
    callbackUrl: string;
    callbackSecret: string;
  }) {
    this.port = opts.port ?? 9999;
    this.callbackUrl = opts.callbackUrl;
    this.callbackSecret = opts.callbackSecret;
  }

  /** Set the response for a specific agent profile */
  setResponse(profile: string, response: MockResponse) {
    this.responses.set(profile, response);
  }

  /** Set all agents to return the same response */
  setDefaultResponse(response: MockResponse) {
    this.responses.set("__default__", response);
  }

  /** Get the request log */
  getRequestLog() {
    return [...this.requestLog];
  }

  /** Clear the request log */
  clearLog() {
    this.requestLog = [];
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(async (req, res) => {
        await this.handleRequest(req, res);
      });
      this.server.listen(this.port, () => {
        console.log(`Mock Hermes listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    // Health check
    if (req.url === "/v1/models" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [{ id: "hermes-agent" }] }));
      return;
    }

    // Chat completions
    if (req.url === "/v1/chat/completions" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks).toString();

      const profile = req.headers["x-agent-profile"] as string ?? "unknown";
      this.requestLog.push({ profile, body, timestamp: Date.now() });

      const mockResponse = this.responses.get(profile) ?? this.responses.get("__default__");

      if (!mockResponse) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `No mock response for profile: ${profile}` }));
        return;
      }

      // Simulate hanging (timeout)
      if (mockResponse.hang) {
        // Don't respond — let the client timeout
        return;
      }

      // Simulate delay
      if (mockResponse.delayMs) {
        await new Promise((r) => setTimeout(r, mockResponse.delayMs));
      }

      // Simulate HTTP error
      if (mockResponse.httpStatus && mockResponse.httpStatus !== 200) {
        res.writeHead(mockResponse.httpStatus, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Mock error" }));
        return;
      }

      // Simulate garbage response
      if (mockResponse.returnGarbage) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end("not json at all {{{garbage###");
        return;
      }

      // Normal response — return OpenAI-compatible chat completion
      const responseContent = JSON.stringify({
        status: mockResponse.status,
        result: mockResponse.result ?? "Mock result",
        approvalRequest: mockResponse.approvalRequest,
        errorClass: mockResponse.errorClass,
        errorMessage: mockResponse.errorMessage,
      });

      const chatResponse = {
        id: `mock-${Date.now()}`,
        object: "chat.completion",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: responseContent },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: mockResponse.tokenUsage?.input ?? 100,
          completion_tokens: mockResponse.tokenUsage?.output ?? 50,
        },
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(chatResponse));
      return;
    }

    // Fallback
    res.writeHead(404);
    res.end("Not found");
  }

  /**
   * Simulate a callback FROM Hermes TO the Convex endpoint.
   * This is what Hermes would do for async (fire-and-callback) tasks.
   */
  async sendCallback(taskRunId: string, payload: MockResponse): Promise<Response> {
    const body = JSON.stringify({
      taskRunId,
      status: payload.status,
      result: payload.result,
      costCents: payload.costCents,
      tokenUsage: payload.tokenUsage,
      approvalRequest: payload.approvalRequest,
      errorClass: payload.errorClass,
      errorMessage: payload.errorMessage,
    });

    const signature = await generateHmacSignature(body, this.callbackSecret);

    return fetch(`${this.callbackUrl}/hermes-callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HMAC-Signature": signature,
      },
      body,
    });
  }

  /**
   * Send a callback with an invalid HMAC signature.
   */
  async sendBadCallback(taskRunId: string): Promise<Response> {
    const body = JSON.stringify({
      taskRunId,
      status: "completed",
      result: "Fake result",
    });

    return fetch(`${this.callbackUrl}/hermes-callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HMAC-Signature": "deadbeef".repeat(8),
      },
      body,
    });
  }

  /**
   * Send a callback with no HMAC signature.
   */
  async sendUnsignedCallback(taskRunId: string): Promise<Response> {
    const body = JSON.stringify({
      taskRunId,
      status: "completed",
      result: "Unsigned result",
    });

    return fetch(`${this.callbackUrl}/hermes-callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  /**
   * Send garbage (non-JSON) as a callback body.
   */
  async sendGarbageCallback(): Promise<Response> {
    const body = "not json {{{garbage";
    const signature = await generateHmacSignature(body, this.callbackSecret);

    return fetch(`${this.callbackUrl}/hermes-callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HMAC-Signature": signature,
      },
      body,
    });
  }
}
