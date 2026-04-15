"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import {
  ArrowLeft,
  Copy,
  Check,
  Bot,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";

/**
 * Co-Work Mode — CopilotKit-powered collaborative agent workspace.
 *
 * Layout (desktop):
 *   ┌─────────── HEADER ────────────────────────────────┐
 *   │ [← Back]  Task title          [$0.23] [sound] [⋯] │
 *   ├──── CHAT (40%) ──┬──── ARTIFACT (60%) ────────────┤
 *   │ CopilotChat       │ ArtifactPanel                  │
 *   │  Agent thinking   │  Document forming live          │
 *   │  Brain cards      │  User co-editing                │
 *   │  Delegation viz   │                                 │
 *   │  [steering input] │  [Copy for Claude Code]         │
 *   ├───────────────────┴────────────────────────────────┤
 *   │ Timeline scrubber (Phase 3)                         │
 *   └────────────────────────────────────────────────────┘
 */

const MASTRA_URL = process.env.NEXT_PUBLIC_MASTRA_URL ?? "https://intersection-mastra.fly.dev";
const COPILOTKIT_API_KEY = process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY ?? "";

export default function CoWorkMode() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as Id<"tasks">;

  const task = useQuery(api.tasks.getTask, { taskId });
  const startSession = useMutation(api.tasks.startInteractiveSession);
  const saveResult = useMutation(api.tasks.saveDeliverable);

  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [costCents, setCostCents] = useState(0);
  const [deliverable, setDeliverable] = useState("");
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  // Health check on mount
  useEffect(() => {
    fetch(`${MASTRA_URL}/health`)
      .then((res) => setServerHealthy(res.ok))
      .catch(() => setServerHealthy(false));
  }, []);

  // Start interactive session when task is queued and server is healthy
  useEffect(() => {
    if (task && task.status === "queued" && serverHealthy && !sessionStarted) {
      setSessionStarted(true);
      startSession({ taskId, sessionId }).catch((err) => {
        console.error("Failed to start interactive session:", err);
      });
    }
  }, [task, serverHealthy, sessionStarted, taskId, sessionId, startSession]);

  const isReplay = task?.status === "completed" && !sessionStarted;
  const isOffline = serverHealthy === false;

  // Smart Copy for Claude Code
  const handleCopy = useCallback(() => {
    const content = deliverable || task?.resultFull || task?.resultSummary || "";
    const prompt = [
      `# ${task?.title ?? "Deliverable"}`,
      `Project: Intersection Studio`,
      `Agent: CEO (supervisor) → delegated to specialists`,
      `Session: ${sessionId}`,
      "",
      "## Deliverable",
      content,
      "",
      "---",
      "Build this. Implementation specs above.",
      "The CEO agent produced this after querying the institutional brain",
      "and delegating to specialist agents. Review and implement.",
    ].join("\n");

    navigator.clipboard?.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [task, deliverable, sessionId]);

  // Loading
  if (!task) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <Loader2 size={24} color="#888" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Server offline
  if (isOffline) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0a0a0a", color: "#fafafa" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, margin: "0 0 8px" }}>Studio agents are offline</h2>
          <p style={{ color: "#888", fontSize: 16 }}>
            The Mastra server is not responding. Check Fly.io status.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: 24, padding: "12px 24px", background: "#141414",
              border: "1px solid #2a2a2a", borderRadius: 8,
              color: "#fafafa", cursor: "pointer", fontSize: 16,
            }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Replay mode for completed tasks
  if (isReplay) {
    const replayContent = task.resultFull ?? task.resultSummary ?? "";
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fafafa" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #2a2a2a",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}>
              <ArrowLeft size={20} />
            </button>
            <Clock size={14} color="#555" />
            <span style={{ fontSize: 14, color: "#888" }}>Replay: {task.title}</span>
          </div>
        </div>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>{task.title}</h1>
          <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {replayContent || (
              <p style={{ color: "#555" }}>No deliverable recorded for this task.</p>
            )}
          </div>
          {replayContent && (
            <div style={{ marginTop: 24 }}>
              <button onClick={handleCopy} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", background: "#f59e0b",
                border: "none", borderRadius: 8, color: "#000", fontWeight: 600,
                cursor: "pointer", fontSize: 14,
              }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy for Claude Code"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Co-Work session
  return (
    <CopilotKit
      runtimeUrl={`${MASTRA_URL}/chat`}
      agent="ceo"
      headers={{ Authorization: `Bearer ${COPILOTKIT_API_KEY}` }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a", color: "#fafafa" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #2a2a2a", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}>
              <ArrowLeft size={20} />
            </button>
            <Bot size={18} color="#3b82f6" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>
              ${(costCents / 100).toFixed(2)}
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
            >
              {soundEnabled
                ? <Volume2 size={16} color="#f59e0b" />
                : <VolumeX size={16} color="#555" />
              }
            </button>
          </div>
        </div>

        {/* Split view: Chat (40%) | Artifact (60%) */}
        <div style={{ display: "grid", gridTemplateColumns: "40fr 60fr", flex: 1, overflow: "hidden" }}>
          {/* LEFT: CopilotChat */}
          <div style={{
            borderRight: "1px solid #2a2a2a",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            <CopilotChat
              labels={{
                title: "CEO Agent",
                initial: "What would you like to work on?",
                placeholder: "Steer the agent...",
              }}
              className="cowork-chat"
            />
          </div>

          {/* RIGHT: Artifact Panel */}
          <div style={{
            display: "flex", flexDirection: "column",
            overflow: "hidden", position: "relative",
          }}>
            <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
              {deliverable ? (
                <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {deliverable}
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
                    <p style={{ fontSize: 12, marginTop: 4 }}>The agent is working on your request</p>
                  </div>
                </div>
              )}
            </div>

            {/* Copy button — fixed bottom-right */}
            {(deliverable || task.resultFull) && (
              <div style={{ position: "absolute", bottom: 16, right: 16 }}>
                <button onClick={handleCopy} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 16px", background: "#f59e0b",
                  border: "none", borderRadius: 8, color: "#000", fontWeight: 600,
                  cursor: "pointer", fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy for Claude Code"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CopilotKit dark theme overrides */}
      <style>{`
        .cowork-chat {
          height: 100% !important;
          --copilot-kit-background-color: #0a0a0a;
          --copilot-kit-secondary-color: #141414;
          --copilot-kit-separator-color: #2a2a2a;
          --copilot-kit-primary-color: #f59e0b;
          --copilot-kit-contrast-color: #fafafa;
          --copilot-kit-secondary-contrast-color: #888;
        }
        @media (max-width: 768px) {
          [style*="grid-template-columns: 40fr 60fr"] {
            grid-template-columns: 1fr !important;
          }
          [style*="border-right: 1px solid #2a2a2a"] {
            border-right: none !important;
            border-bottom: 1px solid #2a2a2a !important;
            max-height: 50vh !important;
          }
        }
      `}</style>
    </CopilotKit>
  );
}
