# Intersection Studio — Daily Log

---

## 2026-04-14

- No commits today — quiet day after the April 12 sprint
- **Studio Dashboard** is the active project; CEO delegation and agent chat are live and stable
- Architecture vision is fully documented: Studio OS v2 (`docs/architecture-studio-os-v2.md`) — Paperclip-style orchestration + gbrain world knowledge + Bumwad methodology phases
- Dashboard is running locally; Fly.io deploy of Hermes agents is live; Vercel deploy of dashboard frontend is the next infra milestone
- TODOS.md (deferred work) prioritizes: HMAC replay protection (P1), dead-letter queue for failed callbacks (P2), correlation IDs / distributed tracing (P2)
- Next major build phase per Studio OS v2 plan: gbrain integration on Fly.io + Knowledge page in dashboard frontend
- **Awaiting Tarik decision:** approve and publish LinkedIn post for recent sprint (drafted in `content/social/linkedin-2026-04-14.md`)
- No blockers — architecture is defined, implementation plan is written, next steps are clear

---

## 2026-04-12

**Project:** Studio Dashboard (Intersection Studio OS)
**Session:** Marathon build — control room → operating system

- Published `docs/architecture-studio-os-v2.md` — Paperclip + gbrain + Bumwad model fully documented; the studio's operating model now has a blueprint
- **Paperclip-style CEO delegation shipped** — `createGoal` mutation lets Tarik describe what he wants; CEO agent auto-routes to the right agent via `delegate_to_agent` plugin tool; delegation logged to Convex activity feed (~981 line insertion across 6 files)
- Added `studio-dashboard` Hermes plugin — `plugin.yaml`, `schemas.py`, `tools.py`, and `__init__.py`; CEO talks to Convex via this plugin to read projects, list agents, and dispatch work
- **Skill-driven goals** — tasks now carry a `skillHint` field telling the assigned agent which skill to invoke; `resultFull` field stores the complete deliverable (viewable + downloadable, no truncation)
- **Hackathon-brainstorm skill** added for Hermes agents — SKILL.md spec + past-winners reference doc; first domain-specific research skill in the system
- **Agent chat live in Studio Dashboard** — persistent `chatMessages` table in Convex; agents receive full project list + project detail as context; chat page in Next.js app
- Fixed: agent name stored per-message (not derived from selected agent) — switching agents clears conversation and relabels correctly
- Fixed: Hermes Docker paths corrected to `/opt/data/profiles/` (official volume mount path); self-healing checks all 12 profiles; proxy timeout raised from 30s → 5 min for tool-using agents (web search, terminal)
- Dev Diary #014 (`2026-04-09`) documents the conceptual shift: Hermes agents = architecture firm, Claude Code = general contractor, Tarik = principal architect; the metaphor is now literal code
- **Milestone:** Studio Dashboard crossed from monitoring tool to full studio operating system — one session, 7 commits

**Items needing attention:**
- gbrain integration is designed (architecture doc) but not yet built — Knowledge page is planned, not shipped
- Due dates, milestones, task dependencies remain P1/P2 backlog items (per OS v2 doc)
- Hackathon-brainstorm skill needs a real run to validate output quality
- MKE Dashboard open decisions still pending: Housing tab split, Hmong translation review, no deployment yet

---

## 2026-04-08

- No commits in the last 24 hours — studio is in a rest/review cycle after an intensive 2-day build sprint
- Last activity: 2026-04-04, dev diary #009 published ("The Numbers Have Names")
- Active project: **MKE Dashboard** (Milwaukee Neighborhood Dashboard) — civic data, Next.js + Convex + Mapbox
- Dashboard reached a significant milestone at end of last sprint: 15 data sources, 30+ metrics, 7 map layers, 4 languages (EN/ES/Hmong/Arabic), 8 neighborhoods
- Phase 1 docs are comprehensive: PRD v2, technical architecture, data dictionary, UX/accessibility spec, component specs, API reference (v1–v3), style guide, economic data sourcing plan, missing data plan
- Developer diary entries #004–#009 published (days 1–2 of build)
- Open product decision flagged in diary #009: **Housing tab** should be split out from Quality of Life — data is there, needs IA decision from Tarik
- Known tech debt: translation pipeline has no build-time type safety — missing translation keys fail silently
- Known optimization target: citywide dataset downloads (WIBR, 311, sales, licenses) are fetched per-neighborhood; a shared pre-fetch step would cut sync time significantly
- MKE Indicators ArcGIS web maps (37 layers — health, demographic, socioeconomic) remain untouched; adding 5 would make the Wellness tab production-grade
- No social posts today — nothing new shipped since last sprint

---

## 2026-04-07

- No commits in the last 24 hours. Last active session was 2026-04-04.
- **MKE Dashboard** is the only active project. Working prototype is built.
- Dashboard covers 8 northside Milwaukee neighborhoods (Lindsay Heights, Amani, Harambee, Metcalfe Park, and 4 others)
- 30+ metrics per neighborhood across 4 categories: Community, Public Safety, Quality of Life, Wellness
- Data sources active: ArcGIS REST (MPROP, crime, foreclosures, vacant buildings), CKAN (311, property sales, liquor licenses), Census ACS
- Taxkey join pattern implemented for property sales + liquor licenses (client-side filter against MPROP envelope, works within 2MB payload)
- Three coordinate strategies in use: spatial envelope, ZIP code match, taxkey join
- 7 toggleable map layers including HOLC redlining overlay
- CopilotKit Generative UI wired — AI chat renders charts + tables on demand
- next-intl i18n live in 4 languages: English, Spanish, Hmong, Arabic
- LinkedIn launch post drafted and committed to `docs/mke-dashboard/linkedin-launch-post.md`
- Dev diary entries #007–#009 written and committed
- **Items needing attention:**
  - No deployment yet — prototype runs locally only
  - RAZE_STATUS and BI_VIOL fields deferred (require DNS partnership) — Phase 2
  - Economic ETL committed but production sync behavior unverified
  - LinkedIn post is ready to publish — needs Tarik's review and approval before posting

---

## 2026-04-05

**Project:** MKE Neighborhood Vitality Dashboard (mke-dashboard)
**Day:** 2 of active development

- Added economic data ETL module (`convex/etl/economic.ts`) — property sales, building permits, and liquor licenses via Milwaukee CKAN API
- Updated Convex schema and sync pipeline to include economic metrics across all 8 northside neighborhoods
- Completed i18n for 28 metric labels across all 4 locales (English, Spanish, Hmong, Arabic) — labels and units now fully translate on language switch
- Fixed language selector: switched from `router.refresh()` to `window.location.reload()` per next-intl docs; now correctly reads server-side cookie on locale change
- Fixed header, category tabs, and CopilotKit sidebar to use `useTranslations` hooks rather than hardcoded English strings
- Published 3 docs to `projects/mke-dashboard/docs/`: Community Access & Resources Data, Economic Development & Housing Data, Data Architecture & API Reference v2
- Wrote and committed LinkedIn launch post comparing MKE Dashboard to Philadelphia's Kensington Dashboard
- Dev Diary #008 published: map layers, neighborhood fly-to, i18n architecture
- Dev Diary #009 published: taxkey join pattern, three coordinate strategies, translation pipeline fragility, economic data changing the narrative
- Dashboard now has 30+ data points per neighborhood across 15 data sources, 7 toggleable map layers, HOLC redlining overlay, and CopilotKit Generative UI with 4 chart tools

**Milestone reached:** Day 2 complete — dashboard is at prototype → demo-ready quality. Kensington parity on data breadth achieved.

**Items needing attention:**
- Hmong translations need review by a fluent speaker — labels exist but quality unverified
- Sync performance: ~200 API calls per full cycle (25 per neighborhood × 8); optimize with citywide pre-fetch cache before adding on-demand sync
- Housing tab decision pending (Tarik): economic data currently buried in Quality of Life alongside 311/vacancy — may warrant its own tab
- i18n translation keys have no build-time type safety — new metrics silently fall back to English if keys not added to all 4 locale files

---
