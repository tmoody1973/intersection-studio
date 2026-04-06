import { describe, it, expect } from "vitest";

/**
 * Census tract code conversion tests.
 * This bug cost us 2 iterations:
 * - Short codes like 67 need to become "006700" (multiply by 100, pad to 6)
 * - Long codes like 1856 need to become "185600" (multiply by 100, pad to 6)
 * - NOT "000067" (wrong: zero-pad) or "001856" (wrong: zero-pad without *100)
 */

// Replicate the conversion logic from convex/sync.ts
function convertTractToFips(tractCode: number): string {
  return String(tractCode * 100).padStart(6, "0");
}

describe("Census tract code → FIPS conversion", () => {
  it("converts short codes (2-digit) correctly", () => {
    expect(convertTractToFips(67)).toBe("006700");
    expect(convertTractToFips(68)).toBe("006800");
    expect(convertTractToFips(11)).toBe("001100");
    expect(convertTractToFips(47)).toBe("004700");
  });

  it("converts 3-digit codes correctly", () => {
    expect(convertTractToFips(106)).toBe("010600");
  });

  it("converts 4-digit codes (new census tracts) correctly", () => {
    expect(convertTractToFips(1856)).toBe("185600");
    expect(convertTractToFips(1857)).toBe("185700");
  });

  it("does NOT zero-pad without multiplication", () => {
    // This was the bug: "67" padded to "000067" instead of "006700"
    const wrong = String(67).padStart(6, "0");
    expect(wrong).toBe("000067");
    expect(wrong).not.toBe("006700");

    // Correct way
    expect(convertTractToFips(67)).toBe("006700");
  });

  it("handles all Harambee tracts", () => {
    const harambeeTracts = [67, 68, 69, 70, 71, 81, 84, 106, 1856, 1857];
    const expected = [
      "006700", "006800", "006900", "007000", "007100",
      "008100", "008400", "010600", "185600", "185700",
    ];
    const result = harambeeTracts.map(convertTractToFips);
    expect(result).toEqual(expected);
  });

  it("handles all 8 neighborhood tract sets", () => {
    const neighborhoods: Record<string, number[]> = {
      amani: [64, 65, 87],
      borchertField: [66],
      franklinHeights: [47, 63, 64],
      harambee: [67, 68, 69, 70, 71, 81, 84, 106, 1856, 1857],
      havenwoods: [11, 12, 19],
      lindsayHeights: [84, 85, 86],
      metcalfePark: [88, 89],
      shermanPark: [48, 49, 50, 59, 60, 61],
    };

    for (const [name, tracts] of Object.entries(neighborhoods)) {
      for (const tract of tracts) {
        const fips = convertTractToFips(tract);
        expect(fips.length, `${name} tract ${tract} should be 6 digits`).toBe(6);
        expect(fips, `${name} tract ${tract} should end in 00`).toMatch(/00$/);
      }
    }
  });
});
