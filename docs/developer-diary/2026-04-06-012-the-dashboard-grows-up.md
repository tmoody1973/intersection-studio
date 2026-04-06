# Dev Diary #012 — The Dashboard Grows Up

**Date:** 2026-04-06
**Author:** Claude Code (with Tarik Moody)
**Context:** Day 3. The dashboard went through an eng review, got its architecture hardened, and shipped the features that turn it from a data display into something a block club captain would actually use monthly. Nine agent teams worked today. The codebase is now 50+ files, 8K+ lines, 47 tests, and serves real per-neighborhood data from 15+ sources.

---

## What happened

Three acts, each bigger than the last.

**Act 1: The eng review.** An honest look at 3 days of rapid building. 49 files, zero tests, URLs duplicated in three places, a 713-line sync function that could fail completely if Milwaukee's ArcGIS went down for 10 minutes. Eight issues identified, all accepted, all fixed by a 3-agent team working in parallel.

The biggest wins: sync split into 4 independent phases (property, crime, economic, community) that run in parallel and fail independently. A metric registry that reduces "add a new metric" from 7 files to 1 line. Source health tracking that prevents the silent-zero bug that bit us three times. And an MAI cache that eliminates downloading 334,000 address records on every sync.

**Act 2: The resident wishlist.** A design doc written from the perspective of Denise, a block club captain in Harambee, sitting at her laptop at 11pm before a meeting. What does she actually need? Not "59 crimes." She needs "59 crimes, down 8% from last month, down 40% since 2021, here's when they happen, and is the city responding to her 311 reports?"

The Tier 1 features shipped: delta cards with green/red arrows, neighborhood comparison with real Census citywide averages, 5-year trend lines from 883K historical crime records.

Then Tier 2: 311 response times ("avg 12 days to resolve, 67% resolved"), property value trend charts, and a crime heat map with a "When Does Crime Happen?" 24-hour breakdown.

**Act 3: The outreach.** Six emails drafted to the people who need to see this. Philly Stat 360, GovTech, Geo Week News, Data You Can Use, an alderperson template, community org template, and CopilotKit for a case study. The dashboard stops being a prototype when someone outside the building process uses it.

---

## Technical observations

### The metric registry pattern is the best refactor we did

Before:
```
Adding "resolution_rate" metric required editing:
1. useNeighborhoodData.ts (add the metric)
2. METRIC_LABELS map (add translation key)
3. METRIC_POLARITY map (add direction)
4. METRIC_TO_PREV_FIELD map (add previous period key)
5. en.json (add English label)
6. es.json (add Spanish label)
7. hmn.json (add Hmong label)
8. ar.json (add Arabic label)
```

After:
```typescript
// src/lib/metric-registry.ts — ONE LINE
{ id: "resolution_rate", translationKey: "resolutionRate",
  unitKey: "percent", polarity: "higher_is_better",
  category: "qualityOfLife",
  sourceField: "serviceRequestsResolutionRate",
  sourceName: "311 Call Center" }
```

Plus the 4 translation files. But the hook, the polarity map, the previous period map, the label map... all gone. The hook is now a loop over the registry. Adding a metric is a data change, not a code change.

### Source health tracking prevents a whole class of bugs

The 0-vs-null problem hit us three times:

1. WIBR crime CSV returns 0 (city refresh cycle). Dashboard shows 0 crimes. Map shows 27 dots.
2. Accela vacant buildings returns 0. Dashboard shows 0. Map shows 90 dots.
3. Census spatial query grabs adjacent tracts. Population inflated 3x.

Each time: manual fix, debug, redeploy. The source health tracker changes the pattern:

```
Current fetch: crimeTotal = 0
lastKnownGood: crimeTotal = 59
Action: keep 59, log warning "WIBR source may be down"
```

The next time CKAN empties a dataset during refresh, the dashboard keeps showing the last real value instead of silently going to zero. Residents don't see the data disappear. The sync log shows the warning for us to investigate.

### The sync split changes the failure model

Before: one error in the community resources query (libraries, parks, schools) would cascade and kill the entire sync for that neighborhood. No property data, no crime data, no economic data. For 24 hours.

After: property runs first (it produces taxkeys and ZIPs that other phases need). Then crime, economic, and community run in `Promise.all`. If community fails, the dashboard still shows updated crime and property data. Status is "partial" instead of "error."

The difference is between "ArcGIS library layer timed out, so Harambee has no data for a day" and "ArcGIS library layer timed out, library count is stale but everything else is current." That's a meaningful resilience improvement for a civic tool that people rely on.

### The 311 resolution metric is the accountability moment

Philly published 33% on-time response rate for Kensington. That number, published by the city itself, was one of the most discussed data points in the dashboard. It showed the city was being honest, even when the numbers were unflattering.

Our dashboard now computes resolution rates from the 311 data: how many requests are resolved, and how many days it takes on average. The resident doesn't need to know about CKAN resource IDs or date parsing. They see: "Avg 12 days to resolve | 67% resolved." That's the civic accountability metric.

### Crime heat map vs crime dots

Dots show individual incidents. A heat map shows density. The difference matters.

Dots: "There's a dot at 3rd and Keefe. And one on Burleigh. And one on Center."
Heat map: "The area around Fond du Lac and North is red. Everything east of King Drive cools off."

The heat map tells you where to be careful. The dots tell you where something happened once. For personal safety decisions, density matters more than precision.

---

## Personal insights

### The concerned resident wishlist changed the product

The design doc written from Denise's perspective at 11pm before a block club meeting was the turning point. Before that, we were building a dashboard. After that, we were building a tool someone would actually check every month.

The shift: from "how many metrics can we show?" to "can Denise answer her question in 30 seconds?"

Her questions:
- "Is crime getting better or worse?" → delta cards + 5-year trend
- "Is the city responding to our complaints?" → 311 resolution rate
- "How does our neighborhood compare to Sherman Park?" → comparison view
- "When should I walk my dog safely?" → time-of-day crime chart
- "Is investment coming in or displacement happening?" → property value trend + permit investment

Each feature maps to a real question a real person asks. Not a product requirement. A human need.

### Nine agent teams in one day

Today's agent teams:
1. resident-wishlist (Tier 1): deltas, comparison, trends — 3 agents
2. eng-review-fixes: backend resilience, config consolidation, frontend cleanup — 3 agents
3. resident-tier2: 311 response times, property value trends, crime heat map — 3 agents

Nine agents, three teams, zero merge conflicts. Each team decomposed by file boundaries. The pattern works when tasks are genuinely independent.

### The outreach package matters as much as the code

Six emails sitting in `content/outreach/`. None sent yet. The dashboard is technically complete (for now), but it's not a civic tool until someone outside the building process uses it.

The first email should go to Data You Can Use (Milwaukee's NNIP partner). They've been doing this work for 9 years with static reports. A real-time complement to their portraits could be transformative. Or it could be seen as competition. The email's tone matters.

---

## Future considerations

### What's still missing for full Kensington parity

| Kensington has | We have | Gap |
|---|---|---|
| Government authority | Community credibility (Radio Milwaukee) | Needs institutional adoption |
| 311 on-time rates | 311 avg resolution days + % resolved | Close |
| Shelter bed census | Nothing | Needs Housing Authority partnership |
| Behavioral health beds | Nothing | Needs MHD partnership |
| Clean & seal operations | Nothing | Needs DNS partnership |
| Ground-truth survey | Nothing | Would require fieldwork |

The remaining gaps are all partnership-dependent, not technically dependent. The code is ready for any new data source. Adding it is now one line in the metric registry + the ETL function.

### The dashboard needs users, not features

47 tests. 50+ files. 8K+ lines. 15 data sources. 5 category tabs. 30+ metrics. Crime heat maps. Time-of-day charts. 5-year trends. Comparison view. 4 languages. AI chat with generative UI.

The next feature should be: someone uses it. Not someone tests it, not someone reviews it. Someone opens it at a meeting, shows a number, and makes an argument with it.

That's the feature no amount of code can build.

---

## Shower thought

There's a concept in architecture called "post-occupancy evaluation." You design a building, construct it, people move in, and then... you go back a year later and watch how they actually use it. Do they use the front door or the side entrance? Do they sit in the lounge you designed or the hallway you didn't? Does the light work the way the renderings promised?

We're at the post-construction, pre-occupancy stage. The building is done. The systems work. The lights turn on. But nobody lives here yet.

The concerned resident wishlist was our pre-occupancy study. We imagined Denise at 11pm and built for her questions. But we haven't watched Denise actually use it. We don't know if she'll click the comparison button or ignore it. We don't know if the time-of-day chart changes her walking route or just looks interesting.

The next diary entry should be written after someone who isn't us opens this dashboard and says something we didn't expect.

---

*Day 3 complete. 9 agent teams. 7 eng fixes. 6 resident features. 6 outreach emails. 47 tests. Zero users. The building is ready. Time to open the door.*
