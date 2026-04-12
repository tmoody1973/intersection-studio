import { describe, it, expect } from "vitest";

/**
 * Document status transition validation.
 * Mirrors the logic in documents.updateStatus handler.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["done", "handed_off"],
  done: ["handed_off"],
  handed_off: [], // terminal
};

function isValidStatusTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Clipboard payload format.
 * Mirrors the copyForClaudeCode function in page.tsx.
 */
const TYPE_LABELS: Record<string, string> = {
  case_study: "Case Study",
  social_post: "Social Post",
  prd: "PRD",
  design_doc: "Design Doc",
  research: "Research",
  other: "Other",
};

function formatClipboardPayload(doc: {
  title: string;
  projectName: string;
  type: string;
  body: string;
}): string {
  return [
    `# ${doc.title}`,
    `Project: ${doc.projectName}`,
    `Type: ${TYPE_LABELS[doc.type] ?? doc.type}`,
    "",
    doc.body,
    "",
    "---",
    "Build this. Implementation specs above.",
  ].join("\n");
}

/**
 * Auto-save conditional logic.
 * Mirrors the guard in callbacks.applyCallbackResult.
 */
function shouldAutoSave(
  newTaskStatus: string,
  result: string | undefined,
): boolean {
  return newTaskStatus === "completed" && !!result;
}

// ─────────────────────────────────────────────
// Status Transition Tests
// ─────────────────────────────────────────────

describe("document status transitions", () => {
  it("allows draft → done", () => {
    expect(isValidStatusTransition("draft", "done")).toBe(true);
  });

  it("allows draft → handed_off (skip done)", () => {
    expect(isValidStatusTransition("draft", "handed_off")).toBe(true);
  });

  it("allows done → handed_off", () => {
    expect(isValidStatusTransition("done", "handed_off")).toBe(true);
  });

  it("rejects handed_off → draft (terminal)", () => {
    expect(isValidStatusTransition("handed_off", "draft")).toBe(false);
  });

  it("rejects handed_off → done (terminal)", () => {
    expect(isValidStatusTransition("handed_off", "done")).toBe(false);
  });

  it("rejects done → draft (no backward transitions)", () => {
    expect(isValidStatusTransition("done", "draft")).toBe(false);
  });

  it("rejects unknown status", () => {
    expect(isValidStatusTransition("bogus", "done")).toBe(false);
  });

  it("rejects transition to same status", () => {
    expect(isValidStatusTransition("draft", "draft")).toBe(false);
    expect(isValidStatusTransition("done", "done")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Clipboard Payload Tests
// ─────────────────────────────────────────────

describe("clipboard payload format", () => {
  it("formats a complete document payload", () => {
    const payload = formatClipboardPayload({
      title: "Case Study: Crate",
      projectName: "Crate",
      type: "case_study",
      body: "# Crate Case Study\n\nCrate is a DJ research tool...",
    });

    expect(payload).toContain("# Case Study: Crate");
    expect(payload).toContain("Project: Crate");
    expect(payload).toContain("Type: Case Study");
    expect(payload).toContain("# Crate Case Study");
    expect(payload).toContain("Build this. Implementation specs above.");
  });

  it("uses human-readable type labels", () => {
    const payload = formatClipboardPayload({
      title: "Test",
      projectName: "Test Project",
      type: "social_post",
      body: "content",
    });

    expect(payload).toContain("Type: Social Post");
    expect(payload).not.toContain("Type: social_post");
  });

  it("handles 'other' type", () => {
    const payload = formatClipboardPayload({
      title: "Test",
      projectName: "Test Project",
      type: "other",
      body: "content",
    });

    expect(payload).toContain("Type: Other");
  });

  it("handles unknown type gracefully", () => {
    const payload = formatClipboardPayload({
      title: "Test",
      projectName: "Test Project",
      type: "unknown_type",
      body: "content",
    });

    // Falls through to raw type string
    expect(payload).toContain("Type: unknown_type");
  });

  it("handles unscoped documents", () => {
    const payload = formatClipboardPayload({
      title: "Test",
      projectName: "Unscoped",
      type: "research",
      body: "research notes",
    });

    expect(payload).toContain("Project: Unscoped");
  });

  it("preserves markdown in body", () => {
    const body = "## Section\n\n- bullet 1\n- bullet 2\n\n```ts\nconst x = 1;\n```";
    const payload = formatClipboardPayload({
      title: "Test",
      projectName: "Test",
      type: "prd",
      body,
    });

    expect(payload).toContain("## Section");
    expect(payload).toContain("- bullet 1");
    expect(payload).toContain("```ts");
  });

  it("ends with the build instruction", () => {
    const payload = formatClipboardPayload({
      title: "Test",
      projectName: "Test",
      type: "other",
      body: "content",
    });

    expect(payload).toMatch(/Build this\. Implementation specs above\.$/);
  });
});

// ─────────────────────────────────────────────
// Auto-Save Conditional Tests
// ─────────────────────────────────────────────

describe("auto-save conditional logic", () => {
  it("saves when task is completed with result", () => {
    expect(shouldAutoSave("completed", "Full deliverable text")).toBe(true);
  });

  it("does NOT save when task is completed without result", () => {
    expect(shouldAutoSave("completed", undefined)).toBe(false);
  });

  it("does NOT save when task is completed with empty result", () => {
    expect(shouldAutoSave("completed", "")).toBe(false);
  });

  it("does NOT save when task failed", () => {
    expect(shouldAutoSave("failed", "error message")).toBe(false);
  });

  it("does NOT save when task is waiting_approval", () => {
    expect(shouldAutoSave("waiting_approval", "draft content")).toBe(false);
  });

  it("does NOT save when task is running", () => {
    expect(shouldAutoSave("running", undefined)).toBe(false);
  });

  it("does NOT save when task is queued", () => {
    expect(shouldAutoSave("queued", undefined)).toBe(false);
  });

  it("does NOT save when task is cancelled", () => {
    expect(shouldAutoSave("cancelled", undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Type Label Tests
// ─────────────────────────────────────────────

describe("type labels", () => {
  it("maps all document types to human labels", () => {
    const types = [
      "case_study",
      "social_post",
      "prd",
      "design_doc",
      "research",
      "other",
    ];

    for (const t of types) {
      expect(TYPE_LABELS[t]).toBeDefined();
      expect(TYPE_LABELS[t].length).toBeGreaterThan(0);
    }
  });

  it("labels don't contain underscores", () => {
    for (const label of Object.values(TYPE_LABELS)) {
      expect(label).not.toContain("_");
    }
  });
});
