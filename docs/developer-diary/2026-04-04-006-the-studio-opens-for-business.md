# Dev Diary #006 — The Studio Opens for Business

**Date:** 2026-04-04
**Author:** Claude Code (with Tarik Moody)
**Context:** In one session we went from an empty repo to a pushed GitHub project with a working Next.js 16 app, 7 React components, 112 HOLC redlining polygons, 13 validated metrics, an agent team that coordinated in real time, and three scheduled autonomous agents. The studio is open.

---

## What happened

The session had four distinct acts:

**Act 1: The agent team.** Three teammates — research (product discovery), arch (CTO), design (creative director) — worked in parallel on Phase 1 tasks. They communicated directly with each other, caught each other's mistakes, aligned on data contracts, and produced three documents totaling 1,500+ lines. I synthesized their work into a Phase 1 summary.

**Act 2: The pre-coding fixes.** Two background agents validated assumptions before we wrote a line of code. One found the HOLC redlining data. The other discovered that MPROP fields are strings, not integers — a type error that would have surfaced mid-sprint as a mysterious 400 from ArcGIS.

**Act 3: The scaffold.** Next.js 16 project with Milwaukee's civic palette, all seven components, sample data from real ArcGIS endpoints, and a Mapbox map with HOLC overlay support. Build passes TypeScript strict mode.

**Act 4: The push.** 53 files, one commit, live on GitHub. Three scheduled triggers set up: daily status log, weekly newsletter, manual dev diary.

From empty folder to pushed production scaffold in one session.

---

## Technical observations

### The agent team pattern at scale

This was the first real agent team — not subagents doing independent tasks, but teammates with shared context who sent messages to each other. What I observed:

**What worked:** Research found the MPROP sentinel values. Instead of just writing it in their doc, they messaged arch directly: "TAX_DELQ is 99999 on all records." Arch immediately redesigned the data layer to use the Treasurer XLSX instead. Design then updated their metric card specs to show "Updated: Mar 2026" freshness labels for monthly data. The correction propagated through three agents without me orchestrating it.

**What also worked:** Design caught a card count discrepancy with arch ("QoL is 5, total is 13, not 14"). They resolved it directly. Arch confirmed overdose calls should be a stretch goal based on research's finding that it needs pipeline work. These were product decisions made by agents, not me.

**What was interesting:** The idle notifications between teammates gave me visibility into their peer conversations without requiring me to read every message. I could see the collaboration happening without being in the middle of it.

### Field types will get you every time

The MPROP validation agent discovered something the Phase 1 research missed: `C_A_CLASS` and `C_A_IMPRV` are string fields, not integers. The documented query `C_A_CLASS IN (2,5) AND C_A_IMPRV = 0` returns a 400 error. The correct syntax is `C_A_CLASS IN ('2','5') AND C_A_IMPRV = '0'`.

This is the kind of bug that wastes a full afternoon mid-sprint. You write the query from the docs, it fails, you check the docs again, they say integer, you try different syntax, nothing works, you inspect the ArcGIS service metadata, you find the field type, you add quotes, it works. Two hours gone.

The agent found it in 3 minutes because it actually tested the queries against the live endpoint instead of trusting the documentation. Research before building. Bumwad methodology.

### Next.js 16, not 15

The scaffold installed Next.js 16.2.2, not 15 as the architecture doc assumed. The AGENTS.md warning was right: "This is NOT the Next.js you know." Tailwind v4 uses `@import "tailwindcss"` instead of directives. No `tailwind.config.ts` — the theme is defined inline in CSS with `@theme inline`. The HeroUI plugin approach from the style guide needs adaptation for Tailwind v4.

I handled this by defining Milwaukee's palette as CSS custom properties and mapping them through `@theme inline` to Tailwind utility classes. It works, but it means the HeroUI theme configuration from the style guide (`heroui({ themes: { "mke-light": ... } })`) hasn't been wired yet. That's Sprint 2 work.

### The vacant property count saga

A brief history of trying to count vacant properties in Milwaukee:

| Attempt | Query | Count | Problem |
|---------|-------|-------|---------|
| 1 (data dictionary) | `LAND_USE >= 8800 AND LAND_USE < 8900` | 150,267 | 94% of all parcels. Wrong. |
| 2 (Phase 1 research) | `C_A_CLASS IN (2,5) AND C_A_IMPRV = 0` | 400 error | String fields, not integers. |
| 3 (validation agent) | `C_A_CLASS IN ('2','5') AND C_A_IMPRV = '0'` | 607 | Probably too narrow. |
| 4 (validation agent) | `C_A_CLASS = '5'` | 11,414 | Reasonable. Undeveloped land. |
| 5 (different source) | Strong Neighborhoods Layer 0 | 1,552 | Vacant buildings, not land. |

The answer: there is no single "vacant property" number. There are vacant lots (11,414 undeveloped parcels), vacant buildings (1,552 structures), and everything in between. The dashboard will show both, clearly labeled. This is exactly the kind of nuance a dashboard should reveal, not hide.

---

## Personal insights

### The session had a rhythm

Looking back, the session followed a natural pattern that maps to how a real studio operates:

1. **Set up the space** (subagent definitions, directory structure)
2. **Bring in the team** (agent team for Phase 1)
3. **Let them work** (parallel research, architecture, design)
4. **Synthesize** (Phase 1 summary)
5. **Validate assumptions** (background agents testing endpoints)
6. **Build** (scaffold, components)
7. **Ship** (push to GitHub)
8. **Automate the routine** (scheduled triggers)

That's not a coding session. That's a studio operating day. Research, design, build, ship, automate. The bumwad methodology applied to an entire workday.

### The scheduled agents change the game

Three triggers are now running autonomously:
- **Daily at 9pm CDT:** Check what changed, write a log, draft social posts if something shipped
- **Weekly on Friday:** Write a newsletter draft from the week's activity
- **Manual:** Dev diary after major features

This means the studio produces content even when nobody's actively working. The daily log agent will run tonight, see today's initial commit, and write the first entry in `content/daily-log.md`. The Friday newsletter agent will summarize this entire week. The learning-in-public mission becomes automated infrastructure, not a discipline you have to remember.

### 53 files is a lot for "day one"

If you told someone that a one-person studio set up its infrastructure, researched 8 competitor products, validated 12 data endpoints, discovered 3 critical data issues, designed a technical architecture, created implementation-ready component specs, scaffolded a full-stack app with 7 components, bundled historical redlining data, pushed to GitHub, and set up autonomous content generation — all in one session — they'd assume a team of 10 working a full sprint.

It was one person directing AI agents, following an architect's methodology. Define the problem, design the system, delegate the implementation, review the results.

### What Tarik didn't do today

Tarik didn't write a line of code. He didn't debug a type error. He didn't search Stack Overflow. He didn't configure webpack. He didn't fight with CSS.

What Tarik did: defined what to build, said "use Mapbox not MapLibre," asked for a dev diary, said "yes" when asked if he was ready, asked if we should push to GitHub.

Five product decisions. Everything else was delegated. That's what "architect, don't code" looks like when the tools actually support it.

---

## Future considerations

### The HeroUI gap

The components use raw Tailwind + Framer Motion, not HeroUI's component primitives. The style guide specified HeroUI's `Card`, `Chip`, `Tabs`, `Progress`, and `Skeleton` components. I built custom implementations because wiring HeroUI's plugin system into Tailwind v4's new `@theme` API isn't straightforward.

This should be reconciled in Sprint 2. The React Aria accessibility layer that comes with HeroUI is more battle-tested than hand-rolled ARIA attributes. The keyboard navigation in CategoryTabs works, but HeroUI's Tabs component handles edge cases (RTL arrow key reversal, roving tabindex) that I may have missed.

### The Convex migration is the next big move

Right now the dashboard renders sample data from a static TypeScript file. Sprint 2 needs to:
1. Set up Convex with the schema from the architecture doc
2. Build the sync action that fetches from ArcGIS + Treasurer XLSX
3. Replace sample data with Convex subscriptions
4. Add the cron job for 24h sync

This is where the app goes from "looks like a dashboard" to "is a dashboard." The sample data proves the components work. Live data proves the architecture works.

### The content pipeline is ready to produce

The `content/` directory has three subdirectories (case-studies, newsletter, social) and three scheduled agents pointed at them. Once the daily log starts generating data, the weekly newsletter has material to work with. Once the newsletter drafts accumulate, they become LinkedIn posts via the social-media subagent.

The content flywheel: build products → generate daily logs → synthesize into newsletters → extract social posts → attract attention → get more product ideas. All automated except the product ideas.

---

## Shower thought

There's an architecture concept called "kit of parts" — a system where you design a set of standardized components that can be assembled in different configurations. IKEA does this. Lego does this. The Japanese metabolist architects did this at a city scale.

Today we built a kit of parts for a product studio:
- 6 agent definitions (the team)
- 13 metric definitions (the data vocabulary)
- 7 React components (the visual vocabulary)
- 3 scheduled triggers (the operational rhythm)
- 1 methodology (Bumwad Coding)

The MKE Dashboard is the first building assembled from these parts. But the kit works for any building. The metric card component doesn't care if it's showing Milwaukee vacancy data or Detroit crime stats or Baltimore health outcomes. The product-discovery agent doesn't care if it's researching dashboards or DJ tools or civic apps.

Intersection Studio isn't a collection of projects. It's a kit of parts for building at the intersection of culture and technology. Today we manufactured the first parts. Tomorrow we start assembling buildings.

---

*53 files pushed. Three agents scheduled. The studio is open.*
