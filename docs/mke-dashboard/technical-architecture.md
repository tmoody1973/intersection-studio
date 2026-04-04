# Milwaukee Neighborhood Vitality Dashboard — Technical Architecture

**Version:** 1.0
**Date:** April 4, 2026
**Author:** CTO — Intersection Studio

---

## Stack Decisions

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 15 (App Router) | Server Components for initial data loads, Route Handlers for API proxying, Server Actions for mutations — all in one framework |
| **Language** | TypeScript (strict mode) | Type safety across ArcGIS response parsing, Convex schemas, and CopilotKit actions |
| **Styling** | Tailwind CSS + HeroUI plugin | HeroUI gives us React Aria accessibility, Framer Motion animations, and i18n/RTL support out of the box — critical for a civic tool |
| **Component Library** | HeroUI (React Aria foundation) | Production-polished for city official demos; built-in a11y beats shadcn/ui for our timeline |
| **Maps** | Mapbox GL JS via react-map-gl | Decision from product owner. Vector tiles, 3D terrain, fly-to animations. Free tier covers 50K loads/mo |
| **Backend** | Convex | Real-time subscriptions for live metric updates, built-in cron jobs for ArcGIS sync, serverless functions for data aggregation |
| **Auth** | Clerk | Three-tier access (public/authenticated/city_official) with JWT templates for Convex integration |
| **AI** | CopilotKit (React SDK + Runtime) | useCopilotReadable/useCopilotAction hooks let the AI read dashboard state and take actions. No other framework offers this React-native pattern |
| **LLM** | Claude Sonnet 4.6 (via Anthropic API) | Best coding model, natively multilingual (English, Spanish, Hmong, Arabic) — no translation API needed for chat |
| **i18n** | next-intl | Best App Router integration. Handles locale routing, RTL, plurals, number/date formatting per locale |
| **Charts** | Recharts | Lightweight, composable, works with React server components pattern |
| **Icons** | Lucide React | 1000+ icons, MIT license, tree-shakeable |
| **Animations** | Framer Motion (via HeroUI) | Already bundled with HeroUI. Reduced motion support built in |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                 │
│                                                                     │
│  Milwaukee ArcGIS Server 10.91          External APIs               │
│  ┌─────────────────────────────┐   ┌──────────────────────┐        │
│  │ MPROP (160K properties)     │   │ Census ACS 5-Year    │        │
│  │ MPD Crime Monthly           │   │ CDC Social Vuln Index│        │
│  │ Foreclosed Properties       │   │ ArcGIS Living Atlas  │        │
│  │ Neighborhood Boundaries     │   │ (HOLC Redlining)     │        │
│  │ Special Districts (BID/TID) │   │ USDA Meal Sites      │        │
│  │ DPW Operations              │   │ FCC Broadband        │        │
│  │ MFD First Due Areas         │   └──────────────────────┘        │
│  │ Strong Neighborhoods        │                                    │
│  └─────────────────────────────┘   Milwaukee Open Data Portal       │
│                                    ┌──────────────────────┐        │
│                                    │ Police Dispatch Calls │        │
│                                    │ Fire Dispatch Calls   │        │
│                                    │ Food Inspections      │        │
│                                    │ 311/UCC Requests      │        │
│                                    └──────────────────────┘        │
└──────────────────────┬──────────────────────┬───────────────────────┘
                       │                      │
                       ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     CONVEX BACKEND                                   │
│                                                                      │
│  ┌─────────────────────┐   ┌──────────────────────────────────────┐ │
│  │ Cron: syncAll        │   │ Internal Action: syncNeighborhood   │ │
│  │ (every 24h)         │──▶│ 1. Fetch boundary polygon            │ │
│  │                     │   │ 2. Spatial query MPROP (paginated)   │ │
│  └─────────────────────┘   │ 3. Aggregate metrics (server-side)   │ │
│                            │ 4. Fetch crime data for boundary     │ │
│  ┌─────────────────────┐   │ 5. Upsert to neighborhoods table    │ │
│  │ Tables:             │   │ 6. Log to syncLogs                   │ │
│  │ • neighborhoods     │   └──────────────────────────────────────┘ │
│  │ • users             │                                            │
│  │ • syncLogs          │   ┌──────────────────────────────────────┐ │
│  │ • feedback          │   │ Public Queries (no auth):            │ │
│  │ • chatHistory       │   │ • getAll neighborhoods + metrics     │ │
│  └─────────────────────┘   │ • getByName (single neighborhood)   │ │
│                            │ • compare (two neighborhoods)        │ │
│                            └──────────────────────────────────────┘ │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Real-time subscriptions
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 15 APP                                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Provider Chain (layout.tsx):                                     │ │
│  │ ClerkProvider > ConvexProviderWithClerk > CopilotKit >          │ │
│  │ IntlProvider > DashboardContext > Page                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Route Handler│  │ Server       │  │ Client Components          │ │
│  │ /api/copilot │  │ Components   │  │ • Map (react-map-gl)       │ │
│  │ /api/arcgis  │  │ (initial     │  │ • MetricCards (HeroUI)     │ │
│  │ (proxy)      │  │  data load)  │  │ • CategoryTabs (HeroUI)    │ │
│  └──────────────┘  └──────────────┘  │ • CopilotSidebar           │ │
│                                      │ • NeighborhoodSelector     │ │
│                                      │ • LanguageSelector         │ │
│                                      └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Route Structure

```
src/app/
├── [locale]/                         # next-intl locale prefix (en, es, hmn, ar)
│   ├── layout.tsx                    # Provider chain, fonts, theme, dir={rtl|ltr}
│   ├── page.tsx                      # PUBLIC — Main dashboard (no auth required)
│   ├── neighborhood/
│   │   └── [slug]/
│   │       └── page.tsx              # PUBLIC — Deep link to specific neighborhood
│   ├── compare/
│   │   └── page.tsx                  # PUBLIC — Side-by-side comparison view
│   ├── sign-in/
│   │   └── [[...sign-in]]/page.tsx   # Clerk sign-in
│   ├── sign-up/
│   │   └── [[...sign-up]]/page.tsx   # Clerk sign-up
│   ├── settings/
│   │   └── page.tsx                  # AUTHENTICATED — User preferences, saved neighborhoods
│   └── admin/
│       ├── layout.tsx                # CITY_OFFICIAL — Role gate (redirect if not authorized)
│       ├── page.tsx                  # Pipeline health, sync logs, feedback review
│       └── export/
│           └── page.tsx              # CITY_OFFICIAL — Raw data CSV export
├── api/
│   ├── copilotkit/
│   │   └── route.ts                  # CopilotKit runtime (AnthropicAdapter + Claude Sonnet)
│   └── arcgis/
│       └── route.ts                  # Proxy for ArcGIS requests (CORS workaround)
└── middleware.ts                      # Clerk auth + next-intl locale routing
```

### Auth Strategy per Route

| Route | Auth | Server/Client | Notes |
|-------|------|---------------|-------|
| `/[locale]` (dashboard) | Public | Server Component for initial data, Client Components for interactivity | No sign-in wall. Philly's model: data is public |
| `/[locale]/neighborhood/[slug]` | Public | Same as above | Shareable deep links |
| `/[locale]/compare` | Public | Client | Two-neighborhood comparison |
| `/[locale]/settings` | Authenticated | Server (role check) + Client | Saved neighborhoods, preferences |
| `/[locale]/admin/*` | `city_official` role | Server (role check) + Client | Pipeline health, exports |
| `/api/copilotkit` | None (rate-limited) | API Route | CopilotKit runtime endpoint |
| `/api/arcgis` | None | API Route | Server-side proxy for ArcGIS REST |

### Server vs Client Component Strategy

**Server Components** (default in App Router):
- Layout shells, page containers, initial data fetching
- Clerk role checks for protected routes
- Static content rendering (headers, footers, data source attribution)

**Client Components** (`"use client"`):
- Map (`react-map-gl` requires WebGL/browser APIs)
- MetricCards (Framer Motion animations, HeroUI interactivity)
- CategoryTabs (keyboard navigation, state management)
- CopilotSidebar (real-time chat, useCopilotReadable/Action)
- NeighborhoodSelector (interactive state changes)
- LanguageSelector (client-side locale switching)
- TimeFilter (updates query parameters)

---

## File/Folder Layout

```
src/
├── app/
│   ├── [locale]/                   # Locale-prefixed routes (see Route Structure above)
│   ├── api/                        # API routes (copilotkit, arcgis proxy)
│   └── middleware.ts               # Clerk + next-intl middleware
│
├── components/
│   ├── dashboard/
│   │   ├── MetricCard.tsx          # Single metric display (HeroUI Card + trend badge)
│   │   ├── MetricsPanel.tsx        # Category tabs + metric card grid (HeroUI Tabs)
│   │   ├── TimeFilter.tsx          # Last month / 6 months / 1 year (HeroUI ButtonGroup)
│   │   ├── NeighborhoodSelector.tsx # Dropdown (mobile) / sidebar list (desktop)
│   │   ├── CompareView.tsx         # Side-by-side neighborhood comparison
│   │   └── DataTableView.tsx       # Accessible table alternative to map
│   ├── map/
│   │   ├── DashboardMap.tsx        # react-map-gl map with all layers
│   │   ├── NeighborhoodLayer.tsx   # Boundary polygon fill + stroke
│   │   ├── ParcelLayer.tsx         # Vacant/delinquent/foreclosed parcel overlays
│   │   ├── CrimeLayer.tsx          # Crime point clusters
│   │   ├── RedliningLayer.tsx      # Historical HOLC grade overlay
│   │   └── CommunityResourceLayer.tsx # Resource point markers
│   ├── layout/
│   │   ├── Header.tsx              # Title + TimeFilter + LanguageSelector + Auth
│   │   ├── Footer.tsx              # Data sources, last sync, attribution
│   │   ├── SkipNavigation.tsx      # Accessibility skip link
│   │   └── MobileNav.tsx           # HeroUI Navbar with hamburger toggle
│   └── ui/
│       ├── TrendBadge.tsx          # Directional arrow + percentage (HeroUI Chip)
│       ├── LanguageSelector.tsx    # Globe icon + locale dropdown
│       └── LoadingSkeleton.tsx     # HeroUI Skeleton patterns for each card type
│
├── copilot/
│   ├── DashboardContext.tsx        # useCopilotReadable for all dashboard state
│   └── actions/
│       ├── switchNeighborhood.ts   # Navigate map to different neighborhood
│       ├── showCategory.ts         # Switch active metric category tab
│       ├── compareNeighborhoods.ts # Open comparison view
│       ├── showTrendChart.ts       # Render Recharts chart in chat (Generative UI)
│       ├── saveNeighborhood.ts     # Add to watchlist (auth required)
│       └── submitFeedback.ts       # Submit feedback via chat (auth required)
│
├── lib/
│   ├── arcgis.ts                   # ArcGIS REST query helpers (server-side)
│   ├── arcgis-types.ts             # TypeScript types for ArcGIS responses
│   ├── neighborhoods.ts            # Static neighborhood data (coordinates, tracts)
│   ├── metric-config.ts            # Metric registry: polarity, categories, ArcGIS queries, trend semantics
│   ├── metrics.ts                  # Metric aggregation logic (from raw MPROP/MPD)
│   ├── auth.ts                     # Clerk helper functions (isAuthenticated, isCityOfficial)
│   ├── constants.ts                # ArcGIS URLs (CORRECTED — see Corrected URLs section), map defaults, category definitions
│   └── utils.ts                    # Shared utilities (formatNumber, formatDate per locale)
│
├── hooks/
│   ├── useNeighborhoodData.ts      # Convex subscription for neighborhood metrics
│   ├── useDashboardState.ts        # Centralized dashboard state (selected neighborhood, category, timeframe)
│   └── useMapLayers.ts             # Active map layer state management
│
├── messages/
│   ├── en.json                     # English (default)
│   ├── es.json                     # Spanish
│   ├── hmn.json                    # Hmong (White Hmong, RPA script)
│   └── ar.json                     # Arabic
│
├── styles/
│   └── globals.css                 # Tailwind directives, font imports, CopilotKit overrides
│
└── i18n/
    ├── request.ts                  # next-intl getRequestConfig
    └── routing.ts                  # Locale routing configuration

convex/
├── schema.ts                       # Database schema (see Convex Schema section)
├── neighborhoods.ts                # Public queries: getAll, getByName, compare
├── users.ts                        # User CRUD: createOrUpdate, saveNeighborhood, preferences
├── sync.ts                         # Internal action: syncNeighborhood (ArcGIS + Treasurer + Strong Neighborhoods → Convex)
├── etl/
│   ├── arcgis.ts                   # ArcGIS REST query helpers (server-side, with pagination)
│   ├── treasurer.ts                # Fetch + parse Treasurer XLSX from data.milwaukee.gov, join by TAXKEY
│   └── strongNeighborhoods.ts      # Fetch vacant buildings from corrected Strong Neighborhoods URL
├── crons.ts                        # Scheduled sync every 24 hours for all 8 neighborhoods
├── feedback.ts                     # Submit + query feedback
├── chatHistory.ts                  # Persist/retrieve AI chat messages
└── auth.config.ts                  # Clerk JWT issuer configuration
```

---

## Data Fetching Strategy

### CORS Finding (validated by research)

Milwaukee's ArcGIS server returns `Access-Control-Allow-Origin: *` on all endpoints. Client-side fetching works without a proxy. However, we still use a server-side layer for: data joining (Treasurer XLSX + MPROP), aggregation, caching, and rate-limit protection.

### CRITICAL: MPROP Sentinel Value Issue

Research validated that three key MPROP fields contain sentinel/placeholder values in the ArcGIS layer — they are NOT populated with real data:

| Field | Sentinel Value | Impact |
|-------|---------------|--------|
| `TAX_DELQ` | `99999` on all 159,983 records | Cannot query tax delinquency from ArcGIS MPROP |
| `RAZE_STATUS` | `9` on all 159,983 records | Cannot query raze orders from ArcGIS MPROP |
| `BI_VIOL` | `"XXXX"` on all records | Cannot query building violations from ArcGIS MPROP |

**Workarounds:**
- **Tax delinquency** — Use City Treasurer's "Delinquent Real Estate Tax Accounts" XLSX from `data.milwaukee.gov` (monthly updates, last updated 2026-03-05). Join by TAXKEY in the Convex sync pipeline.
- **Raze orders / vacant buildings** — Use `StrongNeighborhood/StrongNeighborhood/MapServer` Layer 0 (1,552 vacant buildings as point features). More accurate than MPROP filtering.
- **Building violations** — Not available in Phase 1. Requires DNS partnership (see Missing Data Sourcing Plan).

### Vacant Property Query Correction

The data dictionary recommended `LAND_USE >= 8800 AND LAND_USE < 8900`, but research found this returns 150,267 records (~94% of all parcels) — clearly wrong. The correct approach:

```
-- Option A: Assessment class + no improvements (truly vacant land)
WHERE C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0

-- Option B: Use Strong Neighborhoods vacant buildings layer
StrongNeighborhood/StrongNeighborhood/MapServer/0 (1,552 buildings)
```

The Convex sync action will use Option A for the count metric and Option B for the map point layer.

### The Hybrid Approach

Three tiers of data fetching, each optimized for its access pattern:

```
Tier 1: Convex (cached aggregates + ETL) ── Dashboard metrics, joined data, neighborhood lists
Tier 2: Next.js API Route (thin layer) ───── Interactive map queries, data joining, caching
Tier 3: Direct client fetch ───────────────── ArcGIS GeoJSON (CORS open) + Mapbox tiles
```

### Tier 1: Convex as Aggregation Cache + ETL Pipeline

**What:** Pre-aggregated neighborhood metrics AND joined data from multiple sources (ArcGIS MPROP + Treasurer XLSX + Strong Neighborhoods + MPD).
**When:** Every dashboard page load reads from Convex, not ArcGIS directly.
**Why:** ArcGIS spatial queries are slow (2-5s for MPROP). Convex serves cached results in <100ms with real-time subscriptions. And the MPROP sentinel value issue means we MUST join external data server-side.
**Refresh:** Convex cron job runs `syncNeighborhood` for all 8 neighborhoods every 24 hours. City officials can trigger manual sync.

```
ArcGIS REST ──────────────┐
City Treasurer XLSX ──────┼──(cron/24h)──▶ Convex sync action ──▶ neighborhoods table
Strong Neighborhoods ─────┤                  (join by TAXKEY)            │
MPD Crime ────────────────┘                                              │
                                                                         │
Browser ◀──(real-time subscription)──────────────────────────────────────┘
```

**What Convex caches per neighborhood (13 metric cards):**
- Boundary GeoJSON polygon
- **Community (4 cards):** total properties, owner-occupancy rate, median assessed value, school count
- **Public Safety (3 cards):** Part 1 crime count (with type breakdown + YoY trend), fire incidents, overdose calls
- **Quality of Life (5 cards):** vacant properties (Strong Neighborhoods + MPROP), tax-delinquent count (Treasurer XLSX), city-owned foreclosures (Layer 13), bank-owned foreclosures (Layer 23), avg assessed value
- **Wellness (1 card):** food inspection pass rate (optional)
- Last sync timestamp and status

**ETL Pipeline in Convex sync action:**
1. Fetch neighborhood boundary polygon from `planning/special_districts/MapServer/4` (f=geojson)
2. Spatial query MPROP for properties within boundary (paginate if exceededTransferLimit)
3. Fetch Treasurer delinquent tax XLSX from data.milwaukee.gov, parse, join by TAXKEY
4. Spatial query Strong Neighborhoods Layer 0 for vacant buildings within boundary
5. Spatial query Foreclosed Properties Layer 13 (city) and Layer 23 (bank) within boundary
6. Query MPD crime layers (10 layers) within boundary for current period
7. Aggregate all metrics, compute trends using metric registry polarity
8. Upsert to neighborhoods table

### Tier 2: Next.js API Route (Thin Layer)

**What:** Interactive, on-demand queries that users trigger — clicking a parcel on the map, filtering by specific criteria, requesting raw property data.
**When:** User interactions that need fresh, filtered ArcGIS data beyond what Convex caches.
**Why:** Even though CORS is open, a thin API layer gives us: response caching (stale-while-revalidate), request validation (whitelist allowed service paths), data joining for parcel-level detail, and rate-limit protection for ArcGIS.

```typescript
// src/app/api/arcgis/route.ts
// Thin layer over ArcGIS with:
// - Cache-Control headers (stale-while-revalidate for 5 minutes)
// - Request validation (whitelist allowed service paths)
// - Treasurer data joining for parcel-level tax delinquency
// - Error normalization
// - Pagination handling (checks exceededTransferLimit, auto-paginates)
```

**Use cases:**
- User clicks a parcel on the map → fetch MPROP detail + Treasurer tax status for that TAXKEY
- User clicks "Show vacant parcels" → spatial query using corrected WHERE clause
- City official requests raw data export → paginated MPROP fetch with all fields
- AI action needs fresh data for a specific question

### Tier 3: Direct Client Fetch

**What:** ArcGIS GeoJSON for lightweight map layers + Mapbox vector tiles.
**When:** Map rendering and simple overlay layers.
**Why:** CORS is open on ArcGIS (`*`). Mapbox serves tiles from CDN. Small GeoJSON responses (neighborhood boundaries, special districts) can go directly to the browser.

**Direct client fetch candidates:**
- Mapbox base map tiles (automatic via react-map-gl)
- Neighborhood boundary polygon (single feature, small payload — can fetch client-side as fallback)
- Special district overlays (BID, TID, Historic) — small polygon layers, fetched on-demand when user toggles

**NOT direct client fetch:**
- MPROP parcel data (needs Treasurer join for tax delinquency)
- Crime aggregates (need spatial intersection + aggregation)
- Anything requiring pagination (exceededTransferLimit handling)

### Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Neighborhood metrics | Convex table | 24h (cron refresh) | Manual sync button (admin) |
| Boundary GeoJSON | Convex table | Until manually updated | 190 polygons, rarely change — cache aggressively |
| Treasurer tax delinquency | Convex table (joined during sync) | 24h | Monthly XLSX from data.milwaukee.gov |
| Parcel-level data (on-demand) | Next.js `fetch` cache | 5 min `stale-while-revalidate` | Automatic |
| Census/ACS data | Convex table | 30 days | Manual (annual ACS release) |
| HOLC redlining GeoJSON | Static import (bundled in repo) | Permanent | 1930s historical data never changes |
| Mapbox tiles | Mapbox CDN | Automatic | Managed by Mapbox |

### Pagination Strategy

ArcGIS services have varying `maxRecordCount` limits:
- MPROP: 200,000 (generous — full dataset fits in one query, but spatial queries with geometry may still paginate)
- All other services: 2,000

Every ArcGIS query must check the `exceededTransferLimit` flag in the response. If `true`, re-query with `resultOffset` incremented by `maxRecordCount` until all records are retrieved. The Convex sync action handles this automatically.

### Corrected ArcGIS Service URLs

Research validated all endpoints. The following URLs differ from the original documentation and MUST be used in `src/lib/constants.ts`:

```typescript
// src/lib/constants.ts
const ARCGIS_BASE = "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";

const ARCGIS_SERVICES = {
  // Property
  mprop: `${ARCGIS_BASE}/property/parcels_mprop/MapServer/2`,
  foreclosedCityOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/13`,
  foreclosedBankOwned: `${ARCGIS_BASE}/property/foreclosed_properties/MapServer/23`,
  govtOwned: `${ARCGIS_BASE}/property/govt_owned/MapServer`,

  // Boundaries
  neighborhoods: `${ARCGIS_BASE}/planning/special_districts/MapServer/4`,
  specialDistricts: `${ARCGIS_BASE}/planning/special_districts/MapServer`,

  // Crime (10 layers: Homicide=4, Arson, SexOffense, CriminalDamage, Robbery, Burglary, Theft, VehicleTheft, LockedVehicle, Assault)
  mpdMonthly: `${ARCGIS_BASE}/MPD/MPD_Monthly/MapServer`,

  // DPW — CORRECTED: 6 separate services, NOT a single DPW/MapServer
  dpwForestry: `${ARCGIS_BASE}/DPW/DPW_forestry/MapServer`,
  dpwOperations: `${ARCGIS_BASE}/DPW/DPW_Operations/MapServer`,
  dpwSanitation: `${ARCGIS_BASE}/DPW/DPW_Sanitation/MapServer`,
  dpwStreetcar: `${ARCGIS_BASE}/DPW/DPW_streetcar/MapServer`,
  parkingMeters: `${ARCGIS_BASE}/DPW/ParkingMeters/MapServer`,
  pavingProgram: `${ARCGIS_BASE}/DPW/paving_program/MapServer`, // STALE: 2019-2021 only

  // Strong Neighborhoods — CORRECTED: double path
  strongNeighborhoods: `${ARCGIS_BASE}/StrongNeighborhood/StrongNeighborhood/MapServer`,
  // Layer 0: Vacant Buildings (1,552 points)
  // Layer 1: City-owned real estate inventory

  // Fire
  mfdFirstDue: `${ARCGIS_BASE}/MFD/First_Due_Areas/MapServer`,

  // Environment
  eco: `${ARCGIS_BASE}/ECO/MapServer`,
  mmsdGreenInfra: `${ARCGIS_BASE}/ECO/MMSD_GI_plan/MapServer`,

  // Elections
  elections: `${ARCGIS_BASE}/election/MapServer`,
} as const;

// data.milwaukee.gov (CKAN API v3) — for Treasurer XLSX, dispatch calls, food inspections
const OPEN_DATA_BASE = "https://data.milwaukee.gov";
const TREASURER_TAX_DELINQUENT_URL =
  "https://data.milwaukee.gov/dataset/f376a61a-b279-4ff5-b6da-776a3df14ca0";
```

**Key corrections from documented URLs:**
- `DPW/MapServer` → 6 separate services (`DPW/DPW_forestry/MapServer`, etc.)
- `StrongNeighborhood/MapServer` → `StrongNeighborhood/StrongNeighborhood/MapServer`
- Foreclosed Properties layers: city-owned = Layer 13, bank-owned = Layer 23 (not a single layer)
- Paving program data is stale (2019-2021 only) — deprioritize in Phase 1

---

## CopilotKit Integration Architecture

### Runtime

```typescript
// src/app/api/copilotkit/route.ts
import { CopilotRuntime, AnthropicAdapter } from "@copilotkit/runtime";

const runtime = new CopilotRuntime();

export async function POST(req: Request) {
  const adapter = new AnthropicAdapter({
    model: "claude-sonnet-4-6-20250514",
  });
  return runtime.response(req, adapter);
}
```

### Dashboard Context (World Monitor Pattern)

```typescript
// src/copilot/DashboardContext.tsx
// Wraps the entire dashboard and provides AI-readable context

function DashboardContext({ children }: { children: React.ReactNode }) {
  const { selectedNeighborhood, metrics, activeCategory, timeframe } = useDashboardState();
  const { user } = useUser(); // Clerk

  // Make dashboard state readable by the AI
  useCopilotReadable({
    description: "Currently selected Milwaukee neighborhood",
    value: selectedNeighborhood,
  });

  useCopilotReadable({
    description: "Dashboard metrics for the selected neighborhood across all categories",
    value: metrics,
  });

  useCopilotReadable({
    description: "Active category tab and time filter",
    value: { category: activeCategory, timeframe },
  });

  useCopilotReadable({
    description: "Available neighborhoods for navigation",
    value: NEIGHBORHOODS.map(n => n.name),
  });

  // Register all actions
  useSwitchNeighborhoodAction();
  useShowCategoryAction();
  useCompareNeighborhoodsAction();
  useShowTrendChartAction();
  if (user) {
    useSaveNeighborhoodAction();
    useSubmitFeedbackAction();
  }

  return <>{children}</>;
}
```

### CopilotKit Actions

| Action | Parameters | What It Does | Auth Required |
|--------|-----------|-------------|---------------|
| `switchNeighborhood` | `name: string` | Navigates map + metrics to a different neighborhood | No |
| `showCategory` | `category: string` | Switches the active metric category tab | No |
| `compareNeighborhoods` | `name1, name2: string` | Opens comparison view with both neighborhoods | No |
| `showTrendChart` | `metric: string, months: number` | Renders a Recharts chart inline in chat (Generative UI) | No |
| `saveNeighborhood` | none (uses current) | Saves current neighborhood to user's watchlist | Yes |
| `submitFeedback` | `category, message: string` | Submits feedback about the neighborhood | Yes |

### AI System Instructions

The CopilotKit runtime receives system instructions that:
1. Identify the AI as "Milwaukee Neighborhood Data Assistant"
2. Instruct it to respond in the user's selected locale (English/Spanish/Hmong/Arabic)
3. Ground all answers in the data provided via `useCopilotReadable` — never hallucinate numbers
4. When data is unavailable, say so transparently: "This data isn't tracked yet"
5. For city officials: include data pipeline health context
6. Explain the historical redlining connection when relevant

---

## Mapbox + ArcGIS Overlay Strategy

### The Challenge

Milwaukee's ArcGIS data lives in ArcGIS REST services. Mapbox renders vector tiles. We need to bridge these two systems.

### Approach: GeoJSON Sources on Mapbox

Mapbox GL JS supports adding GeoJSON as a data source via `map.addSource()`. We fetch GeoJSON from ArcGIS (requesting `f=geojson` and `outSR=4326`), then render it as Mapbox layers.

```
ArcGIS REST ──(f=geojson, outSR=4326)──▶ Next.js proxy ──▶ Mapbox GeoJSON Source ──▶ Mapbox Layer
```

### Layer Stack (bottom to top)

| Layer | Source | Type | Rendering |
|-------|--------|------|-----------|
| **Base map** | Mapbox `light-v11` style | Vector tiles | Mapbox CDN (automatic) |
| **HOLC Redlining** | ArcGIS Living Atlas FeatureServer, pre-fetched as static GeoJSON | Fill | Grade A-D colored fills at 15% opacity (see style guide) |
| **Neighborhood boundary** | Convex cache (fetched from ArcGIS `planning/special_districts/4`) | Fill + Line | Lakeshore teal at 8% fill, 2.5px stroke |
| **Special districts** | ArcGIS `planning/special_districts` (BID, TID, Historic) | Line (dashed) | On-demand toggle, distinct dash patterns |
| **Parcel overlays** | ArcGIS MPROP via proxy (spatial query within boundary) | Fill | Vacant=red, Tax-delinquent=amber, Foreclosed=deep red (see style guide) |
| **Crime points** | Convex cache (aggregated from MPD Monthly) | Circle + Cluster | Clustered at zoom <14, individual points at zoom >=14 |
| **Community resources** | Convex cache (compiled from 211 + manual) | Symbol | Categorized icons (food, health, shelter) |
| **DPW projects** | ArcGIS DPW MapServer (paving layer) | Line | Active paving projects highlighted |

### HOLC Redlining Layer

**Status update from research:** Both the ArcGIS Living Atlas `Redlining_Grade/FeatureServer` (returns "Invalid URL") and the University of Richmond DSL (SPA blocks direct GeoJSON downloads) are unavailable as live data sources.

**Strategy:** Bundle Milwaukee's HOLC polygons as a static GeoJSON file in the repo (`public/data/milwaukee-holc.geojson`). This is 1930s historical data that never changes. Source options:
1. Inspect the Richmond DSL SPA's network requests for an internal API endpoint
2. Find a pre-downloaded GeoJSON from other open-source projects that bundle HOLC data (many exist on GitHub)
3. Search ArcGIS Hub for HOLC datasets uploaded by other organizations
4. Contact the Richmond DSL team for bulk download access

Load as a Mapbox source with fill colors per grade:

| HOLC Grade | Color | Opacity | Meaning |
|------------|-------|---------|---------|
| A ("Best") | `#22C55E` (green) | 15% | Historically highest investment |
| B ("Still Desirable") | `#3B82F6` (blue) | 15% | Second tier |
| C ("Declining") | `#EAB308` (yellow) | 15% | Flagged for decline |
| D ("Hazardous") | `#EF4444` (red) | 15% | Redlined — denied investment |

Toggle on/off via a map control. When enabled, the AI context includes HOLC grade for the selected neighborhood so it can narrate the historical connection.

### Performance: Rendering 160K+ MPROP Parcels

You cannot load all 160K MPROP records at once. Strategy:

1. **Neighborhood polygon as spatial filter** — Every MPROP query uses the selected neighborhood boundary as `geometryType=esriGeometryPolygon` + `spatialRel=esriSpatialRelIntersects`. This reduces results from 160K to 1K-5K parcels per neighborhood.

2. **Pagination** — ArcGIS limits results to 2,000 per request. Use `resultOffset` to paginate. The Convex sync action handles this server-side.

3. **Map clustering** — For crime points and community resources, use Mapbox's built-in clustering (`cluster: true` on the GeoJSON source). Shows aggregate counts at low zoom, individual points when zoomed in.

4. **Viewport-based loading** — For parcel-level overlays (clicked by user, not default), only fetch parcels within the current map viewport bounds, not the entire neighborhood.

5. **Simplify geometry** — When fetching boundary polygons, use `maxAllowableOffset=10` on ArcGIS queries to reduce vertex count for display purposes. Full-resolution geometry only needed for spatial queries.

---

## Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  neighborhoods: defineTable({
    name: v.string(),                    // "Harambee", "Sherman Park", etc.
    slug: v.string(),                    // "harambee", "sherman-park"
    boundary: v.any(),                   // GeoJSON FeatureCollection (polygon)
    population: v.number(),
    censusTract: v.array(v.string()),

    // Aggregated metrics (refreshed every 24h by sync cron)
    metrics: v.object({
      community: v.object({
        totalProperties: v.number(),
        ownerOccupancyRate: v.number(),  // percentage
        medianAssessedValue: v.number(),
        schoolCount: v.number(),
        // Phase 2: communityResources, mealSites, wifiLocations
      }),
      publicSafety: v.object({
        crimeCount: v.number(),          // Part 1 crimes in timeframe (aggregate)
        crimeByType: v.any(),            // Array<{ label, value }> for breakdown bar chart
        crimeYoYChange: v.number(),      // Feeds trend badge on crimeCount card (not a separate card)
        fireIncidents: v.number(),
        overdoseCalls: v.optional(v.number()), // Moved from Wellness — MFD dispatch data fits Public Safety
        // Phase 2: dispatchCalls, narcoticsArrests
      }),
      qualityOfLife: v.object({
        vacantProperties: v.number(),           // Primary: Strong Neighborhoods Layer 0 (1,552 vacant buildings)
                                                // Supplemental: MPROP C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0 for vacant land
                                                // Single "Vacant Properties" card combines both sources
        taxDelinquentProperties: v.number(),    // From Treasurer XLSX monthly (NOT MPROP — sentinel values)
        foreclosuresCityOwned: v.number(),      // From foreclosed_properties Layer 13
        foreclosuresBankOwned: v.number(),      // From foreclosed_properties Layer 23
        avgAssessedValue: v.number(),
        // Raze Orders REMOVED from Phase 1 — no public API (MPROP RAZE_STATUS is sentinel)
        // Phase 2: codeViolations (DNS partnership), 311ResponseRate, pavingProjects
      }),
      wellness: v.object({
        foodInspectionPassRate: v.optional(v.number()),
        // overdoseCalls moved to publicSafety (MFD dispatch data, better categorical fit)
        // Phase 2: shelterBeds, leadAbatement, airQuality, behavioralHealth
      }),
    }),

    // Trend data (last 12 months of snapshots for sparklines + trend computation)
    // Each entry: { month: "2026-04", metrics: { vacantProperties: 142, crimeCount: 87, ... } }
    // Capped at 12 entries. Used for: (a) computing trend.direction via metric polarity config,
    // (b) providing sparkline data to expanded MetricCard view
    metricHistory: v.optional(v.any()), // Array of { month, metrics }

    // HOLC historical grade (if applicable — static, set once)
    holcGrade: v.optional(v.string()),  // "A", "B", "C", "D", or null

    lastSync: v.number(),               // Unix timestamp
    syncStatus: v.string(),             // "success" | "partial" | "failed"
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.string(),                    // "resident" | "city_official"
    savedNeighborhoods: v.array(v.string()), // slugs
    watchlist: v.array(v.string()),      // slugs for alert notifications
    preferences: v.object({
      defaultNeighborhood: v.optional(v.string()),
      defaultCategory: v.optional(v.string()),
      locale: v.optional(v.string()),
      theme: v.optional(v.string()),     // "light" | "dark"
    }),
  })
    .index("by_clerkId", ["clerkId"]),

  chatHistory: defineTable({
    userId: v.string(),                  // Clerk user ID
    messages: v.any(),                   // Last 50 messages array
    lastUpdated: v.number(),
  })
    .index("by_userId", ["userId"]),

  syncLogs: defineTable({
    timestamp: v.number(),
    neighborhoodName: v.string(),
    status: v.string(),                  // "success" | "failed"
    recordsFetched: v.number(),
    durationMs: v.number(),
    errors: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_neighborhood", ["neighborhoodName"]),

  feedback: defineTable({
    userId: v.optional(v.string()),
    neighborhoodName: v.string(),
    category: v.string(),                // "data_accuracy" | "feature_request" | "general"
    message: v.string(),
    timestamp: v.number(),
    status: v.string(),                  // "new" | "reviewed" | "resolved"
  })
    .index("by_neighborhood", ["neighborhoodName"])
    .index("by_status", ["status"]),
});
```

### Convex Table Relationships

```
users ──(savedNeighborhoods: slug[])──▶ neighborhoods (by_slug)
users ──(clerkId)──▶ chatHistory (by_userId)
users ──(clerkId)──▶ feedback (by userId)
syncLogs ──(neighborhoodName)──▶ neighborhoods (by_name)
```

---

## Metric Configuration & Data Shape Contract

### The Problem

When crime goes down, that's "improving." When median income goes down, that's "worsening." The frontend component should not contain this logic — it just renders what it's told. The semantic trend direction must be computed in the data pipeline (Convex sync action) using per-metric configuration.

### Metric Registry

```typescript
// src/lib/metric-config.ts

type TrendPolarity = "lower_is_better" | "higher_is_better";

interface MetricConfig {
  id: string;
  category: "community" | "publicSafety" | "qualityOfLife" | "wellness";
  labelKey: string;           // next-intl translation key
  unit: string;               // "parcels", "incidents", "%", "$"
  source: string;             // "MPROP REST", "MPD Monthly", etc.
  polarity: TrendPolarity;    // Determines if decrease = improving or worsening
  hasBreakdown?: boolean;     // If true, Convex sync populates a breakdown array
                              // for the expanded card view (e.g., crime by type)
  computeFromMPROP?: {        // How to derive this metric from raw MPROP data
    where: string;            // ArcGIS WHERE clause
    aggregation: "count" | "average" | "rate";
    rateNumerator?: string;   // For rate: WHERE clause for numerator
  };
}

const METRIC_REGISTRY: MetricConfig[] = [
  // Quality of Life
  {
    id: "vacantProperties",
    category: "qualityOfLife",
    labelKey: "metrics.vacantProperties",
    unit: "properties",
    source: "Strong Neighborhoods + MPROP REST",
    polarity: "lower_is_better",      // fewer vacants = improving
    // Primary: Strong Neighborhoods Layer 0 (1,552 confirmed vacant buildings — point features)
    // Supplemental: MPROP C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0 for vacant land parcels
    // Convex sync combines both sources into one count
    computeFromMPROP: {
      where: "C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0",
      aggregation: "count",
    },
  },
  {
    id: "taxDelinquentProperties",
    category: "qualityOfLife",
    labelKey: "metrics.taxDelinquent",
    unit: "parcels",
    source: "City Treasurer (data.milwaukee.gov)",
    polarity: "lower_is_better",
    // CANNOT use MPROP ArcGIS — TAX_DELQ field has sentinel value 99999 on all records.
    // Source: Treasurer XLSX from data.milwaukee.gov, joined by TAXKEY in Convex sync.
    computeFromMPROP: undefined,
  },
  // Raze Orders REMOVED from Phase 1 — MPROP RAZE_STATUS has sentinel value 9 on all records,
  // and no public API exists for DNS raze order data. Deferred to Phase 2 (city partnership).
  {
    id: "avgAssessedValue",
    category: "qualityOfLife",
    labelKey: "metrics.avgAssessedValue",
    unit: "$",
    source: "MPROP REST",
    polarity: "higher_is_better",     // higher property values = improving
    computeFromMPROP: {
      where: "C_A_TOTAL > 0",
      aggregation: "average",
    },
  },
  // Quality of Life — Foreclosures (split into two cards per design specs)
  {
    id: "foreclosuresCityOwned",
    category: "qualityOfLife",
    labelKey: "metrics.foreclosuresCityOwned",
    unit: "properties",
    source: "Foreclosed Properties REST",
    polarity: "lower_is_better",
  },
  {
    id: "foreclosuresBankOwned",
    category: "qualityOfLife",
    labelKey: "metrics.foreclosuresBankOwned",
    unit: "properties",
    source: "Foreclosed Properties REST",
    polarity: "lower_is_better",
  },
  // Public Safety
  {
    id: "crimeCount",
    category: "publicSafety",
    labelKey: "metrics.crimeIncidents",
    unit: "incidents",
    source: "MPD Monthly",
    polarity: "lower_is_better",
    // Collapsed card shows aggregate Part 1 count.
    // Expanded card shows breakdown bar chart via `breakdown` field.
    // Convex sync populates breakdown: [{ label: "Assault", value: 12 }, ...]
    hasBreakdown: true,
  },
  {
    id: "fireIncidents",
    category: "publicSafety",
    labelKey: "metrics.fireIncidents",
    unit: "incidents",
    source: "MFD Dispatch",
    polarity: "lower_is_better",
  },
  {
    id: "overdoseCalls",
    category: "publicSafety",          // Moved from Wellness — MFD dispatch data
    labelKey: "metrics.overdoseCalls",
    unit: "calls",
    source: "MFD Dispatch",
    polarity: "lower_is_better",
  },
  // Community
  {
    id: "ownerOccupancyRate",
    category: "community",
    labelKey: "metrics.ownerOccupancy",
    unit: "%",
    source: "MPROP REST",
    polarity: "higher_is_better",
    computeFromMPROP: {
      where: "1=1",
      aggregation: "rate",
      rateNumerator: "OWN_OCPD = 'O'",
    },
  },
  {
    id: "medianAssessedValue",
    category: "community",
    labelKey: "metrics.medianAssessedValue",
    unit: "$",
    source: "MPROP REST",
    polarity: "higher_is_better",
  },
  // Wellness
  {
    id: "foodInspectionPassRate",
    category: "wellness",
    labelKey: "metrics.foodInspectionPassRate",
    unit: "%",
    source: "Open Data Portal",
    polarity: "higher_is_better",
  },
  // overdoseCalls moved to publicSafety (see above)
];
```

### Trend Computation in Convex Sync

The Convex `syncNeighborhood` action computes trends using the metric registry:

```typescript
// Inside convex/sync.ts — after fetching current period and previous period data

function computeTrend(
  current: number,
  previous: number,
  polarity: TrendPolarity
): { direction: "improving" | "worsening" | "stable"; percentage: number } {
  if (previous === 0) return { direction: "stable", percentage: 0 };

  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);

  if (absChange < 2) return { direction: "stable", percentage: absChange };

  const isIncrease = change > 0;
  const direction =
    polarity === "higher_is_better"
      ? isIncrease ? "improving" : "worsening"
      : isIncrease ? "worsening" : "improving";

  return { direction, percentage: absChange };
}
```

### Data Shape Contract (Frontend ← Convex)

The Convex `getByName` query returns data shaped to match the `MetricCardProps` interface from the component specs. Each metric includes:

```typescript
interface NeighborhoodMetric {
  id: string;
  label: string;                          // Translation key
  value: number | null;
  unit: string;
  trend: {
    direction: "improving" | "worsening" | "stable";
    percentage: number;
    comparedTo: string;                   // "vs. last quarter"
  } | null;
  category: "community" | "publicSafety" | "qualityOfLife" | "wellness";
  source: { name: string; lastUpdated: string };
  progress?: { value: number; label: string };
  sparkline?: { data: Array<{ period: string; value: number }>; periodType: string };

  /** Optional sub-category breakdown for expanded view.
   *  Used by: crimeCount (Crime by Type bar chart), foreclosures (city vs bank split).
   *  Collapsed card shows aggregate `value`. Expanded card renders breakdown as
   *  horizontal bar chart via Recharts BarChart. */
  breakdown?: Array<{ label: string; value: number }>;
}
```

### Sparkline Data: Historical Snapshots

To provide sparkline data for the expanded card view, the Convex sync action stores a rolling window of metric snapshots:

- Each sync run appends a `{ month: "2026-04", metrics: {...} }` entry to the `metricHistory` array on the neighborhood record
- The array is capped at 12 entries (1 year of monthly snapshots)
- When the frontend requests sparkline data, it reads from `metricHistory` and extracts the relevant metric's values across periods
- This means sparklines are available after the second sync run (first run has no previous data to compare)

---

## Internationalization Architecture

### next-intl Setup

```
src/
├── i18n/
│   ├── request.ts          # getRequestConfig — loads messages for active locale
│   └── routing.ts          # defineRouting — locales: ['en', 'es', 'hmn', 'ar'], default: 'en'
├── messages/
│   ├── en.json             # ~200 keys: dashboard.title, categories.*, metrics.*, actions.*, ai.*
│   ├── es.json             # Spanish
│   ├── hmn.json            # Hmong (White Hmong, RPA)
│   └── ar.json             # Arabic
└── middleware.ts            # Combines Clerk middleware + next-intl locale detection
```

### URL Structure

```
/en/                        # English dashboard
/es/                        # Spanish dashboard
/hmn/                       # Hmong dashboard
/ar/                        # Arabic dashboard (RTL)
/en/neighborhood/harambee   # Deep link with locale
```

### RTL Support

When locale is `ar`:
- `<html lang="ar" dir="rtl">` set in layout.tsx
- All Tailwind utilities use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`)
- HeroUI components handle RTL automatically (React Aria)
- Mapbox map controls remain LTR (standard for maps)
- Body font swaps from DM Sans to IBM Plex Sans Arabic
- Display font swaps from Fraunces to Noto Serif Arabic

### Three Translation Layers

| Layer | Mechanism | Content |
|-------|-----------|---------|
| **Static UI** | next-intl JSON files | Buttons, labels, headers, metric names, category tabs |
| **AI Chat** | Claude's native multilingual | CopilotKit instructions tell Claude to respond in the user's locale |
| **Dynamic Data** | Numbers are universal; labels from next-intl | Metric values display with locale-appropriate number formatting via `@formatjs/intl-numberformat` |

---

## Performance Strategy

### Initial Page Load

1. **Server Component renders layout** — Header, footer, skeleton states. No JS needed.
2. **Convex subscription hydrates** — Neighborhood list + metrics for default neighborhood load from Convex (<100ms).
3. **Map initializes** — Mapbox GL JS loads, renders base tiles. Neighborhood boundary GeoJSON from Convex cache renders as layer.
4. **Client components hydrate** — MetricCards animate in (staggered 60ms), tabs become interactive.

**Target:** First Contentful Paint <1.5s, Time to Interactive <3s.

### Runtime Performance

| Operation | Strategy | Expected Latency |
|-----------|----------|-----------------|
| Switch neighborhood | Read from Convex cache | <100ms |
| Toggle category tab | Client-side state change | Instant |
| Change time filter | Re-read from Convex (different aggregation window) | <200ms |
| Show parcel overlay | On-demand ArcGIS query via proxy (spatial filter) | 1-3s |
| AI chat response | CopilotKit → Anthropic API (streaming) | First token <1s |
| Map fly-to animation | Mapbox GL JS built-in | 800ms |
| Load HOLC overlay | Static GeoJSON (bundled) | Instant |

### Bundle Optimization

- **Mapbox GL JS** (~700KB) — loaded via dynamic import, only on pages with map
- **HeroUI** — tree-shakeable, import only used components
- **Recharts** — dynamic import, only loaded when user requests trend charts
- **Framer Motion** — included via HeroUI, tree-shakeable
- **next-intl** — only loads the active locale's message file

---

## Deployment Plan

### Platform: Vercel

Next.js 15 on Vercel gives us:
- Edge middleware for locale detection and auth
- Automatic static optimization for non-dynamic pages
- Serverless functions for API routes (copilotkit runtime, arcgis proxy)
- Preview deployments for each PR (demo to city officials from preview URLs)
- Analytics and Web Vitals tracking

### Environment Variables

```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...

# Backend
CONVEX_DEPLOYMENT=mke-dashboard
NEXT_PUBLIC_CONVEX_URL=https://mke-dashboard.convex.cloud

# AI
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL=/api/copilotkit
```

### Deployment Pipeline

```
Local dev (npm run dev)
    │
    ▼
Push to GitHub ──▶ Vercel Preview Deploy (automatic per branch)
    │                    │
    │                    ▼
    │              City official review on preview URL
    │
    ▼
Merge to main ──▶ Vercel Production Deploy
                     │
                     ▼
              Convex Production (auto-deployed via convex deploy)
```

### Monitoring

| What | Tool |
|------|------|
| Frontend performance | Vercel Analytics (Web Vitals) |
| API route errors | Vercel Logs |
| Convex sync health | Custom admin dashboard (city_official role) + Convex dashboard |
| AI usage/costs | Anthropic Console usage tracking |
| Uptime | Vercel status + Convex status |

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| ArcGIS proxy abuse | Rate limiting on `/api/arcgis` route. Whitelist only Milwaukee ArcGIS service paths. |
| CopilotKit token costs | Rate limiting on `/api/copilotkit`. Consider Clerk auth requirement for AI chat in production. |
| User data privacy | Convex stores only email + preferences. No PII beyond what Clerk manages. Chat history is user-scoped. |
| City official role | Assigned only via Clerk admin dashboard, not self-service. JWT verified on every Convex query. |
| Environment variables | Never exposed client-side (except `NEXT_PUBLIC_*` prefixed ones which are safe). |
| MPROP owner data | Property ownership is public record. Displayed as-is from ArcGIS (no additional PII aggregation). |

---

## Phase Roadmap

### Phase 1: Prototype (Sprints 1-6, ~12 days)

8 northside neighborhoods. Core metrics from MPROP, MPD, foreclosures. Mapbox map with boundary + HOLC overlay. CopilotKit AI chat. 4 languages. Public access + Clerk auth for saved neighborhoods.

### Phase 2: Data Expansion

- Community resources layer (211 Wisconsin API compilation)
- 311/UCC service request integration with response time tracking
- Census ACS demographic overlays
- CDC SVI vulnerability scores
- DPW paving project overlay
- Additional special district layers (BID, TID, Historic)

### Phase 3: Citywide Scale

- Expand from 8 to all ~70 DCD neighborhoods
- Performance optimization for full-city parcel rendering (consider Mapbox vector tile server for MPROP)
- Neighborhood comparison rankings
- Data You Can Use partnership for historical indicators
- Resident feedback mechanism (Detroit NVI model)

### Phase 4: Institutional Adoption

- DNS code violation integration (city partnership)
- Lead testing/abatement data (MHD partnership)
- Shelter bed availability (Housing Authority partnership)
- City official workflows (export, alerts, reporting)
- Embed in city website (Map Milwaukee integration path)
