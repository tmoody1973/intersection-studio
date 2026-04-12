# How to Use Intersection Studio Dashboard

A guide for operating your 12-agent AI company.

---

## Quick Start

1. Open the dashboard: `http://localhost:3000` (dev) or your Vercel URL (production)
2. Sign in with Clerk
3. Create a project
4. Create a task and assign it to an agent
5. Watch the Kanban board update in real-time

---

## 1. Projects

Projects are the top-level containers for work. Every project follows the
**Bumwad methodology** (architectural design phases):

```
Research → Schematic → Design Dev → Refinement → Construction → Complete
```

### Creating a Project

1. Click **+ New** in the sidebar under "Projects"
2. Fill in the modal:
   - **Name** — the project name (e.g., "MKE Dashboard v2")
   - **Description** — what the project is about
   - **Starting Phase** — defaults to Research (select later phase for imports)
   - **Budget** — optional monthly budget cap in dollars
   - **Assigned Agents** — which agents work on this project (CEO selected by default)
3. **Add Sources** — this is the project's reference library:
   - **Text** tab: paste research notes, briefs, domain knowledge
   - **URL** tab: add links to reference material, competitor sites, API docs
   - **File** tab: upload .md, .pdf, .png, .jpg, .txt, .csv files
4. Click **Create Project**

Sources become context that agents read when working on tasks. The more
context you provide upfront, the better the agents perform.

### Project in the Sidebar

- Click a project to filter all views (Kanban, Overview) to that project
- Click "All projects" to see everything
- Each project shows its Bumwad phase badge and task completion count

---

## 2. Tasks

Tasks are the work units that agents execute. Each task belongs to a project
and is assigned to one agent.

### Creating a Task

1. Go to the **Tasks** page (click "Tasks" in sidebar)
2. Click **+ New Task** (top right)
3. Fill in the modal:
   - **Task Title** — what the agent should do
   - **Description** — detailed instructions (the more specific, the better)
   - **Project** — which project this belongs to
   - **Assign To** — which agent handles it
   - **Priority** — Low, Normal, High, or Urgent
4. Click **Create Task**

The task immediately appears in the **Queued** column and gets dispatched
to the agent on Fly.io.

### What Happens After You Create a Task

```
Queued → Running → Completed (or Failed, or Waiting Approval)
```

1. **Queued**: Task created, waiting for dispatch
2. **Running**: Agent is working — may use web search, run commands, read files
3. **Completed**: Agent finished, result stored in the thread
4. **Failed**: Something went wrong — you can retry (1 retry allowed)
5. **Waiting Approval**: Agent needs your OK before proceeding

### Writing Good Task Descriptions

**Good:** "Research the Census API for Milwaukee neighborhood-level demographic
data. Find endpoints for population, income, and housing. Include rate limits
and pricing."

**Bad:** "Look into census data"

Be specific. Include what you want in the output. Name specific data sources,
APIs, or deliverables.

### Task Detail Panel

Click any task card to open the detail panel on the right:
- **Description** — the full task instructions
- **Agent** — who's working on it
- **Status/Priority/Retries** — task metadata
- **Error** — if failed, what went wrong
- **Result** — the agent's output
- **Thread** — all findings, decisions, and artifacts for this project
- **Runs** — execution history with timing and cost
- **Cancel** — stop a running task
- **Retry** — re-queue a failed task (max 1 retry)

---

## 3. Agents

The 12-agent team runs on Fly.io. Each has a soul (personality), tools
(capabilities), and a role in the hierarchy.

### The Org Chart

```
                    CEO
         ┌──────────┼──────────┐──────────┐
   Creative Dir  Eng Lead  Content Lead  PM
   ├─Designer    ├─Frontend  ├─Writer    ├─QA
   └─Social      └─Backend   └─(Social)  └─Data
```

**Strategic agents** (leads) delegate to execution agents.
**Execution agents** (ICs) do the actual work.

### Agent Editor

1. Go to the **Agents** page
2. Click any agent card to open the editor panel
3. Three tabs:

**Soul tab** — edit the agent's personality and instructions
- This is the agent's SOUL.md — who they are, how they behave
- Edit directly in the textarea
- Save with **Cmd+S** or click Save
- Toggle **Preview** to see formatted output

**Skills tab** — manage the agent's allowed tools
- Add skills by typing and clicking Add
- Remove skills by clicking the x on each tag
- Skills map to Hermes toolsets and custom capabilities

**Config tab** — operational settings
- **Model** — which LLM the agent uses (Claude Sonnet 4, Llama 3.3, etc.)
- **Daily Budget** — max spend per day in dollars
- **Max Concurrent Tasks** — how many tasks at once
- **Timeout** — how long before a task times out (minutes)
- **Reports To** — who this agent reports to in the hierarchy
- **Can Delegate To** — which agents this one can assign work to

---

## 4. Approvals

When an agent needs your sign-off (budget decisions, content publishing,
architecture changes), an approval card appears as a floating overlay in
the bottom-right corner of the dashboard.

- **Max 3 visible** at once ("+N more" badge if overflow)
- **60-minute expiry** — if you don't respond, the task fails
- Click **Approve** or **Reject**
- Approved tasks continue; rejected tasks fail with your reason

---

## 5. Command Palette (Cmd+K)

Press **Cmd+K** (or Ctrl+K) anywhere in the dashboard to search the
**second brain** — all thread entries across all projects.

Type a question like "what did we decide about the auth system?" and it
searches across all agent findings, decisions, and artifacts.

---

## 6. Presentation Mode

Click the **Present** button (top right, next to your avatar) to switch
to high-contrast mode optimized for projectors. Good for demos and the
AfroTech talk.

---

## 7. The Activity Feed

On the Overview page, the Activity Feed shows real-time events:
- Task created, started, completed, failed
- Approvals requested, granted, rejected, expired
- Agent model changes
- **Tool usage** — when agents use web search, terminal, file operations
- Progress reports from agents mid-task

---

## 8. Cost Tracking

The Cost Dashboard on the Overview page shows:
- **Today's spend** across all agents
- **Monthly spend** vs. budget
- **Projected monthly** at current pace
- **Per-agent breakdown** — who's spending what

Budget is tracked per agent (daily cap) and per project.

---

## How Agents Use Tools

Each agent has specific Hermes toolsets enabled:

| Agent | Can Do |
|-------|--------|
| CEO | Web search, delegate to leads, manage todos |
| Engineering Lead | Web search, run terminal commands, read/write files, delegate |
| Creative Director | Web search, analyze images, delegate |
| Content Lead | Web search, delegate |
| Project Manager | Web search, schedule cron jobs, manage todos, delegate |
| Frontend Dev | Run terminal, read/write files |
| Backend Dev | Run terminal, read/write files |
| Visual Designer | Web search, analyze images |
| Content Writer | Web search |
| Social Media | Web search |
| QA Reviewer | Web search, run terminal, browse websites |
| Data Analyst | Web search, run terminal |

All agents also have: **memory** (persistent learning), **skills** (methodology),
and **studio tools** (read project sources, request approval, report progress).

---

## Bumwad Skills

Agents can invoke methodology skills as slash commands:

| Skill | Phase | What It Does |
|-------|-------|-------------|
| `/research-brief` | Research | Domain exploration, competitive analysis |
| `/schematic-review` | Schematic | CEO review of rough concept |
| `/design-development` | Design Dev | Detailed specs, PRDs, schema |
| `/eng-review` | Design Dev | 7-pass engineering review |
| `/construction-handoff` | Construction | Produce Claude Code-ready specs |
| `/linkedin-post` | Any | Draft post in Tarik's voice |
| `/case-study` | Complete | Write product case study |
| `/cost-report` | Any | Agent cost analysis |
| `/status-report` | Any | Weekly rollup |

---

## Typical Workflow

### Starting a New Product

1. **Create project** with starting phase "Research"
2. **Add sources** — paste domain notes, competitor URLs, relevant docs
3. **Create task**: assign CEO → "Run /research-brief for this project"
4. CEO produces research brief → appears in thread + Kanban
5. **Advance phase** to Schematic
6. **Create task**: CEO → "Run /schematic-review based on the research"
7. CEO produces concept + architecture sketch → may request approval
8. **Advance phase** to Design Dev
9. **Create task**: Engineering Lead → "Run /design-development"
10. **Create task**: Engineering Lead → "Run /eng-review"
11. If CLEAR → **advance** to Construction
12. **Create task**: Engineering Lead → "Run /construction-handoff"
13. Take the PLAN.md output → hand to Claude Code to build

### Delegated Work

When you assign a task to the CEO, the CEO can delegate to leads:
- "Have Engineering Lead design the API schema"
- "Have Content Writer draft a LinkedIn post about this"

Delegated tasks appear as child tasks on the Kanban board. The delegation
chain is tracked and circular delegation is blocked.

### Parallel Projects

The system handles multiple projects simultaneously. Select "All projects"
in the sidebar to see every agent working across every project on the
Kanban board. Each project maintains its own thread (institutional memory)
so agents don't mix context between projects.

---

## Tips

- **Be specific** in task descriptions — agents work better with clear instructions
- **Add sources** before creating tasks — context makes agents smarter
- **Watch the Activity Feed** — see what tools agents are using in real-time
- **Check costs** regularly — adjust models (Claude vs Llama) to optimize spend
- **Use the Command Palette** (Cmd+K) to search across all project knowledge
- **Approve quickly** — approvals expire after 60 minutes
- **One project = one thread** — all tasks in a project share context

---

## Troubleshooting

### Agent shows "offline"
The heartbeat cron checks every 2 minutes. If an agent stays offline:
- Check Fly.io logs: `fly logs -a intersection-studio`
- Restart: `fly machine restart <machine-id> -a intersection-studio`

### Task stuck in "running"
Timeout enforcement runs every 2 minutes. If a task exceeds the agent's
`defaultTimeoutMinutes`, it's auto-failed and retried (if first attempt).

### Approval expired
Approvals expire after 60 minutes. The task fails with "Approval expired."
You can retry the task to trigger a new approval request.

### Agent not using tools
Check the agent's toolset config in the Config tab. Make sure the relevant
tools are enabled. Changes require a redeploy to take effect on Fly.io.

### Cost spike
Check the per-agent breakdown in Cost Dashboard. Switch expensive agents
from Claude to Llama for routine tasks. Adjust daily budget caps in Config.
