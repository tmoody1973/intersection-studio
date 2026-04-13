/**
 * Call the Fly.io Hermes proxy from a Convex action.
 * Handles env var reading, Bearer auth, timeout, and error wrapping.
 */
export async function callProxy(
  path: string,
  body: Record<string, unknown>,
  timeoutMs = 10000,
): Promise<Record<string, unknown>> {
  const hermesUrl = process.env.HERMES_API_URL;
  const studioKey = process.env.STUDIO_API_KEY;

  if (!hermesUrl || !studioKey) {
    throw new Error("Missing HERMES_API_URL or STUDIO_API_KEY");
  }

  const response = await fetch(`${hermesUrl}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${studioKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Proxy ${path} returned ${response.status}: ${text}`);
  }

  return response.json();
}
