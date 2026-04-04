"use client";

import { useState, useCallback } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { MetricsPanel } from "./MetricsPanel";
import { DashboardContext } from "@/copilot/DashboardContext";
import { useNeighborhoodData } from "@/hooks/useNeighborhoodData";
import { TARGET_NEIGHBORHOODS } from "@/lib/constants";
import type { CategoryId } from "@/types/metrics";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function DashboardShell() {
  const [selectedSlug, setSelectedSlug] = useState("harambee");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("community");
  const { metrics, neighborhoodName } = useNeighborhoodData(selectedSlug);

  const handleAskAI = useCallback((metricId: string, label: string) => {
    // The CopilotSidebar handles the chat UI —
    // this could auto-open the sidebar with a pre-filled prompt
    console.info(
      `[CopilotKit] Ask AI about: ${label} (${metricId}) in ${selectedSlug}`,
    );
  }, [selectedSlug]);

  return (
    <>
      {/* Register dashboard state with CopilotKit */}
      <DashboardContext
        neighborhoodName={neighborhoodName}
        neighborhoodSlug={selectedSlug}
        activeCategory={activeCategory}
        metrics={metrics}
        onSwitchNeighborhood={setSelectedSlug}
        onSwitchCategory={setActiveCategory}
      />

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
        <MetricsPanel
          metrics={metrics}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onAskAI={handleAskAI}
        />
      </div>

      {/* CopilotKit AI Chat Sidebar */}
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
