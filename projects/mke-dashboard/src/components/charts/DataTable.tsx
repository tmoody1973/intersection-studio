"use client";

interface DataTableProps {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  maxRows?: number;
}

export function DataTable({ title, columns, rows, maxRows = 20 }: DataTableProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="rounded-lg border border-limestone/20 bg-white dark:bg-[#292524]">
      <div className="border-b border-limestone/20 px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-iron">{title}</h3>
        <span className="text-[10px] text-limestone">
          {rows.length} records{rows.length > maxRows ? ` (showing ${maxRows})` : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-limestone/10 bg-limestone/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-foundry"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-limestone/5 hover:bg-limestone/5"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-iron">
                    {formatValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") {
    return v >= 1000 ? `$${v.toLocaleString()}` : String(v);
  }
  const s = String(v);
  // Truncate long date strings
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0, 10);
  return s.length > 40 ? s.substring(0, 40) + "…" : s;
}

export function DataTableSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-limestone/20 bg-white p-4 dark:bg-[#292524]">
      <div className="mb-3 h-4 w-48 rounded bg-limestone/30" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 rounded bg-limestone/10" />
        ))}
      </div>
    </div>
  );
}
