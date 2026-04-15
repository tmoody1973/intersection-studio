# Studio Dashboard

> Intersection Studio's collaborative intelligence workspace. Type a goal, watch AI agents think in real-time, steer mid-task, get a deliverable. Copy it into Claude Code to build.

**Live:** [studio-dashboard-eta.vercel.app](https://studio-dashboard-eta.vercel.app)
**Agents:** [intersection-mastra.fly.dev/health](https://intersection-mastra.fly.dev/health)

## What This Is

A product architect's workspace for running a 20-product studio with AI agents. Type a goal ("research the competitive landscape for DJ tools"), enter Co-Work Mode, and collaborate with the CEO agent in real-time. Watch it think, query the institutional brain, delegate to specialists, and produce a document... all streaming in front of you. Steer at any point. Copy the deliverable into Claude Code for construction.

5 Mastra agents on Fly.io (CEO supervisor + Researcher, Writer, Social Media, Data Analyst), connected to a Neon pgvector brain with 3,747 pages of institutional knowledge. CopilotKit + AG-UI protocol for real-time streaming. Convex for persistence and real-time subscriptions.

The dashboard is the Architecture Firm. Claude Code is the General Contractor.

Built for [Tarik Moody](https://tarikmoody.com)'s AfroTech 2026 talk: "Your Expertise Is the New Code."

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, CopilotKit (AG-UI protocol) |
| Backend | Convex (15 tables, real-time subscriptions, crons) |
| Auth | Clerk (JWT, RBAC with owner/viewer roles) |
| Agents | [Mastra](https://mastra.ai) on Fly.io (5 agents, supervisor pattern, OpenRouter) |
| Brain | Neon pgvector (institutional knowledge, 3,747 pages) |
| Deploy | Vercel (dashboard) + Fly.io (agents) |

## Architecture

```
YOUR BROWSER                         FLY.IO (Mastra Server)
┌────────────────────────────────┐   ┌──────────────────────────────┐
│                                │   │                              │
│  Next.js Dashboard (Vercel)    │   │  /chat (CopilotKit/AG-UI)   │
│                                │   │    CEO Agent (Sonnet)        │
│  Co-Work Mode (/tasks/[id]/    │   │      ├→ Researcher          │
│    cowork)                     │   │      ├→ Writer               │
│    ├ CopilotChat (40%)         │   │      ├→ Social Media         │
│    │  Agent thinking           │   │      └→ Data Analyst         │
│    │  Brain cards              │   │                              │
│    │  Delegation viz           │   │  /api/agents/ceo/generate    │
│    │  Steering input           │   │    (background execution)    │
│    ├ ArtifactPanel (60%)       │   │                              │
│    │  Document forming live    │   │  Brain tools (Neon pgvector) │
│    │  Copy for Claude Code     │   │  Bearer token auth           │
│    └ Timeline (Phase 3)        │   │                              │
│                                │   └──────────────┬───────────────┘
│  Home (/) — Goal input         │                  │ callback
│    → Co-Work Mode              │                  │ (safety net)
│    → or background dispatch    │                  │
│                                │                  ▼
└──────────┬─────────────────────┘   
           │ persist                 CONVEX CLOUD
           ▼                         ┌──────────────────────────────┐
                                     │ tasks, taskRuns, agents,     │
                                     │ agentStatus, documents,      │
                                     │ sessionEvents, events,       │
                                     │ projects, projectSources,    │
                                     │ threadEntries, approvals,    │
                                     │ delegations, users,          │
                                     │ chatMessages, modelCache,    │
                                     │ agentStream (deprecated)     │
                                     └──────────────────────────────┘
```

### Dual Execution Paths

**Interactive (Co-Work Mode):** CopilotKit connects to Mastra via AG-UI. Agent thinking streams in real-time. User steers mid-task. Frontend persists deliverable on completion. Mastra callback provides safety net persistence (survives tab close).

**Background (dispatchTask):** Convex action POSTs to Mastra `/api/agents/ceo/generate`. Agent runs autonomously. Callback returns result to Convex. Used for scheduled tasks and non-interactive execution.

## Dashboard Pages

### Home (`/`) — Goal-First Workspace
- Hero goal input: "What do you want to work on?"
- Submitting a goal creates a task and navigates to Co-Work Mode
- Recent documents with type badges and "Copy for Claude Code"
- Quick action buttons: Research, Write, Social, Analyze

### Co-Work Mode (`/tasks/[id]/cowork`) — Collaborative Workspace
- **Split view:** CopilotChat (40%) + ArtifactPanel (60%)
- Agent thinking, brain cards, delegation visualization in the chat panel
- Document forms live in the artifact panel
- Mid-task steering: type "focus on pricing" and the agent adjusts
- Cost ticker: live token/cost counter
- Smart "Copy for Claude Code": structured prompt with task context + reasoning + deliverable
- **Replay mode:** completed tasks show a read-only timeline of the session
- **Responsive:** stacks on mobile (<768px)

### Tasks (`/tasks`) — Task Board
- Queued, Running, Waiting Approval, Completed, Failed columns
- Task cards with agent, priority, elapsed time, cost
- Click for detail panel with thread, run history, result

### Projects (`/projects`) — Bumwad Methodology
- Projects follow phases: Research → Schematic → Design Dev → Refinement → Construction → Complete
- NotebookLM-style source library per project
- Institutional memory via thread entries

### Team (`/team`) — Agent Profiles
- Agent org chart (CEO → specialists)
- Status, current tasks, daily spend per agent

### Brain (`/brain`) — Institutional Knowledge
- Search across 3,747 pages of studio knowledge
- Neon pgvector semantic search via Convex action

## Task Lifecycle

```
create goal (home)
      │
      ├──── interactive ────→ Co-Work Mode ──→ streaming ──→ steer ──→ complete
      │     (navigate)         (CopilotKit)     (AG-UI)                  │
      │                                                            save deliverable
      │                                                          (frontend + callback)
      │
      └──── background ─────→ dispatchTask ──→ Mastra ──→ callback ──→ complete
            (scheduled)
```

## Running Locally

```bash
cd projects/studio-dashboard
npm install
cp .env.local.example .env.local
# Add Clerk + Convex + Mastra keys to .env.local
npx convex dev    # Start Convex backend
npm run dev       # Start Next.js on :3000
```

## Environment Variables

### Next.js (.env.local)

| Variable | Description |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Convex deployment identifier |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `NEXT_PUBLIC_MASTRA_URL` | Mastra server URL (default: https://intersection-mastra.fly.dev) |
| `NEXT_PUBLIC_COPILOTKIT_API_KEY` | Bearer token for CopilotKit/AG-UI auth |

### Convex (set via `npx convex env set`)

| Variable | Description |
|----------|-------------|
| `MASTRA_URL` | Fly.io Mastra server URL |

### Fly.io (set via `fly secrets set` in mastra-agents)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | LLM access via OpenRouter |
| `COPILOTKIT_API_KEY` | Bearer token for /chat and /api/* auth |
| `NEON_CONNECTION_STRING` | Neon pgvector brain database |

## Deploying

### Dashboard to Vercel

```bash
vercel --prod
```

### Agents to Fly.io

```bash
cd ../mastra-agents
fly deploy -a intersection-mastra
```

### Verify

```bash
# Agents healthy
curl -s https://intersection-mastra.fly.dev/health | python3 -m json.tool

# CopilotKit route responds
curl -s -X POST https://intersection-mastra.fly.dev/chat \
  -H "Authorization: Bearer $COPILOTKIT_API_KEY" \
  -H "Content-Type: application/json"
```

## Design System

See [DESIGN.md](DESIGN.md) for the full token system: colors, typography, spacing, agent accent colors, responsive breakpoints, and accessibility specs.
