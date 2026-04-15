"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { Tldraw, createShapeId, type TLUiOverrides } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useEffect, useRef } from "react";

/**
 * CanvasView — TLDraw-based spatial visualization of a completed session.
 *
 * Renders:
 * - Agent session node (center) — the task title + status
 * - Brain document cards (left cluster) — brain queries from the session
 * - Delegation nodes (right cluster) — agent delegation events
 * - Deliverable node (bottom) — the final output
 *
 * All read-only. No live streaming. Loads from sessionEvents table.
 */

interface SessionEvent {
  _id: string;
  eventType: string;
  data: string;
  timestamp: number;
}

interface CanvasViewProps {
  taskId: Id<"tasks">;
  taskTitle: string;
}

// Minimal UI — hide most TLDraw tools for a read-only view
const overrides: TLUiOverrides = {
  tools(editor, tools) {
    // Only keep select and hand tools
    return {
      select: tools.select,
      hand: tools.hand,
    };
  },
};

export default function CanvasView({ taskId, taskTitle }: CanvasViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (useQuery((api as any).sessionEvents?.byTask, { taskId }) ?? []) as SessionEvent[];
  const editorRef = useRef<any>(null);
  const shapesCreated = useRef(false);

  const createShapes = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || shapesCreated.current || events.length === 0) return;
    shapesCreated.current = true;

    const centerX = 400;
    const centerY = 300;

    // Central task node
    const taskShapeId = createShapeId("task-main");
    editor.createShape({
      id: taskShapeId,
      type: "geo",
      x: centerX - 100,
      y: centerY - 40,
      props: {
        w: 200,
        h: 80,
        geo: "rectangle",
        text: taskTitle,
        color: "blue",
        fill: "semi",
        size: "m",
      },
    });

    // Brain query nodes (left cluster)
    const brainEvents = events.filter((e) => e.eventType === "tool_call");
    brainEvents.forEach((event, i) => {
      let title = "Brain Query";
      try {
        const parsed = JSON.parse(event.data);
        title = parsed.title ?? parsed.query ?? "Brain Query";
      } catch { /* use default */ }

      const brainId = createShapeId(`brain-${i}`);
      editor.createShape({
        id: brainId,
        type: "geo",
        x: centerX - 350,
        y: centerY - 80 + i * 100,
        props: {
          w: 180,
          h: 60,
          geo: "rectangle",
          text: title.slice(0, 40),
          color: "green",
          fill: "semi",
          size: "s",
        },
      });

      // Arrow from brain to task
      editor.createShape({
        id: createShapeId(`brain-arrow-${i}`),
        type: "arrow",
        props: {
          start: { type: "binding", boundShapeId: brainId, normalizedAnchor: { x: 1, y: 0.5 }, isExact: false, isPrecise: false },
          end: { type: "binding", boundShapeId: taskShapeId, normalizedAnchor: { x: 0, y: 0.5 }, isExact: false, isPrecise: false },
          color: "green",
        },
      });
    });

    // Delegation nodes (right cluster)
    const delegationEvents = events.filter((e) => e.eventType === "delegation");
    delegationEvents.forEach((event, i) => {
      let agentName = "Agent";
      try {
        const parsed = JSON.parse(event.data);
        agentName = parsed.toAgent ?? parsed.agent ?? "Agent";
      } catch { /* use default */ }

      const delegateId = createShapeId(`delegate-${i}`);
      editor.createShape({
        id: delegateId,
        type: "geo",
        x: centerX + 200,
        y: centerY - 80 + i * 100,
        props: {
          w: 160,
          h: 60,
          geo: "ellipse",
          text: agentName,
          color: "violet",
          fill: "semi",
          size: "s",
        },
      });

      // Arrow from task to delegate
      editor.createShape({
        id: createShapeId(`delegate-arrow-${i}`),
        type: "arrow",
        props: {
          start: { type: "binding", boundShapeId: taskShapeId, normalizedAnchor: { x: 1, y: 0.5 }, isExact: false, isPrecise: false },
          end: { type: "binding", boundShapeId: delegateId, normalizedAnchor: { x: 0, y: 0.5 }, isExact: false, isPrecise: false },
          color: "violet",
        },
      });
    });

    // Completion / deliverable node (bottom)
    const completionEvent = events.find((e) => e.eventType === "completion");
    if (completionEvent) {
      const completionId = createShapeId("completion");
      editor.createShape({
        id: completionId,
        type: "geo",
        x: centerX - 80,
        y: centerY + 120,
        props: {
          w: 160,
          h: 60,
          geo: "rectangle",
          text: "Deliverable",
          color: "orange",
          fill: "semi",
          size: "m",
        },
      });

      editor.createShape({
        id: createShapeId("completion-arrow"),
        type: "arrow",
        props: {
          start: { type: "binding", boundShapeId: taskShapeId, normalizedAnchor: { x: 0.5, y: 1 }, isExact: false, isPrecise: false },
          end: { type: "binding", boundShapeId: completionId, normalizedAnchor: { x: 0.5, y: 0 }, isExact: false, isPrecise: false },
          color: "orange",
        },
      });
    }

    // Zoom to fit
    editor.zoomToFit({ animation: { duration: 300 } });
  }, [events, taskTitle]);

  useEffect(() => {
    if (editorRef.current && events.length > 0) {
      createShapes();
    }
  }, [events, createShapes]);

  if (events.length === 0) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#555", fontSize: 14 }}>
        No session data available for canvas view.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          // Set dark mode
          editor.user.updateUserPreferences({ colorScheme: "dark" });
          createShapes();
        }}
        overrides={overrides}
      />
    </div>
  );
}
