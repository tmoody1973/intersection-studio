"use client";

export function MetricCardSkeleton({ category }: { category?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[10px] border border-limestone/20 bg-white p-4 dark:bg-[#292524]"
      aria-busy="true"
      aria-label="Loading metric data"
    >
      {/* Left border accent */}
      <div className="absolute left-0 top-0 h-full w-[3px] bg-limestone" />

      <div className="ml-2 space-y-3">
        {/* Label + trend row */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 animate-pulse rounded bg-limestone/30" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-limestone/20" />
        </div>

        {/* Big number */}
        <div className="h-8 w-20 animate-pulse rounded bg-limestone/30" />

        {/* Unit */}
        <div className="h-3 w-12 animate-pulse rounded bg-limestone/20" />

        {/* Source */}
        <div className="h-2.5 w-28 animate-pulse rounded bg-limestone/15" />
      </div>
    </div>
  );
}
