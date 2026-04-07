# Intersection Studio — Daily Log

---

## 2026-04-07

- No commits in the last 24 hours. Last active session was 2026-04-04.
- **MKE Dashboard** is the only active project. Working prototype is built.
- Dashboard covers 8 northside Milwaukee neighborhoods (Lindsay Heights, Amani, Harambee, Metcalfe Park, and 4 others)
- 30+ metrics per neighborhood across 4 categories: Community, Public Safety, Quality of Life, Wellness
- Data sources active: ArcGIS REST (MPROP, crime, foreclosures, vacant buildings), CKAN (311, property sales, liquor licenses), Census ACS
- Taxkey join pattern implemented for property sales + liquor licenses (client-side filter against MPROP envelope, works within 2MB payload)
- Three coordinate strategies in use: spatial envelope, ZIP code match, taxkey join
- 7 toggleable map layers including HOLC redlining overlay
- CopilotKit Generative UI wired — AI chat renders charts + tables on demand
- next-intl i18n live in 4 languages: English, Spanish, Hmong, Arabic
- LinkedIn launch post drafted and committed to `docs/mke-dashboard/linkedin-launch-post.md`
- Dev diary entries #007–#009 written and committed
- **Items needing attention:**
  - No deployment yet — prototype runs locally only
  - RAZE_STATUS and BI_VIOL fields deferred (require DNS partnership) — Phase 2
  - Economic ETL committed but production sync behavior unverified
  - LinkedIn post is ready to publish — needs Tarik's review and approval before posting

---

## 2026-04-05

**Project:** MKE Neighborhood Vitality Dashboard (mke-dashboard)
**Day:** 2 of active development

- Added economic data ETL module (`convex/etl/economic.ts`) — property sales, building permits, and liquor licenses via Milwaukee CKAN API
- Updated Convex schema and sync pipeline to include economic metrics across all 8 northside neighborhoods
- Completed i18n for 28 metric labels across all 4 locales (English, Spanish, Hmong, Arabic) — labels and units now fully translate on language switch
- Fixed language selector: switched from `router.refresh()` to `window.location.reload()` per next-intl docs; now correctly reads server-side cookie on locale change
- Fixed header, category tabs, and CopilotKit sidebar to use `useTranslations` hooks rather than hardcoded English strings
- Published 3 docs to `projects/mke-dashboard/docs/`: Community Access & Resources Data, Economic Development & Housing Data, Data Architecture & API Reference v2
- Wrote and committed LinkedIn launch post comparing MKE Dashboard to Philadelphia's Kensington Dashboard
- Dev Diary #008 published: map layers, neighborhood fly-to, i18n architecture
- Dev Diary #009 published: taxkey join pattern, three coordinate strategies, translation pipeline fragility, economic data changing the narrative
- Dashboard now has 30+ data points per neighborhood across 15 data sources, 7 toggleable map layers, HOLC redlining overlay, and CopilotKit Generative UI with 4 chart tools

**Milestone reached:** Day 2 complete — dashboard is at prototype → demo-ready quality. Kensington parity on data breadth achieved.

**Items needing attention:**
- Hmong translations need review by a fluent speaker — labels exist but quality unverified
- Sync performance: ~200 API calls per full cycle (25 per neighborhood × 8); optimize with citywide pre-fetch cache before adding on-demand sync
- Housing tab decision pending (Tarik): economic data currently buried in Quality of Life alongside 311/vacancy — may warrant its own tab
- i18n translation keys have no build-time type safety — new metrics silently fall back to English if keys not added to all 4 locale files

---
