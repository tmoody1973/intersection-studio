"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { GenericChart, ChartSkeleton } from "@/components/charts/GenericChart";

export function usePieChartTool() {
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
}
