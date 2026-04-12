# Studio Dashboard v2 — Design Document

**Date:** 2026-04-09
**Author:** Tarik Moody + Claude
**Status:** Approved

## Summary

Transform the single-page studio dashboard into a hybrid-routed control room with Kanban task visualization, agent soul editor, enhanced project creation with NotebookLM-style sources, and a public portfolio page.

## Routing Architecture

Hybrid approach: App Router for top-level sections, client-side switching for sub-views within each section.

```
src/app/
  layout.tsx              ← existing (Clerk + Convex providers)
  (dashboard)/
    layout.tsx            ← NEW: sidebar + header chrome, auth gate, project context
    page.tsx              ← Overview (OrgChart, KpiRow, ActivityFeed, CostDashboard)
    agents/
      page.tsx            ← Agent grid + client-side editor panel
    tasks/
      page.tsx            ← Kanban board
    settings/
      page.tsx            ← Settings (placeholder)
  portfolio/
    page.tsx              ← Public project showcase (no auth, stretch goal)
```

The `(dashboard)` route group wraps sidebar layout without adding a URL segment. Sidebar nav items become `<Link>` elements with active state from `usePathname()`. Project selection stays client-side via React context, shared across all dashboard views.

## Kanban Board (`/tasks`)

Five columns matching the task state machine:

| Queued | Running | Waiting Approval | Completed | Failed |

**Card density (medium):**
- Title (bold, 2-line truncate)
- Agent name + colored status dot
- Priority badge pill (low/normal/high/urgent)
- Time elapsed ("running 12m")
- Cost ("$0.03")

**Behavior:**
- No drag-and-drop — tasks move via state machine (agent actions, approvals, retries)
- Column headers show count: "Running (4)"
- Waiting Approval column header pulses when cards present
- Click card opens detail panel (right side): description, thread entries, run history, cost, action buttons (cancel, retry)
- Sidebar project selection filters the board. "All projects" shows the full swarm across parallel projects.

## Agent Editor (`/agents`)

Two client-side states:

**Grid view (default):** Existing OrgChart layout (CEO → leads → ICs). Click card to open editor.

**Editor panel:** Grid slides left (compressed nav list), editor slides in from right (~60% width).

Three tabs:

**Soul tab:**
- Textarea with agent's SOUL.md content (new `soulMarkdown` field on agents table)
- Save on blur or Cmd+S
- Markdown preview toggle

**Skills tab:**
- List of `allowedTools` array
- Add/remove with searchable dropdown
- Bumwad phase labels per skill

**Config tab:**
- Model picker (relocated from OrgChart card)
- `maxDailyBudgetCents` input
- `maxConcurrentTasks` input
- `defaultTimeoutMinutes` input
- `delegationPermissions` multi-select
- `reportsTo` dropdown

All edits via Convex mutations with owner RBAC.

## Enhanced Create Project Modal

Centered modal overlay (replaces sidebar inline form). Triggered by "+ New" in sidebar.

**Fields:**
- Name (required)
- Description (textarea, 3 lines, required)
- Starting phase (dropdown, default "Research")
- Budget (dollar input → cents)
- Assigned agents (multi-select checkboxes, default CEO)

**Sources section (NotebookLM-style):**
- Text paste — add research notes, briefs. Stored as `threadEntry` type `"finding"`
- File drop zone — `.md`, `.pdf`, `.png`, `.jpg`, `.txt`. Stored in Convex file storage. Tracked in new `projectSources` table
- URL input — paste links as reference sources for agents

Sources persist on the project detail view. Add context anytime as project progresses through Bumwad phases. This is the project's reference library that agents pull from.

## Schema Additions

```typescript
// New field on agents table
soulMarkdown: v.optional(v.string()),

// New table
projectSources: defineTable({
  projectId: v.id("projects"),
  type: v.string(),         // "text" | "file" | "url"
  name: v.string(),
  content: v.optional(v.string()),    // for text type
  storageId: v.optional(v.id("_storage")),  // for file type
  url: v.optional(v.string()),        // for url type
  mimeType: v.optional(v.string()),
})
  .index("by_projectId", ["projectId"])
```

## Agent Team (12 Profiles)

**Strategic (report to CEO):**
| Name | Role | Bumwad Phases |
|------|------|---------------|
| CEO | Strategic lead | All phases |
| CTO | Technical architecture | schematic, design_dev, construction |
| Creative Director | Visual direction, brand | schematic, design_dev, refinement |
| Head of Content | Editorial strategy | research, refinement |
| Head of Product | Roadmaps, user research | research, schematic |

**Execution:**
| Name | Role | Bumwad Phases |
|------|------|---------------|
| Frontend Engineer | React/Next.js | construction |
| Backend Engineer | Convex, APIs | construction |
| Designer | UI mockups | design_dev, refinement |
| Content Writer | Blog, social, docs | construction, refinement |
| Social Media Manager | LinkedIn, X, IG (Blotato) | refinement, complete |
| QA Engineer | Testing, a11y | construction, refinement |
| DevOps Engineer | Deploy, monitoring | construction |

## Public Portfolio (`/portfolio`) — Stretch

No-auth page showing active projects. Displays: project name, description, current Bumwad phase, agent count working on it. Public window into what the studio is building.

## Implementation Order

1. Schema additions (`soulMarkdown`, `projectSources`)
2. Routing scaffold (dashboard layout group, 4 routes)
3. Kanban board (`/tasks`)
4. Agent editor (`/agents`)
5. Enhanced create project modal + sources
6. 12 agent soul files + seed update
7. Public portfolio page (stretch)
8. Vercel deploy
