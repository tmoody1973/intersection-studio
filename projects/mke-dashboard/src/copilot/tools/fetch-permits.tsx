"use client";

import { useState, useEffect } from "react";
import { useFrontendTool } from "@copilotkit/react-core";
import { DataTable, DataTableSkeleton } from "@/components/charts/DataTable";

const cache = new Map<string, { data: Record<string, unknown>[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFetchPermitsTool() {
  useFrontendTool({
    name: "fetch_neighborhood_permits",
    description:
      "Fetch and display individual building permit records for a neighborhood from the city's open data. Shows address, permit type, construction cost, and date issued. Use when the user asks 'what's being built?' or 'show me development details' or 'list the permits'.",
    parameters: [
      { name: "neighborhood", type: "string", description: "Neighborhood name", required: true },
      { name: "filterType", type: "string", description: "Filter by permit type: 'all', 'new_construction', 'commercial', 'residential'", required: false },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") return <DataTableSkeleton />;
      return (
        <PermitFetcher
          neighborhood={args?.neighborhood ?? ""}
          filterType={args?.filterType as string}
        />
      );
    },
  });
}

function PermitFetcher({
  neighborhood,
  filterType,
}: {
  neighborhood: string;
  filterType?: string;
}) {
  const [permits, setPermits] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `permits:${filterType ?? "all"}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPermits(cached.data);
      setLoading(false);
      return;
    }

    const url = `https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=828e9630-d7cb-42e4-960e-964eae916397&limit=500&sort=_id+desc`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        let records = data.result.records as Record<string, unknown>[];

        if (filterType === "new_construction") {
          records = records.filter((r) =>
            String(r["Permit Type"] ?? "").toLowerCase().includes("new construction"),
          );
        } else if (filterType === "commercial") {
          records = records.filter((r) =>
            String(r["Permit Type"] ?? "").toLowerCase().includes("commercial"),
          );
        } else if (filterType === "residential") {
          records = records.filter((r) =>
            String(r["Permit Type"] ?? "").toLowerCase().includes("residential"),
          );
        }

        const formatted = records.map((r) => ({
          address: r["Address"] ?? "—",
          type: r["Permit Type"] ?? "—",
          cost: Number(r["Construction Total Cost"] ?? 0),
          date: String(r["Date Issued"] ?? "").substring(0, 10),
          status: r["Status"] ?? "—",
          units: r["Dwelling units impact"] ?? "—",
        }));

        cache.set(cacheKey, { data: formatted, timestamp: Date.now() });
        setPermits(formatted);
      })
      .catch(() => setPermits([]))
      .finally(() => setLoading(false));
  }, [filterType]);

  if (loading) return <DataTableSkeleton />;
  if (!permits || permits.length === 0) {
    return (
      <div className="rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
        <p className="text-sm text-foundry">No permits found for {neighborhood}</p>
      </div>
    );
  }

  return (
    <DataTable
      title={`Building Permits — ${neighborhood}${filterType && filterType !== "all" ? ` (${filterType.replace("_", " ")})` : ""}`}
      columns={[
        { key: "address", label: "Address" },
        { key: "type", label: "Type" },
        { key: "cost", label: "Cost" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
      ]}
      rows={permits}
    />
  );
}
