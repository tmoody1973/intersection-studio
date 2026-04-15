# Entry #019: The Agents Learn to Talk
**Date:** April 15, 2026
**Working on:** CopilotKit + AG-UI integration, Co-Work Mode rewrite

---

## The Paradigm That Kept Coming Back

Three diary entries ago (#018), we fired twelve Hermes agents and hired five Mastra ones. Output quality went up. Costs went from $200/mo to $15/mo. The architecture got simpler. It was a win by every metric except one.

The agents were still silent.

You type a goal. You wait. You get a document. Somewhere between "submit" and "here's your research," an AI did actual thinking, queried an institutional brain with 3,747 pages of context, delegated to a specialist, and synthesized a deliverable. You saw none of it.

Tarik said it plainly: "The agents should be collaborative with me on tasks instead of running autonomously. I should see the agent's thinking process like I do in Claude Code."

That sentence killed the fire-and-forget paradigm for the second time. The first time was Hermes. This time it was the Mastra rebuild. Same mistake, better plumbing.

## What CopilotKit Actually Changes

The technical answer: AG-UI is an event-based protocol that streams agent state from Mastra on Fly.io directly to the browser via CopilotKit. No Convex relay table. No polling. The agent thinks, you watch.

The real answer: the dashboard stops being a task manager and starts being a workspace.

The split view is 40% chat, 60% artifact. Not 50/50. That ratio matters. The artifact (the deliverable) is what you're here for. The chat (the agent's reasoning) is how you got there. Hierarchy as service.

```
BEFORE: type goal → wait → get document (vending machine)
AFTER:  type goal → watch thinking → steer → co-create (pair partner)
```

The vending machine metaphor is useful. Nobody watches a vending machine work. You put money in, you get a snack. But if your vending machine was writing your competitive analysis, you'd want to see the gears turn. You'd want to say "actually, focus on pricing, not features" mid-drop.

## The Three Reviews

We ran /plan-ceo-review, /plan-eng-review, and /plan-design-review in sequence. Here's what each caught:

**CEO review** expanded scope from "add CopilotKit" to a full collaborative intelligence studio: brain cards, agent avatars with delegation visualization, session timeline scrubber, smart "Copy for Claude Code," real-time cost ticker, a Canvas Copilot prototype, and sound design. Eight expansion proposals, eight accepted. Tarik chose SCOPE EXPANSION mode. He wants the cathedral.

The Codex outside voice found the real engineering problems: the brain card data shape in the plan didn't match the actual `brain.ts` output (it returns `{text, title, score, source}`, not `{documentId, excerpt, similarityScore}`). Frontend-only persistence means tab-close loses your deliverable. The studio-dashboard uses npm, but the plan said `bun add`. These are the bugs you catch by reading the code, not the plan.

**Eng review** validated the dual execution path (dispatchTask for background, CopilotKit for interactive) and caught the state machine divergence risk. The existing `stateMachine.ts` enforces queued → running → completed. The new CopilotKit path needed to go through the same transitions, not skip to "running" on mount. That decision, seemingly minor, is the difference between consistent task data and a debugging nightmare six months from now.

**Design review** scored the plan 4/10 initially. No typography, no color system, no empty states, no responsive specs. We generated three mockups with the gstack designer, Tarik picked Variant C (dark professional, agent avatars with delegation flow), and then walked through seven review passes. Final score: 8/10 with a DESIGN.md now capturing the full token system.

What's interesting is the compounding. The CEO review's brain card decision fed into the eng review's test coverage diagram, which fed into the design review's interaction state table. Each review made the next one sharper.

## The Hybrid Persistence Pattern

This is the most architecturally interesting decision in the plan. When a CopilotKit session completes:

1. The frontend calls `saveDeliverable` (fast path, immediate)
2. Mastra also calls back to Convex (safety net, survives tab close)
3. Convex deduplicates by taskId... first write wins

It's a dual-write where both writers are friends. The frontend is faster (no network hop from Fly.io to Convex). The backend is more reliable (survives browser failures). Codex caught this: "Frontend owns write path is a reliability downgrade." The hybrid is the right answer. Neither path alone is sufficient.

The dedup logic in `saveDeliverable` is four lines:

```typescript
if (task.status === "completed") {
  return { dedup: true };
}
```

If the task is already completed, the Mastra callback beat the frontend. Skip silently. No error, no conflict. The simplest concurrency pattern: last writer loses gracefully.

## The 60/40 Split

Every split-view app has to decide: which panel is primary? Claude Code does roughly 50/50. Cursor does 30/70 favoring the editor. We chose 40/60 favoring the artifact.

The reasoning: you're building a deliverable (research doc, case study, competitive analysis). The chat is how you get there, but the document is why you're here. When Tarik is in Co-Work Mode, his eyes should spend most of their time on the right panel, watching the document form. The left panel is for occasional steering.

This is "hierarchy as service" from the design review. What does the user see first? The deliverable. What does the user see second? The agent's reasoning. What does the user see third? The cost ticker, the timeline, the controls. Everything else is noise.

## What Surprised Me

The `registerCopilotKit` call is one line:

```typescript
registerCopilotKit({ path: "/chat", resourceId: "ceo" })
```

That one line replaces:
- The `agentStream` Convex table (relay for streaming events)
- The HTTP action that received stream events from Mastra
- The `useQuery(agentStream.byTask)` subscription in the old Co-Work page
- 14KB of custom streaming UI code

It's replaced by CopilotKit's `<CopilotChat>` component and AG-UI's streaming protocol. The whole point of the framework is that it already solved streaming, shared state, and tool visualization. Building it custom would have taken 8-10 hours. This took 3.

The thing that makes you nervous about frameworks is also what makes them powerful. You trade control for velocity. AG-UI being an open protocol makes the trade acceptable... if CopilotKit doesn't work, the protocol is portable.

## The Sound Design Decision

This is my favorite scope decision from the CEO review. Tarik accepted sound design: three audio cues (delegation chime, brain query pulse, completion tone), toggleable via localStorage.

In a conference demo, sound is theatrical. The audience hears the delegation happen. They hear the brain being queried. They hear the completion. It's the difference between watching a movie on mute and watching it with the score.

The toggle defaults to OFF (browser autoplay policies), but when enabled for the demo, it turns a visual experience into a sensory one. Cost: maybe 30 minutes of CC time. Impact on the AfroTech audience: disproportionate.

## Looking Ahead

Phase 1 is done. The CopilotKit integration compiles, the schema is migrated, the Co-Work page is rewritten, the home screen navigates to collaborative sessions. Next: brain cards, agent avatars, cost ticker, timeline, canvas prototype.

The canvas is the stretch goal that could make this memorable. TLDraw-based infinite canvas where agent sessions appear as spatial nodes, brain documents as linked cards. It's Miro meets AI agents. High risk (no framework, custom from scratch) but if it works, it's the shot nobody else has at AfroTech.

Six and a half months to November. The foundation is solid. The reviews are clear. Time to build the cathedral.

---

*Total CC time today: ~2 hours across CEO review + eng review + design review + Phase 1 implementation. The three reviews took longer than the code. That's correct.*
