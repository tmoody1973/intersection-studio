"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useCallback } from "react";
import { useProjectContext } from "@/components/providers/ProjectContext";

const TYPE_LABELS: Record<string, string> = {
  case_study: "Case Study",
  social_post: "Social Post",
  prd: "PRD",
  design_doc: "Design Doc",
  research: "Research",
  other: "Other",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS);

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--color-orange)",
  done: "var(--color-success)",
  handed_off: "var(--color-primary)",
};

function copyForClaudeCode(doc: {
  title: string;
  projectName: string;
  type: string;
  body: string;
}) {
  const payload = [
    `# ${doc.title}`,
    `Project: ${doc.projectName}`,
    `Type: ${TYPE_LABELS[doc.type] ?? doc.type}`,
    "",
    doc.body,
    "",
    "---",
    "Build this. Implementation specs above.",
  ].join("\n");

  // Try clipboard API first, fall back to textarea trick
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(payload);
  }

  // Fallback for non-HTTPS contexts
  const textarea = document.createElement("textarea");
  textarea.value = payload;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export default function OverviewPage() {
  const { selectedProjectId } = useProjectContext();
  const recentDocs = useQuery(api.documents.listRecent);
  const updateType = useMutation(api.documents.updateType);

  const [goalInput, setGoalInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const createGoal = useMutation(api.tasks.createGoal);

  const handleSubmitGoal = useCallback(async () => {
    if (!goalInput.trim() || submitting) return;

    const goal = goalInput.trim();
    setGoalInput("");
    setSubmitting(true);
    setError(null);

    try {
      await createGoal({
        title: goal,
        description: goal,
        projectId: selectedProjectId ?? undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the team. Check that agents are online in the Team view.",
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }, [goalInput, submitting, createGoal, selectedProjectId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitGoal();
    }
  };

  const handleCopy = async (doc: {
    _id: string;
    title: string;
    projectName: string;
    type: string;
    body: string;
  }) => {
    await copyForClaudeCode(doc);
    setCopiedId(doc._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Hero goal input */}
      <section style={{ marginBottom: "var(--space-8)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            marginBottom: "var(--space-4)",
          }}
        >
          What do you want to work on?
        </h1>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a case study for Crate... Draft LinkedIn posts about Shipwright... Research competitors for the next product..."
            disabled={submitting}
            rows={2}
            style={{
              flex: 1,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "0.75rem 1rem",
              fontSize: "var(--text-sm)",
              color: "var(--color-text)",
              outline: "none",
              resize: "none",
              minHeight: 56,
            }}
          />
          <button
            onClick={handleSubmitGoal}
            disabled={!goalInput.trim() || submitting}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 12,
              background:
                goalInput.trim() && !submitting
                  ? "var(--color-primary)"
                  : "var(--color-surface-2)",
              color:
                goalInput.trim() && !submitting
                  ? "#fff"
                  : "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              minHeight: 44,
              whiteSpace: "nowrap",
            }}
          >
            {submitting ? "Sending..." : "Go"}
          </button>
        </div>
        {error && (
          <div
            style={{
              marginTop: "var(--space-2)",
              fontSize: "var(--text-xs)",
              color: "var(--color-error)",
              padding: "0.5rem 0.75rem",
              background: "rgba(209, 99, 167, 0.1)",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
        {submitting && (
          <div
            style={{
              marginTop: "var(--space-2)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            Goal dispatched to CEO. Working on it...
          </div>
        )}
      </section>

      {/* Recent Documents */}
      <section>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            marginBottom: "var(--space-4)",
          }}
        >
          Recent Documents
        </h2>

        {!recentDocs && (
          <div
            style={{
              padding: "var(--space-6)",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            Loading...
          </div>
        )}

        {recentDocs && recentDocs.length === 0 && (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              color: "var(--color-text-muted)",
              background: "var(--color-surface)",
              borderRadius: 16,
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-2)" }}>
              No deliverables yet
            </div>
            <div style={{ fontSize: "var(--text-sm)" }}>
              Type a goal above to get started. Your agents will produce
              documents you can copy into Claude Code.
            </div>
          </div>
        )}

        {recentDocs && recentDocs.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "var(--space-2)",
            }}
          >
            {recentDocs.map((doc) => (
              <div
                key={doc._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "0.75rem 1rem",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              >
                {/* Status dot */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: STATUS_COLORS[doc.status] ?? "var(--color-text-muted)",
                    flexShrink: 0,
                  }}
                />

                {/* Title + project */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--text-sm)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.title}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {doc.projectName}
                    {doc.agentName && ` · ${doc.agentName}`}
                  </div>
                </div>

                {/* Type dropdown */}
                <select
                  value={doc.type}
                  onChange={async (e) => {
                    await updateType({
                      documentId: doc._id,
                      type: e.target.value as "case_study" | "social_post" | "prd" | "design_doc" | "research" | "other",
                    });
                  }}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 999,
                    padding: "2px 8px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Copy for Claude Code */}
                <button
                  onClick={() => handleCopy(doc)}
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color:
                      copiedId === doc._id
                        ? "var(--color-success)"
                        : "var(--color-primary)",
                    background: "transparent",
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: `1px solid ${copiedId === doc._id ? "var(--color-success)" : "var(--color-primary)"}`,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedId === doc._id ? "Copied!" : "Copy for Claude Code"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
