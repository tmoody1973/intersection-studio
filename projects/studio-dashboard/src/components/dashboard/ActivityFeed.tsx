"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const EVENT_LABELS: Record<string, string> = {
  "task.created": "created a task",
  "task.run.started": "started working",
  "task.run.succeeded": "completed",
  "task.run.failed": "failed",
  "task.auto_retry": "retrying",
  "task.timeout_retry": "timed out, retrying",
  "task.timeout_final": "timed out",
  "approval.requested": "needs approval",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  "approval.expired": "approval expired",
  "agent.model_changed": "model changed",
  "security.hmac_failed": "rejected unsigned callback",
  "task.delegated": "delegated task",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ActivityFeed() {
  const events = useQuery(api.events.listRecent, { limit: 30 });

  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          marginBottom: "var(--space-4)",
        }}
      >
        Activity
      </h2>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: "var(--space-4)",
          maxHeight: 400,
          overflowY: "auto",
        }}
        aria-live="polite"
      >
        {!events && (
          <div style={{ color: "var(--color-text-muted)", padding: "var(--space-4)", textAlign: "center" }}>
            Loading activity...
          </div>
        )}

        {events && events.length === 0 && (
          <div style={{ color: "var(--color-text-muted)", padding: "var(--space-8)", textAlign: "center" }}>
            Nothing happening yet. Create a task to see your agents in action.
          </div>
        )}

        {events && events.length > 0 && (
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {events.map((event, i) => {
              const label = EVENT_LABELS[event.type] ?? event.type;
              return (
                <div
                  key={event._id}
                  className={i === 0 ? "feed-item-enter" : undefined}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-sm)",
                    background: i === 0 ? "rgba(79, 152, 163, 0.06)" : "transparent",
                  }}
                >
                  <span>
                    {event.agentName && (
                      <strong style={{ color: "var(--color-primary)" }}>
                        {event.agentName}
                      </strong>
                    )}{" "}
                    {label}
                  </span>
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatTime(event._creationTime)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
