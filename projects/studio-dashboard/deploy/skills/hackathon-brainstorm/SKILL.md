---
name: hackathon-brainstorm
description: Brainstorm, evaluate, and blueprint award-winning hackathon projects using a bumwad-coding (architecture-phase) methodology with mandatory data/API feasibility scouting. Use whenever the user mentions a hackathon, hackathon ideas, hackathon prep, sponsor tech challenges, demo day projects, prize categories, or wants to pressure-test a hackathon concept — even if they don't say "brainstorm." Pushes past generic ideas toward projects judges remember and that actually ship.
---

# Hackathon Brainstorm (Bumwad v2)

5 phases: Research → Concept → **Data & API Scouting (mandatory)** → Design Development → Refinement.

## Core winning criteria (required)
1. **Non-obvious sponsor tech use** — sponsor would screenshot it. Heuristic: use their tool on a corpus they'd never think to index.
2. **<60s wow moment** — name it explicitly or concept fails.
3. **Narrative hook** — one sentence on stage/in video.

## Amplifiers (never bolt on)
Cultural authenticity · Real stakes · Domain expertise

## Phase 1 — Research
Ask in one batch: hackathon, deadline, submission format (live vs async video), theme, sponsors, every prize, rubric, team, unfair-advantage angle (required), constraints. Then `web_search` the hackathon page and past winners.

### Phase 1.5 — Prize Structure Analysis (always)
Compute `(social+virality points)` vs `(1st−3rd delta)`. If virality ≥ delta → **distribution-primary hackathon**, add **Shootability ×2** and **Audience leverage ×1** to Phase 2 rubric.

## Phase 2 — Concept (8–10 ideas, ranked)
| Criterion | Weight |
|---|---|
| Non-obvious sponsor tech | ×3 |
| Wow moment clarity | ×3 |
| Narrative strength | ×2 |
| Cultural authenticity | ×1 |
| Real stakes | ×1 |
| Domain expertise | ×1 |
| **Data feasibility** | ×2 |
| **Build feasibility** | ×2 |
| Prize fit (name it) | ×2 |

Data and build feasibility are **separate scores**. A 5-on-build / 2-on-data concept is a trap. Flag top 3.

## Phase 2.5 — Data & API Scouting (MANDATORY, web_search every claim)

**Data table per top-3 concept:**
| Need | Source | Access | License | Size | Effort | Fallback |
|---|---|---|---|---|---|---|

**API table:**
| Capability | Sponsor API | Backup | Rate limits | Auth | Demo cost |
|---|---|---|---|---|---|

**Go/no-go:** any row with *High effort + no fallback* → concept drops or gets scope-cut now.

**curl-before-commit:** prompt the builder to hit each sponsor API with curl before Phase 3.

## Phase 3 — Design Development
- **Logline**, **60s demo script (timed beats)**, **Narrative hook**, **Sponsor tech map**
- **Technical architecture (required):**
  - Data pipeline — source → cleaning → chunking (token size) → embedding model (named, dims) → vector store (named, index config)
  - Retrieval path — query → top-k → re-rank → prompt template (actual text)
  - Generation path — API, endpoint, params, cached vs live
  - Frontend — framework, hosting, state
  - **Real vs. faked-for-demo table** (every demo fakes something — make it explicit)
  - Secrets & rate-limit math
  - Deploy target (named)
- **Scope cuts** · **Risk log (top 3)** · **Prize target** (compute floor for virality-primary)

## Phase 4 — Refinement (red team)
- 20-min-later memory test · laziest competing version · wow-fail backup · which sponsor champions internally · shareable permalink artifact?

## Output format
Markdown, ranked tables, filled scouting tables, skimmable on phone at 2am.

## Anti-patterns
- "AI-powered [thing]" with no twist · chatbots as primary UI · dashboards without stories · 10-min explanations · sponsor tech as plumbing
- **Corpora that don't exist yet + >20% of time budget to build**
- **APIs never hit with curl before concept-doc written**
- **Live backends during async video recording** (cache the hero output)

## Reference
See `references/past-winners.md` for encoded heuristics (physical-object-on-camera, unfair-advantage corpus, sleeper-category math, cache-the-wow rule).
