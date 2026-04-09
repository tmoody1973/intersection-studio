# Intersection Studio — Architecture Decision: Hermes + gstack + Bumwad

**Date:** 2026-04-09
**Context:** Session where we built the entire studio dashboard (Phases 1-4), deployed Hermes CEO agent to Fly.io, and discovered the right separation of concerns between Hermes, Claude Code, and gstack.

---

## The Architecture

Three systems, three roles. Modeled after how an architecture firm works.

### Hermes Agents = The Architecture Firm

12 agents on Fly.io running 24/7. They research, draft, produce documents, and execute work. The CEO agent runs the firm. Leads manage departments. ICs do the drafting.

Hermes agents will have native **Bumwad skills** (not gstack ports) that follow the architectural design phases:

| Bumwad Phase | Hermes Skill | Agent | Output |
|---|---|---|---|
| Research | `research-brief` | CEO | Market landscape, existing solutions, domain analysis |
| Schematic | `architecture-outline` | Eng Lead | System diagram, tech stack, data model sketch |
| Design Dev | `design-brief` | Creative Director | Visual direction, interaction patterns, component inventory |
| Refinement | `review-package` | PM | Consolidated findings, open questions, risk flags |
| Construction | (regular tasks) | All agents | Code, content, assets |

Each skill produces a DRAFT artifact stored in the project on the dashboard.

### Claude Code + gstack = The Review Layer

gstack skills run in Claude Code on your laptop (Max subscription, interactive, human-in-the-loop). They VERIFY what Hermes agents produce:

- `/office-hours` — challenge the premises of the research brief
- `/plan-ceo-review` — verify scope and strategy decisions
- `/plan-eng-review` — verify architecture, schema, test coverage
- `/plan-design-review` — verify UI decisions, interaction states, accessibility
- `/review` — pre-landing code review before shipping

gstack's rigor (11-section reviews, outside voices, Codex challenges) catches what agents miss. The interactive loop ensures your judgment shapes every decision.

### Claude Code = The General Contractor

After reviews are complete and plans are approved, Claude Code builds. It takes the construction documents (eng plan, design plan, schema, test paths) and implements. It follows the specs. It doesn't decide what to build.

### You = The Client and Principal Architect

You commissioned the project. You review every phase. You sign off before construction starts. The firm works for you. The contractor works for you. Neither replaces your judgment.

---

## The Workflow

```
1. CREATE PROJECT (dashboard)
   You create "Construction Firm Scheduler" in the studio dashboard.
   Phase: Research.

2. HERMES DRAFTS (Fly.io, autonomous)
   CEO agent runs research-brief skill.
   Produces market landscape, existing solutions, domain analysis.
   Stored as designDoc in the project.

3. YOU REVIEW (Claude Code + gstack, interactive)
   Pull the research brief into Claude Code.
   Run /office-hours to challenge premises.
   Run /plan-ceo-review to scope it.
   Approved plan pushed back to dashboard.
   Phase advances: Research → Schematic.

4. HERMES DRAFTS AGAIN (Fly.io)
   Eng Lead runs architecture-outline skill.
   Creative Director runs design-brief skill.
   Drafts stored in project.

5. YOU REVIEW AGAIN (Claude Code + gstack)
   Run /plan-eng-review on the architecture.
   Run /plan-design-review on the design brief.
   Approved plans pushed back to dashboard.
   Phase advances: Design Dev → Construction.

6. CLAUDE CODE BUILDS (your laptop)
   Export project context from dashboard.
   Paste into Claude Code: "Build Phase 1a."
   Claude Code implements the approved plans.

7. HERMES OPERATES (Fly.io, ongoing)
   Content agents write about the product.
   Social agent publishes (via Blotato).
   QA agent reviews.
   Data agent monitors.
   You approve external-facing output.
```

---

## Why Not gstack Inside Hermes

Explored and rejected. Three reasons:

1. **gstack skills use Claude Code tools** (Read, Write, Edit, Bash, AskUserQuestion, EnterPlanMode). Hermes has different tools. No 1:1 compatibility layer.

2. **Interactive reviews are better.** /plan-ceo-review with you making decisions produces sharper plans than auto-decided. The whole point of Bumwad is the architect makes the design decisions.

3. **The separation is correct.** Agents draft, you review. That's how architecture firms work. Trying to make agents review their own work defeats the purpose.

## Why Not Claude Code on Fly.io

Explored and rejected. Technically possible (`claude -p` runs headlessly, gstack has `SPAWNED_SESSION` auto-decide mode). But:

1. **You already pay for Max.** No extra API costs on your laptop.
2. **Auto-decided reviews lose quality.** The recommended option isn't always YOUR option.
3. **Solves a problem you don't have.** You're not trying to remove yourself from design. You're trying to remove yourself from execution.

## What To Build Next

1. **Bumwad skills for Hermes** — native skills, not gstack ports. Research-brief, architecture-outline, design-brief, review-package.
2. **Export to Claude Code** — one-click project context export (already built).
3. **Plan import** — after gstack review in Claude Code, push approved plan back to dashboard.
4. **11 more agent souls** — deploy the full team on Fly.io.

---

## The Insight

Bumwad Coding isn't a metaphor for how to use AI. It's the actual operating system of an AI-powered studio. The architectural design phases (research, schematic, design development, refinement, construction) map directly to:

- Which agent does the work
- Which tool reviews the work
- When the human makes decisions
- When construction begins

The agents draft. gstack reviews. Claude Code builds. You architect.
