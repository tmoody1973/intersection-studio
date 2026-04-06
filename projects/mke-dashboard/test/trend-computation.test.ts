import { describe, it, expect } from "vitest";
import { computeTrendDirection, type TrendPolarity } from "@/lib/metric-config";

/**
 * Trend computation tests.
 * The delta cards depend on correct polarity mapping:
 * - Crime going DOWN = "improving" (green)
 * - Income going UP = "improving" (green)
 * - Crime going UP = "worsening" (red)
 * - Income going DOWN = "worsening" (red)
 * - < 2% change = "stable" (gray)
 */

describe("computeTrendDirection", () => {
  describe("lower_is_better metrics (crime, vacancy, poverty)", () => {
    const polarity: TrendPolarity = "lower_is_better";

    it("returns improving when value decreases", () => {
      expect(computeTrendDirection(polarity, -10)).toBe("improving");
      expect(computeTrendDirection(polarity, -50)).toBe("improving");
    });

    it("returns worsening when value increases", () => {
      expect(computeTrendDirection(polarity, 10)).toBe("worsening");
      expect(computeTrendDirection(polarity, 50)).toBe("worsening");
    });

    it("returns stable for small changes (< 2%)", () => {
      expect(computeTrendDirection(polarity, 1)).toBe("stable");
      expect(computeTrendDirection(polarity, -1)).toBe("stable");
      expect(computeTrendDirection(polarity, 0)).toBe("stable");
      expect(computeTrendDirection(polarity, 1.9)).toBe("stable");
    });
  });

  describe("higher_is_better metrics (income, population, home value)", () => {
    const polarity: TrendPolarity = "higher_is_better";

    it("returns improving when value increases", () => {
      expect(computeTrendDirection(polarity, 10)).toBe("improving");
      expect(computeTrendDirection(polarity, 50)).toBe("improving");
    });

    it("returns worsening when value decreases", () => {
      expect(computeTrendDirection(polarity, -10)).toBe("worsening");
      expect(computeTrendDirection(polarity, -50)).toBe("worsening");
    });

    it("returns stable for small changes (< 2%)", () => {
      expect(computeTrendDirection(polarity, 1)).toBe("stable");
      expect(computeTrendDirection(polarity, -1)).toBe("stable");
      expect(computeTrendDirection(polarity, 0)).toBe("stable");
    });
  });

  describe("edge cases", () => {
    it("handles exactly 2% as boundary", () => {
      // The implementation uses Math.abs(rawChange) < threshold (2)
      // Exactly 2.0 is NOT stable — it's at the boundary
      expect(computeTrendDirection("lower_is_better", 2)).toBe("worsening");
      expect(computeTrendDirection("lower_is_better", 1.99)).toBe("stable");
      expect(computeTrendDirection("lower_is_better", -2)).toBe("improving");
      expect(computeTrendDirection("lower_is_better", -1.99)).toBe("stable");
    });

    it("handles large percentage changes", () => {
      expect(computeTrendDirection("lower_is_better", -100)).toBe("improving");
      expect(computeTrendDirection("higher_is_better", 500)).toBe("improving");
    });
  });
});

describe("Trend percentage computation", () => {
  function computePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  it("computes correct percentage for crime decline", () => {
    // Harambee: 552 (2021) → 332 (2024) = 39.8% decline
    const change = computePercentageChange(332, 552);
    expect(Math.round(Math.abs(change))).toBe(40);
    expect(change).toBeLessThan(0);
  });

  it("computes correct percentage for property value increase", () => {
    const change = computePercentageChange(138000, 120000);
    expect(change).toBeCloseTo(15, 0);
  });

  it("handles zero previous value without division error", () => {
    const change = computePercentageChange(100, 0);
    expect(change).toBe(0); // Not Infinity
  });

  it("handles equal values as 0% change", () => {
    const change = computePercentageChange(59, 59);
    expect(change).toBe(0);
  });
});
