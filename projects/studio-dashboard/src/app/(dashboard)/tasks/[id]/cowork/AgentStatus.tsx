"use client";

import { useCopilotChat } from "@copilotkit/react-core";
import { useState, useEffect, useRef } from "react";

/**
 * Agent Status Bar — shows whether the agent is actively working.
 *
 * Solves the "is it doing something or did it fail?" problem:
 * - Pulsing dot + context-aware status text
 * - Elapsed timer so you can see time passing
 * - Timeout warning at 90s
 * - "Completed" flash when agent finishes
 * - Stays visible for 3s after completion so you know it finished
 */

export function AgentStatusBar() {
  const { isLoading, visibleMessages } = useCopilotChat();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const wasLoadingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer while loading
  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Flash "completed" if we were previously loading
      if (wasLoadingRef.current) {
        wasLoadingRef.current = false;
        setShowCompleted(true);
        setTimeout(() => setShowCompleted(false), 3000);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  // Infer activity from the last message
  const lastMsg = visibleMessages?.[visibleMessages.length - 1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastText = typeof (lastMsg as any)?.content === "string" ? (lastMsg as any).content : "";

  let statusText = "CEO is working";
  if (lastText.includes("delegate") && lastText.includes("research")) {
    statusText = "Delegating to Researcher";
  } else if (lastText.includes("delegate") && lastText.includes("writ")) {
    statusText = "Delegating to Writer";
  } else if (lastText.includes("delegate") && lastText.includes("social")) {
    statusText = "Delegating to Social Media";
  } else if (lastText.includes("delegate") && (lastText.includes("data") || lastText.includes("analy"))) {
    statusText = "Delegating to Data Analyst";
  } else if (lastText.includes("brain") || lastText.includes("institutional")) {
    statusText = "Querying institutional brain";
  } else if (lastText.includes("synthesiz") || lastText.includes("compil")) {
    statusText = "Synthesizing results";
  }

  const isTimeout = elapsedSeconds > 90;

  // Show completed flash
  if (showCompleted) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", background: "#0f1f1a",
        borderBottom: "1px solid #1a3a2a", fontSize: 13,
        color: "#10b981", flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
        <span>Agent finished — check the response below</span>
      </div>
    );
  }

  if (!isLoading) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 16px",
      background: isTimeout ? "#1f1410" : "#141414",
      borderBottom: `1px solid ${isTimeout ? "#3a2a1a" : "#2a2a2a"}`,
      fontSize: 13,
      color: isTimeout ? "#ef4444" : "#f59e0b",
      flexShrink: 0,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: isTimeout ? "#ef4444" : "#f59e0b",
        animation: "pulse-status 1.5s ease-in-out infinite",
      }} />
      <span style={{ flex: 1 }}>
        {isTimeout
          ? `Still working... this is taking longer than expected (${elapsedSeconds}s)`
          : `${statusText} (${elapsedSeconds}s)`
        }
      </span>
      {elapsedSeconds > 10 && !isTimeout && (
        <span style={{ fontSize: 11, color: "#555" }}>
          delegation can take 30-60s
        </span>
      )}
      <style>{`
        @keyframes pulse-status {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
