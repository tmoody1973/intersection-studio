"use client";

import { useCopilotChat } from "@copilotkit/react-core";
import { useState, useEffect } from "react";
import { SmartCopy } from "./SmartCopy";

/**
 * Artifact Panel — shows the agent's deliverable, extracted from chat messages.
 *
 * Reads CopilotKit's visible messages and displays the longest assistant
 * message as the deliverable in the right panel. Updates live as the
 * agent streams its response.
 *
 * This is the pragmatic approach: instead of useCoAgent shared state
 * (which requires Mastra-side configuration), we extract the deliverable
 * from the chat stream directly.
 */

interface ArtifactPanelProps {
  taskTitle: string;
  sessionId: string;
  taskResultFull?: string | null;
}

export function ArtifactPanel({ taskTitle, sessionId, taskResultFull }: ArtifactPanelProps) {
  const { visibleMessages, isLoading } = useCopilotChat();
  const [agentNotes, setAgentNotes] = useState<string[]>([]);

  // Extract the deliverable from assistant messages
  // Strategy: find the longest assistant message (that's usually the deliverable)
  // Also collect shorter messages as "agent notes" for smart copy context
  let deliverable = "";
  const notes: string[] = [];

  if (visibleMessages && visibleMessages.length > 0) {
    for (const msg of visibleMessages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (msg as any).role;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = typeof (msg as any).content === "string" ? (msg as any).content : "";

      if (role === "assistant" && content.length > 0) {
        if (content.length > deliverable.length) {
          // Previous deliverable becomes a note
          if (deliverable.length > 20) {
            notes.push(deliverable.slice(0, 100));
          }
          deliverable = content;
        } else if (content.length > 20) {
          notes.push(content.slice(0, 100));
        }
      }
    }
  }

  // Fall back to task result if no chat messages
  if (!deliverable && taskResultFull) {
    deliverable = taskResultFull;
  }

  // Update notes for smart copy
  useEffect(() => {
    if (notes.length > 0) {
      setAgentNotes(notes);
    }
  }, [notes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
      height: "100%",
    }}>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
        {deliverable ? (
          <div>
            {/* Show a subtle label */}
            <div style={{
              fontSize: 11, color: "#555", marginBottom: 12,
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {isLoading ? "Generating..." : "Deliverable"}
            </div>
            <div style={{
              fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-wrap",
              fontFamily: "Inter, system-ui, sans-serif",
            }}>
              {deliverable}
            </div>
            {isLoading && (
              <div style={{
                display: "inline-block",
                width: 8, height: 16,
                background: "#f59e0b",
                marginLeft: 2,
                animation: "blink-cursor 1s step-end infinite",
              }} />
            )}
          </div>
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#555" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "100%", maxWidth: 400, height: 200,
                background: "repeating-linear-gradient(0deg, transparent, transparent 19px, #2a2a2a 19px, #2a2a2a 20px)",
                opacity: 0.3, marginBottom: 16,
              }} />
              <p style={{ fontSize: 14 }}>Your document will appear here</p>
              <p style={{ fontSize: 12, marginTop: 4, color: "#444" }}>
                {isLoading
                  ? "Agent is working — the deliverable will appear as it's generated"
                  : "Type a message in the chat to get started"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Smart Copy — fixed bottom-right */}
      {deliverable && !isLoading && (
        <div style={{ position: "absolute", bottom: 16, right: 16 }}>
          <SmartCopy
            taskTitle={taskTitle}
            deliverable={deliverable}
            sessionId={sessionId}
            agentNotes={agentNotes}
          />
        </div>
      )}

      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
