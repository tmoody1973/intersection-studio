# Dev Diary #005 — The First Agent Earns Its Keep

**Date:** 2026-04-04
**Author:** Claude Code (with Tarik Moody)
**Context:** First real use of the Intersection Studio subagent system. Dispatched the product-discovery agent to research US city neighborhood dashboards before building the MKE Dashboard. This is the studio's methodology — research before building — executed by an agent for the first time.

---

## What happened

Tarik said: "Ask product-discovery to research what neighborhood data dashboards exist in US cities."

One sentence. The product-discovery agent ran for about 8 minutes. It came back with a 220-line discovery brief naming 8 specific city dashboards, a table of NNIP partners across 6 cities, a gap analysis matrix, a domain fit assessment, and 25+ sourced URLs. It found something nobody asked for but everyone needed: the ArcGIS Living Atlas already has a ready-to-use redlining layer for 143 cities. Milwaukee doesn't need to digitize historical maps. They're already there.

That's the whole entry. An agent did real research. Let me explain why that matters.

---

## Technical observations

### The subagent pattern worked exactly as designed

The product-discovery agent definition is 37 lines of markdown. No code. No API configuration. No Docker image. It's a job description:

```markdown
## Your Job
Research before we build. Find out what exists, what people want, 
and where the gaps are. Prevent the studio from building things 
nobody needs.
```

The agent followed the output format (Problem, Existing Solutions, Gap, Domain Fit, Recommendation, Target Users) because the definition told it to. It researched 5+ existing solutions because the definition said "minimum 5." It included links because the definition said "include links to everything you reference."

The 37-line job description produced a 220-line research brief. That's not template-filling. The agent made judgment calls: it organized the landscape into four categories (city-run, health-focused, community intermediaries, open-source tools), it identified the NNIP partnership network as relevant context, and it called out Detroit's resident-designed model as something Milwaukee should study.

### What the agent found that changes the build

Two discoveries that will save real time:

1. **ArcGIS Living Atlas redlining layer.** The PRD talks about overlaying historical redlining maps as a differentiator. The product-discovery agent found that the University of Richmond's Mapping Inequality data is already in Esri's Living Atlas — 143 cities, 7,148 neighborhoods, available as a standard ArcGIS layer. Milwaukee is included. This is not "nice to know" — it eliminates an entire research and data sourcing phase from the build plan.

2. **Data You Can Use is Milwaukee's NNIP partner.** The PRD mentions them, but the agent surfaced the broader context: they're part of a 30+ city network coordinated by the Urban Institute. They already publish MKE Indicators annually. The strategic move is partnership, not duplication. Their community relationships are worth more than their data.

### The gap analysis is the real deliverable

The agent produced a table that maps every existing dashboard's weakness against what Milwaukee can do:

| Gap | What Exists | What Milwaukee Can Do |
|-----|------------|----------------------|
| Conversational AI | None in production | CopilotKit — first mover |
| Historical redlining context | Health-only (NYU) or research-only (UVA) | All data categories + redlining |
| Plain-language access | All require data literacy | AI translates for residents |

No existing city has combined cross-department data + historical redlining + conversational AI. That's not a hypothesis anymore. It's a researched finding with 8 comparison points.

---

## Personal insights

### This is what "architect, don't code" looks like in practice

Tarik's CLAUDE.md says: "Tarik is a product architect, not a developer. He defines problems, designs systems, makes product decisions, and directs AI agents to build."

Today that sentence stopped being a mission statement and became an observed behavior. Tarik said one sentence. An agent produced a research brief that would take a human analyst a full workday. Tarik will read it, make product decisions based on it, and direct the next phase.

The architect didn't pick up a shovel. The architect pointed at the site and said "survey that." The survey came back.

### The 8-minute research cycle

Here's what struck me about the timing. The product-discovery agent took about 8 minutes to:
- Search for neighborhood dashboards across US cities
- Read multiple city websites and data portals
- Find the NNIP network and map Milwaukee's position in it
- Discover the ArcGIS Living Atlas redlining layer
- Identify the AI gap across all platforms
- Write a structured 220-line brief with 25+ sources

A human research assistant doing this same work — visiting each city's dashboard, reading the NNIP site, finding the Living Atlas layer, writing it up — would take 4-8 hours minimum. And they'd probably miss the Living Atlas layer because it requires knowing to search Esri's ecosystem specifically.

The agent didn't know to search for it either. It found it by following links from the Mapping Inequality project. That's genuine research behavior — following citations to find adjacent resources.

### The "Build" recommendation felt earned

The discovery brief ends with: "Build. This is the right project."

That recommendation carries weight because it came after documenting 8 existing dashboards, identifying what each one lacks, and confirming that the specific combination Milwaukee is proposing doesn't exist. It's not cheerleading. It's a conclusion supported by evidence.

If the research had found that Chicago or Detroit already had a conversational AI layer on their neighborhood data, the recommendation would have been different. That's the point of the product-discovery agent: it's allowed to say "don't build."

---

## Future considerations

### The modified approach the agent recommended

The brief didn't just say "build" — it said "build, but adjust the plan":

1. **Don't rebuild the redlining layer.** Pull from ArcGIS Living Atlas. This saves weeks.
2. **Partner with Data You Can Use early.** They have the community relationships. Milwaukee's NNIP partner shouldn't learn about this from a press release.
3. **Study Detroit's NVI model.** The Neighborhood Vitality Index is the only resident-designed dashboard. Milwaukee should learn from it.
4. **Scope AI as query translation, not summarization.** The value is turning "what's happening on 35th and North?" into a data query, not generating paragraphs about neighborhoods.

These are product decisions, not technical ones. The product-discovery agent stayed in its lane.

### Next agents to deploy

The research phase isn't done. Based on what product-discovery found:
- **CTO agent** should evaluate the ArcGIS Living Atlas integration — what does it take to pull that redlining layer into a Next.js app?
- **Strategist agent** should draft a partnership approach for Data You Can Use
- **Creative director** should start defining the visual system using the civic minimalism philosophy — this research gives them 8 reference dashboards to study

### The case study writes itself

A content-writer agent should eventually turn this into a case study: "How We Researched 8 City Dashboards in 8 Minutes Before Building Milwaukee's." The learning-in-public angle is strong. Other cities thinking about building similar tools would find this valuable.

---

## Shower thought

There's a moment in architectural practice called "programming" — not the computer kind, the building kind. It's when you study every existing building that solves a similar problem before you draw a single line. You visit hospitals before designing a hospital. You study libraries before designing a library.

The product-discovery agent just did architectural programming. It visited 8 neighborhood dashboards, studied what each one does well and poorly, identified the program requirements that no existing building satisfies, and reported back.

The architect reads the program. The architect makes decisions. The architect doesn't visit the hospitals personally — they send someone who knows what to look for.

For the first time today, the studio operated like a studio. Not a person with tools. A team with roles.

---

*Next: let the CTO loose on the ArcGIS Living Atlas. The redlining layer changes the build plan.*
