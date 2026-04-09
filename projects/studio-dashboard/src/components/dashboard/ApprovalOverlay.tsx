"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

function ApprovalCard({
  approval,
  onResolve,
}: {
  approval: {
    _id: Id<"approvals">;
    taskTitle: string;
    agentName: string;
    reason: string;
    expiresAt: number;
  };
  onResolve: (id: Id<"approvals">, decision: "approved" | "rejected") => void;
}) {
  const minutesLeft = Math.max(
    0,
    Math.round((approval.expiresAt - Date.now()) / 60000),
  );

  return (
    <div
      className="approval-enter"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-md)",
        width: 340,
      }}
    >
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
        {approval.agentName} needs approval
      </div>
      <div style={{ fontWeight: 700, marginBottom: "var(--space-2)" }}>
        {approval.taskTitle}
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
        {approval.reason}
      </div>
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button
          onClick={() => onResolve(approval._id, "approved")}
          style={{
            flex: 1,
            minHeight: 64,
            background: "var(--color-success)",
            color: "#fff",
            borderRadius: "var(--radius-lg)",
            fontWeight: 700,
            fontSize: "var(--text-sm)",
          }}
        >
          Approve
        </button>
        <button
          onClick={() => onResolve(approval._id, "rejected")}
          style={{
            flex: 1,
            minHeight: 64,
            background: "var(--color-error)",
            color: "#fff",
            borderRadius: "var(--radius-lg)",
            fontWeight: 700,
            fontSize: "var(--text-sm)",
          }}
        >
          Reject
        </button>
      </div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          textAlign: "center",
          marginTop: "var(--space-3)",
        }}
      >
        Expires in {minutesLeft} min
      </div>
    </div>
  );
}

export function ApprovalOverlay() {
  const pendingApprovals = useQuery(api.approvals.listPending);
  const resolveApproval = useMutation(api.approvals.resolve);
  const [resolving, setResolving] = useState<string | null>(null);

  if (!pendingApprovals || pendingApprovals.length === 0) return null;

  const visible = pendingApprovals.slice(0, 3);
  const remaining = pendingApprovals.length - 3;

  async function handleResolve(
    approvalId: Id<"approvals">,
    decision: "approved" | "rejected",
  ) {
    setResolving(approvalId);
    try {
      await resolveApproval({ approvalId, decision });
    } catch (err) {
      console.error("Failed to resolve approval:", err);
    } finally {
      setResolving(null);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "var(--space-6)",
        right: "var(--space-6)",
        display: "flex",
        flexDirection: "column-reverse",
        gap: "var(--space-3)",
        zIndex: 100,
      }}
    >
      {visible.map((approval) => (
        <ApprovalCard
          key={approval._id}
          approval={approval}
          onResolve={handleResolve}
        />
      ))}
      {remaining > 0 && (
        <div
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: 999,
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textAlign: "center",
            width: "fit-content",
            alignSelf: "flex-end",
          }}
        >
          +{remaining} more
        </div>
      )}
    </div>
  );
}
