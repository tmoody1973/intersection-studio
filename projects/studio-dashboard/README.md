# Studio Dashboard

> Intersection Studio Control Room -- 12 AI agents managed through a reactive dashboard.

## What This Is

A product architect's command center. 12 Hermes Agent profiles running on Fly.io, wrapped in a Next.js + Convex + Clerk control plane. You delegate work to AI agents, they execute, you approve results. Every decision becomes institutional memory.

Built for [Tarik Moody](https://tarikmoody.com)'s AfroTech 2026 talk: "Your Expertise Is the New Code."

## Stack

- **Frontend:** Next.js 16, React 19, Satoshi + Cabinet Grotesk fonts
- **Backend:** Convex (9 tables, real-time subscriptions, crons)
- **Auth:** Clerk (JWT, RBAC with owner/viewer roles)
- **Agents:** Hermes Agent on Fly.io (12 profiles, OpenRouter LLM routing)
- **Social:** Blotato API for publishing
- **Tests:** Vitest (51 tests)

## Architecture

```
YOUR BROWSER                     FLY.IO (Chicago)
+------------------------+       +---------------------------+
|                        |       |  Routing Proxy (:3000)    |
|  Next.js Dashboard     |       |    -> 12 Hermes gateways  |
|  (Vercel)              |       |                           |
|                        | HTTP  |  CEO (:8650) -> Sonnet    |
|  Convex Client --------+-----> |  Creative -> Sonnet       |
|  Clerk Auth            |       |  Eng Lead -> Sonnet       |
|                        |       |  ...8 more agents         |
+------------------------+       |                           |
                                 |  OpenRouter (one API key) |
CONVEX CLOUD                     +---------------------------+
+-------------------------------------------+
| agents, agentStatus, tasks, taskRuns,     |
| delegations, events, approvals,           |
| threadEntries, users                      |
|                                           |
| Fire-and-callback: Convex action fires    |
| HTTP to Fly.io, Hermes calls back via     |
| HMAC-signed POST to /hermes-callback      |
+-------------------------------------------+
```

## Dashboard Features

- **Org Chart** -- 12 agents in hierarchy with status dots (online/offline/error)
- **Model Picker** -- swap any agent's LLM at runtime (5 models via OpenRouter)
- **Approval Overlay** -- floating cards slide up from bottom-right, max 3 visible
- **Activity Feed** -- real-time log of agent actions with slide-in animations
- **Cost Tracker** -- today/month/projected spend, budget bar, per-agent breakdown
- **Command Palette** -- Cmd+K to search threads ("what did we decide about...")
- **Presentation Mode** -- high-contrast light theme for projectors, larger text

## Running Locally

```bash
cd projects/studio-dashboard
npm install
cp .env.local.example .env.local
# Add your Clerk + Convex keys to .env.local
npm run dev
```

Open http://localhost:3000

## Environment Variables

```
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Convex env vars (set via `npx convex env set`):
```
HERMES_API_URL=https://intersection-studio.fly.dev
STUDIO_API_KEY=your-fly-io-studio-key
HERMES_CALLBACK_SECRET=your-hmac-secret
BLOTATO_API_KEY=your-blotato-key
```

## Deploying Hermes to Fly.io

```bash
cd deploy

# Create app + storage
fly apps create intersection-studio
fly volumes create hermes_studio_data --region ord --size 5 -a intersection-studio

# Set secrets
fly secrets set OPENROUTER_API_KEY="sk-or-v1-..." -a intersection-studio
fly secrets set STUDIO_API_KEY="your-studio-key" -a intersection-studio

# Deploy
fly deploy -a intersection-studio

# Verify
curl -H "Authorization: Bearer your-studio-key" \
  https://intersection-studio.fly.dev/health
```

## Tests

```bash
npm test        # 51 tests
npm run test:watch  # watch mode
```

## Task State Machine

```
queued -> running -> completed
                  -> failed (auto-retry 1x for transient errors)
                  -> waiting_approval -> completed (approved)
                                      -> failed (rejected or expired 60min)
cancelled <- any non-terminal state
```

## Project Structure

```
convex/
  schema.ts          9 tables with indexes + search index
  tasks.ts           createTask (public) + dispatchTask (internal)
  callbacks.ts       HMAC verify (action) + apply result (mutation)
  agents.ts          listWithStatus, updateModel
  approvals.ts       listPending, resolve (guarded)
  events.ts          listRecent (activity feed)
  costs.ts           breakdown (per-agent cost tracking)
  threads.ts         search (full-text, Cmd+K)
  heartbeat.ts       health checks, timeout enforcement, approval expiry
  crons.ts           heartbeat (2min) + daily spend reset
  blotato.ts         social media publishing via Blotato API
  seed.ts            12 agent profiles with org hierarchy
  users.ts           ensureUser + currentUser (RBAC)
  http.ts            /hermes-callback endpoint
  lib/
    stateMachine.ts  validateTransition + shouldRetry
    hmac.ts          Web Crypto HMAC-SHA256 verification
    delegation.ts    circular delegation detection

src/
  app/
    layout.tsx       Clerk + Convex providers
    page.tsx         Dashboard home
    globals.css      Design system + 3 animations
  components/
    dashboard/       OrgChart, KpiRow, ActivityFeed, ApprovalOverlay,
                     CommandPalette, CostDashboard, PresentationToggle
    layout/          Sidebar
    providers/       ConvexClientProvider

deploy/              Fly.io deployment files
test/                Mock Hermes server + integration tests
```
