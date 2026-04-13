# Developer Diary #017: The Brain That Couldn't Multitask

**Date:** April 12, 2026
**Entry:** #017
**PR:** [#1 — GBrain Integration](https://github.com/tmoody1973/intersection-studio/pull/1)

---

## What We Built

The institutional brain for Intersection Studio. GBrain, built on PGLite and pgvector, now runs on Fly.io alongside the 12 Hermes agents. Every completed deliverable flows into it. Every agent queries it before starting work. The dashboard's Cmd+K palette has a "Brain" tab for semantic search across the entire portfolio.

3,747 pages. 23,377 chunks. Semantic embeddings via OpenRouter. The studio's 20 products worth of decisions, design docs, case studies, and agent knowledge... searchable by meaning, not just keywords.

Type "how to write a case study" and it finds a CEO memory about case study structure. Not because the words match. Because the meaning does.

## The Review Pipeline

This feature went through a full review pipeline before a single line of code was written:

1. **CEO Review** — Scope expansion mode. Started with "add a brain" and ended with 6 accepted expansions: brain-aware agent prompts, auto-ingest, dashboard search, seed data import, goal context enrichment, and agent tools.

2. **Eng Review** — 11 architecture decisions. The big ones: brain writes must happen in Convex actions (not mutations, which can't make HTTP calls), PGLite needs a write serialization queue, Bearer auth instead of HMAC for internal endpoints, parallel brain + thread fetch via Promise.all.

3. **Design Review** — The Cmd+K Brain tab went from 4/10 to 8/10 on design completeness. Generated mockups with the gstack designer, ran a comparison board, picked Variant B. Added ARIA tab roles, loading states, error states, empty states.

4. **Outside Voice** — Codex (gpt-5.3) did an independent plan challenge. Found two things we missed: brain health should be in the /health endpoint, and the plugin manifest was missing delegate_to_agent. Both fixed.

Three AI models reviewed this plan before implementation started. That's not process theater. Every review found something real.

## The Discovery: PGLite Cannot Multitask. At All.

This is the thing I'll remember from today.

The CEO plan said "PGLite supports unlimited concurrent readers but ONE writer at a time." We built a write serialization queue in the proxy. Smart architecture. Good engineering.

What nobody told us: PGLite can't handle ANY concurrent access. Not "one writer at a time." Zero concurrent processes, period. If `gbrain import` is running, `gbrain stats` crashes with `Aborted()`. A read during a write doesn't wait politely. It corrupts the database.

We discovered this the hard way. Three times. Three database resets. Each time the PGLite directory had to be `rm -rf`'d and re-initialized because the corruption was unrecoverable.

```
fly ssh console -C "gbrain stats"
> Aborted(). Build with -sASSERTIONS for more info.
```

That error message became a running theme. "Aborted()" is PGLite's way of saying "someone else is in here and I'm going to crash rather than wait."

The proxy's write queue handles this correctly for runtime operations (all brain access goes through one Node.js process). But CLI-based operations (import, embed, stats) each spawn their own PGLite instance, and two instances on the same data directory is instant corruption.

Logged this as a learning with confidence 10/10. Future sessions will know.

## The Embedding Saga

The first import attempt (all 12 agent profiles, 3,458 files) hung for 20 minutes. CPU at 0.1%. Memory flat. Not crashing, not progressing.

Turns out `gbrain import` (without `--no-embed`) tries to generate embeddings inline using the OpenAI SDK. No `OPENAI_API_KEY` configured. Instead of failing fast with "missing API key," it hung on each file. 3,458 files, each hanging.

The fix: import with `--no-embed` first (3,458 pages in 37.5 seconds), then `gbrain embed --stale` separately with OpenRouter configured as the OpenAI-compatible endpoint. That took about 15 minutes for 21,578 chunks.

```bash
# This takes 20 minutes and produces nothing:
gbrain import /opt/data/profiles/

# This takes 38 seconds:
gbrain import --no-embed /opt/data/profiles/

# Then this works:
OPENAI_API_KEY=$OPENROUTER_API_KEY OPENAI_BASE_URL=https://openrouter.ai/api/v1
gbrain embed --stale
```

Another discovery: `gbrain query --json` doesn't exist. The `--json` flag isn't in the CLI. The proxy was passing it as an argument and gbrain was interpreting it as part of the query string. Output is plain text (`[0.9098] ceo/soul -- # Intersection Studio...`) that we parse into JSON in the proxy.

## The Architecture Pattern

What's interesting about this whole integration is the layering:

```
Dashboard (browser)
  -> Convex action (cloud)
    -> Fly.io proxy (edge)
      -> gbrain CLI (PGLite, same machine)
```

Four hops to query a local database. Sounds ridiculous. But each hop has a reason:
- Browser can't call Fly.io directly (needs auth)
- Convex can't run PGLite (serverless, no filesystem)
- The proxy serializes writes and manages the CLI lifecycle
- gbrain is the brains (pun intended)

The proxy is the unsung hero. It started as a 50-line port router for agents. Now it's the brain's guardian, the write queue, and the JSON translator. 280 lines and doing real work.

## What Made Me Smile

The semantic search result for "how to write a case study" returning a CEO memory about case study structure. Not because the words match. Because pgvector understood the meaning. That's 20 products worth of institutional knowledge, queryable by intent.

The health endpoint now returns 13 items: 12 agents and "brain." The brain is an employee.

## Future Considerations

- **Embedding costs:** 21,578 chunks through OpenRouter's embedding API. Need to monitor the cost impact. Each new deliverable triggers an embed on auto-ingest.
- **Stale lock files:** PGLite's `postmaster.pid` persists on the Fly.io volume. If the container crashes mid-write, the next boot finds a stale lock. The start.sh should clear stale locks on startup.
- **Brain sync cron:** Currently seed data is a manual import. A cron job to periodically re-import changed files would keep the brain fresh without manual intervention.
- **The 5s timeout:** Bumped from 3s to 5s for semantic search. Cold queries on 21k chunks are slow. If the brain grows to 50k+ chunks, we'll need to optimize or pre-warm the pgvector index.

## The Bumwad Methodology Note

This feature followed every phase. Research (what is GBrain, how does PGLite work). Schematic design (CEO plan with 6 expansions). Design development (eng review with 11 decisions, design review with mockups). Refinement (outside voice challenges, Codex finding two gaps). Construction (parallel worktree agents building Lanes A and B simultaneously).

The time from "approved plan" to "deployed and searching" was about 90 minutes. The time from "let's add a brain" to "semantic search returning results" was about 3 hours including all three reviews, mockup generation, implementation, three database corruptions, one Docker build failure (unzip), one CLI flag that doesn't exist, and one embedding API that hung silently.

Architecture isn't slow. Architecture is how you go fast without breaking things. (We broke things anyway, but we knew how to fix them.)
