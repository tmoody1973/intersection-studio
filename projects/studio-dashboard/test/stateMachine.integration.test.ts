import { describe, it, expect } from "vitest";
import { validateTransition, shouldRetry } from "../convex/lib/stateMachine";

/**
 * Integration-level state machine tests.
 * Tests complete task lifecycle scenarios end-to-end
 * through the state machine.
 */

describe("full task lifecycle scenarios", () => {
  it("happy path: queued → running → completed", () => {
    const t1 = validateTransition("queued", "running", 0);
    expect(t1.valid).toBe(true);

    const t2 = validateTransition("running", "completed", 0);
    expect(t2.valid).toBe(true);

    // Terminal — no further transitions
    const t3 = validateTransition("completed", "running", 0);
    expect(t3.valid).toBe(false);
  });

  it("approval flow: queued → running → waiting_approval → completed", () => {
    expect(validateTransition("queued", "running", 0).valid).toBe(true);
    expect(validateTransition("running", "waiting_approval", 0).valid).toBe(true);
    expect(validateTransition("waiting_approval", "completed", 0).valid).toBe(true);
  });

  it("rejection flow: queued → running → waiting_approval → failed", () => {
    expect(validateTransition("queued", "running", 0).valid).toBe(true);
    expect(validateTransition("running", "waiting_approval", 0).valid).toBe(true);
    expect(validateTransition("waiting_approval", "failed", 0).valid).toBe(true);
  });

  it("timeout + retry flow: queued → running → failed → queued → running → completed", () => {
    expect(validateTransition("queued", "running", 0).valid).toBe(true);
    expect(validateTransition("running", "failed", 0).valid).toBe(true);

    // Retry (retryCount still 0)
    expect(validateTransition("failed", "queued", 0).valid).toBe(true);

    // Second attempt
    expect(validateTransition("queued", "running", 1).valid).toBe(true);
    expect(validateTransition("running", "completed", 1).valid).toBe(true);
  });

  it("timeout + retry exhausted: fails on second retry attempt", () => {
    expect(validateTransition("failed", "queued", 0).valid).toBe(true); // first retry OK
    expect(validateTransition("failed", "queued", 1).valid).toBe(false); // second retry BLOCKED
  });

  it("cancellation from any non-terminal state", () => {
    expect(validateTransition("queued", "cancelled", 0).valid).toBe(true);
    expect(validateTransition("running", "cancelled", 0).valid).toBe(true);
    expect(validateTransition("waiting_approval", "cancelled", 0).valid).toBe(true);
  });

  it("cannot cancel from terminal states", () => {
    expect(validateTransition("completed", "cancelled", 0).valid).toBe(false);
    expect(validateTransition("cancelled", "cancelled", 0).valid).toBe(false);
  });
});

describe("retry decision scenarios", () => {
  it("retries transient network error on first attempt", () => {
    expect(shouldRetry("NetworkError", 0)).toBe(true);
  });

  it("does not retry network error on second attempt", () => {
    expect(shouldRetry("NetworkError", 1)).toBe(false);
  });

  it("does not retry permanent failures regardless of attempt", () => {
    expect(shouldRetry("JSONParseError", 0)).toBe(false);
    expect(shouldRetry("AgentFailureError", 0)).toBe(false);
    expect(shouldRetry("CircularDelegationError", 0)).toBe(false);
    expect(shouldRetry("StaleParentError", 0)).toBe(false);
  });

  it("retries all transient error types on first attempt", () => {
    const transient = ["NetworkError", "ServiceUnavailable", "RateLimitError", "TimeoutError"];
    for (const err of transient) {
      expect(shouldRetry(err, 0)).toBe(true);
    }
  });
});
