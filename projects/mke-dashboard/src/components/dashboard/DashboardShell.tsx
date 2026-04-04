"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { MetricsPanel } from "./MetricsPanel";
import { DashboardContext } from "@/copilot/DashboardContext";
import { useNeighborhoodData } from "@/hooks/useNeighborhoodData";
import { TARGET_NEIGHBORHOODS } from "@/lib/constants";
import type { CategoryId } from "@/types/metrics";

// Dynamic import for Mapbox (requires WebGL, can't SSR)
const DashboardMap = dynamic(
  () =>
    import("@/components/map/DashboardMap").then((mod) => mod.DashboardMap),
  { ssr: false, loading: () => <div className="h-full bg-limestone/10 rounded-lg animate-pulse" /> },
);

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function DashboardShell() {
  const [selectedSlug, setSelectedSlug] = useState("harambee");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("community");
  const [showHOLC, setShowHOLC] = useState(false);
  const { metrics, isLoading, neighborhoodName } =
    useNeighborhoodData(selectedSlug);

  // Parse boundary GeoJSON from Convex data for the map
  const boundaryData = useMemo(() => {
    // This would come from the Convex neighborhood record
    // For now, we'll let the map load boundaries from the DCD layer
    return undefined;
  }, [selectedSlug]);

  const handleAskAI = useCallback(
    (metricId: string, label: string) => {
      console.info(
        `[CopilotKit] Ask AI about: ${label} (${metricId}) in ${selectedSlug}`,
      );
    },
    [selectedSlug],
  );

  return (
    <>
      <DashboardContext
        neighborhoodName={neighborhoodName}
        neighborhoodSlug={selectedSlug}
        activeCategory={activeCategory}
        metrics={metrics}
        onSwitchNeighborhood={setSelectedSlug}
        onSwitchCategory={setActiveCategory}
      />

      <div className="mx-auto w-full max-w-7xl">
        {/* Neighborhood selector + HOLC toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label
            htmlFor="neighborhood-select"
            className="text-sm font-medium text-iron"
          >
            Neighborhood
          </label>
          <select
            id="neighborhood-select"
            className="rounded-lg border border-limestone/30 bg-white px-3 py-2 text-sm text-iron focus:border-lakeshore focus:outline-none focus:ring-1 focus:ring-lakeshore dark:bg-[#292524]"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            {TARGET_NEIGHBORHOODS.map((name) => (
              <option key={name} value={toSlug(name)}>
                {name}
              </option>
            ))}
          </select>
          <span className="text-xs text-limestone">
            Viewing: {neighborhoodName}
          </span>
          <label className="ml-auto flex items-center gap-2 text-xs text-foundry">
            <input
              type="checkbox"
              checked={showHOLC}
              onChange={(e) => setShowHOLC(e.target.checked)}
              className="h-4 w-4 rounded border-limestone/30 text-lakeshore focus:ring-lakeshore"
            />
            Show 1930s Redlining
          </label>
        </div>

        {/* Desktop: Map + Metrics side by side */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Map */}
          <div className="h-[300px] w-full overflow-hidden rounded-lg border border-limestone/20 lg:h-[600px] lg:w-[400px] lg:flex-shrink-0">
            <DashboardMap showHOLC={showHOLC} />
          </div>

          {/* Metrics Panel */}
          <div className="min-w-0 flex-1">
            <MetricsPanel
              metrics={metrics}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onAskAI={handleAskAI}
            />
          </div>
        </div>
      </div>

      <CopilotSidebar
        labels={{
          title: "Ask about Milwaukee",
          initial: `Hi! I can help you understand neighborhood data for ${neighborhoodName}. Try asking:\n\n• How many vacant properties are there?\n• What's the crime trend?\n• Compare this neighborhood to Sherman Park`,
        }}
        defaultOpen={false}
      />
    </>
  );
}
