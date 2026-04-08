# Intersection Studio

## Who We Are

A product studio that builds at the intersection of culture and technology. Founded by Tarik Moody — architect (Howard University), Director of Strategy & Innovation at Radio Milwaukee, host of Rhythm Lab Radio, Army Signal Officer veteran.

Tarik is a product architect, not a developer. He defines problems, designs systems, makes product decisions, and directs AI agents to build. His value is systems thinking + 20 years of domain expertise.

## The Portfolio (20 shipped products)

**Music:** Crate (DJ research, 19 data sources), Crate CLI, Rhythm Lab Radio app
**Civic Tech:** Hakivo (legislative audio briefings), MKE.dev, Budget Compass, REDLINED (3D redlining viz), Badger Ballot
**Public Media:** Radio Milwaukee playlist app (in production), StoryForge, Listening Post, Tribe AI
**Financial Literacy:** BLK Exchange (simulated trading with cultural tickers)
**Food & Culture:** Digero (recipes), Sonic Sommelier (music → dining)
**Dev Tools:** Claude Code Workflow, Clean Code, Shipwright (vibe coding → learning portfolios)
**Career:** PathFinder (AI career learning platform)

## The Methodology — Bumwad Coding

Every project follows architectural design phases:
1. **Research & Programming** — understand the domain, research what exists
2. **Schematic Design** — rough concept, system architecture
3. **Design Development** — detailed specs, PRDs, technical architecture
4. **Refinement** — iterate based on feedback
5. **Construction Documents** — implementation-ready specs

Never skip research. Never start coding before the design phases.

## What Projects to Take

GOOD: Culture + technology intersections, music intelligence, civic data, public media, financial literacy through culture, tools for non-traditional builders, learning-in-public

BAD: Generic SaaS, projects with no domain angle, "build it cheap" requests

## How to Make Decisions

- Domain fit over revenue
- Ship over perfect
- Learn in public — every project becomes a case study
- Architect, don't code — delegate implementation
- Bumwad first — research before building

## Subagents

This project uses subagents defined in `.claude/agents/`. Use them:

- **product-discovery** — market research, competitive analysis, idea validation
- **strategist** — pricing, positioning, pitch decks, business model
- **cto** — technical architecture, stack decisions, code review
- **creative-director** — visual direction, design systems, brand identity
- **content-writer** — case studies, newsletters, blog posts, documentation
- **social-media** — platform-specific posts for LinkedIn, X, Instagram

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
