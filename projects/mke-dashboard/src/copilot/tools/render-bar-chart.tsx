"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { GenericChart, ChartSkeleton } from "@/components/charts/GenericChart";

export function useBarChartTool() {
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
}
