/**
 * Auth helpers for Clerk integration.
 * Three tiers: public (no auth), authenticated (signed in), city_official (role).
 *
 * NOTE: Clerk is not yet configured. These helpers are ready for Sprint 1 integration.
 * Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env.local.
 */

export type AuthTier = "public" | "authenticated" | "city_official";

/**
 * Determine the auth tier from Clerk session metadata.
 * Call this in Server Components or Route Handlers.
 */
export function getAuthTier(sessionClaims: Record<string, unknown> | null): AuthTier {
  if (!sessionClaims) return "public";

  const role = sessionClaims?.metadata &&
    typeof sessionClaims.metadata === "object" &&
    "role" in (sessionClaims.metadata as Record<string, unknown>)
      ? (sessionClaims.metadata as Record<string, string>).role
      : undefined;

  if (role === "city_official") return "city_official";
  return "authenticated";
}
