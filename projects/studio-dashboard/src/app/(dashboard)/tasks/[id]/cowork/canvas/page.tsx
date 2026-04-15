"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { ArrowLeft, Columns, Loader2 } from "lucide-react";

/**
 * Canvas Copilot Prototype — TLDraw-based spatial view of agent sessions.
 *
 * Read-only visualization of completed sessions. Agent sessions appear as nodes,
 * brain documents as linked cards, deliverables as artifacts.
 *
 * Route: /tasks/[id]/cowork/canvas
 * Toggle: button in Co-Work header switches between /cowork and /cowork/canvas
 *
 * This is a PROTOTYPE (gated on Phases 1-3 being demo-ready).
 * No live streaming — reads from Convex sessionEvents for completed sessions.
 */

// Dynamic import to avoid TLDraw's large bundle on other routes
const CanvasView = dynamic(() => import("./CanvasView"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#555" }}>
      <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function CanvasPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as Id<"tasks">;

  const task = useQuery(api.tasks.getTask, { taskId });

  if (!task) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <Loader2 size={24} color="#888" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a", color: "#fafafa" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid #2a2a2a", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(`/tasks/${taskId}/cowork`)}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }}
            aria-label="Back to split view"
          >
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</span>
          <span style={{
            fontSize: 11, color: "#f59e0b", background: "#f59e0b20",
            padding: "2px 8px", borderRadius: 4,
          }}>
            Canvas (prototype)
          </span>
        </div>
        <button
          onClick={() => router.push(`/tasks/${taskId}/cowork`)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", background: "#141414",
            border: "1px solid #2a2a2a", borderRadius: 6,
            color: "#fafafa", cursor: "pointer", fontSize: 13,
          }}
        >
          <Columns size={14} />
          Split View
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <CanvasView taskId={taskId} taskTitle={task.title} />
      </div>
    </div>
  );
}
