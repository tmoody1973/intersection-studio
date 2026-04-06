import { describe, it, expect } from "vitest";

/**
 * Data fallback logic tests.
 * The 0-vs-null problem has caused 3 bugs:
 * 1. WIBR crime 0 → didn't fall back to ArcGIS
 * 2. Accela vacant buildings 0 → didn't fall back to Strong Neighborhoods
 * 3. Census spatial query grabbed adjacent tracts → inflated population
 *
 * The pattern: when a data source returns 0, we need to distinguish
 * "genuinely zero" from "source is down/empty."
 */

describe("Fallback logic: 0 vs null vs undefined", () => {
  // Replicate the crime fallback from useNeighborhoodData.ts
  function getCrimeCount(
    crimeTotal: number | undefined | null,
    part1CrimeCount: number | undefined | null,
  ): number | null {
    return crimeTotal && crimeTotal > 0
      ? crimeTotal
      : part1CrimeCount ?? null;
  }

  it("uses WIBR when it has data", () => {
    expect(getCrimeCount(59, 33)).toBe(59);
  });

  it("falls back to ArcGIS when WIBR is 0 (source empty)", () => {
    expect(getCrimeCount(0, 27)).toBe(27);
  });

  it("falls back to ArcGIS when WIBR is undefined", () => {
    expect(getCrimeCount(undefined, 27)).toBe(27);
  });

  it("falls back to ArcGIS when WIBR is null", () => {
    expect(getCrimeCount(null, 27)).toBe(27);
  });

  it("returns null when both sources are empty", () => {
    expect(getCrimeCount(0, null)).toBe(null);
    expect(getCrimeCount(undefined, undefined)).toBe(null);
  });

  // Replicate the vacant building fallback from sync.ts
  function getVacantCount(
    csvVacantCount: number | undefined,
    arcgisVacantCount: number,
  ): number {
    return csvVacantCount && csvVacantCount > 0
      ? csvVacantCount
      : arcgisVacantCount;
  }

  it("uses Accela when it has data", () => {
    expect(getVacantCount(150, 90)).toBe(150);
  });

  it("falls back to ArcGIS when Accela is 0 (source empty)", () => {
    expect(getVacantCount(0, 90)).toBe(90);
  });

  it("falls back to ArcGIS when Accela is undefined", () => {
    expect(getVacantCount(undefined, 90)).toBe(90);
  });
});

describe("Nullish coalescing pitfalls", () => {
  it("demonstrates why ?? fails for 0-vs-null", () => {
    // This is the BUG: 0 ?? 90 returns 0, not 90
    expect(0 ?? 90).toBe(0);

    // What we WANTED: if value is 0 or missing, use fallback
    // Correct: explicit check
    const value = 0;
    const fallback = 90;
    const correct = value && value > 0 ? value : fallback;
    expect(correct).toBe(90);
  });

  it("?? works correctly for null and undefined", () => {
    expect(null ?? 90).toBe(90);
    expect(undefined ?? 90).toBe(90);
  });
});
