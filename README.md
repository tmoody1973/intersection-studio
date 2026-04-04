# Intersection Studio

> A product studio that builds at the intersection of culture and technology.

## About

Intersection Studio is a one-person product studio founded by [Tarik Moody](https://tarikmoody.com) -- architect (Howard University), Director of Strategy & Innovation at Radio Milwaukee, host of Rhythm Lab Radio, Army Signal Officer veteran.

The studio uses AI agent teams to research, design, and build products. Tarik defines problems, designs systems, and makes product decisions. Claude Code agents handle implementation.

## Portfolio (20 shipped products)

**Music:** Crate (DJ research, 19 data sources), Crate CLI, Rhythm Lab Radio app
**Civic Tech:** Hakivo (legislative audio briefings), MKE.dev, Budget Compass, REDLINED (3D redlining viz), Badger Ballot
**Public Media:** Radio Milwaukee playlist app (in production), StoryForge, Listening Post, Tribe AI
**Financial Literacy:** BLK Exchange (simulated trading with cultural tickers)
**Food & Culture:** Digero (recipes), Sonic Sommelier (music to dining)
**Dev Tools:** Claude Code Workflow, Clean Code, Shipwright
**Career:** PathFinder (AI career learning platform)

## Active Projects

| Project | Status | Description |
|---------|--------|-------------|
| [MKE Dashboard](projects/mke-dashboard/) | Scaffolding | Milwaukee Neighborhood Vitality Dashboard -- civic data + AI |

## Methodology: Bumwad Coding

Every project follows architectural design phases:

1. **Research & Programming** -- understand the domain, research what exists
2. **Schematic Design** -- rough concept, system architecture
3. **Design Development** -- detailed specs, PRDs, technical architecture
4. **Refinement** -- iterate based on feedback
5. **Construction Documents** -- implementation-ready specs

Never skip research. Never start coding before the design phases.

## Studio Structure

```
intersection-studio/
├── .claude/agents/          # AI agent team definitions
│   ├── product-discovery.md # Market research, competitive analysis
│   ├── strategist.md        # Pricing, positioning, business model
│   ├── cto.md               # Technical architecture, stack decisions
│   ├── creative-director.md # Visual direction, design systems
│   ├── content-writer.md    # Case studies, newsletters, blog posts
│   └── social-media.md      # LinkedIn, X, Instagram posts
├── projects/                # Active product builds
├── content/                 # Generated content
│   ├── case-studies/
│   ├── newsletter/
│   └── social/
└── docs/                    # Research, PRDs, architecture docs
    ├── developer-diary/     # Reflective build logs
    ├── mke-dashboard/       # MKE Dashboard research + specs
    └── brand/               # Studio brand guidelines
```

## AI Agent Team

Six agents defined in `.claude/agents/`, usable as subagents (one-shot tasks) or agent team teammates (collaborative, multi-context):

| Agent | Role |
|-------|------|
| **product-discovery** | Research before we build. 5+ existing solutions, gap analysis, domain fit check. |
| **strategist** | Business side. Pricing, positioning, pitch decks. Price for value, not cost. |
| **cto** | Technical decisions. Default stack: Next.js, Convex, Clerk, CopilotKit, Mapbox. |
| **creative-director** | Visual identity. Civic minimalism. WCAG AA. Mobile-first. |
| **content-writer** | Every project becomes a story. Direct, honest, specific. No buzzwords. |
| **social-media** | Platform-specific posts. Real person sharing real work, not a brand account. |

## Automated Operations

Three scheduled agents run autonomously:

| Schedule | Agent | Output |
|----------|-------|--------|
| Daily 9pm CDT | Status logger | `content/daily-log.md` + social posts if something shipped |
| Friday 6pm CDT | Newsletter writer | `content/newsletter/draft-YYYY-MM-DD.md` |
| Manual trigger | Dev diary | `docs/developer-diary/` entry after major features |

## Getting Started

```bash
git clone https://github.com/tmoody1973/intersection-studio.git
cd intersection-studio
```

To work on a specific project, cd into its directory:

```bash
cd projects/mke-dashboard
npm install
cp .env.local.example .env.local
# Add your API keys to .env.local
npm run dev
```

## What Projects to Take

**Good:** Culture + technology intersections, music intelligence, civic data, public media, financial literacy through culture, tools for non-traditional builders

**Bad:** Generic SaaS, projects with no domain angle, "build it cheap" requests

## License

All rights reserved. Individual projects may have their own licenses.
