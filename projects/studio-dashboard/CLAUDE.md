@AGENTS.md

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

## Project Context

Intersection Studio Control Room: 12 Hermes Agent profiles on Fly.io managed through a Next.js + Convex + Clerk dashboard.

- CEO Plan: `~/.gstack/projects/tmoody1973-intersection-studio/ceo-plans/2026-04-09-hermes-control-room.md`
- Design Doc: `~/.gstack/projects/tmoody1973-intersection-studio/tarikmoody-main-design-20260408-181858.md`
- Mockup: `docs/intersection-studio-dashboard-mockup.html` (project root)

## Stack

- Next.js 16 + React 19
- Convex (database, actions, crons, HTTP endpoints)
- Clerk (auth, tokenIdentifier for RBAC)
- Hermes Agent on Fly.io (12 profiles, OpenRouter LLM routing)
- Blotato API (social media publishing)

## Key Architecture Decisions

- Fire-and-callback pattern: Convex actions fire HTTP to Fly.io, Hermes calls back to `/hermes-callback`
- HMAC-signed callbacks with `crypto.timingSafeEqual` (check length first!)
- Task state machine enforced in `convex/lib/stateMachine.ts`
- Agent status separated from agent config (high-churn data separation)
- Thread entries as individual Convex documents (not arrays, avoids 1MB limit)
- Approval expiry: 60 minutes via heartbeat cron

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
