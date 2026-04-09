"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

// Models loaded dynamically from OpenRouter via Convex cache

function StatusDot({ status }: { status: string }) {
  const color =
    status === "online"
      ? "var(--color-success)"
      : status === "error"
        ? "var(--color-error)"
        : "var(--color-text-muted)";

  const shadow =
    status === "online"
      ? "0 0 0 4px rgba(109, 170, 69, 0.15)"
      : status === "error"
        ? "0 0 0 4px rgba(209, 99, 167, 0.15)"
        : "none";

  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        boxShadow: shadow,
        display: "inline-block",
      }}
    />
  );
}

function AgentCard({
  agent,
  availableModels,
}: {
  agent: {
    _id: Id<"agents">;
    name: string;
    role: string;
    model: string;
    status: string;
    currentTaskCount: number;
  };
  availableModels: Array<{ id: string; name: string }>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const updateModel = useMutation(api.agents.updateModel);
  const modelShort = agent.model.split("/").pop() ?? agent.model;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "var(--space-4)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{agent.name}</span>
        <StatusDot status={agent.status} />
      </div>
      <div
        style={{
          marginTop: "var(--space-2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            background: "var(--color-surface-2)",
            padding: "2px 8px",
            borderRadius: 999,
            cursor: "pointer",
          }}
          title="Change model"
        >
          {modelShort} ▾
        </button>
        {agent.currentTaskCount > 0 && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-orange)" }}>
            {agent.currentTaskCount} active
          </span>
        )}
      </div>

      {showPicker && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            marginTop: 4,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {availableModels.map((m) => (
            <button
              key={m.id}
              onClick={async () => {
                await updateModel({ agentId: agent._id, model: m.id });
                setShowPicker(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.75rem",
                fontSize: "var(--text-xs)",
                background: m.id === agent.model ? "rgba(79, 152, 163, 0.12)" : "transparent",
                color: m.id === agent.model ? "var(--color-primary)" : "var(--color-text)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {m.name}
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrgChart() {
  const agents = useQuery(api.agents.listWithStatus);
  const models = useQuery(api.models.listCached);

  if (!agents) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading agents...
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
        Setting up your AI team...
      </div>
    );
  }

  // Separate CEO, leads, ICs
  const ceo = agents.find((a) => !a.reportsTo);
  const leads = agents.filter(
    (a) => a.reportsTo && a.role === "strategic" && a._id !== ceo?._id,
  );
  const ics = agents.filter((a) => a.role === "execution");

  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          marginBottom: "var(--space-4)",
        }}
      >
        Team
      </h2>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {/* CEO row */}
        {ceo && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 300px)", justifyContent: "center" }}>
            <AgentCard agent={ceo} availableModels={models ?? []} />
          </div>
        )}

        {/* Leads row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${leads.length}, 1fr)`,
            gap: "var(--space-3)",
          }}
        >
          {leads.map((agent) => (
            <AgentCard key={agent._id} agent={agent} availableModels={models ?? []} />
          ))}
        </div>

        {/* ICs row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {ics.map((agent) => (
            <AgentCard key={agent._id} agent={agent} availableModels={models ?? []} />
          ))}
        </div>
      </div>
    </section>
  );
}
