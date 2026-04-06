"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { GenericChart, ChartSkeleton } from "@/components/charts/GenericChart";

export function useLineChartTool() {
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
}
