"use client";

import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import type { MetricTrend } from "@/types/metrics";

const TREND_STYLES = {
  improving: {
    bg: "bg-positive-bg dark:bg-[#052E16]",
    text: "text-positive dark:text-[#4ADE80]",
    Icon: TrendingDown,
    srPrefix: "improving, down",
  },
  worsening: {
    bg: "bg-critical-bg dark:bg-[#450A0A]",
    text: "text-critical dark:text-[#FCA5A5]",
    Icon: TrendingUp,
    srPrefix: "worsening, up",
  },
  stable: {
    bg: "bg-warning-bg dark:bg-[#451A03]",
    text: "text-warning dark:text-[#FCD34D]",
    Icon: ArrowRight,
    srPrefix: "stable,",
  },
} as const;

interface TrendBadgeProps {
  trend: MetricTrend;
}

export function TrendBadge({ trend }: TrendBadgeProps) {
  const style = TREND_STYLES[trend.direction];
  const { Icon } = style;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
      aria-label={`${style.srPrefix} ${trend.percentage}% ${trend.comparedTo}`}
    >
      <Icon size={12} aria-hidden="true" />
      <span>{trend.percentage}%</span>
    </span>
  );
}
