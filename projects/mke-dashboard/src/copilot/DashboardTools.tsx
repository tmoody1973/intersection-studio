"use client";

import { useBarChartTool } from "./tools/render-bar-chart";
import { useLineChartTool } from "./tools/render-line-chart";
import { usePieChartTool } from "./tools/render-pie-chart";
import { useKpiCardTool } from "./tools/render-kpi-card";
import { useZoneInfoTool } from "./tools/render-zone-info";
import { useInvestmentSummaryTool } from "./tools/render-investment-summary";
import { useDataTableTool } from "./tools/render-data-table";
import { useFetchPermitsTool } from "./tools/fetch-permits";

/**
 * Registers CopilotKit frontend tools for Generative UI.
 * The AI can call these to render charts, tables, and indicators
 * directly in the chat sidebar.
 */
export function DashboardTools() {
  useBarChartTool();
  useLineChartTool();
  usePieChartTool();
  useKpiCardTool();
  useZoneInfoTool();
  useInvestmentSummaryTool();
  useDataTableTool();
  useFetchPermitsTool();

  return null;
}
