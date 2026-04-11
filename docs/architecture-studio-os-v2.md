# Intersection Studio OS v2 — Paperclip + gbrain + Bumwad

**Date:** 2026-04-11
**Context:** The control room (v1) is built and deployed. This doc describes the evolution to a full studio operating system inspired by Paperclip's agent orchestration, Asana's project management, and gbrain's world knowledge.

---

## The Vision

The studio dashboard becomes the operating system for Intersection Studio. Not just a control room for watching agents work. A full project management system where:

- Projects have goals, milestones, timelines, and Bumwad phases
- Tasks have assignees, due dates, subtasks, comments, and dependencies
- The CEO agent breaks goals into tasks and delegates automatically
- gbrain gives every agent access to world knowledge (people, companies, past decisions)
- You manage the studio from one place, like Asana but with AI employees

---

## What We Take from Paperclip

[Paperclip](https://github.com/paperclipai/paperclip) models a zero-human company. We don't want zero-human. We want one human (Tarik) as the principal architect with AI staff. But the structural patterns are right:

| Paperclip Feature | Our Adaptation |
|---|---|
| Goals cascade to tasks | Projects have goals. Tasks inherit project context. |
| Tickets with full ancestry | Tasks carry project + thread + gbrain context |
| Atomic checkout | Task locking already in our state machine |
| Budget enforcement per agent | Already built (daily budget + cost tracking) |
| Approval gates | Already built (floating overlay, 60-min expiry) |
| Org chart delegation | Already built (CEO → leads → ICs) |
| Multi-company | NOT needed. One studio. |
| Heartbeat mechanism | Already built (2-min cron) |

**What we ADD beyond Paperclip:**
- Bumwad methodology phases on projects
- gbrain world knowledge (Paperclip doesn't have this)
- gstack review pipeline (Paperclip doesn't have this)
- Handoff to Claude Code for building (Paperclip uses its own agents)

---

## What We Take from Asana

The project management UX. Not the features list, the mental model: projects contain tasks, tasks have structure, you can see progress at every level.

| PM Feature | Priority | Status |
|---|---|---|
| Projects with phases | P0 | Built (Bumwad phases) |
| Tasks with status | P0 | Built (kanban) |
| Task assignee (agent) | P0 | Built |
| Task priority | P0 | Built |
| Due dates on tasks | P1 | NOT built |
| Subtasks | P1 | Partial (parent_task_id exists for delegation) |
| Milestones within projects | P1 | NOT built |
| Task comments / discussion | P2 | Thread entries serve this role |
| Dependencies between tasks | P2 | NOT built |
| Timeline / Gantt view | P3 | NOT built |
| Recurring tasks | P3 | NOT built |
| Labels / tags | P2 | NOT built |
| Search across all projects | P1 | Cmd+K searches threads, not tasks |

---

## How gbrain Integrates

gbrain is the world knowledge layer. Thread entries are project-scoped memory (what happened on THIS project). gbrain is cross-project, cross-domain knowledge (what you know about the WORLD).

### The Three Memory Layers

```
LAYER 1: SOUL.md (identity)
  "You are the Creative Director for Intersection Studio..."
  Static. Defines who the agent IS.

LAYER 2: Thread entries (project memory)
  "CEO delegated logo direction to Creative Director on 2026-04-08"
  "Creative Director decided on warm tones for BLK Exchange"
  Scoped to one project. Built as agents work.

LAYER 3: gbrain (world knowledge)
  "Pedro Franceschi: co-founder of Stripe, met at YC 2015"
  "Construction firms use Procore for scheduling, Buildertrend for smaller firms"
  "Tarik prefers warm, cultural aesthetics over corporate blue"
  Cross-project. Compounds over time. Searchable.
```

### How Agents Use gbrain

```
BEFORE (current):
  Agent receives task → reads SOUL.md + thin project context → works blind

AFTER (with gbrain):
  Agent receives task "Research construction firm scheduling"
    → Plugin pre_llm_call fires
    → Queries gbrain: "construction firms" "scheduling software" "Tarik's construction contacts"
    → Gets: market landscape, relevant people, past notes, related decisions
    → Agent starts with REAL context, not a blank slate
    → Agent discovers new entities (competitor names, market size)
    → Plugin post_tool_call writes discoveries back to gbrain
    → Next agent on this project inherits that knowledge
```

### gbrain in the Frontend

The dashboard gets a **Knowledge** section (new sidebar nav item):

```
KNOWLEDGE PAGE:
  ┌──────────────────────────────────────────────────────┐
  │  Search: [________________________] [Search]          │
  │                                                       │
  │  RECENT PAGES                    CATEGORIES           │
  │  ┌─────────────────────┐        People (342)          │
  │  │ Pedro Franceschi    │        Companies (128)       │
  │  │ person · Updated 2d │        Concepts (89)         │
  │  ├─────────────────────┤        Products (45)         │
  │  │ Procore             │        Meetings (280)        │
  │  │ company · Updated 1w│        Ideas (67)            │
  │  ├─────────────────────┤                              │
  │  │ Construction Tech   │        BRAIN STATS           │
  │  │ concept · Updated 3d│        951 pages             │
  │  └─────────────────────┘        Last sync: 2 min ago  │
  │                                                       │
  │  PAGE DETAIL (click to expand):                       │
  │  ┌─────────────────────────────────────────────────┐  │
  │  │ # Pedro Franceschi                              │  │
  │  │ type: person | tags: founder, stripe, brazil    │  │
  │  │                                                 │  │
  │  │ [Compiled truth]                                │  │
  │  │ Co-founded Stripe with John Collison. Based in  │  │
  │  │ SF. Known for fast decision-making.             │  │
  │  │                                                 │  │
  │  │ ---                                             │  │
  │  │ - 2015-03-01: Met at Y Combinator              │  │
  │  │ - 2024-11-15: Referenced in Series B discussion │  │
  │  │ - 2025-02-01: Updated after conversation       │  │
  │  └─────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────┘
```

The Cmd+K command palette also searches gbrain (not just threads):
- Type "Pedro" → finds the person page
- Type "construction scheduling" → finds concept pages + related companies
- Type "what do I know about Procore" → semantic search across compiled truths

### gbrain Installation on Fly.io

```bash
# On the Fly.io machine:
hermes skills install garrytan/gbrain

# Or install as npm package alongside Hermes:
npm install -g github:garrytan/gbrain
gbrain init  # creates PGLite database on persistent volume

# Import existing knowledge:
gbrain import /opt/data/brain/

# The plugin queries gbrain before each LLM turn:
gbrain search "construction firm scheduling" --limit 5
```

The studio-dashboard plugin's `pre_llm_call` hook gets updated:

```python
# Current: just project context
context = fetch_project_context(project_id)

# New: project context + world knowledge
context = fetch_project_context(project_id)
world_knowledge = gbrain_search(task_description, limit=5)
context += format_gbrain_results(world_knowledge)
```

---

## Updated Dashboard Pages

```
SIDEBAR:
  Overview        (org chart, KPIs, activity feed, costs)
  Projects        (list with phases, progress, task counts)
  Tasks           (kanban across all projects or filtered)
  Agents          (editor: soul, skills, config)
  Knowledge       (gbrain: search, browse, edit pages)   ← NEW
  Settings        (app config)
```

### Projects Page (enhanced, Asana-like)

```
PROJECTS LIST:
  ┌────────────────────────────────────────────────────────┐
  │  [+ New Project]                          [Filter ▾]   │
  │                                                        │
  │  Construction Firm Scheduler                           │
  │  ▓▓▓▓▓▓▓▓░░░░░░░░ 45%  │  Schematic  │  8 tasks     │
  │  Due: May 15  │  Budget: $50 of $200  │  3 agents     │
  │                                                        │
  │  MKE Dashboard v2                                      │
  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 85%  │  Construction  │  24 tasks  │
  │  Due: Apr 30  │  Budget: $120 of $300  │  5 agents    │
  │                                                        │
  │  BLK Exchange Pilot                                    │
  │  ▓▓░░░░░░░░░░░░░░ 12%  │  Research  │  2 tasks       │
  │  Due: Jun 1  │  Budget: $0 of $150  │  1 agent        │
  └────────────────────────────────────────────────────────┘

PROJECT DETAIL (click):
  ┌────────────────────────────────────────────────────────┐
  │  Construction Firm Scheduler                           │
  │  Phase: Schematic  [Advance →]                         │
  │                                                        │
  │  GOAL: Build a scheduling tool for small construction  │
  │  firms that replaces whiteboard-based job tracking     │
  │                                                        │
  │  MILESTONES:                                           │
  │  ✓ Research brief complete (Apr 10)                    │
  │  ◐ Architecture outline (Apr 14)                       │
  │  ○ Design brief (Apr 18)                               │
  │  ○ MVP build (May 5)                                   │
  │  ○ User testing (May 12)                               │
  │                                                        │
  │  SOURCES: 3 docs, 2 URLs  [+ Add Source]               │
  │  PLANS: CEO Plan ✓  Eng Plan ◐  Design Plan ○         │
  │  KNOWLEDGE: 12 gbrain pages linked                     │
  │                                                        │
  │  TASKS: [Kanban view]  [List view]  [Timeline view]    │
  │  ┌────────┬────────┬───────────┬──────────┐            │
  │  │Queued  │Running │Approval   │Completed │            │
  │  │        │        │           │          │            │
  │  │Research│Eng Lead│LinkedIn   │Market    │            │
  │  │brief   │arch    │post draft │analysis  │            │
  │  │v2      │outline │           │          │            │
  │  └────────┴────────┴───────────┴──────────┘            │
  │                                                        │
  │  THREAD: [Institutional memory, searchable]            │
  └────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase A: Fix delegation context (quick win, 30 min)
- Increase context limits in plugin (500 → 2000 chars per source, 300 → 1000 per thread)
- Include full project goal in every task dispatch
- Pass parent task result to child tasks on delegation

### Phase B: gbrain integration (2-3 hours)
- Install gbrain on Fly.io persistent volume
- Update plugin pre_llm_call to query gbrain
- Update plugin post hooks to write discoveries to gbrain
- Add Knowledge page to dashboard frontend
- Add gbrain search to Cmd+K palette

### Phase C: Enhanced project management (2-3 hours)
- Add to projects: goal, dueDate, milestones
- Add to tasks: dueDate, subtasks (nested), comments
- Build Projects list page with progress bars
- Build Project detail page with milestone tracking
- Add gbrain page linking to projects

### Phase D: Task enhancements (1-2 hours)
- Due dates on tasks
- Task search across all projects
- Labels/tags
- Export project as Claude Code handoff bundle

---

## The Full Stack

```
YOU (architect)
  │
  ├── Claude Code + gstack (reviews, building)
  │     Uses: gbrain MCP for world knowledge
  │     Uses: gstack skills for structured reviews
  │     Builds: actual code from approved plans
  │
  ├── Studio Dashboard (management, Asana-like)
  │     Shows: projects, tasks, agents, knowledge, costs
  │     Does: create projects, approve work, browse gbrain
  │     Runs on: Vercel
  │
  └── Hermes Agents on Fly.io (execution)
        Uses: gbrain for world knowledge (search before every task)
        Uses: Bumwad skills for methodology-driven work
        Uses: studio-dashboard plugin for Convex bridge
        Writes to: gbrain (discoveries compound)
        Writes to: Convex (tasks, events, thread entries)

KNOWLEDGE FLOWS:
  gbrain ←→ Hermes agents (read before, write after)
  gbrain ←→ Claude Code via MCP (same brain, different interface)
  gbrain ←→ Dashboard (browse, search, edit pages)
  
  One brain. Three interfaces. Knowledge compounds everywhere.
```

---

## Why This Works

Paperclip gives you agent orchestration. Asana gives you project management. gbrain gives you institutional memory. Bumwad gives you methodology.

None of them alone is enough. Combined:

- Projects have structure (Asana) AND AI employees (Paperclip)
- Agents have context (gbrain) AND methodology (Bumwad)
- You have oversight (dashboard) AND verification (gstack in Claude Code)
- Knowledge compounds across projects, agents, and time (gbrain)

The agents draft. gbrain remembers. gstack reviews. Claude Code builds. You architect.
