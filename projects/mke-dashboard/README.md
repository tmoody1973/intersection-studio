# Milwaukee Neighborhood Vitality Dashboard

> A cross-department civic data platform for transparency, accountability, and community-driven revitalization.

## What It Does

Consolidates Milwaukee's fragmented city data -- property records, crime, foreclosures, vacancies, and more -- into a single, neighborhood-level dashboard that any resident can understand. An AI conversational layer (CopilotKit + Claude) lets people ask questions about their neighborhood in plain English.

No other US city has combined cross-department neighborhood data + historical redlining context + conversational AI in one platform.

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 16 (App Router) | Server Components + API routes in one framework |
| **Language** | TypeScript (strict) | Type safety across ArcGIS, Convex, and CopilotKit |
| **Styling** | Tailwind CSS v4 + HeroUI | Milwaukee civic palette, WCAG AA accessibility |
| **Maps** | Mapbox GL JS via react-map-gl | Vector tiles, fly-to animations, HOLC overlay |
| **Backend** | Convex | Real-time subscriptions, cron sync, serverless ETL |
| **Auth** | Clerk | Public/authenticated/city_official tiers |
| **AI** | CopilotKit + Claude Sonnet 4.6 | Conversational queries, natively multilingual |
| **i18n** | next-intl | English, Spanish, Hmong, Arabic (RTL) |
| **Charts** | Recharts | Sparklines in metric card expanded view |
| **Icons** | Lucide React | 1000+ icons, MIT, tree-shakeable |

## Data Sources

All validated and tested against live endpoints:

| Source | Records | Refresh | Status |
|--------|---------|---------|--------|
| **MPROP** (Master Property Record) | 159,983 parcels, 103 fields | Daily | Live |
| **MPD Crime** | 10 crime type layers | Monthly | Live |
| **Foreclosed Properties** | 1,156 (928 city + 228 bank) | Nightly | Live |
| **Strong Neighborhoods** (vacant buildings) | 1,552 | Live | Live |
| **Neighborhood Boundaries** | 190 polygons | Stable | Live |
| **City Treasurer** (tax delinquent) | Monthly XLSX | Monthly | ETL pipeline |
| **HOLC Redlining** | 112 Milwaukee polygons | Static (1930s) | Bundled GeoJSON |

CORS is open (`*`) on all Milwaukee ArcGIS endpoints. No API keys needed.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Accounts: [Convex](https://convex.dev), [Clerk](https://clerk.com), [Mapbox](https://mapbox.com), [Anthropic](https://console.anthropic.com)

### Installation

```bash
cd projects/mke-dashboard
npm install
```

### Environment

Copy and fill in your API keys:

```bash
cp .env.local.example .env.local
```

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `CONVEX_DEPLOYMENT` | Convex project ID | `npx convex dev` (auto-populated) |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL | `npx convex dev` (auto-populated) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | [clerk.com/dashboard](https://clerk.com/dashboard) |
| `CLERK_SECRET_KEY` | Clerk backend key | [clerk.com/dashboard](https://clerk.com/dashboard) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | [mapbox.com/account](https://account.mapbox.com/access-tokens/) |
| `ANTHROPIC_API_KEY` | Claude API key (for CopilotKit) | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

### Development

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Fonts, metadata, providers
│   ├── page.tsx                # Main dashboard (public, no auth wall)
│   └── api/
│       ├── copilotkit/         # CopilotKit AI runtime
│       └── arcgis/             # ArcGIS proxy (caching + data joining)
├── components/
│   ├── dashboard/
│   │   ├── MetricCard.tsx      # Primary data display (8 visual states)
│   │   ├── CategoryTabs.tsx    # Community / Safety / QoL / Wellness
│   │   ├── MetricsPanel.tsx    # Tabs + card grid
│   │   └── DashboardShell.tsx  # Neighborhood selector + panel
│   ├── map/
│   │   └── DashboardMap.tsx    # Mapbox + neighborhood + HOLC layers
│   └── ui/
│       ├── TrendBadge.tsx      # Improving/worsening/stable indicator
│       └── LoadingSkeleton.tsx # Shimmer loading state
├── lib/
│   ├── constants.ts            # ArcGIS URLs (corrected), categories, queries
│   ├── arcgis.ts               # Query helpers with pagination
│   └── metric-config.ts        # 13 metrics with polarity-based trend logic
├── hooks/
│   └── useNeighborhoodData.ts  # Data hook (sample now, Convex ready)
├── types/
│   └── metrics.ts              # TypeScript interfaces
├── data/
│   └── sample-metrics.ts       # 13 real Milwaukee metrics
└── public/data/
    └── milwaukee_holc.geojson  # 112 HOLC redlining polygons (169KB)

convex/
├── schema.ts                   # 5 tables: neighborhoods, users, syncLogs, chatHistory, feedback
├── neighborhoods.ts            # Public queries: getAll, getBySlug, compare, listNames
├── sync.ts                     # Sync action: ArcGIS + Treasurer → Convex
├── crons.ts                    # 24h sync for 8 neighborhoods (staggered)
└── etl/
    └── arcgis.ts               # Server-side ArcGIS query helpers
```

## Target Neighborhoods (Phase 1)

Eight northside Milwaukee neighborhoods with the highest need and strongest civic infrastructure:

Amani, Borchert Field, Franklin Heights, Harambee, Havenwoods, Lindsay Heights, Metcalfe Park, Sherman Park

## Key Design Decisions

**No auth wall.** The dashboard is publicly accessible. Auth unlocks saved neighborhoods, chat history, and city official features.

**Civic minimalism.** Not Palantir dark-mode. Not ArcGIS clunk. Mobile-first, high contrast, progressive disclosure. The AI handles complex queries so the visual UI stays simple.

**MPROP sentinel values.** Three MPROP fields (TAX_DELQ, RAZE_STATUS, BI_VIOL) contain placeholder data in ArcGIS. Tax delinquency comes from the City Treasurer's monthly XLSX via Convex ETL. Raze orders and building violations are deferred to Phase 2 (requires city partnership).

**Two vacancy metrics.** Undeveloped land (11,414 parcels via `C_A_CLASS = '5'`) and vacant buildings (1,552 via Strong Neighborhoods) measure different things. Both are shown.

**Redlining overlay.** 1930s HOLC grades (A-D) from ArcGIS feature service, bundled as static GeoJSON. Shows how past disinvestment connects to present conditions.

## Documentation

Full research and specs in `docs/mke-dashboard/`:

| Document | What It Contains |
|----------|-----------------|
| `prd-v2.md` | Full product requirements, Philly Kensington comparison |
| `discovery-neighborhood-dashboards.md` | 8 US city dashboards researched |
| `research-data-source-validation.md` | Endpoint testing, sentinel values, corrected URLs |
| `technical-architecture.md` | Stack, data flow, route structure, Convex schema |
| `component-specs-phase1.md` | MetricCard + CategoryTabs implementation specs |
| `mke-style-guide.md` | Colors, typography, spacing, HeroUI theme |
| `mke-data-dictionary.md` | Every field in every dataset |
| `mke-missing-data-sourcing-plan.md` | What data needs city partnerships |
| `phase1-summary.md` | Synthesis of all Phase 1 findings |

## Auth Tiers

| Tier | Who | What They See |
|------|-----|---------------|
| **Public** | Any resident | Full dashboard, all metrics, map, data sources |
| **Authenticated** | Signed-in users | + saved neighborhoods, AI chat history, watchlist alerts |
| **City Official** | Staff with `city_official` role | + raw data export, admin metrics, sync status |

## License

All rights reserved.
