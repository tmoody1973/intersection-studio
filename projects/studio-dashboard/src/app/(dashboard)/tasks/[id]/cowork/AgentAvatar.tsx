"use client";

/**
 * Agent Avatar — colored circle with initial letter.
 * Used for delegation visualization in Co-Work Mode chat.
 *
 * Agent colors (from DESIGN.md):
 *   CEO: #3b82f6 (blue)
 *   Researcher: #10b981 (green)
 *   Writer: #f59e0b (amber)
 *   Social Media: #8b5cf6 (purple)
 *   Data Analyst: #14b8a6 (teal)
 */

const AGENT_COLORS: Record<string, string> = {
  ceo: "#3b82f6",
  researcher: "#10b981",
  writer: "#f59e0b",
  "social-media": "#8b5cf6",
  socialMedia: "#8b5cf6",
  "data-analyst": "#14b8a6",
  dataAnalyst: "#14b8a6",
};

const AGENT_LABELS: Record<string, string> = {
  ceo: "CEO",
  researcher: "Researcher",
  writer: "Writer",
  "social-media": "Social",
  socialMedia: "Social",
  "data-analyst": "Data",
  dataAnalyst: "Data",
};

interface AgentAvatarProps {
  agentId: string;
  size?: number;
  showLabel?: boolean;
  status?: "idle" | "thinking" | "done";
}

export function AgentAvatar({ agentId, size = 36, showLabel = true, status }: AgentAvatarProps) {
  const color = AGENT_COLORS[agentId] ?? "#888";
  const label = AGENT_LABELS[agentId] ?? agentId;
  const initial = label[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          background: `${color}15`,
          display: "grid",
          placeItems: "center",
          fontSize: size * 0.4,
          fontWeight: 700,
          color,
          position: "relative",
          flexShrink: 0,
        }}
        aria-label={`${label} agent`}
      >
        {initial}
        {status === "thinking" && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 10, height: 10, borderRadius: "50%",
            background: color,
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
        )}
        {status === "done" && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 10, height: 10, borderRadius: "50%",
            background: "#10b981",
          }} />
        )}
      </div>
      {showLabel && (
        <span style={{ fontSize: 13, color: "#fafafa", fontWeight: 500 }}>
          {label}
        </span>
      )}
      {status === "thinking" && showLabel && (
        <span style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>thinking...</span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

/**
 * Delegation Arrow — visual indicator of delegation flow.
 * Shows: FromAgent → arrow → ToAgent
 */
interface DelegationFlowProps {
  fromAgent: string;
  toAgent: string;
  status?: "thinking" | "done";
}

export function DelegationFlow({ fromAgent, toAgent, status = "thinking" }: DelegationFlowProps) {
  const fromColor = AGENT_COLORS[fromAgent] ?? "#888";
  const toColor = AGENT_COLORS[toAgent] ?? "#888";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 0",
    }}>
      <AgentAvatar agentId={fromAgent} size={28} showLabel={false} />
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
        <line x1="0" y1="6" x2="18" y2="6" stroke={fromColor} strokeWidth="1.5" />
        <polygon points="18,2 24,6 18,10" fill={toColor} />
      </svg>
      <AgentAvatar agentId={toAgent} size={28} showLabel={true} status={status} />
    </div>
  );
}
