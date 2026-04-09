"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

const PHASE_LABELS: Record<string, string> = {
  research: "Research",
  schematic: "Schematic",
  design_dev: "Design Dev",
  refinement: "Refinement",
  construction: "Construction",
  complete: "Complete",
};

const PHASE_COLORS: Record<string, string> = {
  research: "var(--color-primary)",
  schematic: "var(--color-orange)",
  design_dev: "var(--color-warning)",
  refinement: "var(--color-success)",
  construction: "var(--color-success)",
  complete: "var(--color-text-muted)",
};

function PhaseTag({ phase }: { phase: string }) {
  return (
    <span
      style={{
        fontSize: "var(--text-xs)",
        padding: "2px 8px",
        borderRadius: 999,
        background: `color-mix(in srgb, ${PHASE_COLORS[phase] ?? "var(--color-text-muted)"} 15%, transparent)`,
        color: PHASE_COLORS[phase] ?? "var(--color-text-muted)",
      }}
    >
      {PHASE_LABELS[phase] ?? phase}
    </span>
  );
}

export function ProjectList({
  selectedId,
  onSelect,
}: {
  selectedId: Id<"projects"> | null;
  onSelect: (id: Id<"projects"> | null) => void;
}) {
  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    const id = await createProject({
      name: newName.trim(),
      description: newDesc.trim() || newName.trim(),
    });
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    onSelect(id);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-3)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Projects
        </span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
            background: "transparent",
            padding: "2px 6px",
          }}
        >
          + New
        </button>
      </div>

      {showCreate && (
        <div
          style={{
            background: "var(--color-surface-2)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            marginBottom: "var(--space-3)",
            display: "grid",
            gap: "var(--space-2)",
          }}
        >
          <input
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.4rem 0.6rem",
              fontSize: "var(--text-xs)",
              outline: "none",
            }}
            autoFocus
          />
          <input
            placeholder="Brief description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.4rem 0.6rem",
              fontSize: "var(--text-xs)",
              outline: "none",
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
              padding: "0.4rem",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
            }}
          >
            Create
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: "var(--space-1)" }}>
        {/* "All" option */}
        <button
          onClick={() => onSelect(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            background: selectedId === null ? "rgba(79, 152, 163, 0.12)" : "transparent",
            color: selectedId === null ? "var(--color-text)" : "var(--color-text-muted)",
            textAlign: "left",
            fontSize: "var(--text-xs)",
          }}
        >
          All projects
        </button>

        {projects?.map((project) => (
          <button
            key={project._id}
            onClick={() => onSelect(project._id)}
            style={{
              display: "grid",
              gap: "0.25rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              background:
                selectedId === project._id
                  ? "rgba(79, 152, 163, 0.12)"
                  : "transparent",
              textAlign: "left",
              fontSize: "var(--text-xs)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color:
                    selectedId === project._id
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                }}
              >
                {project.name}
              </span>
              <PhaseTag phase={project.phase} />
            </div>
            {project.taskCounts.total > 0 && (
              <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>
                {project.taskCounts.completed}/{project.taskCounts.total} tasks
              </span>
            )}
          </button>
        ))}

        {projects && projects.length === 0 && !showCreate && (
          <div
            style={{
              padding: "var(--space-4)",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
            }}
          >
            No projects yet
          </div>
        )}
      </div>
    </div>
  );
}
