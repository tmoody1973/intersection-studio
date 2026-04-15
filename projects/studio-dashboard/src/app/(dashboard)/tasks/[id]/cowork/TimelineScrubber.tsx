"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { useRef, useState, useCallback } from "react";

interface SessionEvent {
  _id: string;
  sessionId: string;
  taskId: Id<"tasks">;
  eventType: string;
  data: string;
  timestamp: number;
}
import { Brain, Users, MessageSquare, FileText, AlertCircle, DollarSign, CheckCircle2 } from "lucide-react";

/**
 * Timeline Scrubber — horizontal bar with event dots for session replay.
 *
 * Layout:
 *   ● ● ● ● ●─────────────────────────○
 *   |         |                         |
 *   start     events                    end
 *
 * Event types: thinking, tool_call, delegation, steering, chunk, completion, error, cost_update
 * Click any dot to scroll the chat to that event's timestamp.
 */

const EVENT_ICONS: Record<string, typeof Brain> = {
  thinking: MessageSquare,
  tool_call: Brain,
  delegation: Users,
  steering: MessageSquare,
  chunk: FileText,
  completion: CheckCircle2,
  error: AlertCircle,
  cost_update: DollarSign,
};

const EVENT_COLORS: Record<string, string> = {
  thinking: "#888",
  tool_call: "#10b981",
  delegation: "#3b82f6",
  steering: "#f59e0b",
  chunk: "#555",
  completion: "#10b981",
  error: "#ef4444",
  cost_update: "#f59e0b",
};

interface TimelineScrubberProps {
  taskId: Id<"tasks">;
  sessionId?: string;
  onJumpToEvent?: (timestamp: number) => void;
}

export function TimelineScrubber({ taskId, sessionId, onJumpToEvent }: TimelineScrubberProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (useQuery((api as any).sessionEvents?.byTask, { taskId }) ?? []) as SessionEvent[];
  const barRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out chunk events for display (too noisy)
  const displayEvents = events.filter((e: SessionEvent) => e.eventType !== "chunk" && e.eventType !== "cost_update");

  const handleClick = useCallback((timestamp: number) => {
    onJumpToEvent?.(timestamp);
  }, [onJumpToEvent]);

  if (displayEvents.length === 0) {
    return (
      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#555",
        fontSize: 12,
      }}>
        <div style={{
          flex: 1, height: 2, background: "#2a2a2a", borderRadius: 1,
        }} />
        <span>No events yet</span>
      </div>
    );
  }

  const startTime = displayEvents[0].timestamp;
  const endTime = displayEvents[displayEvents.length - 1].timestamp;
  const duration = endTime - startTime || 1;

  return (
    <div style={{
      padding: "8px 16px",
      borderTop: "1px solid #2a2a2a",
      flexShrink: 0,
    }}>
      {/* Timeline bar */}
      <div
        ref={barRef}
        style={{
          position: "relative",
          height: 24,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Background track */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%",
          height: 2, background: "#2a2a2a", borderRadius: 1,
          transform: "translateY(-50%)",
        }} />

        {/* Event dots */}
        {displayEvents.map((event: SessionEvent, i: number) => {
          const position = ((event.timestamp - startTime) / duration) * 100;
          const color = EVENT_COLORS[event.eventType] ?? "#888";
          const isHovered = hoveredIndex === i;
          const Icon = EVENT_ICONS[event.eventType] ?? MessageSquare;
          const dotSize = isHovered ? 12 : 8;

          return (
            <div
              key={event._id}
              style={{
                position: "absolute",
                left: `${position}%`,
                transform: "translateX(-50%)",
                cursor: "pointer",
                zIndex: isHovered ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(event.timestamp)}
            >
              <div style={{
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                background: color,
                transition: "all 0.15s",
              }} />
              {/* Tooltip on hover */}
              {isHovered && (
                <div style={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  padding: "4px 8px",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  color: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  <Icon size={10} color={color} />
                  <span>{event.eventType}</span>
                  <span style={{ color: "#555" }}>
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary line */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "#555",
        marginTop: 2,
      }}>
        <span>{displayEvents.length} events</span>
        <span>{Math.round(duration / 1000)}s duration</span>
      </div>
    </div>
  );
}

/**
 * Replay Timeline — static list view of session events for completed tasks.
 * Shows each event with timestamp, type icon, and data preview.
 */
interface ReplayTimelineProps {
  taskId: Id<"tasks">;
}

export function ReplayTimeline({ taskId }: ReplayTimelineProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (useQuery((api as any).sessionEvents?.byTask, { taskId }) ?? []) as SessionEvent[];
  const displayEvents = events.filter((e: SessionEvent) => e.eventType !== "chunk");

  if (displayEvents.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#555", fontSize: 14 }}>
        No timeline recorded for this session.
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      {displayEvents.map((event: SessionEvent) => {
        const color = EVENT_COLORS[event.eventType] ?? "#888";
        const Icon = EVENT_ICONS[event.eventType] ?? MessageSquare;
        let preview = "";
        try {
          const parsed = JSON.parse(event.data);
          preview = typeof parsed === "string" ? parsed : JSON.stringify(parsed).slice(0, 100);
        } catch {
          preview = event.data.slice(0, 100);
        }

        return (
          <div
            key={event._id}
            style={{
              display: "flex",
              gap: 12,
              padding: "8px 16px",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <div style={{
              width: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}>
              <Icon size={14} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{event.eventType}</span>
                <span style={{ fontSize: 11, color: "#555" }}>
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              {preview && (
                <p style={{
                  fontSize: 12, color: "#888", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {preview}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
