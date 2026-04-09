"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function cents(n: number): string {
  return `$${(n / 100).toFixed(2)}`;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      style={{
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 999,
          width: `${pct}%`,
          background: pct > 80
            ? "var(--color-warning)"
            : "linear-gradient(90deg, var(--color-primary), var(--color-orange))",
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}

export function CostDashboard() {
  const costs = useQuery(api.costs.breakdown);

  if (!costs) {
    return (
      <section>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>
          Cost Tracker
        </h2>
        <div style={{ color: "var(--color-text-muted)", padding: "var(--space-4)" }}>Loading costs...</div>
      </section>
    );
  }

  const budgetPct = costs.budgetCents > 0
    ? Math.round((costs.totalMonth / costs.budgetCents) * 100)
    : 0;

  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>
        Cost Tracker
      </h2>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: "var(--space-4)",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Today
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.3rem" }}>
            {cents(costs.totalToday)}
          </div>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: "var(--space-4)",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            This Month
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.3rem" }}>
            {cents(costs.totalMonth)}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            {budgetPct}% of {cents(costs.budgetCents)} budget
          </div>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: "var(--space-4)",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Projected
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginTop: "0.3rem",
              color: costs.projectedMonth > costs.budgetCents ? "var(--color-warning)" : "var(--color-text)",
            }}
          >
            {cents(costs.projectedMonth)}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            /month at current pace
          </div>
        </div>
      </div>

      {/* Budget bar */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          <span>Monthly budget</span>
          <span>{cents(costs.totalMonth)} / {cents(costs.budgetCents)}</span>
        </div>
        <Bar value={costs.totalMonth} max={costs.budgetCents} />
      </div>

      {/* Per-agent breakdown */}
      {costs.perAgent.length > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 60px",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span>Agent</span>
            <span style={{ textAlign: "right" }}>Today</span>
            <span style={{ textAlign: "right" }}>Month</span>
            <span style={{ textAlign: "right" }}>Tasks</span>
          </div>
          {costs.perAgent.map((agent) => (
            <div
              key={agent.agentId}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 80px 60px",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                fontSize: "var(--text-sm)",
                borderBottom: "1px solid var(--color-border)",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600 }}>{agent.name}</span>
              <span style={{ textAlign: "right", color: "var(--color-text-muted)" }}>{cents(agent.todayCents)}</span>
              <span style={{ textAlign: "right" }}>{cents(agent.monthCents)}</span>
              <span style={{ textAlign: "right", color: "var(--color-text-muted)" }}>{agent.taskCount}</span>
            </div>
          ))}
        </div>
      )}

      {costs.perAgent.length === 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: "var(--space-8)",
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          $0.00 this month. Costs appear as agents complete tasks.
        </div>
      )}
    </section>
  );
}
