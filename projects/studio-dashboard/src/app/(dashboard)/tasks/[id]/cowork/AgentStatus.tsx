"use client";

import { useCopilotChat } from "@copilotkit/react-core";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Agent Status Bar — shows whether the agent is actively working.
 *
 * Solves the "is it doing something or did it fail?" problem.
 * Displays above the chat panel with clear visual feedback:
 * - Thinking: pulsing dot + "CEO is thinking..." / "Delegating to Researcher..."
 * - Idle: nothing shown (get out of the way)
 * - Error: red banner with error message
 */

export function AgentStatusBar() {
  const { isLoading, visibleMessages } = useCopilotChat();

  // Infer activity from the last message
  const lastMsg = visibleMessages?.[visibleMessages.length - 1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastText = typeof (lastMsg as any)?.content === "string" ? (lastMsg as any).content : "";

  // Detect delegation intent from agent text
  let statusText = "CEO is working...";
  if (lastText.includes("delegate") && lastText.includes("research")) {
    statusText = "Delegating to Researcher — this may take 30-60 seconds...";
  } else if (lastText.includes("delegate") && lastText.includes("writ")) {
    statusText = "Delegating to Writer...";
  } else if (lastText.includes("delegate") && lastText.includes("social")) {
    statusText = "Delegating to Social Media agent...";
  } else if (lastText.includes("delegate") && lastText.includes("data") || lastText.includes("analy")) {
    statusText = "Delegating to Data Analyst...";
  } else if (lastText.includes("brain") || lastText.includes("institutional")) {
    statusText = "Querying institutional brain...";
  } else if (lastText.includes("synthesiz") || lastText.includes("compil")) {
    statusText = "Synthesizing results...";
  }

  if (!isLoading) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      background: "#141414",
      borderBottom: "1px solid #2a2a2a",
      fontSize: 13,
      color: "#f59e0b",
      flexShrink: 0,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#f59e0b",
        animation: "pulse-status 1.5s ease-in-out infinite",
      }} />
      <span>{statusText}</span>
      <style>{`
        @keyframes pulse-status {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
