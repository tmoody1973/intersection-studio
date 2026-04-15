"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Smart Copy for Claude Code — generates a structured prompt with full context.
 *
 * Instead of copying raw deliverable text, generates:
 * - Task summary
 * - Agent reasoning highlights (what brain docs were found, who was delegated to)
 * - The deliverable content
 * - Suggested next steps
 */

interface SmartCopyProps {
  taskTitle: string;
  deliverable: string;
  sessionId: string;
  projectName?: string;
  agentNotes?: string[];
  disabled?: boolean;
}

export function SmartCopy({
  taskTitle,
  deliverable,
  sessionId,
  projectName = "Intersection Studio",
  agentNotes = [],
  disabled = false,
}: SmartCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (disabled || !deliverable) return;

    const sections = [
      `# ${taskTitle}`,
      `Project: ${projectName}`,
      `Agent: CEO (supervisor) → delegated to specialists`,
      `Session: ${sessionId}`,
    ];

    if (agentNotes.length > 0) {
      sections.push("");
      sections.push("## Agent Reasoning");
      for (const note of agentNotes) {
        sections.push(`- ${note}`);
      }
    }

    sections.push("");
    sections.push("## Deliverable");
    sections.push(deliverable);
    sections.push("");
    sections.push("---");
    sections.push("Build this. The CEO agent produced this deliverable after querying");
    sections.push("the institutional brain and delegating to specialist agents.");
    sections.push("Review the content and implement accordingly.");

    const prompt = sections.join("\n");

    navigator.clipboard?.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [taskTitle, deliverable, sessionId, projectName, agentNotes, disabled]);

  return (
    <button
      onClick={handleCopy}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: disabled ? "#2a2a2a" : "#f59e0b",
        border: "none",
        borderRadius: 8,
        color: disabled ? "#555" : "#000",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 14,
        boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "background 0.15s",
      }}
      aria-label="Copy deliverable for Claude Code"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied!" : "Copy for Claude Code"}
    </button>
  );
}
