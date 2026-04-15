"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjectContext } from "@/components/providers/ProjectContext";
import {
  Send,
  Copy,
  Check,
  FileText,
  MessageSquare,
  BarChart3,
  Megaphone,
  Search,
  ArrowRight,
  Clock,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  case_study: "Case Study",
  social_post: "Social Post",
  prd: "PRD",
  design_doc: "Design Doc",
  research: "Research",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--color-orange)",
  done: "var(--color-success)",
  handed_off: "var(--color-primary)",
};

function copyForClaudeCode(doc: { title: string; projectName: string; type: string; body: string }) {
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

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(payload);
  }

  const textarea = document.createElement("textarea");
  textarea.value = payload;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

const QUICK_ACTIONS = [
  { label: "Research", icon: Search, description: "Competitive analysis, market research", color: "#4f98a3" },
  { label: "Write", icon: FileText, description: "Blog posts, case studies, PRDs", color: "#437a22" },
  { label: "Social", icon: Megaphone, description: "LinkedIn, X, Instagram posts", color: "#da7101" },
  { label: "Analyze", icon: BarChart3, description: "Metrics, costs, data insights", color: "#964219" },
];

export default function HomePage() {
  const { selectedProjectId } = useProjectContext();
  const router = useRouter();
  const recentDocs = useQuery(api.documents.listRecent);
  const recentTasks = useQuery(api.tasks.listTasks, { status: "running" });

  const [goalInput, setGoalInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const createGoal = useMutation(api.tasks.createGoal);

  const handleSubmitGoal = useCallback(
    async (prefill?: string) => {
      const goal = (prefill ?? goalInput).trim();
      if (!goal || submitting) return;

      setGoalInput("");
      setSubmitting(true);
      setError(null);

      try {
        const taskId = await createGoal({
          title: goal.length > 80 ? goal.slice(0, 80) + "..." : goal,
          description: goal,
          projectId: selectedProjectId ?? undefined,
        });
        // Navigate to Co-Work Mode for interactive collaboration
        router.push(`/tasks/${taskId}/cowork`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create goal");
        setTimeout(() => setError(null), 5000);
        setSubmitting(false);
        inputRef.current?.focus();
      }
    },
    [goalInput, submitting, createGoal, selectedProjectId],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitGoal();
    }
  };

  const handleCopy = async (doc: { _id: string; title: string; projectName: string; type: string; body: string }) => {
    await copyForClaudeCode(doc);
    setCopiedId(doc._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runningCount = recentTasks?.length ?? 0;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: "var(--space-8)" }}>
      {/* Hero */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "var(--space-2)",
          }}
        >
          What would you like to work on?
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Type a goal. The CEO agent delegates to specialists, researches with institutional memory, and delivers a document.
        </p>
      </div>

      {/* Goal input */}
      <div
        style={{
          position: "relative",
          marginBottom: "var(--space-6)",
        }}
      >
        <textarea
          ref={inputRef}
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Research the competitive landscape for DJ tools... Write a case study for Crate... Draft social posts about our 20th product..."
          disabled={submitting}
          rows={3}
          style={{
            width: "100%",
            padding: "var(--space-4) var(--space-4) 3rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: "var(--text-base)",
            resize: "none",
            lineHeight: 1.5,
            transition: "border-color var(--transition), box-shadow var(--transition)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 152, 163, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "var(--space-3)",
            right: "var(--space-3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {submitting ? "Delegating..." : "Enter to send"}
          </span>
          <button
            onClick={() => handleSubmitGoal()}
            disabled={!goalInput.trim() || submitting}
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              background: goalInput.trim() ? "var(--color-primary)" : "var(--color-border)",
              color: "#fff",
              transition: "background var(--transition)",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            background: "rgba(161, 44, 123, 0.08)",
            border: "1px solid rgba(161, 44, 123, 0.2)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            fontSize: "var(--text-sm)",
            marginBottom: "var(--space-6)",
          }}
        >
          {error}
        </div>
      )}

      {/* Running tasks indicator */}
      {runningCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
            background: "rgba(79, 152, 163, 0.06)",
            border: "1px solid rgba(79, 152, 163, 0.15)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-6)",
            fontSize: "var(--text-sm)",
            color: "var(--color-primary)",
          }}
        >
          <Clock size={14} />
          {runningCount} task{runningCount > 1 ? "s" : ""} in progress
          <ArrowRight size={14} style={{ marginLeft: "auto" }} />
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-3)",
          }}
        >
          Quick actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-3)" }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setGoalInput(action.description + " for ");
                inputRef.current?.focus();
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "var(--space-2)",
                padding: "var(--space-4)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                textAlign: "left",
                transition: "border-color var(--transition), box-shadow var(--transition)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${action.color}20`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <action.icon size={18} color={action.color} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{action.label}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.3 }}>
                {action.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent deliverables */}
      {recentDocs && recentDocs.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-3)",
            }}
          >
            Recent deliverables
          </h2>
          <div style={{ display: "grid", gap: "1px", background: "var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            {recentDocs.slice(0, 5).map((doc) => (
              <div
                key={doc._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) var(--space-4)",
                  background: "var(--color-surface)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: STATUS_COLORS[doc.status] ?? "var(--color-text-muted)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.title}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {TYPE_LABELS[doc.type] ?? doc.type}
                    {doc.projectName ? ` \u00B7 ${doc.projectName}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy({ ...doc, projectName: doc.projectName ?? "Studio" })}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    color: copiedId === doc._id ? "var(--color-success)" : "var(--color-text-muted)",
                    transition: "color var(--transition)",
                    flexShrink: 0,
                  }}
                  title="Copy for Claude Code"
                >
                  {copiedId === doc._id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
