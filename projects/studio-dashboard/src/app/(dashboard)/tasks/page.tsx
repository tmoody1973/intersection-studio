"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useProjectContext } from "@/components/providers/ProjectContext";
import { useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

const COLUMNS = [
  { status: "queued", label: "Queued", color: "var(--color-text-muted)" },
  { status: "running", label: "Running", color: "var(--color-primary)" },
  {
    status: "waiting_approval",
    label: "Waiting Approval",
    color: "var(--color-warning)",
  },
  { status: "completed", label: "Completed", color: "var(--color-success)" },
  { status: "failed", label: "Failed", color: "var(--color-error)" },
] as const;

const PRIORITY_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  low: {
    bg: "rgba(138,136,132,0.15)",
    color: "var(--color-text-muted)",
    label: "Low",
  },
  normal: {
    bg: "rgba(79,152,163,0.12)",
    color: "var(--color-primary)",
    label: "Normal",
  },
  high: {
    bg: "rgba(253,171,67,0.15)",
    color: "var(--color-orange)",
    label: "High",
  },
  urgent: {
    bg: "rgba(209,99,167,0.15)",
    color: "var(--color-error)",
    label: "Urgent",
  },
};

function StatusDot({ status }: { status: string }) {
  const color =
    status === "online"
      ? "var(--color-success)"
      : status === "error"
        ? "var(--color-error)"
        : "var(--color-text-muted)";

  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TaskCard({
  task,
  onClick,
}: {
  task: {
    _id: Id<"tasks">;
    title: string;
    agentName: string;
    agentStatus: string;
    priority: string;
    status: string;
    costCents: number;
    startedAt?: number;
    finishedAt?: number;
    _creationTime: number;
  };
  onClick: () => void;
}) {
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.normal;
  const elapsed =
    task.status === "running" && task.startedAt
      ? `running ${timeAgo(task.startedAt).replace(" ago", "")}`
      : timeAgo(task._creationTime);

  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        textAlign: "left",
        width: "100%",
        transition: "border-color var(--transition)",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: "var(--text-sm)",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
        }}
      >
        <StatusDot status={task.agentStatus} />
        <span>{task.agentName}</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            padding: "1px 6px",
            borderRadius: 999,
            background: priority.bg,
            color: priority.color,
            fontWeight: 600,
          }}
        >
          {priority.label}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>{elapsed}</span>
          {task.costCents > 0 && (
            <span>${(task.costCents / 100).toFixed(2)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function TaskDetailPanel({
  taskId,
  onClose,
}: {
  taskId: Id<"tasks">;
  onClose: () => void;
}) {
  const task = useQuery(api.tasks.getTask, { taskId });
  const cancelTask = useMutation(api.tasks.cancelTask);
  const retryTask = useMutation(api.tasks.retryTask);
  const archiveTask = useMutation(api.tasks.archiveTask);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) {
    return (
      <div
        style={{
          padding: "var(--space-6)",
          color: "var(--color-text-muted)",
        }}
      >
        Loading...
      </div>
    );
  }

  const canCancel = ["queued", "running", "waiting_approval"].includes(
    task.status,
  );
  const canRetry = task.status === "failed" && task.retryCount < 1;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        padding: "var(--space-6)",
        overflowY: "auto",
        display: "grid",
        gap: "var(--space-4)",
        alignContent: "start",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            margin: 0,
          }}
        >
          {task.title}
        </h3>
        <button
          onClick={onClose}
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--color-text-muted)",
            background: "transparent",
            padding: "0.25rem",
          }}
        >
          x
        </button>
      </div>

      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        {task.description}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Agent
          </div>
          <div style={{ fontSize: "var(--text-sm)", marginTop: "0.2rem" }}>
            {task.agentName}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Status
          </div>
          <div style={{ fontSize: "var(--text-sm)", marginTop: "0.2rem" }}>
            {task.status}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Priority
          </div>
          <div style={{ fontSize: "var(--text-sm)", marginTop: "0.2rem" }}>
            {task.priority}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Retries
          </div>
          <div style={{ fontSize: "var(--text-sm)", marginTop: "0.2rem" }}>
            {task.retryCount}/1
          </div>
        </div>
      </div>

      {task.errorMessage && (
        <div
          style={{
            background: "rgba(209,99,167,0.08)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--color-error)",
          }}
        >
          {task.errorMessage}
        </div>
      )}

      {(task.resultFull || task.resultSummary) && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-2)",
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
              Result
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(task.resultFull ?? task.resultSummary ?? "");
                }}
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  background: "var(--color-surface-2)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                }}
              >
                Copy
              </button>
              <button
                onClick={() => {
                  const blob = new Blob(
                    [task.resultFull ?? task.resultSummary ?? ""],
                    { type: "text/markdown" },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${task.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  background: "rgba(79,152,163,0.12)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-primary)",
                }}
              >
                Download .md
              </button>
            </div>
          </div>
          <div
            style={{
              background: "var(--color-surface-2)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {task.resultFull ?? task.resultSummary}
          </div>
        </div>
      )}

      {/* Thread entries */}
      {task.threadEntries && task.threadEntries.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-2)",
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
              Thread ({task.threadEntries.length})
            </div>
            <button
              onClick={() => {
                const threadMd = [
                  `# Thread: ${task.title}`,
                  `**Agent:** ${task.agentName}`,
                  `**Status:** ${task.status}`,
                  "",
                  "---",
                  "",
                  ...(task.threadEntries ?? []).map(
                    (e) => `## [${e.type}]\n\n${e.content}\n`,
                  ),
                ].join("\n");
                const blob = new Blob([threadMd], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `thread-${task.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-primary)",
                background: "rgba(79,152,163,0.12)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-primary)",
              }}
            >
              Export for Claude Code
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: "var(--space-2)",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {task.threadEntries.map((entry) => (
              <div
                key={entry._id}
                style={{
                  background: "var(--color-surface-2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-2) var(--space-3)",
                  fontSize: "var(--text-xs)",
                }}
              >
                <span
                  style={{
                    color: "var(--color-primary)",
                    fontWeight: 600,
                  }}
                >
                  [{entry.type}]
                </span>{" "}
                {entry.content.slice(0, 200)}
                {entry.content.length > 200 && "..."}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run history */}
      {task.runs && task.runs.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "var(--space-2)",
            }}
          >
            Runs ({task.runs.length})
          </div>
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {task.runs.map((run) => (
              <div
                key={run._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-surface-2)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-xs)",
                }}
              >
                <span>{run.status}</span>
                {run.costCents !== undefined && run.costCents !== null && (
                  <span>${(run.costCents / 100).toFixed(2)}</span>
                )}
                <span style={{ color: "var(--color-text-muted)" }}>
                  {new Date(run.startedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {canCancel && (
            <button
              onClick={() => cancelTask({ taskId })}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(209,99,167,0.1)",
                color: "var(--color-error)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
              }}
            >
              Cancel
            </button>
          )}
          {canRetry && (
            <button
              onClick={() => retryTask({ taskId })}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(79,152,163,0.12)",
                color: "var(--color-primary)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
              }}
            >
              Retry
            </button>
          )}
        </div>

        {/* Archive + Delete */}
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {["completed", "failed", "cancelled"].includes(task.status) && (
            <button
              onClick={() => {
                archiveTask({ taskId });
                onClose();
              }}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface-2)",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              Archive
            </button>
          )}
          {task.status !== "running" && (
            <button
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                deleteTask({ taskId });
                onClose();
              }}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-md)",
                background: confirmDelete
                  ? "var(--color-error)"
                  : "transparent",
                color: confirmDelete
                  ? "#fff"
                  : "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                border: `1px solid ${confirmDelete ? "var(--color-error)" : "var(--color-border)"}`,
              }}
            >
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Create Task Modal ---

function CreateTaskModal({
  open,
  onClose,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId: Id<"projects"> | null;
}) {
  const createTask = useMutation(api.tasks.createTask);
  const agents = useQuery(api.agents.listWithStatus);
  const projects = useQuery(api.projects.list);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agentId, setAgentId] = useState<Id<"agents"> | "">("");
  const [projectId, setProjectId] = useState<Id<"projects"> | "">(
    defaultProjectId ?? "",
  );
  const [priority, setPriority] = useState("normal");
  const [creating, setCreating] = useState(false);

  // Set default agent to CEO when agents load
  if (agents && agents.length > 0 && agentId === "") {
    const ceo = agents.find((a) => !a.reportsTo);
    if (ceo) setAgentId(ceo._id);
  }

  // Sync default project when prop changes
  if (defaultProjectId && projectId === "") {
    setProjectId(defaultProjectId);
  }

  if (!open) return null;

  async function handleCreate() {
    if (!title.trim() || !agentId || !projectId) return;
    setCreating(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || title.trim(),
        ownerAgentId: agentId as Id<"agents">,
        projectId: projectId as Id<"projects">,
        priority,
      });
      setTitle("");
      setDescription("");
      setPriority("normal");
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setCreating(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-xs)",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "var(--space-1)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.5rem 0.75rem",
    fontSize: "var(--text-sm)",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-5)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              margin: 0,
            }}
          >
            New Task
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--color-text-muted)",
              background: "transparent",
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            padding: "var(--space-5)",
            display: "grid",
            gap: "var(--space-4)",
          }}
        >
          {/* Title */}
          <div>
            <label style={labelStyle}>Task Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should the agent do?"
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for the agent..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Project + Agent row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <label style={labelStyle}>Project</label>
              <select
                value={projectId}
                onChange={(e) =>
                  setProjectId(e.target.value as Id<"projects">)
                }
                style={inputStyle}
              >
                <option value="">Select project...</option>
                {projects?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assign To</label>
              <select
                value={agentId}
                onChange={(e) =>
                  setAgentId(e.target.value as Id<"agents">)
                }
                style={inputStyle}
              >
                <option value="">Select agent...</option>
                {agents?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}{" "}
                    {a.status === "online" ? "" : `(${a.status})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>Priority</label>
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
              }}
            >
              {(["low", "normal", "high", "urgent"] as const).map((p) => {
                const styles = PRIORITY_STYLES[p];
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      padding: "0.4rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      fontWeight: isSelected ? 700 : 400,
                      background: isSelected ? styles.bg : "transparent",
                      color: isSelected
                        ? styles.color
                        : "var(--color-text-muted)",
                      border: `1px solid ${isSelected ? styles.color : "var(--color-border)"}`,
                    }}
                  >
                    {styles.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !agentId || !projectId || creating}
            style={{
              width: "100%",
              padding: "0.75rem",
              background:
                title.trim() && agentId && projectId
                  ? "var(--color-primary)"
                  : "var(--color-surface-2)",
              color:
                title.trim() && agentId && projectId
                  ? "#fff"
                  : "var(--color-text-muted)",
              borderRadius: "var(--radius-lg)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              minHeight: 44,
            }}
          >
            {creating ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { selectedProjectId } = useProjectContext();
  const tasks = useQuery(
    api.tasks.listForKanban,
    selectedProjectId ? { projectId: selectedProjectId } : {},
  );
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(
    null,
  );
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-4)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            margin: 0,
          }}
        >
          Tasks
        </h2>
        <button
          onClick={() => setShowCreateTask(true)}
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-lg)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            minHeight: 44,
          }}
        >
          + New Task
        </button>
      </div>

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultProjectId={selectedProjectId}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedTaskId
            ? "1fr 380px"
            : "1fr",
          gap: 0,
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {/* Kanban board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(200px, 1fr))`,
            gap: "var(--space-3)",
            overflowX: "auto",
          }}
        >
          {COLUMNS.map((col) => {
            const columnTasks =
              tasks?.filter((t) => t.status === col.status) ?? [];
            const isApproval = col.status === "waiting_approval";

            return (
              <div key={col.status}>
                <div
                  className={
                    isApproval && columnTasks.length > 0
                      ? "approval-pulse"
                      : undefined
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    marginBottom: "var(--space-3)",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-surface)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: col.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      marginLeft: "auto",
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTaskId(task._id)}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div
                      style={{
                        padding: "var(--space-6) var(--space-3)",
                        textAlign: "center",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        border: "1px dashed var(--color-border)",
                        borderRadius: 12,
                      }}
                    >
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedTaskId && (
          <TaskDetailPanel
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </section>
  );
}
