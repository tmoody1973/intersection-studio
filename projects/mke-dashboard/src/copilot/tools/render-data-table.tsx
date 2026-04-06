"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { DataTable, DataTableSkeleton } from "@/components/charts/DataTable";

export function useDataTableTool() {
  useFrontendTool({
    name: "render_data_table",
    description:
      "Render a data table showing individual records. Use this when the user asks for a list or details of specific items like permits, properties, crimes, or 311 requests. The data parameter should be an array of objects.",
    parameters: [
      { name: "title", type: "string", description: "Table title", required: true },
      { name: "columns", type: "object[]", description: "Array of {key, label} column definitions", required: true },
      { name: "data", type: "object[]", description: "Array of row objects", required: true },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "executing") return <DataTableSkeleton />;
      if (!args?.data || !args?.columns) return <></>;
      return (
        <DataTable
          title={args.title ?? "Data"}
          columns={args.columns as Array<{ key: string; label: string }>}
          rows={args.data as Record<string, unknown>[]}
        />
      );
    },
  });
}
