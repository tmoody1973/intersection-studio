export type CategoryId =
  | "community"
  | "publicSafety"
  | "qualityOfLife"
  | "wellness"
  | "development";

export interface MetricTrend {
  direction: "improving" | "worsening" | "stable";
  /** Absolute percentage change from previous period */
  percentage: number;
  /** Human-readable period: "vs. last quarter", "vs. 2024" */
  comparedTo: string;
}

export interface MetricSource {
  /** Display name: "MPROP REST", "MPD Monthly", "Census ACS" */
  name: string;
  /** Last updated timestamp (ISO 8601) */
  lastUpdated: string;
}

export interface MetricProgress {
  /** 0-100 */
  value: number;
  /** Label shown next to bar: "on-time", "abated", etc. */
  label: string;
}

export interface SparklinePoint {
  period: string;
  value: number;
}

export interface MetricCardProps {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  trend: MetricTrend | null;
  category: CategoryId;
  source: MetricSource;
  progress?: MetricProgress;
  sparkline?: {
    data: SparklinePoint[];
    periodType: string;
  };
  state?: "default" | "loading" | "error" | "empty";
  errorMessage?: string;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onAskAI?: (id: string, label: string) => void;
}

export interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: "CircleDot" | "Shield" | "Building2" | "Heart" | "Landmark";
  color: string;
  colorDark: string;
  metricCount?: number;
  disabled?: boolean;
}

export interface CategoryTabsProps {
  categories: CategoryTab[];
  activeCategory: CategoryId;
  onChange: (categoryId: CategoryId) => void;
  showCounts?: boolean;
}

export interface NeighborhoodMetric {
  id: string;
  category: CategoryId;
  label: string;
  value: number | null;
  unit: string;
  trendDirection: "improving" | "worsening" | "stable" | null;
  trendPercentage: number | null;
  trendComparedTo: string;
  sourceName: string;
  sourceLastUpdated: string;
  progressValue?: number;
  progressLabel?: string;
  sparklineData?: SparklinePoint[];
  sparklinePeriodType?: string;
}
