# Studio Dashboard — Deferred Work

Items deferred from CEO review (2026-04-09) + Eng review + Design review.
Prioritized for post-AfroTech hardening unless noted.

## P1 — Security Hardening

### HMAC Replay Protection
**What:** Add nonce store + timestamp validation + key rotation to callback HMAC.
**Why:** Current HMAC prevents tampering but not replay attacks. An attacker who captures a valid callback can replay it indefinitely.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Depends on:** Fly.io deployment (need real callbacks to test against)
**Context:** Both Claude and Codex flagged this. Acceptable for single-user pre-launch but must ship before any multi-user access.

### Prompt Injection Hardening
**What:** Validate/sanitize task descriptions before passing to Hermes agents.
**Why:** Task descriptions are user input that becomes part of the agent's system prompt. Malicious input could hijack agent behavior.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Depends on:** Fly.io deployment
**Context:** Low risk for single-user system (Tarik is the only one creating tasks). Required before adding collaborators.

## P2 — Reliability

### Dead-Letter Queue for Failed Callbacks
**What:** Store failed/unprocessable callbacks in a separate table for manual retry.
**Why:** If callback processing fails after HMAC verification (e.g., DB error), the result is lost. A dead-letter table preserves it for retry.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Depends on:** Nothing

### TOCTOU Fix for Concurrent Delegation
**What:** Add optimistic locking to circular delegation detection.
**Why:** Two concurrent delegations could both pass the ancestry check then create a cycle. Extremely unlikely with 12 agents and 1 user but technically possible.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Depends on:** Nothing
**Context:** Codex flagged this. Risk is near-zero at current scale.

### Thread Retention / Compaction
**What:** Archive or summarize thread entries when a thread exceeds 500 entries.
**Why:** Each agent reads ALL thread entries on intake. At 500+ entries, this becomes slow and expensive.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Depends on:** Significant agent usage (months of operation)

## P2 — Observability

### Correlation IDs / Distributed Tracing
**What:** Add a trace_id that propagates from task creation through dispatch, Hermes execution, callback, and all downstream mutations.
**Why:** When debugging a failed task, you currently have to manually follow the chain across events table entries. A single trace_id makes this instant.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Depends on:** Nothing

## P2 — Infrastructure

### nginx Proxy HA
**What:** Add health-check-based routing to the Fly.io proxy. Currently single-process.
**Why:** If the proxy dies, all 12 agents are unreachable. At scale, need redundancy.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Depends on:** Fly.io deployment + significant usage

## P3 — Data Governance

### PII Retention / Deletion / Export
**What:** Define retention policies for thread entries, events, and task results. Build deletion and export endpoints.
**Why:** Institutional memory accumulates business decisions, content drafts, and potentially sensitive information. Legal/compliance needs a way to manage this data.
**Effort:** L (human: ~1 week / CC: ~2 hours)
**Depends on:** Significant data accumulation
**Context:** Not needed for AfroTech demo. Required before any client-facing use.

## P3 — Design

### DESIGN.md Formalization
**What:** Run /design-consultation to create a formal design system document.
**Why:** Currently using mockup CSS vars as informal system. A DESIGN.md ensures consistency as the dashboard grows.
**Effort:** S (human: ~4 hours / CC: ~30 min via /design-consultation)
**Depends on:** Phase 2 dashboard being stable

### Semantic Search with Embeddings
**What:** Replace full-text search (Cmd+K) with OpenRouter embedding + vector search.
**Why:** Full-text search matches keywords. Semantic search matches meaning ("what did we decide about the logo" finds entries that say "brand identity direction").
**Effort:** M (human: ~1 day / CC: ~30 min)
**Depends on:** Full-text search proving insufficient

### Mobile-Responsive Approval Cards
**What:** Responsive layout for approval overlay on phone screens.
**Why:** Tarik may need to approve tasks from his phone while at Radio Milwaukee.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Depends on:** Phase 2 dashboard being stable
