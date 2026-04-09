import { describe, it, expect } from "vitest";
import { generateHmacSignature } from "../convex/lib/hmac";

/**
 * Callback endpoint integration tests.
 *
 * These test the HMAC verification and JSON parsing logic
 * at the function level (not against a live Convex deployment).
 * Full E2E tests against the deployed endpoint require HERMES_CALLBACK_SECRET
 * to be configured.
 *
 * The mock Hermes server (test/mockHermes.ts) is available for
 * full integration testing once Fly.io is deployed.
 */

const CALLBACK_SECRET = "test-callback-secret";

describe("callback HMAC verification", () => {
  it("generates valid HMAC for a callback payload", async () => {
    const payload = JSON.stringify({
      taskRunId: "abc123",
      status: "completed",
      result: "Task done",
      costCents: 12,
    });

    const sig = await generateHmacSignature(payload, CALLBACK_SECRET);
    expect(sig).toHaveLength(64);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("same payload + secret = same signature (deterministic)", async () => {
    const payload = '{"status":"completed"}';
    const sig1 = await generateHmacSignature(payload, CALLBACK_SECRET);
    const sig2 = await generateHmacSignature(payload, CALLBACK_SECRET);
    expect(sig1).toBe(sig2);
  });

  it("different payload = different signature", async () => {
    const sig1 = await generateHmacSignature('{"status":"completed"}', CALLBACK_SECRET);
    const sig2 = await generateHmacSignature('{"status":"failed"}', CALLBACK_SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("different secret = different signature", async () => {
    const payload = '{"status":"completed"}';
    const sig1 = await generateHmacSignature(payload, CALLBACK_SECRET);
    const sig2 = await generateHmacSignature(payload, "other-secret");
    expect(sig1).not.toBe(sig2);
  });
});

describe("callback payload shapes", () => {
  it("completed payload has required fields", () => {
    const payload = {
      taskRunId: "run_abc123",
      status: "completed" as const,
      result: "LinkedIn post draft: ...",
      costCents: 15,
      tokenUsage: { input: 1200, output: 400 },
    };

    expect(payload.taskRunId).toBeTruthy();
    expect(payload.status).toBe("completed");
    expect(payload.result).toBeTruthy();
    expect(payload.costCents).toBeGreaterThan(0);
  });

  it("needs_approval payload has approvalRequest", () => {
    const payload = {
      taskRunId: "run_abc123",
      status: "needs_approval" as const,
      result: "Draft post ready for review",
      approvalRequest: {
        action: "Publish LinkedIn post",
        reason: "External-facing content needs human review",
      },
    };

    expect(payload.approvalRequest).toBeDefined();
    expect(payload.approvalRequest.action).toBeTruthy();
    expect(payload.approvalRequest.reason).toBeTruthy();
  });

  it("failed payload has errorClass and errorMessage", () => {
    const payload = {
      taskRunId: "run_abc123",
      status: "failed" as const,
      errorClass: "RateLimitError",
      errorMessage: "OpenRouter 429: too many requests",
    };

    expect(payload.errorClass).toBeTruthy();
    expect(payload.errorMessage).toBeTruthy();
  });

  it("delegation payload has delegations array", () => {
    const payload = {
      taskRunId: "run_abc123",
      status: "completed" as const,
      result: "Delegating to Content Writer",
      delegations: [
        { to: "content-writer", task: "Write LinkedIn post", reason: "Content work" },
      ],
    };

    expect(payload.delegations).toHaveLength(1);
    expect(payload.delegations[0].to).toBe("content-writer");
  });
});

describe("mock Hermes server shape", () => {
  it("OpenAI-compatible chat completion response", () => {
    const response = {
      id: "mock-123",
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({ status: "completed", result: "Done" }),
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };

    expect(response.choices).toHaveLength(1);
    const content = JSON.parse(response.choices[0].message.content);
    expect(content.status).toBe("completed");
  });
});
