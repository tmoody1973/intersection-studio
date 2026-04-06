"use client";

import { useFrontendTool } from "@copilotkit/react-core";

export function useKpiCardTool() {
  useFrontendTool({
    name: "render_kpi_card",
    description:
      "Render a key performance indicator card showing a single important number with context. Use for highlighting a specific metric.",
    parameters: [
      { name: "label", type: "string", description: "Metric name", required: true },
      { name: "value", type: "number", description: "The number to display", required: true },
      { name: "unit", type: "string", description: "Unit label (%, parcels, incidents)", required: true },
      { name: "context", type: "string", description: "Brief explanation", required: false },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") {
        return <div className="animate-pulse rounded-lg border border-limestone/20 bg-white p-4 h-24 dark:bg-[#292524]" />;
      }
      if (!args) return <></>;
      return (
        <div className="rounded-lg border-l-[3px] border-l-lakeshore border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foundry">
            {args.label}
          </span>
          <div className="mt-1 font-display text-3xl font-bold text-iron">
            {typeof args.value === "number" ? args.value.toLocaleString() : args.value}
          </div>
          <span className="text-xs text-foundry">{args.unit}</span>
          {args.context && (
            <p className="mt-2 text-xs text-limestone">{args.context}</p>
          )}
        </div>
      );
    },
  });
}
