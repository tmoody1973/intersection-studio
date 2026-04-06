/**
 * Trend computation utilities.
 * Metric definitions have moved to src/lib/metric-registry.ts.
 */

export type TrendPolarity = "lower_is_better" | "higher_is_better";

/**
 * Given a metric's polarity and a raw change direction,
 * compute the semantic trend direction.
 */
export function computeTrendDirection(
  polarity: TrendPolarity,
  rawChange: number,
): "improving" | "worsening" | "stable" {
  const threshold = 2; // Less than 2% change = stable
  if (Math.abs(rawChange) < threshold) return "stable";

  if (polarity === "lower_is_better") {
    return rawChange < 0 ? "improving" : "worsening";
  }
  return rawChange > 0 ? "improving" : "worsening";
}
