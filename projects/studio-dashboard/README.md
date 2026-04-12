# Studio Dashboard

> Intersection Studio Control Room -- 12 AI agents managed through a reactive dashboard.

**Live:** [studio-dashboard-eta.vercel.app](https://studio-dashboard-eta.vercel.app)
**Agents:** [intersection-studio.fly.dev/health](https://intersection-studio.fly.dev/health)

## What This Is

A product architect's command center. 12 [Hermes Agent](https://github.com/NousResearch/hermes-agent) profiles running on Fly.io, wrapped in a Next.js + Convex + Clerk control plane. You create projects, assign tasks to agents, they research and design using real tools (web search, terminal, file ops), and you approve results. Every decision becomes institutional memory.

Hermes is an open-source autonomous agent framework by [Nous Research](https://nousresearch.com/) with built-in tools, skills, plugins, and memory. See the [Hermes docs](https://hermes-agent.nousresearch.com/docs).

Built for [Tarik Moody](https://tarikmoody.com)'s AfroTech 2026 talk: "Your Expertise Is the New Code."

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Satoshi + Cabinet Grotesk |
| Backend | Convex (11 tables, real-time subscriptions, crons) |
| Auth | Clerk (JWT, RBAC with owner/viewer roles) |
| Agents | [Hermes Agent](https://hermes-agent.nousresearch.com/docs) on Fly.io (12 profiles, OpenRouter) |
| Plugin | studio-dashboard ([plugin docs](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin), bridges Hermes ↔ Convex) |
| Skills | 9 Bumwad methodology skills ([skill docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)) |
| Deploy | Vercel (dashboard) + Fly.io (agents) |

## Architecture

```
YOUR BROWSER                        FLY.IO (Chicago, shared-cpu-4x, 8GB)
┌─────────────────────┐             ┌──────────────────────────────────┐
│                     │             │  Routing Proxy (:3000)           │
│  Next.js Dashboard  │             │    → 12 Hermes gateways         │
│  (Vercel)           │             │                                  │
│                     │  /v1/       │  CEO (:8650)         Sonnet 4   │
│  4 Routes:          │  responses  │  Creative Dir (:8651) Sonnet 4  │
│  / Overview         │ ──────────→ │  Eng Lead (:8652)    Sonnet 4   │
│  /agents Editor     │             │  Content Lead (:8653) Sonnet 4  │
│  /tasks Kanban      │             │  Project Mgr (:8654) Sonnet 4   │
│  /settings          │             │  Visual Des (:8655)  Sonnet 4   │
│                     │             │  Frontend (:8656)    Llama 3.3  │
│  Clerk Auth         │             │  Backend (:8657)     Llama 3.3  │
│  Convex Client      │             │  Writer (:8658)      Llama 3.3  │
└─────────────────────┘             │  Social (:8659)      Llama 3.3  │
                                    │  QA (:8660)          Llama 3.3  │
CONVEX CLOUD                        │  Data (:8661)        Llama 3.3  │
┌────────────────────────────────┐  │                                  │
│ agents, agentStatus, tasks,    │  │  Plugin: studio-dashboard        │
│ taskRuns, projects,            │  │   pre_llm_call → inject context  │
│ projectSources, delegations,   │  │   post_tool_call → log to Convex│
│ events, approvals,             │  │   tools: read_sources, approval, │
│ threadEntries, users,          │  │          report_progress         │
│ modelCache                     │  │                                  │
│                                │  │  Skills: /research-brief,        │
│ /hermes-callback  (HMAC)      │  │   /eng-review, /linkedin-post... │
│ /project-context  (plugin)    │  │                                  │
│ /hermes-tool-log  (plugin)    │  │  OpenRouter (one API key, 200+   │
│ /hermes-progress  (plugin)    │  │   models)                        │
└────────────────────────────────┘  └──────────────────────────────────┘
```

## Dashboard Pages

### Overview (`/`)
- Org chart with 12 agents, live status dots, model picker
- KPI row: active tasks, daily spend, agents online, pending approvals
- Activity feed: real-time log of all agent actions + tool usage
- Cost dashboard: today/month/projected spend, budget bar, per-agent breakdown

### Tasks (`/tasks`) -- Kanban Board
- 5 columns: Queued, Running, Waiting Approval, Completed, Failed
- Medium density cards: title, agent, priority badge, elapsed time, cost
- Click card for detail panel: description, thread, run history, result
- **+ New Task** button to create and dispatch tasks to agents
- Download result as `.md`, export thread for Claude Code handoff
- Archive completed tasks, delete with confirmation
- Filtered by sidebar project selection

### Agents (`/agents`) -- Agent Editor
- Org chart grid (CEO → leads → ICs), click to open editor
- **Soul tab**: edit agent personality (SOUL.md), Cmd+S save, preview toggle
- **Skills tab**: add/remove allowed tools
- **Config tab**: model picker, daily budget, concurrency, timeout, delegation permissions, reporting hierarchy

### Settings (`/settings`)
- Placeholder for future app configuration

## Projects & Sources

Projects follow the Bumwad methodology (Research → Schematic → Design Dev → Refinement → Construction → Complete). Each project has:

- **Sources** -- NotebookLM-style reference library (text, URLs, uploaded files)
- **Thread** -- institutional memory built from agent findings, decisions, artifacts
- **Phase** -- current Bumwad stage, affects which skills agents use

Sources are injected into agent context via the studio-dashboard plugin's `pre_llm_call` hook. Each task in a project shares the same thread, so Agent B sees Agent A's results.

## Hermes Plugin

The `studio-dashboard` [Python plugin](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin) bridges Hermes agents with the Convex backend:

| Component | Purpose |
|-----------|---------|
| `pre_llm_call` hook | Injects project sources + thread context before each LLM turn |
| `post_tool_call` hook | Logs every tool use to the Convex activity feed |
| `on_session_end` hook | Sends completion callback if session ends |
| `read_project_sources` tool | Agents fetch project reference material from Convex |
| `request_approval` tool | Agents request owner approval (60-min expiry) |
| `report_progress` tool | Agents send intermediate findings mid-task |

See [docs/hermes-integration.md](docs/hermes-integration.md) for full integration architecture.

## Bumwad Skills

Methodology encoded as [Hermes skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) (SKILL.md files):

| Skill | Phase | Purpose |
|-------|-------|---------|
| `/research-brief` | Research | Domain exploration, competitive analysis |
| `/schematic-review` | Schematic | CEO review of rough concept |
| `/design-development` | Design Dev | Detailed specs, PRDs, schema design |
| `/eng-review` | Design Dev | 7-pass engineering review protocol |
| `/construction-handoff` | Construction | Produce Claude Code-ready PLAN.md |
| `/linkedin-post` | Any | Draft post in Tarik's voice |
| `/case-study` | Complete | Product retrospective |
| `/cost-report` | Any | Agent cost analysis |
| `/status-report` | Any | Weekly rollup |

## Task Lifecycle

```
         create task
              │
              ▼
           Queued ──── dispatch to Hermes ────→ Running
              │                                    │
              │                              ┌─────┼─────┐
              │                              ▼     ▼     ▼
              │                        Completed  Failed  Waiting
              │                           │        │     Approval
              │                           │     retry    │    │
              │                           │     (1x)  approve reject
              │                           │        │     │     │
              │                        Archive  Queued  Done  Failed
              │
           Cancel ──→ Cancelled ──→ Archive or Delete
```

## Running Locally

```bash
cd projects/studio-dashboard
npm install
cp .env.local.example .env.local
# Add your Clerk + Convex keys to .env.local
npx convex dev    # Start Convex backend
npm run dev       # Start Next.js on :3000
```

## Environment Variables

### Next.js (.env.local)

| Variable | Description |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Convex deployment identifier |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex HTTP endpoint URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |

### Convex (set via `npx convex env set`)

| Variable | Description |
|----------|-------------|
| `HERMES_API_URL` | Fly.io Hermes gateway URL |
| `STUDIO_API_KEY` | Shared auth token (must match Fly.io) |
| `HERMES_CALLBACK_SECRET` | HMAC signing secret (must match Fly.io) |

### Fly.io (set via `fly secrets set`)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | LLM access via OpenRouter |
| `STUDIO_API_KEY` | Shared auth token (must match Convex) |
| `HERMES_CALLBACK_SECRET` | HMAC signing secret (must match Convex) |
| `CONVEX_SITE_URL` | Convex HTTP endpoint for plugin callbacks |

## Deploying

### Dashboard to Vercel

```bash
vercel --prod
```

### Agents to Fly.io

```bash
cd deploy
fly deploy

# Force re-setup (after changing souls, skills, or plugin):
fly ssh console -a intersection-studio -C "rm -f /opt/data/.setup-complete-v2"
fly machine restart <machine-id> -a intersection-studio
```

### Verify

```bash
# All agents online
curl -s https://intersection-studio.fly.dev/health | python3 -m json.tool

# Plugin tools registered
curl -s -X POST https://intersection-studio.fly.dev/v1/chat/completions \
  -H "Authorization: Bearer $STUDIO_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Agent-Profile: ceo" \
  -d '{"model":"hermes-agent","messages":[{"role":"user","content":"List your tools"}]}'
```

## Project Structure

```
convex/
  schema.ts            11 tables with indexes + search index
  tasks.ts             createTask, dispatchTask, listForKanban, cancel, retry, archive, delete
  callbacks.ts         HMAC verify + apply result (state machine)
  agents.ts            listWithStatus, getAgent, updateSoul, updateConfig, updateTools, updateModel
  approvals.ts         listPending, resolve (guarded)
  events.ts            listRecent (activity feed)
  costs.ts             breakdown (per-agent cost tracking)
  threads.ts           search (full-text, Cmd+K)
  projects.ts          list, get, create, advancePhase, storePlan
  projectSources.ts    addText, addUrl, addFile, generateUploadUrl, remove
  pluginEndpoints.ts   getProjectContext, logToolUsage, reportProgress
  heartbeat.ts         health checks, timeout enforcement, approval expiry
  crons.ts             heartbeat (2min), daily spend reset, model refresh
  migrations.ts        populateSouls (one-time)
  seed.ts              12 agent profiles with org hierarchy
  users.ts             ensureUser, currentUser (RBAC)
  http.ts              /hermes-callback, /project-context, /hermes-tool-log, /hermes-progress
  lib/
    stateMachine.ts    validateTransition + shouldRetry
    hmac.ts            Web Crypto HMAC-SHA256 verification
    delegation.ts      circular delegation detection

src/app/
  layout.tsx           Clerk + Convex providers
  globals.css          Design system tokens + animations
  (dashboard)/
    layout.tsx         Sidebar + header + auth gate + project context
    page.tsx           Overview (OrgChart, KpiRow, ActivityFeed, CostDashboard)
    agents/page.tsx    Agent grid + editor panel (Soul, Skills, Config tabs)
    tasks/page.tsx     Kanban board + task detail panel + create task modal
    settings/page.tsx  Settings placeholder

src/components/
  dashboard/           OrgChart, KpiRow, ActivityFeed, ApprovalOverlay,
                       CommandPalette, CostDashboard, PresentationToggle,
                       ProjectList, CreateProjectModal
  layout/              Sidebar (routed with active state)
  providers/           ConvexClientProvider, ProjectContext

deploy/
  fly.toml             Fly.io config (ord, 4x CPU, 8GB RAM)
  Dockerfile           Hermes + Node.js + souls + skills + plugin
  souls/               12 SOUL.md files (one per agent)
  skills/              9 Bumwad methodology + content + ops skills
  plugins/             studio-dashboard Python plugin
  scripts/
    start.sh           Profile setup + plugin install + gateway startup
    proxy.mjs          HTTP routing proxy (port 3000 → 12 gateways)

docs/
  plans/               Design documents
  hermes-integration.md  Full integration architecture
  how-to-use.md        User guide for operating the dashboard
  test-playbook.md     15-test validation playbook
```

## Documentation

- [How to Use](docs/how-to-use.md) -- user guide for the dashboard
- [Hermes Integration](docs/hermes-integration.md) -- plugin, skills, toolsets, API, memory
- [Test Playbook](docs/test-playbook.md) -- 15 tests to validate the full workflow
- [Design Document](docs/plans/2026-04-09-dashboard-v2-design.md) -- v2 design decisions
