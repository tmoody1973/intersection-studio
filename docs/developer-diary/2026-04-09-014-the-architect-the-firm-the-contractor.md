# Dev Diary #014 — The Architect, the Firm, and the Contractor

**Date:** 2026-04-09
**Author:** Claude Code (with Tarik Moody)
**Context:** Continuation of the marathon session. The dashboard was built, the CEO agent went live on Fly.io, and then a conversation about system architecture turned into something bigger. Tarik figured out the operating model for the whole studio.

---

## What happened

The building was done. 50 files, 51 tests, 12 agents seeded, CEO responding from Chicago. Dashboard showing the org chart. Model picker pulling 157 models from OpenRouter. The technical work was finished.

Then Tarik asked a question: "Should projects be a thing in the system?"

Yes. Obviously. Tasks need to live under projects. But the question opened a door. If projects exist, they need phases. If phases exist, they map to Bumwad. If Bumwad runs in the system, then the system IS the methodology. Not a tool that supports the methodology. The methodology itself, running as software.

That led to: "Can we run gstack inside Hermes?"

We researched it. Hermes has a skill system with taps. gstack is a default tap. You can install it. But gstack skills use Claude Code tools (Read, Write, AskUserQuestion), and Hermes has different tools. No compatibility layer. Dead end for direct porting.

Then: "Can we install Claude Code on Fly.io and have Hermes invoke it?"

Technically yes. Claude Code runs headlessly. gstack has a spawned-session mode that auto-decides. It would work. But it solves the wrong problem. You don't want to remove yourself from the design process. You want to remove yourself from the execution.

Then Tarik said the thing that crystallized everything:

"So Claude Code becomes the contractor and Hermes acts like the architecture firm building the documents for the contractor."

That's it. That's the whole model.

---

## The model

Three roles, borrowed directly from how buildings get designed and built.

**Hermes agents are the architecture firm.** They research, draft, produce construction documents. The CEO runs the firm. Leads manage departments. ICs draft. They work 24/7 on a server. They don't build the building. They design it.

**Claude Code is the general contractor.** It takes the construction documents and builds. It knows materials (React, Convex, Next.js). It follows specs. It doesn't decide what to build. It builds what the documents say.

**Tarik is the client and the principal architect.** He commissioned the project. He reviews every phase. He signs off before construction starts. Neither the firm nor the contractor replaces his judgment.

gstack is the review toolkit the principal architect uses. It's not the firm's tool. It's HIS tool for verifying the firm's work.

---

## Why this matters

Bumwad Coding was always described as a methodology inspired by architectural design phases. Research, schematic design, design development, refinement, construction documents. Same phases you'd use to design a building.

As of tonight, it's not a metaphor. It's literally how the software runs.

The research phase is a Hermes skill that the CEO agent executes. The schematic phase is a Hermes skill that the Eng Lead executes. The review between phases is gstack running in Claude Code with Tarik making decisions. The construction phase is Claude Code building from approved plans.

Each phase has a system. Each system has a role. Each role has boundaries. The agents can't approve their own work. The contractor can't change the design. The architect reviews everything.

That's not a workflow. That's an operating model.

---

## Technical additions

Projects table added to Convex. Bumwad phases (research, schematic, design_dev, refinement, construction, complete) tracked per project. Plan artifacts stored directly in the project row (designDoc, ceoPlan, engPlan, designPlan). Tasks linked to projects. Sidebar shows project list with phase tags and task counts. Export-to-Claude-Code query that bundles a project's full context into one markdown document.

157 OpenRouter models cached and available in the model picker dropdown. Heartbeat cron now hits the real Fly.io /health endpoint instead of hardcoding all agents as online. Cost dashboard with per-agent breakdown, projected monthly burn, and budget bar.

CEO agent deployed and responding. Three crash loops debugged (profile path, bash password expansion, persistent volume). Symlink from ~/.hermes to /opt/data/hermes was the fix that stuck.

---

## The conversation that changed everything

The best engineering decisions don't come from technical analysis. They come from someone saying "wait, isn't this just like..."

Tarik's architecture degree isn't background flavor for his bio. It's the lens through which he sees every system. When he said "Hermes is the firm, Claude Code is the contractor," he wasn't making an analogy. He was recognizing a structural pattern he's known for 20 years, applied to a domain that didn't exist 2 years ago.

That's domain expertise. That's the code.

---

## What's next

Build the Bumwad skills for Hermes. Native skills, not gstack ports. Research-brief, architecture-outline, design-brief, review-package. Deploy the other 11 agent souls. Finish the LinkedIn post. Deploy the dashboard to Vercel.

The operating model is defined. Now build the operating system.
