"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

const PHASES = [
  { value: "research", label: "Research" },
  { value: "schematic", label: "Schematic" },
  { value: "design_dev", label: "Design Development" },
  { value: "refinement", label: "Refinement" },
  { value: "construction", label: "Construction" },
];

interface PendingSource {
  id: string;
  type: "text" | "url" | "file";
  name: string;
  content?: string;
  url?: string;
  file?: File;
}

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: Id<"projects">) => void;
}) {
  const createProject = useMutation(api.projects.create);
  const addTextSource = useMutation(api.projectSources.addText);
  const addUrlSource = useMutation(api.projectSources.addUrl);
  const addFileSource = useMutation(api.projectSources.addFile);
  const generateUploadUrl = useMutation(api.projectSources.generateUploadUrl);
  const agents = useQuery(api.agents.listWithStatus);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("research");
  const [budget, setBudget] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<Id<"agents">[]>([]);
  const [sources, setSources] = useState<PendingSource[]>([]);
  const [sourceTab, setSourceTab] = useState<"text" | "url" | "file">("text");
  const [sourceText, setSourceText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function addSource() {
    if (sourceTab === "text" && sourceText.trim()) {
      setSources((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "text",
          name: sourceName.trim() || "Note",
          content: sourceText.trim(),
        },
      ]);
      setSourceText("");
      setSourceName("");
    } else if (sourceTab === "url" && sourceUrl.trim()) {
      setSources((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "url",
          name: sourceName.trim() || sourceUrl.trim(),
          url: sourceUrl.trim(),
        },
      ]);
      setSourceUrl("");
      setSourceName("");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      setSources((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "file",
          name: file.name,
          file,
        },
      ]);
    }
    e.target.value = "";
  }

  function removeSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);

    try {
      const budgetCents = budget ? Math.round(parseFloat(budget) * 100) : undefined;
      const projectId = await createProject({
        name: name.trim(),
        description: description.trim() || name.trim(),
        budgetCents: budgetCents && budgetCents > 0 ? budgetCents : undefined,
      });

      // Save sources
      for (const source of sources) {
        if (source.type === "text" && source.content) {
          await addTextSource({
            projectId,
            name: source.name,
            content: source.content,
          });
        } else if (source.type === "url" && source.url) {
          await addUrlSource({
            projectId,
            name: source.name,
            url: source.url,
          });
        } else if (source.type === "file" && source.file) {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": source.file.type },
            body: source.file,
          });
          const { storageId } = await result.json();
          await addFileSource({
            projectId,
            name: source.name,
            storageId,
            mimeType: source.file.type,
          });
        }
      }

      // Reset form
      setName("");
      setDescription("");
      setPhase("research");
      setBudget("");
      setSelectedAgents([]);
      setSources([]);
      onCreated(projectId);
      onClose();
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  }

  // Select CEO by default if agents loaded and none selected
  if (agents && agents.length > 0 && selectedAgents.length === 0) {
    const ceo = agents.find((a) => !a.reportsTo);
    if (ceo) {
      setSelectedAgents([ceo._id]);
    }
  }

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
          maxWidth: 640,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header */}
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
            New Project
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
          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
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
              placeholder="What is this project about?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Phase + Budget row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <label style={labelStyle}>Starting Phase</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                style={inputStyle}
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Budget ($)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Assigned Agents */}
          <div>
            <label style={labelStyle}>Assigned Agents</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
              }}
            >
              {agents?.map((agent) => {
                const isSelected = selectedAgents.includes(agent._id);
                return (
                  <button
                    key={agent._id}
                    onClick={() => {
                      setSelectedAgents((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== agent._id)
                          : [...prev, agent._id],
                      );
                    }}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: 999,
                      fontSize: "var(--text-xs)",
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected
                        ? "rgba(79,152,163,0.15)"
                        : "var(--color-surface-2)",
                      color: isSelected
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                      border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                    }}
                  >
                    {agent.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sources */}
          <div>
            <label style={labelStyle}>Sources</label>

            {/* Source tabs */}
            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: "var(--space-3)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {(["text", "url", "file"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSourceTab(tab)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "var(--text-xs)",
                    fontWeight: sourceTab === tab ? 700 : 400,
                    color:
                      sourceTab === tab
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                    borderBottom:
                      sourceTab === tab
                        ? "2px solid var(--color-primary)"
                        : "2px solid transparent",
                    background: "transparent",
                    textTransform: "capitalize",
                  }}
                >
                  {tab === "text" ? "Text" : tab === "url" ? "URL" : "File"}
                </button>
              ))}
            </div>

            {/* Source input */}
            {sourceTab === "text" && (
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Source name (e.g., Research Notes)"
                  style={inputStyle}
                />
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Paste text, research, notes..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <button onClick={addSource} style={addBtnStyle}>
                  Add Text
                </button>
              </div>
            )}

            {sourceTab === "url" && (
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Source name"
                  style={inputStyle}
                />
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
                <button onClick={addSource} style={addBtnStyle}>
                  Add URL
                </button>
              </div>
            )}

            {sourceTab === "file" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.pdf,.png,.jpg,.jpeg,.txt,.csv"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "var(--space-6)",
                    border: "2px dashed var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                  }}
                >
                  Drop files or click to upload
                  <br />
                  <span style={{ fontSize: "var(--text-xs)" }}>
                    .md, .pdf, .png, .jpg, .txt, .csv
                  </span>
                </button>
              </div>
            )}

            {/* Added sources list */}
            {sources.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-1)",
                  marginTop: "var(--space-3)",
                }}
              >
                {sources.map((source) => (
                  <div
                    key={source.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.4rem 0.75rem",
                      background: "var(--color-surface-2)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                      <span
                        style={{
                          padding: "1px 4px",
                          borderRadius: 4,
                          background: "rgba(79,152,163,0.12)",
                          color: "var(--color-primary)",
                          fontSize: "10px",
                          textTransform: "uppercase",
                        }}
                      >
                        {source.type}
                      </span>
                      <span>{source.name}</span>
                    </div>
                    <button
                      onClick={() => removeSource(source.id)}
                      style={{
                        color: "var(--color-text-muted)",
                        background: "transparent",
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: name.trim()
                ? "var(--color-primary)"
                : "var(--color-surface-2)",
              color: name.trim() ? "#fff" : "var(--color-text-muted)",
              borderRadius: "var(--radius-lg)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              minHeight: 44,
            }}
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
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

const addBtnStyle: React.CSSProperties = {
  padding: "0.4rem",
  background: "rgba(79,152,163,0.12)",
  color: "var(--color-primary)",
  borderRadius: "var(--radius-sm)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
};
