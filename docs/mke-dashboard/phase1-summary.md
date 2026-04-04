# MKE Neighborhood Vitality Dashboard — Phase 1 Summary

**Phase:** Research & Programming (Bumwad Phase 1)
**Date:** April 4, 2026
**Team:** research (Product Discovery), arch (CTO), design (Creative Director)

---

## Executive Summary

Phase 1 is complete. Three teammates worked in parallel — validating data sources, designing architecture, and creating component specs — and coordinated their findings in real time. The result: **we're ready to build, with some important corrections to the original plan.**

The biggest discovery: three MPROP fields the dashboard depends on (tax delinquency, raze orders, building violations) contain placeholder data in the ArcGIS layer. The architecture has been redesigned around this reality, using alternative data sources and a Convex ETL pipeline that joins data from multiple origins.

---

## What's Confirmed Working

### Data Sources (from research)

| Source | Status | Records | Notes |
|--------|--------|---------|-------|
| **MPROP (ArcGIS)** | LIVE | 159,983 parcels, 103 fields | Daily refresh, GeoJSON supported |
| **Neighborhood Boundaries** | LIVE | 190 polygons | Stable, rarely changes |
| **Foreclosed Properties** | LIVE | 1,156 total (928 city + 228 bank) | Nightly refresh, separate layers per type |
| **MPD Crime** | LIVE | 10 crime type layers | Monthly refresh |
| **Government-Owned Properties** | LIVE | 4 layers by jurisdiction | Nightly refresh |
| **Strong Neighborhoods** | LIVE | 1,552 vacant buildings | Corrected URL found |
| **DPW Services** | LIVE | 6 sub-services | Corrected URLs; paving data stale (2019-2021) |
| **data.milwaukee.gov** | LIVE | 253 datasets, CKAN v3 API | Tax delinquent XLSX updated monthly |

**CORS is wide open** (`Access-Control-Allow-Origin: *`) on all Milwaukee ArcGIS endpoints. No proxy strictly required for browser fetching, but the architecture uses one anyway for caching, data joining, and rate-limit protection.

### What Does NOT Work

| Data | Problem | Workaround |
|------|---------|------------|
| **TAX_DELQ** (MPROP) | All 159,983 records = 99999 (sentinel) | Use City Treasurer XLSX from data.milwaukee.gov, join by TAXKEY |
| **RAZE_STATUS** (MPROP) | All records = 9 (sentinel) | Deferred to Phase 2 (requires DNS partnership) |
| **BI_VIOL** (MPROP) | All records = "XXXX" (sentinel) | Deferred to Phase 2 (requires DNS partnership) |
| **HOLC Redlining** (ArcGIS Living Atlas) | `Redlining_Grade/FeatureServer` returns "Invalid URL" | Bundle static GeoJSON from University of Richmond data |
| **Vacant property count** | LAND_USE 8800-8899 returns 150,267 (94% of parcels — wrong) | Use `C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0` for count + Strong Neighborhoods for map points |
| **DPW/MapServer** | Original URL returns 404 | Corrected to individual sub-services (DPW_forestry, DPW_Operations, etc.) |
| **StrongNeighborhood/MapServer** | Original URL returns 404 | Corrected to `StrongNeighborhood/StrongNeighborhood/MapServer` |

---

## Architecture (from arch)

### Stack (Confirmed)

Next.js 15 (App Router) / TypeScript / Tailwind CSS / HeroUI / **Mapbox** GL JS via react-map-gl / Convex / Clerk / CopilotKit / Claude Sonnet 4.6 / next-intl / Recharts / Lucide React

### Data Flow

```
ArcGIS REST ──────────────┐
City Treasurer XLSX ──────┼──(Convex cron/24h)──▶ neighborhoods table ──▶ Browser
Strong Neighborhoods ─────┤     (join by TAXKEY,     (real-time subscriptions)
MPD Crime ────────────────┘      aggregate metrics)
```

**Three-tier fetching:**
1. **Convex** — Pre-aggregated neighborhood metrics (serves <100ms). Cron syncs every 24h from ArcGIS + Treasurer + Strong Neighborhoods + MPD.
2. **Next.js API Route** — Interactive queries (parcel detail, spatial filters). Thin proxy with caching.
3. **Direct client** — Mapbox vector tiles only.

### Key Decisions

- **No auth wall on the dashboard** — public access by default (Philly model). Clerk auth unlocks saved neighborhoods, chat history, and city official features.
- **Convex as ETL + cache** — Critical because MPROP sentinel values mean we MUST join external data server-side. ArcGIS spatial queries take 2-5s; Convex serves cached results in <100ms.
- **HOLC redlining as static GeoJSON** — Historical data that never changes. Pre-fetch and bundle rather than depend on a flaky external API.
- **CopilotKit runtime on API route** — AnthropicAdapter with Claude Sonnet 4.6. Dashboard state readable via useCopilotReadable. Six CopilotKit actions defined (switch neighborhood, show category, compare, trend chart, save, feedback).
- **i18n via next-intl** — 4 locales (en/es/hmn/ar). RTL for Arabic. Font swaps for Arabic script. AI chat is natively multilingual via Claude.

### Route Structure

```
/[locale]/                    → Public dashboard
/[locale]/neighborhood/[slug] → Deep link to neighborhood
/[locale]/compare             → Side-by-side comparison
/[locale]/settings            → Authenticated: saved neighborhoods
/[locale]/admin               → City official: pipeline health, exports
/api/copilotkit               → CopilotKit runtime
/api/arcgis                   → ArcGIS proxy (caching + joining)
```

---

## Component Specs (from design)

### Metric Card

- **Click-to-expand pattern** — collapsed shows one number + trend; expanded shows sparkline, city average comparison, "Ask AI" button
- **Full TypeScript interface** — 15 props covering value, unit, trend (semantic: improving/worsening/stable), category, source with lastUpdated, optional progress bar, optional sparkline
- **8 visual states** — default, loading (skeleton shimmer), error, empty, positive/negative/stable trends, hover, focus, expanded
- **Accessible** — ARIA labels include metric name + value + trend + source. Color never used alone (icon + number + color for trends)
- **Responsive** — mobile single-column, tablet 2-col, desktop 3-4 col grid. Animations respect `prefers-reduced-motion`

### Category Tabs

- **Four categories** — Community (teal), Public Safety (brick), Quality of Life (steel blue), Wellness (plum)
- **HeroUI Tabs with React Aria** — keyboard nav (arrow keys, Home/End), focus management, `role="tablist"` / `role="tab"` / `role="tabpanel"` out of the box
- **Background morph, not underline slide** — handles variable-width labels across languages (Arabic vs English)
- **Mobile: horizontal scroll** with fade indicators if tabs overflow (RTL-aware)
- **44px minimum touch targets** on all breakpoints

### Confirmed Metrics by Category

| Category | Metrics | Count | Data Status |
|----------|---------|-------|-------------|
| **Community** | Total Properties, Owner-Occupied Rate, Median Assessed Value, Schools | 4 | All live API |
| **Public Safety** | Part 1 Crimes, Fire Incidents, Overdose Calls (stretch) | 2-3 | Monthly/nightly refresh |
| **Quality of Life** | Vacant Buildings, Tax-Delinquent Properties, Foreclosures (City), Foreclosures (Bank), Avg Assessed Value | 5 | Mix of live + monthly XLSX |
| **Wellness** | Food Inspection Pass Rate | 1 | Available but optional |

**Total: 12-13 metrics for v1** (vs. Philly's 30). This is appropriate for a prototype targeting 8 neighborhoods.

### Trend Direction Logic

Semantic, not directional — the data layer computes "improving" or "worsening" based on per-metric polarity:
- Crime going DOWN = improving (green)
- Assessed value going DOWN = worsening (red)
- Component receives the semantic value, doesn't decide polarity

---

## Blockers & Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **HOLC redlining data sourcing** | Medium | Need to find or extract Milwaukee GeoJSON from Richmond DSL. Inspect their SPA's network requests, or find a pre-bundled dataset. |
| **Treasurer XLSX parsing** | Medium | Monthly XLSX format may change. Build robust parser in Convex ETL with schema validation. |
| **Vacant property count accuracy** | Medium | Strong Neighborhoods has 1,552 buildings; MPROP class-based query needs validation. Use both sources and reconcile. |
| **Wellness category thin** | Low | Only 1 confirmed metric. Phase 2 partnerships (CDC SVI, MHD, Housing Authority) will fill this. Show honest empty state for now. |
| **ArcGIS rate limits** | Low | No limits observed, but no guarantees. Convex caching + 24h sync protects against hammering. |
| **Paving data stale** | Low | 2019-2021 only. Drop from v1 metrics; add when DPW updates the layer. |

---

## Recommended Next Steps (Phase 2: Schematic Design)

### Immediate (before coding)

1. **Source HOLC redlining GeoJSON for Milwaukee** — inspect Richmond DSL's network requests, search GitHub for pre-bundled datasets, or contact the Richmond team
2. **Download and parse Treasurer XLSX** — validate the schema, identify TAXKEY join field, test joining with MPROP
3. **Validate corrected vacant property query** — run `C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0` against MPROP and compare count to Strong Neighborhoods' 1,552

### Sprint 1 (Foundation)

4. **Scaffold the Next.js project** — follow the build strategy doc's Sprint 1 exactly: project setup + Clerk auth + Mapbox map centered on Milwaukee
5. **Set up Convex** — schema, sync action for one neighborhood (test with Harambee), cron job
6. **Implement MetricCard and CategoryTabs** — the component specs are implementation-ready with TypeScript interfaces, visual states, and animation specs

### Sprint 2 (Data)

7. **Connect ArcGIS data** — MPROP spatial queries, MPD crime, foreclosures, Strong Neighborhoods
8. **Build Treasurer ETL** — XLSX download → parse → join by TAXKEY → upsert to Convex
9. **HOLC redlining overlay** — static GeoJSON on Mapbox with toggle

### Sprint 3+ (AI + Polish)

10. **CopilotKit integration** — runtime, DashboardContext, 6 actions
11. **i18n** — 4 locale files, RTL for Arabic, font swaps
12. **City official features** — admin route, data export, pipeline health

---

## What This Phase Proved

1. **Milwaukee's data infrastructure is real and accessible.** 159,983 properties, 10 crime layers, 190 neighborhood polygons, all queryable via REST with open CORS. The PRD's claim that Milwaukee has the foundation was validated.

2. **The original data dictionary had errors that would have broken the build.** Three MPROP fields (TAX_DELQ, RAZE_STATUS, BI_VIOL) are placeholders. Two service URLs are wrong. The vacant property query returns 94% of all parcels. Research caught all of this before a single line of code was written.

3. **The Bumwad methodology works.** Research before building. The corrected URLs, sentinel value workarounds, and alternative data sources are now documented. Sprint 1 can start with accurate information instead of discovering these issues mid-build.

---

*Phase 1 complete. The research is done, the architecture is designed, the components are specified. Time to build.*
