"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "var(--space-5)",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.4rem" }}>
        {value}
      </div>
      {detail && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
          {detail}
        </div>
      )}
    </div>
  );
}

export function KpiRow() {
  const agents = useQuery(api.agents.listWithStatus);
  const tasks = useQuery(api.tasks.listTasks, {});
  const pendingApprovals = useQuery(api.approvals.listPending);

  const activeTasks = tasks?.filter((t) => t.status === "running" || t.status === "queued").length ?? 0;
  const totalSpend = agents?.reduce((sum, a) => sum + a.dailySpendCents, 0) ?? 0;
  const onlineCount = agents?.filter((a) => a.status === "online").length ?? 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "var(--space-4)",
      }}
    >
      <KpiCard
        label="Active Tasks"
        value={activeTasks}
        detail={`${tasks?.length ?? 0} total`}
      />
      <KpiCard
        label="Today's Spend"
        value={`$${(totalSpend / 100).toFixed(2)}`}
        detail="across all agents"
      />
      <KpiCard
        label="Agents Online"
        value={`${onlineCount}/12`}
      />
      <KpiCard
        label="Pending Approvals"
        value={pendingApprovals?.length ?? 0}
      />
    </div>
  );
}
