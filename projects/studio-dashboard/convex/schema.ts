import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Intersection Studio Control Room — Convex Schema
 *
 * 9 tables for the Hermes-powered agentic company.
 * Reviewed via /plan-ceo-review + /plan-eng-review (2026-04-09).
 *
 * Architecture:
 *   Browser → Next.js (Vercel) → Convex Cloud ↔ Fly.io (12 Hermes agents)
 *   Hermes calls back via POST /hermes-callback (HMAC-signed)
 *
 *   ┌─────────┐     ┌──────────────┐     ┌─────────────┐
 *   │ agents  │────→│ agentStatus  │     │ users       │
 *   └────┬────┘     └──────────────┘     └─────────────┘
 *        │ owns
 *   ┌────▼────┐     ┌──────────────┐
 *   │  tasks  │────→│  task_runs   │
 *   └──┬───┬──┘     └──────────────┘
 *      │   │ delegates
 *      │ ┌─▼───────────┐
 *      │ │ delegations  │
 *      │ └─────────────┘
 *      │ requests
 *   ┌──▼──────────┐
 *   │  approvals  │
 *   └─────────────┘
 *   ┌──────────────┐     ┌──────────────┐
 *   │thread_entries│     │   events     │
 *   └──────────────┘     └──────────────┘
 */
export default defineSchema({
  /**
   * Projects — the top-level container for work.
   * Each project follows Bumwad phases:
   *   research → schematic → design_dev → refinement → construction → complete
   *
   * gstack skills produce plans in Claude Code (your laptop).
   * Plans get stored here. Hermes agents read them and create tasks.
   *
   *   /office-hours      → research phase    → designDoc
   *   /plan-ceo-review   → schematic phase   → ceoPlan
   *   /plan-eng-review   → design_dev phase  → engPlan
   *   /plan-design-review → design_dev phase → designPlan
   *   Hermes agents      → construction      → tasks under this project
   */
  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    phase: v.string(), // research|schematic|design_dev|refinement|construction|complete
    createdBy: v.string(), // tokenIdentifier
    budgetCents: v.optional(v.number()),
    spentCents: v.number(),
    // Plan artifacts from gstack reviews (stored as markdown)
    designDoc: v.optional(v.string()),   // from /office-hours
    ceoPlan: v.optional(v.string()),     // from /plan-ceo-review
    engPlan: v.optional(v.string()),     // from /plan-eng-review
    designPlan: v.optional(v.string()),  // from /plan-design-review
  })
    .index("by_slug", ["slug"])
    .index("by_phase", ["phase"]),

  /**
   * Agent profiles — stable config data.
   * One row per agent (12 total). Seed on first deploy.
   */
  agents: defineTable({
    name: v.string(),
    hermesProfileId: v.string(),
    description: v.string(),
    role: v.string(), // "strategic" | "execution"
    reportsTo: v.optional(v.id("agents")),
    model: v.string(), // OpenRouter model string, e.g. "anthropic/claude-sonnet-4-20250514"
    soulMarkdown: v.optional(v.string()), // full SOUL.md content, editable from dashboard
    allowedTools: v.array(v.string()),
    delegationPermissions: v.array(v.id("agents")),
    maxDailyBudgetCents: v.number(),
    maxConcurrentTasks: v.number(),
    defaultTimeoutMinutes: v.number(),
  }).index("by_hermesProfileId", ["hermesProfileId"]),

  /**
   * Agent status — HIGH CHURN, separated from agents table.
   * Updated by heartbeat cron every ~2 min (staggered across 12 agents).
   * Convex guideline: separate high-churn operational data from stable config.
   */
  agentStatus: defineTable({
    agentId: v.id("agents"),
    status: v.string(), // "online" | "offline" | "error"
    lastHeartbeatAt: v.number(),
    currentTaskCount: v.number(),
    dailySpendCents: v.number(),
    errorMessage: v.optional(v.string()),
  }).index("by_agentId", ["agentId"]),

  /**
   * Tasks — the core work unit.
   *
   * State machine (enforced in convex/lib/stateMachine.ts):
   *   queued → running → completed | failed | waiting_approval
   *   waiting_approval → completed | failed | cancelled (+ 60min expiry)
   *   failed → queued (retry, 1x only)
   *   completed, cancelled → terminal (no transitions out)
   *   cancelled ← any non-terminal state
   */
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    createdBy: v.string(), // tokenIdentifier or "agent:{agentId}"
    ownerAgentId: v.id("agents"),
    projectId: v.optional(v.id("projects")), // tasks belong to a project
    status: v.string(), // queued|running|waiting_approval|completed|failed|cancelled
    priority: v.string(), // low|normal|high|urgent
    budgetCents: v.optional(v.number()),
    spentCents: v.number(),
    parentTaskId: v.optional(v.id("tasks")),
    threadId: v.string(),
    retryCount: v.number(), // 0 = first attempt, 1 = retried (max)
    skillHint: v.optional(v.string()), // e.g. "hackathon-brainstorm" — tells agent which skill to use
    resultSummary: v.optional(v.string()),
    resultFull: v.optional(v.string()), // full deliverable document (not truncated)
    errorMessage: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_status_and_priority", ["status", "priority"])
    .index("by_ownerAgentId", ["ownerAgentId"])
    .index("by_projectId", ["projectId"])
    .index("by_parentTaskId", ["parentTaskId"])
    .index("by_threadId", ["threadId"]),

  /**
   * Task runs — individual execution attempts.
   * A task may have 1-2 runs (original + 1 retry).
   */
  taskRuns: defineTable({
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    status: v.string(), // running|succeeded|failed|cancelled
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    tokenUsage: v.optional(v.string()), // JSON: {input, output}
    costCents: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    resultPayload: v.optional(v.string()), // JSON: full Hermes response
    hmacVerified: v.boolean(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_agentId", ["agentId"])
    .index("by_status", ["status"])
    .index("by_status_and_startedAt", ["status", "startedAt"]),

  /**
   * Delegations — tracks who delegated to whom and why.
   */
  delegations: defineTable({
    parentTaskId: v.id("tasks"),
    childTaskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    toAgentId: v.id("agents"),
    reason: v.string(),
  })
    .index("by_parentTaskId", ["parentTaskId"])
    .index("by_childTaskId", ["childTaskId"]),

  /**
   * Events — append-only audit log.
   * Feeds the real-time activity feed in the dashboard.
   */
  events: defineTable({
    taskId: v.optional(v.id("tasks")),
    agentId: v.optional(v.id("agents")),
    type: v.string(), // task.created|task.delegated|task.run.started|approval.requested|approval.granted|budget.exceeded|...
    payload: v.string(), // JSON: event-specific data
  })
    .index("by_taskId", ["taskId"])
    .index("by_type", ["type"]),

  /**
   * Approvals — pending/resolved approval requests.
   * Displayed as floating overlay cards in the dashboard (max 3 visible).
   * Expire after 60 minutes (heartbeat cron checks expiresAt).
   */
  approvals: defineTable({
    taskId: v.id("tasks"),
    requestedByAgentId: v.id("agents"),
    reason: v.string(),
    status: v.string(), // pending|approved|rejected
    decidedByTokenIdentifier: v.optional(v.string()),
    decisionReason: v.optional(v.string()),
    expiresAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_status", ["status"]),

  /**
   * Thread entries — individual knowledge entries (second brain).
   * NOT stored as arrays in a single doc (Convex 1MB limit).
   * Searchable via Cmd+K command palette (Convex search index).
   */
  threadEntries: defineTable({
    threadId: v.string(),
    agentId: v.optional(v.id("agents")),
    type: v.string(), // decision|artifact|constraint|finding|handoff
    content: v.string(),
    metadata: v.optional(v.string()), // JSON: type-specific metadata
  })
    .index("by_threadId", ["threadId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["threadId"],
    }),

  /**
   * Users — linked to Clerk via tokenIdentifier.
   * RBAC: "owner" can approve/create/change, "viewer" can only view.
   */
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    role: v.string(), // "owner" | "viewer"
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  /**
   * Project sources — NotebookLM-style reference library.
   * Text notes, uploaded files, and URLs that agents pull from.
   */
  projectSources: defineTable({
    projectId: v.id("projects"),
    type: v.string(), // "text" | "file" | "url"
    name: v.string(),
    content: v.optional(v.string()),          // for text type
    storageId: v.optional(v.id("_storage")),  // for file type
    url: v.optional(v.string()),              // for url type
    mimeType: v.optional(v.string()),
  })
    .index("by_projectId", ["projectId"]),

  /**
   * Cached OpenRouter model list.
   * Refreshed daily. Dashboard reads from here, not from OpenRouter API.
   */
  modelCache: defineTable({
    modelsJson: v.string(),
    count: v.number(),
    fetchedAt: v.number(),
  }),

  /**
   * Chat messages — direct conversations with agents.
   * Like Claude Code sessions but structured and project-scoped.
   * Conversations are grouped by conversationId.
   */
  chatMessages: defineTable({
    conversationId: v.string(),
    agentId: v.id("agents"),
    projectId: v.optional(v.id("projects")),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_agentId", ["agentId"]),

  /**
   * Documents — deliverables produced by agents.
   * The primary output of the Goal-First workspace.
   * Auto-saved when a task completes with resultFull (via applyCallbackResult).
   * Users review, reclassify, and "Copy for Claude Code" from the home page.
   *
   *   Goal input → CEO delegation → Hermes agent work → callback → document auto-saved
   *   User reviews → clicks "Copy for Claude Code" → pastes in terminal → builds
   */
  documents: defineTable({
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    type: v.union(
      v.literal("case_study"),
      v.literal("social_post"),
      v.literal("prd"),
      v.literal("design_doc"),
      v.literal("research"),
      v.literal("other"),
    ),
    title: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("done"),
      v.literal("handed_off"),
    ),
    createdByAgent: v.optional(v.id("agents")),
    createdByUser: v.optional(v.string()), // Clerk tokenIdentifier
  })
    .index("by_projectId", ["projectId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_taskId", ["taskId"]),
});
