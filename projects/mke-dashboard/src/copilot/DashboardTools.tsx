"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { GenericChart, ChartSkeleton } from "@/components/charts/GenericChart";

/**
 * Registers CopilotKit frontend tools for Generative UI.
 * The AI can call these to render charts, tables, and indicators
 * directly in the chat sidebar.
 */
export function DashboardTools() {
  // --- Chart rendering tools ---

  useFrontendTool({
    name: "render_bar_chart",
    description:
      "Render a bar chart comparing a metric across categories (e.g., crime by type, foreclosures by neighborhood). Use this when the user asks to compare or break down data.",
    parameters: [
      { name: "title", type: "string", description: "Chart title", required: true },
      { name: "data", type: "object[]", description: "Array of {name, value} objects", required: true },
      { name: "xAxisKey", type: "string", description: "Key for X axis labels", required: false },
      { name: "yAxisKey", type: "string", description: "Key for Y axis values", required: false },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") return <ChartSkeleton />;
      if (!args?.data) return <></>;
      return (
        <GenericChart
          title={args.title ?? "Chart"}
          chartType="bar"
          data={args.data as Record<string, unknown>[]}
          xAxisKey={args.xAxisKey ?? "name"}
          yAxisKey={args.yAxisKey ?? "value"}
          color="#1A6B52"
        />
      );
    },
  });

  useFrontendTool({
    name: "render_line_chart",
    description:
      "Render a line chart showing trends over time (e.g., monthly crime trends, property value changes). Use for time series data.",
    parameters: [
      { name: "title", type: "string", description: "Chart title", required: true },
      { name: "data", type: "object[]", description: "Array of {month, value} objects", required: true },
      { name: "xAxisKey", type: "string", description: "Key for X axis (time)", required: false },
      { name: "yAxisKey", type: "string", description: "Key for Y axis (value)", required: false },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") return <ChartSkeleton />;
      if (!args?.data) return <></>;
      return (
        <GenericChart
          title={args.title ?? "Trend"}
          chartType="line"
          data={args.data as Record<string, unknown>[]}
          xAxisKey={args.xAxisKey ?? "month"}
          yAxisKey={args.yAxisKey ?? "value"}
          color="#2563EB"
        />
      );
    },
  });

  useFrontendTool({
    name: "render_pie_chart",
    description:
      "Render a pie chart showing proportional breakdowns (e.g., crime type distribution, property use categories). Use for percentage breakdowns.",
    parameters: [
      { name: "title", type: "string", description: "Chart title", required: true },
      { name: "data", type: "object[]", description: "Array of {name, value} objects", required: true },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") return <ChartSkeleton />;
      if (!args?.data) return <></>;
      return (
        <GenericChart
          title={args.title ?? "Breakdown"}
          chartType="pie"
          data={args.data as Record<string, unknown>[]}
          xAxisKey="name"
          yAxisKey="value"
        />
      );
    },
  });

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

  return <></>;
}
