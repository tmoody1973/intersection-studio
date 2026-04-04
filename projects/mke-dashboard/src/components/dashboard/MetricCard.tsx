"use client";

import { useCallback } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { TrendBadge } from "@/components/ui/TrendBadge";
import { MetricCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { CATEGORY_COLORS } from "@/lib/constants";
import type { MetricCardProps, CategoryId } from "@/types/metrics";

function getCategoryColor(category: CategoryId, mode: "light" | "dark" = "light"): string {
  return CATEGORY_COLORS[category][mode];
}

function buildAriaLabel(props: MetricCardProps): string {
  const parts = [`${props.label}:`];

  if (props.state === "loading") return `${props.label}: loading data`;
  if (props.state === "error") return `${props.label}: data unavailable`;
  if (props.state === "empty" || props.value === null)
    return `${props.label}: no data reported`;

  parts.push(`${props.value.toLocaleString()} ${props.unit}`);

  if (props.trend) {
    parts.push(
      `${props.trend.direction} ${props.trend.percentage}% ${props.trend.comparedTo}`,
    );
  }

  if (props.progress) {
    parts.push(`${props.progress.value}% ${props.progress.label}`);
  }

  parts.push(`source: ${props.source.name}`);
  return parts.join(", ");
}

function formatLastUpdated(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
      delay: index * 0.06,
    },
  }),
};

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

interface MetricCardWithIndexProps extends MetricCardProps {
  index?: number;
}

export function MetricCard(props: MetricCardWithIndexProps) {
  const {
    id,
    label,
    value,
    unit,
    trend,
    category,
    source,
    progress,
    state = "default",
    errorMessage,
    isExpanded = false,
    onToggleExpand,
    onAskAI,
    index = 0,
  } = props;

  const prefersReducedMotion = useReducedMotion();

  const handleToggle = useCallback(() => {
    onToggleExpand?.(id);
  }, [id, onToggleExpand]);

  const handleAskAI = useCallback(() => {
    onAskAI?.(id, label);
  }, [id, label, onAskAI]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
      if (e.key === "Escape" && isExpanded) {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle, isExpanded],
  );

  if (state === "loading") {
    return <MetricCardSkeleton category={category} />;
  }

  const borderColor = getCategoryColor(category);

  return (
    <motion.article
      role="article"
      aria-label={buildAriaLabel(props)}
      tabIndex={0}
      onClick={onToggleExpand ? handleToggle : undefined}
      onKeyDown={onToggleExpand ? handleKeyDown : undefined}
      className={`
        relative overflow-hidden rounded-[10px] border bg-white
        transition-shadow
        dark:bg-[#292524] dark:border-[#44403C]
        ${onToggleExpand ? "cursor-pointer" : ""}
        ${isExpanded ? "shadow-lg" : "shadow-sm hover:-translate-y-0.5 hover:shadow-md"}
        ${state === "error" ? "border-critical" : "border-limestone/20"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      `}
      style={{
        // @ts-expect-error -- CSS custom property for focus ring color
        "--tw-ring-color": borderColor,
      }}
      custom={index}
      variants={prefersReducedMotion ? reducedMotionVariants : cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left border accent */}
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: state === "error" ? "#B91C1C" : borderColor }}
      />

      <div className="ml-2 p-3 sm:p-4">
        {/* Row 1: Label + Trend Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foundry sm:text-xs">
            {label}
          </span>
          {trend && state === "default" && <TrendBadge trend={trend} />}
        </div>

        {/* Row 2: Big Number */}
        <div className="mt-2">
          {state === "error" ? (
            <span className="font-display text-2xl font-bold text-foundry sm:text-[2.5rem]">
              &mdash;
            </span>
          ) : value !== null ? (
            <span className="font-display text-[2rem] font-bold leading-none text-iron sm:text-[2.5rem]">
              {typeof value === "number"
                ? value.toLocaleString()
                : value}
            </span>
          ) : (
            <span className="font-display text-2xl font-bold text-limestone">
              N/A
            </span>
          )}
        </div>

        {/* Row 3: Unit */}
        <div className="mt-1">
          <span className="text-xs text-foundry">{unit}</span>
        </div>

        {/* Optional: Progress Bar */}
        {progress && state === "default" && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-limestone/20"
                role="progressbar"
                aria-valuenow={progress.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress.value}% ${progress.label}`}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: borderColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.value}%` }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.8, ease: "easeOut" }
                  }
                />
              </div>
              <span className="ml-2 whitespace-nowrap text-foundry">
                {progress.value}% {progress.label}
              </span>
            </div>
          </div>
        )}

        {/* Error state message */}
        {state === "error" && (
          <p className="mt-2 text-xs text-critical">
            {errorMessage ?? "Data unavailable"}
          </p>
        )}

        {/* Source caption */}
        <div className="mt-3 flex items-center gap-1">
          <span className="font-data text-[10px] text-limestone sm:text-[11px]">
            src: {source.name}
            {source.lastUpdated &&
              ` — Updated ${formatLastUpdated(source.lastUpdated)}`}
          </span>
        </div>

        {/* Expanded content */}
        {isExpanded && state === "default" && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.25, ease: "easeInOut" }
            }
            className="mt-4 border-t border-limestone/20 pt-4"
          >
            {/* Sparkline placeholder — Recharts integration in Sprint 2 */}
            {props.sparkline && (
              <div className="mb-3 h-16 rounded bg-limestone/10" />
            )}

            {/* Ask AI button */}
            {onAskAI && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAskAI();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-lakeshore transition-colors hover:bg-lakeshore/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lakeshore"
              >
                <MessageSquareText size={14} aria-hidden="true" />
                Ask AI about this
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}
