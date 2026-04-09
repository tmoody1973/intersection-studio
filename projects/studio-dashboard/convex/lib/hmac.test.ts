import { describe, it, expect } from "vitest";
import { verifyHmacSignature, generateHmacSignature } from "./hmac";

const SECRET = "test-secret-key-for-unit-tests";
const PAYLOAD = '{"taskRunId":"abc123","status":"completed","result":"done"}';

describe("verifyHmacSignature", () => {
  it("returns true for a valid signature", async () => {
    const signature = await generateHmacSignature(PAYLOAD, SECRET);
    const result = await verifyHmacSignature(PAYLOAD, signature, SECRET);
    expect(result).toBe(true);
  });

  it("returns false for an invalid signature", async () => {
    const result = await verifyHmacSignature(PAYLOAD, "deadbeef".repeat(8), SECRET);
    expect(result).toBe(false);
  });

  it("returns false for an empty signature", async () => {
    const result = await verifyHmacSignature(PAYLOAD, "", SECRET);
    expect(result).toBe(false);
  });

  it("returns false for a wrong-length signature", async () => {
    const result = await verifyHmacSignature(PAYLOAD, "abc", SECRET);
    expect(result).toBe(false);
  });

  it("returns false when payload is tampered", async () => {
    const signature = await generateHmacSignature(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace("completed", "failed");
    const result = await verifyHmacSignature(tampered, signature, SECRET);
    expect(result).toBe(false);
  });

  it("returns false when secret is wrong", async () => {
    const signature = await generateHmacSignature(PAYLOAD, SECRET);
    const result = await verifyHmacSignature(PAYLOAD, signature, "wrong-secret");
    expect(result).toBe(false);
  });
});

describe("generateHmacSignature", () => {
  it("produces a 64-character hex string (SHA-256)", async () => {
    const signature = await generateHmacSignature(PAYLOAD, SECRET);
    expect(signature).toHaveLength(64);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic (same input = same output)", async () => {
    const sig1 = await generateHmacSignature(PAYLOAD, SECRET);
    const sig2 = await generateHmacSignature(PAYLOAD, SECRET);
    expect(sig1).toBe(sig2);
  });
});
