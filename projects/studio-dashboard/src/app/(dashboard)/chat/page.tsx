"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { useProjectContext } from "@/components/providers/ProjectContext";
import type { Id } from "../../../../convex/_generated/dataModel";

function AgentPicker({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Array<{
    _id: Id<"agents">;
    name: string;
    status: string;
    role: string;
    model: string;
  }>;
  selectedId: Id<"agents"> | null;
  onSelect: (id: Id<"agents">) => void;
}) {
  return (
    <div
      style={{
        borderRight: "1px solid var(--color-border)",
        padding: "var(--space-4)",
        width: 200,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "var(--space-3)",
        }}
      >
        Agents
      </div>
      {agents.map((agent) => (
        <button
          key={agent._id}
          onClick={() => onSelect(agent._id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            background:
              selectedId === agent._id
                ? "rgba(79, 152, 163, 0.12)"
                : "transparent",
            textAlign: "left",
            fontSize: "var(--text-xs)",
            marginBottom: 2,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                agent.status === "online"
                  ? "var(--color-success)"
                  : "var(--color-text-muted)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: selectedId === agent._id ? 700 : 400,
              color:
                selectedId === agent._id
                  ? "var(--color-text)"
                  : "var(--color-text-muted)",
            }}
          >
            {agent.name}
          </span>
        </button>
      ))}
    </div>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export default function ChatPage() {
  const agents = useQuery(api.agents.listWithStatus);
  const { selectedProjectId } = useProjectContext();
  const sendMessage = useAction(api.chat.sendMessage);

  const [selectedAgent, setSelectedAgent] = useState<Id<"agents"> | null>(null);
  const [conversationId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history when agent changes
  const history = useQuery(
    api.chat.getConversationHistory,
    selectedAgent
      ? { conversationId, limit: 50 }
      : "skip",
  );

  useEffect(() => {
    if (history) {
      setMessages(
        history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m._creationTime,
        })),
      );
    }
  }, [history]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedAgentData = agents?.find((a) => a._id === selectedAgent);

  async function handleSend() {
    if (!input.trim() || !selectedAgent || sending) return;

    const userMsg = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, timestamp: Date.now() },
    ]);

    try {
      const result = await sendMessage({
        agentId: selectedAgent,
        message: userMsg,
        projectId: selectedProjectId ?? undefined,
        conversationId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.content,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to reach agent"}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 120px)",
        background: "var(--color-surface)",
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}
    >
      {/* Agent picker sidebar */}
      <AgentPicker
        agents={agents ?? []}
        selectedId={selectedAgent}
        onSelect={setSelectedAgent}
      />

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chat header */}
        {selectedAgentData && (
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{selectedAgentData.name}</div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                {selectedAgentData.model.split("/").pop()} ·{" "}
                {selectedAgentData.status === "online" ? "Online" : "Offline"}
                {selectedProjectId && " · Project-scoped"}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {!selectedAgent && (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>
                  Select an agent to start a conversation
                </div>
                <div style={{ fontSize: "var(--text-sm)" }}>
                  Like working in Claude Code, but with your AI team.
                  <br />
                  Each agent remembers your conversation.
                </div>
              </div>
            </div>
          )}

          {selectedAgent && messages.length === 0 && !sending && (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>
                  Start a conversation with {selectedAgentData?.name}
                </div>
                <div style={{ fontSize: "var(--text-sm)" }}>
                  Brainstorm, refine, review work, or just think out loud.
                  <br />
                  {selectedProjectId
                    ? "Conversation is scoped to the selected project."
                    : "Select a project in the sidebar to scope the conversation."}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "0.75rem 1rem",
                  borderRadius: 16,
                  fontSize: "var(--text-sm)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  background:
                    msg.role === "user"
                      ? "rgba(79, 152, 163, 0.15)"
                      : "var(--color-surface-2)",
                  border:
                    msg.role === "assistant"
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-primary)",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {selectedAgentData?.name}
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: 16,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  {selectedAgentData?.name}
                </span>
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedAgent && (
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "flex-end",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedAgentData?.name}... (Enter to send, Shift+Enter for new line)`}
                disabled={sending}
                rows={1}
                style={{
                  flex: 1,
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: "0.75rem 1rem",
                  fontSize: "var(--text-sm)",
                  outline: "none",
                  resize: "none",
                  minHeight: 44,
                  maxHeight: 200,
                  color: "var(--color-text)",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: 12,
                  background:
                    input.trim() && !sending
                      ? "var(--color-primary)"
                      : "var(--color-surface-2)",
                  color:
                    input.trim() && !sending
                      ? "#fff"
                      : "var(--color-text-muted)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  minHeight: 44,
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
