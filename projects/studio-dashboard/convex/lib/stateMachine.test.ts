import { describe, it, expect } from "vitest";
import { validateTransition, shouldRetry } from "./stateMachine";

describe("validateTransition", () => {
  // Happy path transitions
  it("allows queued → running", () => {
    expect(validateTransition("queued", "running", 0)).toEqual({ valid: true });
  });

  it("allows running → completed", () => {
    expect(validateTransition("running", "completed", 0)).toEqual({ valid: true });
  });

  it("allows running → failed", () => {
    expect(validateTransition("running", "failed", 0)).toEqual({ valid: true });
  });

  it("allows running → waiting_approval", () => {
    expect(validateTransition("running", "waiting_approval", 0)).toEqual({ valid: true });
  });

  it("allows waiting_approval → completed (approve)", () => {
    expect(validateTransition("waiting_approval", "completed", 0)).toEqual({ valid: true });
  });

  it("allows waiting_approval → failed (reject)", () => {
    expect(validateTransition("waiting_approval", "failed", 0)).toEqual({ valid: true });
  });

  // Retry
  it("allows failed → queued when retryCount is 0", () => {
    expect(validateTransition("failed", "queued", 0)).toEqual({ valid: true });
  });

  it("rejects failed → queued when retryCount is 1 (max retries)", () => {
    const result = validateTransition("failed", "queued", 1);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Max retries");
  });

  // Cancellation
  it("allows queued → cancelled", () => {
    expect(validateTransition("queued", "cancelled", 0)).toEqual({ valid: true });
  });

  it("allows running → cancelled", () => {
    expect(validateTransition("running", "cancelled", 0)).toEqual({ valid: true });
  });

  it("allows waiting_approval → cancelled", () => {
    expect(validateTransition("waiting_approval", "cancelled", 0)).toEqual({ valid: true });
  });

  // Illegal transitions
  it("rejects completed → running (terminal state)", () => {
    const result = validateTransition("completed", "running", 0);
    expect(result.valid).toBe(false);
  });

  it("rejects cancelled → queued (terminal state)", () => {
    const result = validateTransition("cancelled", "queued", 0);
    expect(result.valid).toBe(false);
  });

  it("rejects unknown status", () => {
    const result = validateTransition("bogus", "running", 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Unknown status");
  });

  it("rejects queued → completed (must go through running)", () => {
    const result = validateTransition("queued", "completed", 0);
    expect(result.valid).toBe(false);
  });
});

describe("shouldRetry", () => {
  it("retries NetworkError on first attempt", () => {
    expect(shouldRetry("NetworkError", 0)).toBe(true);
  });

  it("retries ServiceUnavailable on first attempt", () => {
    expect(shouldRetry("ServiceUnavailable", 0)).toBe(true);
  });

  it("retries RateLimitError on first attempt", () => {
    expect(shouldRetry("RateLimitError", 0)).toBe(true);
  });

  it("retries TimeoutError on first attempt", () => {
    expect(shouldRetry("TimeoutError", 0)).toBe(true);
  });

  it("does NOT retry JSONParseError", () => {
    expect(shouldRetry("JSONParseError", 0)).toBe(false);
  });

  it("does NOT retry AgentFailureError", () => {
    expect(shouldRetry("AgentFailureError", 0)).toBe(false);
  });

  it("does NOT retry CircularDelegationError", () => {
    expect(shouldRetry("CircularDelegationError", 0)).toBe(false);
  });

  it("does NOT retry any error when retryCount >= 1", () => {
    expect(shouldRetry("NetworkError", 1)).toBe(false);
    expect(shouldRetry("TimeoutError", 1)).toBe(false);
  });
});
