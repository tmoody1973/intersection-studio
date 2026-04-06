"use client";

import { useFrontendTool } from "@copilotkit/react-core";

export function useInvestmentSummaryTool() {
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
}
