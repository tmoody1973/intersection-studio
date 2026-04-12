"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

// --- Agent Grid ---

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
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
      }}
    />
  );
}

function AgentGridCard({
  agent,
  isSelected,
  onClick,
}: {
  agent: {
    _id: Id<"agents">;
    name: string;
    role: string;
    model: string;
    status: string;
    currentTaskCount: number;
  };
  isSelected: boolean;
  onClick: () => void;
}) {
  const modelShort = agent.model.split("/").pop() ?? agent.model;

  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gap: "var(--space-2)",
        padding: "var(--space-4)",
        background: "var(--color-surface)",
        border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: 16,
        textAlign: "left",
        transition: "border-color var(--transition)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
          {agent.name}
        </span>
        <StatusDot status={agent.status} />
      </div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{modelShort}</span>
        {agent.currentTaskCount > 0 && (
          <span style={{ color: "var(--color-orange)" }}>
            {agent.currentTaskCount} active
          </span>
        )}
      </div>
    </button>
  );
}

// --- Soul Tab ---

function SoulTab({ agentId }: { agentId: Id<"agents"> }) {
  const agent = useQuery(api.agents.getAgent, { agentId });
  const updateSoul = useMutation(api.agents.updateSoul);
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (agent?.soulMarkdown !== undefined) {
      setContent(agent.soulMarkdown ?? agent.description ?? "");
    }
  }, [agent?.soulMarkdown, agent?.description]);

  async function handleSave() {
    await updateSoul({ agentId, soulMarkdown: content });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Cmd+S save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!agent) return null;

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          SOUL.md
        </span>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              background: showPreview
                ? "rgba(79,152,163,0.12)"
                : "transparent",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            style={{
              fontSize: "var(--text-xs)",
              color: saved ? "var(--color-success)" : "var(--color-primary)",
              background: "rgba(79,152,163,0.12)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
            }}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            minHeight: 300,
          }}
        >
          {content}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.7,
            fontFamily: "monospace",
            minHeight: 300,
            resize: "vertical",
            outline: "none",
          }}
        />
      )}
    </div>
  );
}

// --- Skills Tab ---

function SkillsTab({ agentId }: { agentId: Id<"agents"> }) {
  const agent = useQuery(api.agents.getAgent, { agentId });
  const updateTools = useMutation(api.agents.updateTools);
  const [newTool, setNewTool] = useState("");

  if (!agent) return null;

  const tools = agent.allowedTools ?? [];

  async function addTool() {
    if (!newTool.trim() || tools.includes(newTool.trim())) return;
    await updateTools({
      agentId,
      allowedTools: [...tools, newTool.trim()],
    });
    setNewTool("");
  }

  async function removeTool(tool: string) {
    await updateTools({
      agentId,
      allowedTools: tools.filter((t) => t !== tool),
    });
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
        }}
      >
        <input
          value={newTool}
          onChange={(e) => setNewTool(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTool()}
          placeholder="Add a skill or tool..."
          style={{
            flex: 1,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.4rem 0.75rem",
            fontSize: "var(--text-sm)",
            outline: "none",
          }}
        />
        <button
          onClick={addTool}
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            padding: "0.4rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
          }}
        >
          Add
        </button>
      </div>

      {tools.length === 0 && (
        <div
          style={{
            padding: "var(--space-6)",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
          }}
        >
          No skills assigned yet
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {tools.map((tool) => (
          <div
            key={tool}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              padding: "0.25rem 0.75rem",
              fontSize: "var(--text-xs)",
            }}
          >
            <span>{tool}</span>
            <button
              onClick={() => removeTool(tool)}
              style={{
                color: "var(--color-text-muted)",
                background: "transparent",
                fontSize: "var(--text-xs)",
                padding: 0,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Config Tab ---

function ConfigTab({ agentId }: { agentId: Id<"agents"> }) {
  const agent = useQuery(api.agents.getAgent, { agentId });
  const agents = useQuery(api.agents.listWithStatus);
  const updateConfig = useMutation(api.agents.updateConfig);
  const updateModel = useMutation(api.agents.updateModel);
  const models = useQuery(api.models.listCached);

  if (!agent) return null;

  const otherAgents = agents?.filter((a) => a._id !== agentId) ?? [];

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Model */}
      <div>
        <label
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--space-1)",
          }}
        >
          Model
        </label>
        <select
          value={agent.model}
          onChange={(e) => updateModel({ agentId, model: e.target.value })}
          style={{
            width: "100%",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
            fontSize: "var(--text-sm)",
            outline: "none",
          }}
        >
          {models?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          {/* Ensure current model is always an option */}
          {models && !models.find((m) => m.id === agent.model) && (
            <option value={agent.model}>{agent.model}</option>
          )}
        </select>
      </div>

      {/* Budget */}
      <div>
        <label
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--space-1)",
          }}
        >
          Daily Budget ($)
        </label>
        <input
          type="number"
          defaultValue={agent.maxDailyBudgetCents / 100}
          onBlur={(e) => {
            const cents = Math.round(parseFloat(e.target.value) * 100);
            if (!isNaN(cents) && cents > 0) {
              updateConfig({ agentId, maxDailyBudgetCents: cents });
            }
          }}
          style={{
            width: "100%",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
            fontSize: "var(--text-sm)",
            outline: "none",
          }}
        />
      </div>

      {/* Max concurrent tasks */}
      <div>
        <label
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--space-1)",
          }}
        >
          Max Concurrent Tasks
        </label>
        <input
          type="number"
          defaultValue={agent.maxConcurrentTasks}
          onBlur={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val > 0) {
              updateConfig({ agentId, maxConcurrentTasks: val });
            }
          }}
          style={{
            width: "100%",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
            fontSize: "var(--text-sm)",
            outline: "none",
          }}
        />
      </div>

      {/* Timeout */}
      <div>
        <label
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--space-1)",
          }}
        >
          Timeout (minutes)
        </label>
        <input
          type="number"
          defaultValue={agent.defaultTimeoutMinutes}
          onBlur={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val > 0) {
              updateConfig({ agentId, defaultTimeoutMinutes: val });
            }
          }}
          style={{
            width: "100%",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
            fontSize: "var(--text-sm)",
            outline: "none",
          }}
        />
      </div>

      {/* Reports To */}
      <div>
        <label
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--space-1)",
          }}
        >
          Reports To
        </label>
        <select
          value={agent.reportsTo ?? ""}
          onChange={(e) => {
            if (e.target.value) {
              updateConfig({
                agentId,
                reportsTo: e.target.value as Id<"agents">,
              });
            }
          }}
          style={{
            width: "100%",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
            fontSize: "var(--text-sm)",
            outline: "none",
          }}
        >
          <option value="">None (top level)</option>
          {otherAgents.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Delegation Permissions */}
      <div>
        <label
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--space-2)",
          }}
        >
          Can Delegate To
        </label>
        <div style={{ display: "grid", gap: "var(--space-1)" }}>
          {otherAgents.map((a) => {
            const isPermitted = agent.delegationPermissions?.includes(a._id);
            return (
              <label
                key={a._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  padding: "0.25rem 0",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isPermitted}
                  onChange={() => {
                    const current = agent.delegationPermissions ?? [];
                    const updated = isPermitted
                      ? current.filter((id) => id !== a._id)
                      : [...current, a._id];
                    updateConfig({ agentId, delegationPermissions: updated });
                  }}
                />
                {a.name}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Editor Panel ---

type EditorTab = "soul" | "skills" | "config";

function AgentEditorPanel({
  agentId,
  onClose,
}: {
  agentId: Id<"agents">;
  onClose: () => void;
}) {
  const agent = useQuery(api.agents.getAgent, { agentId });
  const [activeTab, setActiveTab] = useState<EditorTab>("soul");

  if (!agent) return null;

  const tabs: Array<{ key: EditorTab; label: string }> = [
    { key: "soul", label: "Soul" },
    { key: "skills", label: "Skills" },
    { key: "config", label: "Config" },
  ];

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-4) var(--space-5)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>{agent.name}</div>
          <div
            style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}
          >
            {agent.role} · {agent.status}
          </div>
        </div>
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

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "0.6rem",
              fontSize: "var(--text-sm)",
              fontWeight: activeTab === tab.key ? 700 : 400,
              color:
                activeTab === tab.key
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              background: "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "var(--space-4) var(--space-5)", overflowY: "auto" }}>
        {activeTab === "soul" && <SoulTab agentId={agentId} />}
        {activeTab === "skills" && <SkillsTab agentId={agentId} />}
        {activeTab === "config" && <ConfigTab agentId={agentId} />}
      </div>
    </div>
  );
}

// --- Page ---

export default function AgentsPage() {
  const agents = useQuery(api.agents.listWithStatus);
  const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(
    null,
  );

  if (!agents) {
    return (
      <div
        style={{
          padding: "var(--space-8)",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Loading agents...
      </div>
    );
  }

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
        Agents
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedAgentId ? "1fr 420px" : "1fr",
          gap: 0,
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {/* Agent grid */}
        <div style={{ display: "grid", gap: "var(--space-4)", alignContent: "start" }}>
          {ceo && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px, 300px)",
                justifyContent: "center",
              }}
            >
              <AgentGridCard
                agent={ceo}
                isSelected={selectedAgentId === ceo._id}
                onClick={() =>
                  setSelectedAgentId(
                    selectedAgentId === ceo._id ? null : ceo._id,
                  )
                }
              />
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${leads.length}, 1fr)`,
              gap: "var(--space-3)",
            }}
          >
            {leads.map((agent) => (
              <AgentGridCard
                key={agent._id}
                agent={agent}
                isSelected={selectedAgentId === agent._id}
                onClick={() =>
                  setSelectedAgentId(
                    selectedAgentId === agent._id ? null : agent._id,
                  )
                }
              />
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {ics.map((agent) => (
              <AgentGridCard
                key={agent._id}
                agent={agent}
                isSelected={selectedAgentId === agent._id}
                onClick={() =>
                  setSelectedAgentId(
                    selectedAgentId === agent._id ? null : agent._id,
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Editor panel */}
        {selectedAgentId && (
          <AgentEditorPanel
            agentId={selectedAgentId}
            onClose={() => setSelectedAgentId(null)}
          />
        )}
      </div>
    </section>
  );
}
