/**
 * HMAC signature verification for Hermes callbacks.
 *
 * Uses the Web Crypto API (SubtleCrypto) instead of Node's crypto module.
 * This works in Convex's default V8 runtime — no "use node" needed.
 *
 * The callback endpoint at /hermes-callback is the most exposed attack surface.
 * Every callback must include an X-HMAC-Signature header containing:
 *   HMAC-SHA256(raw_request_body, shared_secret) as hex string.
 */

/**
 * Convert an ArrayBuffer to a hex string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares every character regardless of where the first mismatch is.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify that the HMAC signature matches the payload.
 *
 * @param payload - Raw request body as string (NOT parsed/re-serialized JSON)
 * @param signature - Hex-encoded HMAC-SHA256 from X-HMAC-Signature header
 * @param secret - Shared secret between Fly.io Hermes and Convex
 * @returns true if signature is valid
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  const expected = bufferToHex(signatureBuffer);

  // Constant-time comparison — length check is implicit (both are hex of SHA-256)
  return constantTimeEqual(expected, signature);
}

/**
 * Generate an HMAC signature for a payload.
 * Used by the mock Hermes server in tests.
 */
export async function generateHmacSignature(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  return bufferToHex(signatureBuffer);
}
