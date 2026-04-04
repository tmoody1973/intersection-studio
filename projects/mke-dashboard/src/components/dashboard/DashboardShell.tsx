"use client";

import { useCallback } from "react";
import { MetricsPanel } from "./MetricsPanel";
import { SAMPLE_METRICS } from "@/data/sample-metrics";

export function DashboardShell() {
  const handleAskAI = useCallback((metricId: string, label: string) => {
    // TODO: Wire to CopilotKit sidebar in Sprint 3
    console.info(`[CopilotKit] Ask AI about: ${label} (${metricId})`);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Neighborhood selector placeholder */}
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
          defaultValue="harambee"
        >
          <option value="harambee">Harambee</option>
          <option value="sherman-park">Sherman Park</option>
          <option value="metcalfe-park">Metcalfe Park</option>
          <option value="lindsay-heights">Lindsay Heights</option>
          <option value="amani">Amani</option>
          <option value="borchert-field">Borchert Field</option>
          <option value="franklin-heights">Franklin Heights</option>
          <option value="havenwoods">Havenwoods</option>
        </select>
        <span className="text-xs text-limestone">
          Sample data — live Convex queries in Sprint 2
        </span>
      </div>

      {/* Metrics Panel: Category Tabs + Metric Cards */}
      <MetricsPanel metrics={SAMPLE_METRICS} onAskAI={handleAskAI} />
    </div>
  );
}
