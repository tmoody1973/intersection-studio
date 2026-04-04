"use client";

import { useState, useCallback } from "react";
import { MetricsPanel } from "./MetricsPanel";
import { useNeighborhoodData } from "@/hooks/useNeighborhoodData";
import { TARGET_NEIGHBORHOODS } from "@/lib/constants";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function DashboardShell() {
  const [selectedSlug, setSelectedSlug] = useState("harambee");
  const { metrics, neighborhoodName } = useNeighborhoodData(selectedSlug);

  const handleAskAI = useCallback((metricId: string, label: string) => {
    // TODO: Wire to CopilotKit sidebar in Sprint 3
    console.info(
      `[CopilotKit] Ask AI about: ${label} (${metricId}) in ${selectedSlug}`,
    );
  }, [selectedSlug]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Neighborhood selector */}
      <div className="mb-6 flex items-center gap-3">
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
      </div>

      {/* Metrics Panel: Category Tabs + Metric Cards */}
      <MetricsPanel metrics={metrics} onAskAI={handleAskAI} />
    </div>
  );
}
