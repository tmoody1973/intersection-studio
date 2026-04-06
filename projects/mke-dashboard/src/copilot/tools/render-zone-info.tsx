"use client";

import { useFrontendTool } from "@copilotkit/react-core";

export function useZoneInfoTool() {
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
}
