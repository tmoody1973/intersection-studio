import { describe, it, expect } from "vitest";

/**
 * Address normalization tests for MAI geocoding.
 * Permits have addresses like "2033 S 24TH ST"
 * MAI has components: HSE_NBR="2033", DIR="S", STREET="24TH", STTYPE="ST"
 * Both need to normalize to the same key for matching.
 */

// Replicate from convex/etl/economic.ts
function normalizePermitAddress(addr: string): string {
  return addr.replace(/,.*$/, "").replace(/\s+/g, " ").trim().toUpperCase();
}

function buildMaiKey(
  hse: string,
  dir: string,
  street: string,
  sttype: string,
): string {
  return `${hse} ${dir} ${street} ${sttype}`
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

describe("Permit address normalization", () => {
  it("normalizes a standard permit address", () => {
    expect(normalizePermitAddress("2033 S 24TH ST")).toBe("2033 S 24TH ST");
  });

  it("strips city/state/zip suffix after comma", () => {
    expect(
      normalizePermitAddress("2033 S 24TH ST, MILWAUKEE, WI, 53204"),
    ).toBe("2033 S 24TH ST");
  });

  it("collapses multiple spaces", () => {
    expect(normalizePermitAddress("2033  S  24TH  ST")).toBe("2033 S 24TH ST");
  });

  it("uppercases everything", () => {
    expect(normalizePermitAddress("2033 s 24th st")).toBe("2033 S 24TH ST");
  });

  it("trims whitespace", () => {
    expect(normalizePermitAddress("  2033 S 24TH ST  ")).toBe("2033 S 24TH ST");
  });

  it("handles empty string", () => {
    expect(normalizePermitAddress("")).toBe("");
  });
});

describe("MAI key building", () => {
  it("builds key from components", () => {
    expect(buildMaiKey("612", "W", "ABBOTT", "AV")).toBe("612 W ABBOTT AV");
  });

  it("handles missing direction", () => {
    // Some addresses don't have a direction prefix
    expect(buildMaiKey("100", "", "MAIN", "ST")).toBe("100 MAIN ST");
  });

  it("handles None/null direction", () => {
    expect(buildMaiKey("100", "None", "MAIN", "ST")).toBe("100 NONE MAIN ST");
    // This would NOT match "100 MAIN ST" — potential matching issue
  });
});

describe("Permit ↔ MAI matching", () => {
  it("matches when formats align", () => {
    const permitAddr = normalizePermitAddress("2033 S 24TH ST");
    const maiKey = buildMaiKey("2033", "S", "24TH", "ST");
    expect(permitAddr).toBe(maiKey);
  });

  it("matches with different casing", () => {
    const permitAddr = normalizePermitAddress("612 w abbott av");
    const maiKey = buildMaiKey("612", "W", "ABBOTT", "AV");
    expect(permitAddr).toBe(maiKey);
  });

  it("identifies when formats DON'T align", () => {
    // Permit: "473 E WATERFORD AV" vs MAI: "473 E WATERFORD AVE"
    // If sttype differs (AV vs AVE), the match fails
    const permitAddr = normalizePermitAddress("473 E WATERFORD AV");
    const maiKey1 = buildMaiKey("473", "E", "WATERFORD", "AV");
    const maiKey2 = buildMaiKey("473", "E", "WATERFORD", "AVE");

    expect(permitAddr).toBe(maiKey1);
    expect(permitAddr).not.toBe(maiKey2);
  });
});
