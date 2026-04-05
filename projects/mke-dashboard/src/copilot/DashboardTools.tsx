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

  // --- Economic development tools ---

  useFrontendTool({
    name: "render_zone_info",
    description:
      "Show which economic development zones (TID, BID, Opportunity Zones, TIN, NID) apply to the current neighborhood. Use when users ask about development districts, tax incentives, or investment zones.",
    parameters: [
      {
        name: "neighborhood",
        type: "string",
        description: "The neighborhood name",
        required: true,
      },
      {
        name: "tid",
        type: "string[]",
        description: "Tax Incremental District names",
        required: false,
      },
      {
        name: "bid",
        type: "string[]",
        description: "Business Improvement District names",
        required: false,
      },
      {
        name: "oz",
        type: "string[]",
        description: "Opportunity Zone tract IDs",
        required: false,
      },
      {
        name: "tin",
        type: "string[]",
        description: "Targeted Investment Neighborhood names",
        required: false,
      },
      {
        name: "nid",
        type: "string[]",
        description: "Neighborhood Improvement District names",
        required: false,
      },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="animate-pulse rounded-lg border border-limestone/20 bg-white p-4 h-32 dark:bg-[#292524]" />
        );
      }
      if (!args) return <></>;

      const zones = [
        {
          label: "TID — Tax Incremental District",
          desc: "Property tax revenue reinvested in the district",
          items: args.tid as string[] | undefined,
        },
        {
          label: "BID — Business Improvement District",
          desc: "Commercial corridor improvement assessments",
          items: args.bid as string[] | undefined,
        },
        {
          label: "OZ — Opportunity Zone",
          desc: "Federal tax incentives for qualified investments",
          items: args.oz as string[] | undefined,
        },
        {
          label: "TIN — Targeted Investment Neighborhood",
          desc: "City housing resources and NIDC programs",
          items: args.tin as string[] | undefined,
        },
        {
          label: "NID — Neighborhood Improvement District",
          desc: "Residential special assessment district",
          items: args.nid as string[] | undefined,
        },
      ];

      return (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-iron">
            Development Zones — {args.neighborhood}
          </h3>
          {zones.map((z) => (
            <div
              key={z.label}
              className="rounded-lg border border-limestone/20 bg-white p-3 dark:bg-[#292524]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    z.items && z.items.length > 0
                      ? "bg-lakeshore"
                      : "bg-limestone/30"
                  }`}
                />
                <span className="text-xs font-semibold text-iron">
                  {z.label}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-limestone">{z.desc}</p>
              {z.items && z.items.length > 0 ? (
                <p className="mt-1 text-xs text-foundry">
                  {z.items.join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-limestone/60">
                  None in this neighborhood
                </p>
              )}
            </div>
          ))}
        </div>
      );
    },
  });

  useFrontendTool({
    name: "render_investment_summary",
    description:
      "Show a summary of economic investment in a neighborhood including permit dollars, property sales, and commercial activity. Use when users ask about investment, development activity, or economic health.",
    parameters: [
      {
        name: "neighborhood",
        type: "string",
        description: "The neighborhood name",
        required: true,
      },
      {
        name: "permitInvestment",
        type: "number",
        description: "Total building permit investment in dollars",
        required: false,
      },
      {
        name: "newConstruction",
        type: "number",
        description: "Number of new construction permits",
        required: false,
      },
      {
        name: "salesCount",
        type: "number",
        description: "Number of property sales",
        required: false,
      },
      {
        name: "medianPrice",
        type: "number",
        description: "Median sale price in dollars",
        required: false,
      },
      {
        name: "totalSalesVolume",
        type: "number",
        description: "Total sales volume in dollars",
        required: false,
      },
      {
        name: "liquorLicenses",
        type: "number",
        description: "Number of active liquor licenses",
        required: false,
      },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="animate-pulse rounded-lg border border-limestone/20 bg-white p-4 h-24 dark:bg-[#292524]" />
        );
      }
      if (!args) return <></>;

      const fmt = (v: unknown) => {
        if (v == null) return "N/A";
        return typeof v === "number" ? v.toLocaleString() : String(v);
      };
      const fmtDollars = (v: unknown) => {
        if (v == null) return "N/A";
        return typeof v === "number" ? `$${v.toLocaleString()}` : String(v);
      };

      const kpis = [
        {
          label: "Permit Investment",
          value: fmtDollars(args.permitInvestment),
          unit: "total",
        },
        {
          label: "New Construction",
          value: fmt(args.newConstruction),
          unit: "permits",
        },
        {
          label: "Property Sales",
          value: fmt(args.salesCount),
          unit: "transactions",
        },
        {
          label: "Median Sale Price",
          value: fmtDollars(args.medianPrice),
          unit: "",
        },
        {
          label: "Sales Volume",
          value: fmtDollars(args.totalSalesVolume),
          unit: "total",
        },
        {
          label: "Liquor Licenses",
          value: fmt(args.liquorLicenses),
          unit: "active",
        },
      ].filter((k) => k.value !== "N/A");

      return (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-iron">
            Investment Summary — {args.neighborhood}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border-l-[3px] border-l-lakeshore border border-limestone/20 bg-white p-3 dark:bg-[#292524]"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foundry">
                  {k.label}
                </span>
                <div className="mt-1 font-display text-xl font-bold text-iron">
                  {k.value}
                </div>
                {k.unit && (
                  <span className="text-[10px] text-limestone">{k.unit}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    },
  });

  return <></>;
}
