# Hermes Integration Architecture

**Last updated:** 2026-04-09
**References:** [Hermes docs](https://hermes-agent.nousresearch.com/docs)

## Overview

Intersection Studio uses Hermes Agent as the "architecture firm" — 12 AI agents running on Fly.io that research, design, and produce construction documents. The Convex + Next.js dashboard is the control plane. Claude Code is the "general contractor" that builds from the agents' specs.

```
┌─────────────────┐
│    Dashboard     │  Edit souls, skills, tools from browser
│    (Next.js)     │  Create projects + tasks
└────────┬────────┘
         │ mutations
┌────────▼────────┐
│  Convex Cloud   │  Tasks, projects, threads, events, approvals
│  (backend)      │  Dispatches tasks, receives callbacks
└────────┬────────┘
         │ /v1/responses API (stateful)
┌────────▼─────────────────────────────────────────┐
│  Fly.io — Hermes Gateway                         │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  studio-dashboard plugin                     │ │
│  │  • pre_llm_call → inject project context    │ │
│  │  • post_tool_call → log to Convex           │ │
│  │  • on_session_end → completion callback     │ │
│  │  • tools: read_sources, approval, progress  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  12 Agent Profiles (ports 8650-8661)             │
│  Each with: SOUL.md, toolsets, skills, memory    │
│                                                   │
│  Skills: /research-brief, /eng-review, etc.      │
│  Plugin: studio-dashboard (Convex bridge)        │
└───────────────────────────────────────────────────┘
```

## How Tasks Flow

1. **User creates task** in dashboard (project + agent + description)
2. **Convex creates task** in `queued` status, schedules dispatch
3. **`dispatchTask` action** sends POST to `/v1/responses` on Hermes
   - Uses stateful API with `conversation` = threadId
   - Injects `STUDIO_CONTEXT` metadata in instructions
   - Hermes loads SOUL.md, tools, skills, memory natively
4. **Hermes agent processes** with full toolset:
   - Web search, terminal, file ops (per agent config)
   - Can call `report_progress` to send findings mid-task
   - Can call `request_approval` for owner decisions
   - Plugin's `pre_llm_call` injects project sources from Convex
   - Plugin's `post_tool_call` logs every tool use to activity feed
5. **Response returns** with structured JSON or plain text
6. **Convex processes result** via `callbacks.applyCallbackResult`:
   - Completed → task done, result saved, thread entry added
   - Needs approval → approval card appears in dashboard
   - Failed → error logged, auto-retry if eligible

## The Plugin: studio-dashboard

**Location:** `deploy/plugins/studio-dashboard/`

The plugin bridges Hermes with the Convex backend. It's a Python plugin
following the [Hermes plugin spec](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin).

### Hooks

| Hook | Purpose | Convex Endpoint |
|------|---------|-----------------|
| `pre_llm_call` | Inject project sources + thread context | `POST /project-context` |
| `post_tool_call` | Log tool usage to activity feed | `POST /hermes-tool-log` |
| `on_session_end` | Send completion callback if session ends | `POST /hermes-callback` |

### Custom Tools

| Tool | Purpose |
|------|---------|
| `read_project_sources` | Fetch project reference material from Convex |
| `request_approval` | Request owner approval (60-min expiry) |
| `report_progress` | Send intermediate findings/decisions to dashboard |

### Context Injection

The `pre_llm_call` hook extracts `STUDIO_CONTEXT` from the instructions:

```
<!-- STUDIO_CONTEXT: {"taskRunId": "...", "projectId": "...", "threadId": "..."} -->
```

It then calls `POST /project-context` to fetch:
- Project phase (Bumwad stage)
- Sources (text notes, URLs, file metadata)
- Thread entries (last 10 decisions/findings/artifacts)

This context is appended to the user message (not system prompt) to preserve
Hermes's prompt cache stability.

### Security

All plugin-to-Convex communication is HMAC-SHA256 signed using
`HERMES_CALLBACK_SECRET`. Convex verifies signatures with timing-safe
comparison before processing any request.

## Toolsets Per Agent

Configured in `deploy/scripts/start.sh` and written to each profile's `config.yaml`.

| Agent | Toolsets | Rationale |
|-------|---------|-----------|
| CEO | web, memory, delegation, skills, todo | Strategic oversight, delegates to leads |
| Creative Director | web, memory, delegation, skills, vision | Visual review, image analysis |
| Engineering Lead | web, terminal, file, memory, delegation, skills | Can run code, review files |
| Content Lead | web, memory, delegation, skills | Research, editorial direction |
| Project Manager | web, memory, delegation, skills, todo, cronjob | Tracking, scheduling |
| Visual Designer | web, memory, skills, vision | Design research, image analysis |
| Frontend Dev | terminal, file, memory, skills | Build UI, run dev tools |
| Backend Dev | terminal, file, memory, skills | Build Convex functions, run tests |
| Content Writer | web, memory, skills | Research, draft content |
| Social Media | web, memory, skills | Platform research, draft posts |
| QA Reviewer | web, terminal, browser, memory, skills | Test sites, run tests, browse |
| Data Analyst | web, terminal, memory, skills | Query data, run analysis |

## Skills (Bumwad Methodology)

**Location:** `deploy/skills/`

Skills are [SKILL.md files](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)
loaded via progressive disclosure. Each becomes a slash command.

### Methodology Skills (`bumwad/`)

| Skill | Bumwad Phase | Used By |
|-------|-------------|---------|
| `/research-brief` | Research | CEO, Content Lead |
| `/schematic-review` | Schematic | CEO |
| `/design-development` | Design Dev | Engineering Lead |
| `/eng-review` | Design Dev | Engineering Lead |
| `/construction-handoff` | Construction | Engineering Lead |

### Content Skills (`content/`)

| Skill | Purpose | Used By |
|-------|---------|---------|
| `/linkedin-post` | Draft LinkedIn posts in Tarik's voice | Content Writer |
| `/case-study` | Write product case studies | Content Writer |

### Operations Skills (`operations/`)

| Skill | Purpose | Used By |
|-------|---------|---------|
| `/cost-report` | Weekly agent cost analysis | Data Analyst, PM |
| `/status-report` | Weekly status rollup | Project Manager |

Skills are loaded from `/opt/studio/skills/` via the `skills.external_dirs`
config in each agent's `config.yaml`.

## Memory Strategy

Hermes provides two memory layers:

| Layer | Scope | Capacity | Use |
|-------|-------|----------|-----|
| **MEMORY.md** | Per-agent | ~800 tokens | Agent preferences, learned patterns |
| **USER.md** | Per-agent | ~500 tokens | Tarik's preferences, communication style |

Our Convex system adds a third layer:

| Layer | Scope | Capacity | Use |
|-------|-------|----------|-----|
| **Thread entries** | Per-project | Unlimited | Decisions, findings, artifacts |
| **Project sources** | Per-project | Unlimited | Reference material (text, files, URLs) |

These are complementary:
- **Hermes memory** = agent-level knowledge (persists across all tasks)
- **Convex threads** = project-level knowledge (injected per-task by plugin)

## API Usage

We use the `/v1/responses` endpoint (stateful) instead of `/v1/chat/completions`:

```json
POST /v1/responses
{
  "model": "hermes-agent",
  "input": "Research census data APIs for Milwaukee neighborhoods",
  "instructions": "<!-- STUDIO_CONTEXT: {...} -->\n\n## Thread Context\n...",
  "conversation": "thread-uuid-here",
  "store": true
}
```

Benefits:
- Server-side conversation history (multi-turn tool execution)
- Named conversations matching our threadIds
- Agent uses full toolset (web, terminal, etc.) autonomously
- Plugin hooks fire on every LLM turn

Per [Hermes API docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server):
- System prompts "layer on top" of the agent's core prompt
- SOUL.md is loaded natively by Hermes, not injected by us
- Model field is cosmetic — actual model is in the profile config
- 120-second timeout for tool-augmented tasks

## SOUL.md

Each agent has a SOUL.md defining personality and tone. Per the
[SOUL.md guide](https://hermes-agent.nousresearch.com/docs/guides/use-soul-with-hermes):

- SOUL.md defines: identity, style, what to avoid, defaults
- SOUL.md does NOT define: project instructions, file paths, architecture
- Loaded at session start as slot #1 in system prompt
- Changes require session restart

Our SOUL.md files live in `deploy/souls/` and are copied to each profile
during setup. The dashboard's Soul tab editor updates `soulMarkdown` in Convex.
To sync to Fly.io, a redeploy is needed (or a future SSH-based sync).

## Environment Variables

### Fly.io Secrets
| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | LLM access via OpenRouter |
| `STUDIO_API_KEY` | Auth token for Hermes API requests |
| `HERMES_CALLBACK_SECRET` | HMAC signing for Convex communication |
| `CONVEX_SITE_URL` | Convex HTTP endpoint base URL |

### Convex Environment
| Variable | Purpose |
|----------|---------|
| `HERMES_API_URL` | Fly.io Hermes gateway URL |
| `STUDIO_API_KEY` | Auth token for Hermes API requests |
| `HERMES_CALLBACK_SECRET` | HMAC verification for incoming callbacks |

## Deploy Process

1. Update souls, skills, or plugin code in `deploy/`
2. `cd deploy && fly deploy`
3. First boot creates all 12 profiles with toolsets + installs plugin
4. Subsequent boots skip setup (marker: `/opt/data/.setup-complete-v2`)
5. To force re-setup: `fly ssh console -C "rm /opt/data/.setup-complete-v2"` then restart

## File Structure

```
deploy/
├── fly.toml                    # Fly.io config (ord, 4x CPU, 8GB RAM)
├── Dockerfile                  # Hermes + Node.js + souls + skills + plugin
├── souls/                      # SOUL.md per agent (12 files)
│   ├── ceo.md
│   ├── engineering-lead.md
│   └── ...
├── skills/                     # Bumwad methodology skills
│   ├── bumwad/
│   │   ├── research-brief/SKILL.md
│   │   ├── schematic-review/SKILL.md
│   │   ├── design-development/SKILL.md
│   │   ├── eng-review/SKILL.md
│   │   └── construction-handoff/SKILL.md
│   ├── content/
│   │   ├── linkedin-post/SKILL.md
│   │   └── case-study/SKILL.md
│   └── operations/
│       ├── cost-report/SKILL.md
│       └── status-report/SKILL.md
├── plugins/
│   └── studio-dashboard/       # Convex bridge plugin
│       ├── plugin.yaml
│       ├── __init__.py
│       ├── schemas.py
│       └── tools.py
└── scripts/
    ├── start.sh                # Profile setup + gateway startup
    └── proxy.mjs               # HTTP routing proxy (port 3000)
```
