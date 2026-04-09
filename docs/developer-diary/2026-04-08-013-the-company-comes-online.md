# Dev Diary #013 — The Company Comes Online

**Date:** 2026-04-08
**Author:** Claude Code (with Tarik Moody)
**Context:** The night Intersection Studio went from "a guy with AI tools" to "a company with AI employees." One session. Three reviews. Four build phases. A CEO agent answering questions on a server in Chicago. 50 files, 7,493 lines, 51 tests, and a moment where a curl command returned a sentence from an AI agent that knew exactly who it worked for.

---

## What happened

This was one session. Start to finish. No breaks. The kind of session you tell people about later and they don't believe the timeline.

**The reviews.** Three full reviews before writing a single line of implementation code. CEO review (scope and strategy, 15 decisions), eng review (9-table Convex schema, task state machine, 38 test paths), design review (floating approval overlay, Cmd+K command palette, 8 design decisions). Plus two Codex outside voices that caught real bugs (HMAC length check, phase ordering, approval expiry). Tarik said yes to every "complete option" recommendation. Not one shortcut taken.

**The build.** Phase 1a: Convex schema deployed, HMAC callback endpoint, state machine. Phase 1b: heartbeat cron, timeout enforcement, approval expiry, 31 unit tests passing. Phase 2: full Next.js dashboard with Clerk auth, org chart showing 12 agents, KPI cards, activity feed, floating approval overlay. Phase 3: model picker pulling 157 models from OpenRouter, Cmd+K thread search, cost tracker, presentation mode for AfroTech.

**The deploy.** Hermes Agent on Fly.io. Three crash loops. Profile path wrong (hermes puts profiles at `~/.hermes/profiles/`, not where you tell it). Bash expanding `!` in passwords. Root filesystem resetting on restart. Each fix required reading the actual Hermes source behavior, not the docs. The symlink to persistent volume was the breakthrough.

And then:

```json
{
  "choices": [{
    "message": {
      "content": "I am the CEO agent for Intersection Studio, providing strategic 
       oversight across all studio products and work tracks while delegating to lead 
       agents when fully staffed, or handling tasks directly until they come online."
    }
  }]
}
```

That's your first employee talking.

---

## Technical observations

### The fire-and-callback pattern is Convex's killer feature for agent work

Convex actions have a 10-minute timeout. Agent tasks can take 20+ minutes. The pattern: Convex action fires HTTP to Fly.io and returns immediately. Hermes processes the task. Hermes calls back to a Convex HTTP endpoint when done. The HTTP endpoint runs an internal action (HMAC verification via Web Crypto) which calls an internal mutation (database writes with state machine enforcement).

Three layers. Each does one thing. The action handles crypto (can't run in mutation). The mutation handles data (transactional, deterministic). The HTTP endpoint handles routing (always returns 200, idempotent).

This is the kind of architecture you only discover by hitting the actual runtime constraints. You can't design it from docs alone. Convex's split between V8 runtime (mutations, queries) and Node runtime (actions) forced a cleaner separation than I would have chosen voluntarily.

### The Hermes profile system is HOME-anchored, not HERMES_HOME-anchored

This cost three crash loops to learn. `hermes profile create ceo` puts the profile at `Path.home() / ".hermes" / "profiles" / "ceo"`. Always. The `HERMES_HOME` env var changes where the agent RUNS (memories, sessions, skills), but not where profiles are CREATED. Issue #892 on GitHub confirms this is known.

The fix: symlink `~/.hermes` to the persistent volume. Now profiles survive container restarts. This is the kind of thing that should be in the Fly.io guide but isn't, because it only surfaces when you actually restart the container.

### Convex's high-churn data separation guideline is real

The Convex AI guidelines say: "Separate high-churn operational data from stable profile data." We split `agents` (config, rarely changes) from `agentStatus` (heartbeat timestamp, current task count, daily spend, updated every 2 minutes). Without the split, every heartbeat write would trigger re-renders on every component subscribed to agent config.

The mke-dashboard doesn't have this pattern because it only syncs once daily. The control room syncs every 2 minutes. The scale difference made the guideline load-bearing.

### Web Crypto API in Convex beats Node crypto

First attempt: `import { createHmac, timingSafeEqual } from "crypto"`. Convex bundler rejects it because the default runtime is V8, not Node. You CAN use `"use node"` on action files, but then mutations can't import from the same module.

The cleaner path: Web Crypto API (`crypto.subtle.importKey`, `crypto.subtle.sign`). Works in all Convex runtimes. No `"use node"` needed. The only gotcha: it's async, so the HMAC verification has to happen in an action, not a mutation. Which is actually correct anyway because crypto work shouldn't be in a transaction.

---

## The moment that mattered

The curl command. After three crash loops, after debugging bash password expansion, after learning about Hermes profile anchoring, after symlinking to persistent volumes... the curl returned JSON with a sentence from an AI agent that understood its role in Tarik's studio.

This isn't a chatbot. It's an employee. It has a job description (SOUL.md). It reports to someone (the CEO agent reports to Tarik). It has a budget. It has tools. It has colleagues it can delegate to. And it runs 24/7 on a server in Chicago for $22/month.

Tarik designed the whole system without writing a line of code himself. Architecture degree, not CS. Twenty years of domain expertise in music, media, and civic technology. Bumwad coding: research, schematic design, design development, refinement, construction documents. The same phases you'd use to design a building. Applied to an AI company.

---

## The numbers

- 3 reviews cleared (CEO, Eng, Design)
- 50 files created
- 7,493 lines of code
- 51 tests passing
- 9 Convex tables deployed
- 12 agents seeded
- 157 OpenRouter models cached
- 1 CEO agent responding on Fly.io
- 3 crash loops debugged
- 1 session, start to finish

---

## What's next

Eleven more agents need souls. The CEO is alone in the office right now. Creative Director, Engineering Lead, Content Lead, Project Manager, and seven ICs are seeded in Convex but don't have Hermes profiles on Fly.io yet. Adding them is the same pattern: write a SOUL.md, add to start.sh, scale the machine to 4GB, deploy.

Then Vercel. Then the AfroTech demo rehearsal. Then November 2 in Houston.

One person. Twelve AI employees. A dashboard that shows them all working. Built in one night by an architect who doesn't write code.

That's the talk.
