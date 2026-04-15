"use client";

import { Brain, ExternalLink } from "lucide-react";

/**
 * Brain Card — inline card rendered when the agent queries the institutional brain.
 * Shows matched document with title, excerpt, similarity score, and source.
 *
 * Data shape from brain.ts:122-128:
 *   { text: string, title: string, score: number, source: string }
 */

interface BrainResult {
  text: string;
  title: string;
  score: number;
  source: string;
}

export function BrainCard({ result }: { result: BrainResult }) {
  const scorePercent = Math.round(result.score * 100);
  const excerpt = result.text.length > 200
    ? result.text.slice(0, 200) + "..."
    : result.text;

  return (
    <div style={{
      background: "#0f1f1a",
      border: "1px solid #1a3a2a",
      borderRadius: 8,
      padding: "10px 12px",
      maxHeight: 120,
      overflow: "hidden",
      position: "relative",
      marginTop: 6,
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Brain size={14} color="#10b981" />
        <span style={{
          fontSize: 13, fontWeight: 600, color: "#fafafa",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {result.title}
        </span>
        <span style={{
          fontSize: 11, color: "#10b981", fontFamily: "monospace",
          flexShrink: 0,
        }}>
          {scorePercent}%
        </span>
      </div>
      <p style={{
        fontSize: 12, color: "#888", lineHeight: 1.4,
        margin: 0, overflow: "hidden",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
      }}>
        {excerpt}
      </p>
      {result.source && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          marginTop: 6, fontSize: 11, color: "#555",
        }}>
          <ExternalLink size={10} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.source}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Empty brain result card — shown when no matching documents found.
 */
export function BrainCardEmpty() {
  return (
    <div style={{
      background: "#141414",
      border: "1px solid #2a2a2a",
      borderRadius: 8,
      padding: "10px 12px",
      marginTop: 6,
      marginBottom: 6,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <Brain size={14} color="#555" />
      <span style={{ fontSize: 12, color: "#555" }}>No matching documents in brain</span>
    </div>
  );
}
