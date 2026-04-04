# MKE Neighborhood Dashboard — Claude Code Build Strategy

A sprint-by-sprint roadmap for building the dashboard in Claude Code, from zero to demo-ready.

---

## Before You Open Claude Code

### Accounts & API Keys You Need

Set these up first. Claude Code will need them in `.env.local`:

| Service | What You Need | Cost | URL |
|---------|--------------|------|-----|
| **Clerk** | Publishable key + secret key | Free (10K MAU) | clerk.com |
| **Mapbox** | Access token | Free (50K loads/mo) | mapbox.com/account |
| **Convex** | Project URL + deploy key | Free tier | dashboard.convex.dev |
| **Anthropic** | API key (for CopilotKit runtime) | Pay-per-use | console.anthropic.com |
| **CopilotKit** | Cloud API key OR self-hosted runtime | Free tier available | cloud.copilotkit.ai |
| **Vercel** (optional) | Account for deployment | Free tier | vercel.com |

### Clerk Setup (Do This First)

1. Create a Clerk application at clerk.com
2. Enable sign-in methods: Email, Google, and optionally Apple
3. Create a custom role called `city_official` in Clerk Dashboard → Roles
4. Note your keys: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
5. Set up the Convex integration: In Clerk Dashboard → JWT Templates, create a "convex" template with the Convex issuer URL

### Your `.env.local` will look like:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...
CONVEX_DEPLOYMENT=your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL=/api/copilotkit
```

### Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

---

## The Build Order (Why It Matters)

Each sprint builds on the previous one. Don't skip ahead — if the ArcGIS data layer doesn't work, nothing above it will.

```
Sprint 1: Project scaffold + Clerk auth + Mapbox rendering
Sprint 2: ArcGIS data connection (can we pull real Milwaukee data?)
Sprint 3: Convex backend + Clerk-Convex integration + data pipeline
Sprint 4: Dashboard UI + metrics panels (make it look like Philly)
Sprint 5: CopilotKit AI layer (make it talk)
Sprint 6: Role-based features + polish + demo prep
```

---

## Sprint 1: Foundation + Auth (Day 1-2)

**Goal:** Next.js app with Clerk auth, Mapbox map centered on Milwaukee, and a public/authenticated split.

### Auth architecture decisions:

The dashboard has three access tiers:

| Tier | Who | What They See | Auth Required? |
|------|-----|--------------|----------------|
| **Public** | Any resident | Full dashboard, all metrics, map, data sources | No |
| **Authenticated** | Signed-in users | Everything public + saved neighborhoods, AI chat history, neighborhood watchlist alerts | Yes (free signup) |
| **City Official** | Staff with `city_official` role | Everything above + raw data export, admin metrics, sync status, data pipeline health | Yes (role assigned by admin) |

**Key decision:** The dashboard itself should be publicly accessible (like Philly's). Auth unlocks personalization and power features, but nobody should need to sign in just to see their neighborhood's data.

### Claude Code session:

```
claude

> Scaffold a Next.js 14 app (app router) with TypeScript, Tailwind CSS, 
  and the following dependencies: @heroui/react, framer-motion, 
  react-map-gl, mapbox-gl, convex, @clerk/nextjs, 
  @copilotkit/react-core, @copilotkit/react-ui, @copilotkit/runtime, 
  recharts, @turf/turf, next-intl, lucide-react. 
  Use src/ directory structure.
  
  Configure HeroUI in tailwind.config.js using the heroui plugin 
  with a custom "mke-light" theme (primary: #1A6B52, background: #F8F6F1).
  See the MKE Style Guide for full theme configuration.
  
  Add Google Fonts in layout.tsx: Fraunces (display), DM Sans (body), 
  IBM Plex Mono (data). Apply DM Sans as the default body font.

> Set up Clerk authentication:
  1. Create src/app/layout.tsx with ClerkProvider wrapping the entire app.
     Import the Clerk publishable key from env vars.
  2. Create src/middleware.ts using clerkMiddleware(). Configure it so that
     ALL routes are public by default (the dashboard is public). Only 
     protect routes under /dashboard/settings and /admin.
  3. Create a sign-in page at src/app/sign-in/[[...sign-in]]/page.tsx
     using Clerk's SignIn component.
  4. Create a sign-up page at src/app/sign-up/[[...sign-up]]/page.tsx
     using Clerk's SignUp component.
  5. Add a header component with: dashboard title on the left, and on the 
     right either a SignInButton (if not signed in) or UserButton (if 
     signed in). Use Clerk's useAuth hook to conditionally render.

> Create a .env.local.example with placeholders for all keys including
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN, CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL,
  ANTHROPIC_API_KEY, and NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL.

> Create src/lib/neighborhoods.ts with a constant array of Milwaukee 
  neighborhoods. Each should have: id (slug), name, population (approximate), 
  censusTract array, and a center coordinate [lng, lat]. Include these 8 
  neighborhoods: Harambee, Lindsay Heights, Amani, Bronzeville, Sherman Park, 
  Washington Park, Walnut Hill, Metcalfe Park. Use real Milwaukee coordinates.

> Create src/components/Map.tsx using react-map-gl with Mapbox GL JS.
  Center on Milwaukee (lng: -87.92, lat: 43.06, zoom: 12). Use the 
  mapbox://styles/mapbox/light-v11 style. It should accept a 
  selectedNeighborhood prop and eventually render GeoJSON layers.

> Create the main page at src/app/page.tsx that renders the Map component
  with a simple neighborhood selector sidebar. This page is PUBLIC — no 
  auth required. Wire up the Mapbox token from environment variables.

> Create src/lib/auth.ts with helper functions:
  1. isAuthenticated() — checks if user is signed in
  2. isCityOfficial() — checks if user has the city_official role
  3. getUserPreferences() — returns saved neighborhood preferences (for 
     authenticated users)
```

### Validate before moving on:
- [ ] `npm run dev` starts without errors
- [ ] Dashboard loads WITHOUT signing in (public access works)
- [ ] Sign-in button appears in header
- [ ] Clerk sign-in/sign-up flow works
- [ ] After sign-in, UserButton appears with avatar
- [ ] Map renders centered on Milwaukee
- [ ] Neighborhood selector shows 8 neighborhoods
- [ ] No console errors about missing tokens

### Key files created:
```
src/
├── app/
│   ├── layout.tsx              # ClerkProvider wraps everything
│   ├── page.tsx                # Public dashboard (no auth required)
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── components/
│   ├── Header.tsx              # Title + SignInButton/UserButton
│   └── Map.tsx
├── lib/
│   ├── auth.ts                 # Auth helper functions
│   └── neighborhoods.ts
└── middleware.ts               # Clerk middleware (all routes public by default)
```

---

## Sprint 2: ArcGIS Data Connection (Day 2-3)

**Goal:** Fetch real neighborhood boundaries from Milwaukee's ArcGIS server and render them on the map. Then fetch MPROP parcel data inside the selected neighborhood.

### Claude Code session:

```
claude

> Create src/lib/arcgis.ts with helper functions to query Milwaukee's 
  ArcGIS REST services. The base URL is 
  https://milwaukeemaps.milwaukee.gov/arcgis/rest/services
  
  Create these functions:
  
  1. fetchNeighborhoodBoundary(name: string) — queries 
     planning/special_districts/MapServer/4/query with 
     WHERE NEIGHBORHD = '{name}', outSR=4326, f=geojson.
     Returns GeoJSON FeatureCollection.
  
  2. fetchPropertiesInBoundary(geometry: GeoJSON.Polygon, filters?: object) —
     queries property/parcels_mprop/MapServer/2/query using the boundary 
     polygon as a spatial filter. Converts GeoJSON polygon to Esri JSON 
     format (rings + spatialReference). Supports WHERE clause for filtering 
     (e.g., TAX_DELQ > 0). Always include inSR=4326, outSR=4326, f=geojson.
     Handle the 2000 record pagination limit with resultOffset.
  
  3. fetchCrimeData(geometry: GeoJSON.Polygon, months: number) — queries
     MPD/MPD_Monthly/MapServer/0/query with time and spatial filters.
  
  All functions should handle errors gracefully and log the actual URL 
  being fetched for debugging.

> Update Map.tsx to:
  1. When selectedNeighborhood changes, call fetchNeighborhoodBoundary
  2. Add the returned GeoJSON as a Source with two Layers:
     - Fill layer (green, 8% opacity) 
     - Line layer (green, 2.5px width)
  3. Fit the map bounds to the neighborhood polygon
  4. Show a loading state while fetching

> Create src/lib/types.ts with TypeScript types for:
  - Neighborhood (id, name, pop, tracts, center)
  - DashboardMetrics (community, publicSafety, qualityOfLife, wellness)
  - PropertyData (from MPROP fields)
  - CrimeData (from MPD fields)
```

### Important: Test the ArcGIS connection

This is where you'll discover if Milwaukee's ArcGIS server allows CORS from localhost. If it does, great — you can query directly from the browser during development. If it doesn't (likely), you'll need to proxy through a Next.js API route:

```
claude

> The ArcGIS server is blocking CORS requests from the browser. Create a 
  Next.js API route at src/app/api/arcgis/route.ts that proxies requests 
  to milwaukeemaps.milwaukee.gov. The client sends the service path and 
  query params, the API route makes the server-side fetch and returns 
  the response. Update arcgis.ts to use this proxy in development.
```

### Validate before moving on:
- [ ] Neighborhood boundary polygon renders on the map when you select Harambee
- [ ] Switching neighborhoods fetches a new boundary and re-renders
- [ ] Map flies to the selected neighborhood
- [ ] Console shows the ArcGIS query URL for debugging
- [ ] If CORS blocked: proxy route works

---

## Sprint 3: Convex Backend + Clerk Integration (Day 3-5)

**Goal:** Move ArcGIS queries server-side into Convex. Cache neighborhood data. Set up Clerk-Convex auth so user preferences persist. Set up the data pipeline.

### Claude Code session:

```
claude

> Initialize Convex in this project. Run npx convex init and set up 
  the Convex provider in layout.tsx. IMPORTANT: The provider order 
  in layout.tsx should be: ClerkProvider > ConvexProviderWithClerk > 
  CopilotKit (later) > Page content.

> Set up Clerk-Convex integration:
  1. Install @clerk/clerk-react if not already installed
  2. Create convex/auth.config.ts pointing to Clerk's JWT issuer URL
  3. Update src/app/layout.tsx to use ConvexProviderWithClerk instead of 
     plain ConvexProvider. Pass the Clerk useAuth hook.
  4. This allows Convex queries/mutations to access the authenticated 
     user's identity via ctx.auth.getUserIdentity()

> Create the Convex schema at convex/schema.ts:
  - neighborhoods table: name (string), boundary (any — stores GeoJSON), 
    metrics (any — stores aggregated dashboard data), lastSync (number — 
    timestamp), population (number), censusTract (array of strings)
  - syncLogs table: timestamp (number), neighborhoodName (string), 
    status (string), recordsFetched (number), errors (optional string)
  - users table: clerkId (string, indexed), email (string), 
    savedNeighborhoods (array of strings), watchlist (array of strings — 
    neighborhoods to get alerts for), role (string — "resident" or 
    "city_official"), preferences (any — dashboard preferences like 
    default neighborhood, preferred category), chatHistory (any — 
    last 50 AI chat messages for continuity)
  - feedback table: userId (optional string), neighborhoodName (string),
    category (string), message (string), timestamp (number)

> Create convex/users.ts with:
  - query: getCurrentUser — uses ctx.auth.getUserIdentity() to find 
    or return null for the current user
  - mutation: createOrUpdateUser — upserts user record when they sign in 
    (called from a useEffect on the frontend)
  - mutation: saveNeighborhood — adds a neighborhood to the user's 
    saved list
  - mutation: removeNeighborhood — removes from saved list
  - mutation: updatePreferences — saves dashboard preferences
  - mutation: saveChatHistory — persists last 50 AI messages
  - query: getChatHistory — returns chat history for AI continuity

> Create convex/neighborhoods.ts with:
  - query: getAll — returns all neighborhoods with their latest metrics
    (no auth required — public data)
  - query: getByName — returns one neighborhood with full metrics
    (no auth required)
  - query: compare — accepts two neighborhood names, returns both for 
    side-by-side comparison (no auth required)
  - mutation: upsertMetrics — updates a neighborhood's cached metrics 
    and lastSync timestamp (internal only)

> Create convex/sync.ts with an internal action: syncNeighborhood
  This action:
  1. Fetches the neighborhood boundary from ArcGIS (server-side, no CORS)
  2. Fetches MPROP data using the boundary as spatial filter
  3. Aggregates: count vacant (LAND_USE 8800-8899), count tax delinquent 
     (TAX_DELQ > 0), count raze orders (RAZE_STATUS > 0), count foreclosures,
     average assessed value (C_A_TOTAL), count owner-occupied (OWN_OCPD = O)
  4. Fetches crime data from MPD Monthly, counts by type
  5. Stores aggregated metrics via upsertMetrics mutation
  6. Logs the sync to syncLogs table

> Create convex/crons.ts that runs syncNeighborhood for all 8 
  neighborhoods every 24 hours.

> Create convex/feedback.ts with:
  - mutation: submitFeedback — lets authenticated users submit feedback 
    about a neighborhood or the dashboard itself
  - query: getFeedbackForNeighborhood — returns feedback (city_official 
    role only)

> Update the frontend:
  1. page.tsx reads neighborhood data from Convex (public queries)
  2. Add a useEffect that calls createOrUpdateUser when a Clerk user 
     signs in — syncs their Clerk identity to Convex
  3. If authenticated, load saved neighborhoods and preferences
  4. Show a "Save this neighborhood" button for authenticated users
  5. Show a "Feedback" button for authenticated users
```

### Validate before moving on:
- [ ] `npx convex dev` runs without errors
- [ ] Signing in creates a user record in Convex
- [ ] Public (non-auth) users can see all dashboard data
- [ ] Authenticated users can save/unsave neighborhoods
- [ ] Saved neighborhoods persist across sessions
- [ ] Convex dashboard shows data in all tables

### Seed the data:

```
claude

> Create a script at scripts/seed.ts that manually triggers 
  syncNeighborhood for all 8 neighborhoods. This populates Convex 
  with initial data so the frontend has something to show immediately.
  Run it with: npx convex run sync:syncNeighborhood '{"name":"Harambee"}'
```

### Validate before moving on:
- [ ] `npx convex dev` runs without errors
- [ ] Seeding script successfully fetches and stores data for at least one neighborhood
- [ ] Frontend reads from Convex (not direct ArcGIS) and displays neighborhood data
- [ ] Convex dashboard shows data in the neighborhoods table
- [ ] Map still renders boundaries (now from Convex cache)

---

## Sprint 4: Dashboard UI with HeroUI (Day 5-7)

**Goal:** Build the metrics panels, category tabs, metric cards, and time filter using HeroUI components. Mobile-first, accessible, multilingual-ready. This should look production-grade out of the box.

### Claude Code session:

```
claude

> Read the MKE Style Guide (mke-style-guide.md) before building any UI. 
  Follow its color system, typography, spacing, and component patterns exactly.

> Set up next-intl for multilingual support:
  1. Configure locale routing with: en (default), es, hmn, ar
  2. Create messages/en.json with all UI strings (dashboard title, 
     category names, metric labels, buttons, AI chat labels, error messages)
  3. Use Claude to generate messages/es.json (Spanish), messages/hmn.json 
     (Hmong - White Hmong dialect, RPA script), and messages/ar.json (Arabic)
  4. Set up middleware for locale detection and routing
  5. Add dir="rtl" to <html> when locale is Arabic

> Create the dashboard layout MOBILE-FIRST using HeroUI components:
  
  MOBILE (< 768px):
  - Full-width header with title + language selector + auth button
  - HeroUI Select component for neighborhood selection (full-width)
  - Map section (collapsible via HeroUI Accordion)
  - HeroUI Tabs for categories (scrollable horizontal on mobile)
  - Metric cards in single-column grid
  - Floating action button (bottom-right) for AI chat
  - AI chat opens as HeroUI Modal (full-screen on mobile)
  
  TABLET (768px - 1024px):
  - Two-column: map (left) + metrics (right)
  - AI chat as bottom sheet
  
  DESKTOP (> 1024px):
  - Three-column: nav/map (300px) + metrics (flex) + AI chat (350px)
  - AI chat as persistent sidebar

  Use CSS logical properties throughout: ms-*, me-*, ps-*, pe-* 
  instead of ml-*, mr-*, pl-*, pr-* for automatic RTL support.

> Create src/components/MetricCard.tsx using HeroUI Card:
  - HeroUI Card component with left border in category color (3px)
  - Metric label: uppercase, text-xs, tracking-wide, DM Sans 600
  - Big number: Fraunces font, text-4xl on desktop / text-3xl on mobile
  - Unit text: text-sm, muted color, next to the number
  - Trend badge: HeroUI Chip component with:
    - Lucide TrendingDown icon (green) or TrendingUp icon (red) 
    - ALWAYS include both icon AND percentage — never color alone
    - Background: success-50/danger-50 from the theme
  - Optional: HeroUI Progress component for response rate metrics
  - Source: text-xs, IBM Plex Mono, very muted, bottom of card
  - Full aria-label: "{label}: {value} {unit}, trending {direction} 
    {percent}%, source: {source}"
  - Staggered entrance animation via Framer Motion (60ms delay per card)
  - Minimum touch target: 44x44px (entire card is tappable for detail)
  - All text strings pulled from next-intl translations

> Create src/components/MetricsPanel.tsx using HeroUI Tabs:
  - Four tabs using HeroUI Tabs component with icons (Lucide):
    - CircleDot + "Community" (teal)
    - Shield + "Public Safety" (brick red)
    - Building2 + "Quality of Life" (steel blue)
    - Heart + "Wellness" (plum)
  - Icon AND text on each tab (never icon-only)
  - Active tab: filled background in category color
  - Tab labels from next-intl translations
  - Content: CSS Grid of MetricCards
    - Mobile: grid-cols-1
    - Tablet: grid-cols-2
    - Desktop: grid-cols-3 or auto-fill minmax(220px, 1fr)
  - HeroUI Skeleton components while data loads from Convex
  - Keyboard: arrow keys navigate between tabs (HeroUI handles this)

> Create src/components/TimeFilter.tsx using HeroUI ButtonGroup:
  - Three buttons: Last Month, 6 Months, 1 Year
  - HeroUI ButtonGroup with variant="flat"
  - Active state uses primary color, inactive is default
  - Updates the Convex query timeframe
  - Labels from next-intl translations

> Create src/components/NeighborhoodSelector.tsx:
  - Mobile: HeroUI Select (full-width dropdown)
  - Desktop: sidebar list using HeroUI Listbox
  - Each item shows:
    - Neighborhood name (DM Sans, font-semibold)
    - Population (IBM Plex Mono, text-xs, muted)
  - Active neighborhood highlighted with primary color
  - Selecting updates both map and metrics
  - Names from next-intl translations

> Create src/components/LanguageSelector.tsx using HeroUI Dropdown:
  - Trigger: Globe icon (Lucide) + current language name
  - Options: 🇺🇸 English, 🇲🇽 Español, 🇱🇦 Hmoob, 🇸🇦 العربية
  - Plus a "Request a language" option that opens feedback form
  - Selecting a language: updates next-intl locale, persists to 
    localStorage (and Convex if authenticated)
  - Position: header, right side, before auth button

> Create src/components/DataTableView.tsx:
  - Toggle button: "View as Table" (Lucide Table2 icon)
  - When active, shows an accessible HTML table with the same data 
    as the metric cards
  - Proper <th scope="col">, <caption>, keyboard navigable
  - This is the primary accessibility alternative to the WebGL map
  - Uses HeroUI Table component

> Create src/components/Header.tsx:
  - Left: Dashboard title (Fraunces, responsive size)
  - Center: TimeFilter
  - Right: LanguageSelector + Clerk SignInButton/UserButton
  - Sticky on scroll
  - Mobile: hamburger menu (HeroUI Navbar with toggle)

> Add skip navigation as the first focusable element:
  <a href="#main-content" class="sr-only focus:not-sr-only 
  focus:absolute focus:z-50 focus:p-4 focus:bg-primary 
  focus:text-white">Skip to main content</a>

> Add prefers-reduced-motion support:
  Wrap all Framer Motion animations in a check:
  const prefersReducedMotion = useReducedMotion(); // from framer-motion
  If true, set all animation durations to 0.

> Wire everything together in page.tsx:
  - Working map with neighborhood boundaries
  - Neighborhood selector (dropdown on mobile, sidebar on desktop)
  - Category tabs with metric cards populated from Convex
  - Time filter
  - Language selector
  - "View as Table" toggle
  - Footer showing data sources, last sync time, and 
    "Inspired by Philadelphia's Kensington Dashboard"
```

### Validate before moving on:
- [ ] All four category tabs render with metric cards using HeroUI components
- [ ] Switching neighborhoods updates both map and metrics
- [ ] Metric cards show trends with BOTH icon and percentage (not color alone)
- [ ] HeroUI Skeleton loading states work
- [ ] Time filter changes the displayed data
- [ ] Language selector switches between English, Spanish, Hmong, Arabic
- [ ] Arabic view flips layout to RTL correctly
- [ ] "View as Table" shows accessible data table
- [ ] Tab focus indicators visible (ring around focused elements)
- [ ] Screen reader reads metric cards with full context
- [ ] Mobile layout works (single column, collapsible map)
- [ ] Touch targets are minimum 44x44px
- [ ] Reduced motion preference respected (no animations)
- [ ] Skip navigation link works
- [ ] Footer shows data provenance

---

## Sprint 5: CopilotKit AI Layer (Day 7-9)

**Goal:** Add the AI chat sidebar with CopilotKit. The AI reads dashboard state and user context, can take actions, and answers questions grounded in the data. Chat history persists for authenticated users.

### Claude Code session:

```
claude

> Create the CopilotKit runtime endpoint at 
  src/app/api/copilotkit/route.ts using CopilotRuntime with 
  AnthropicAdapter. Use claude-sonnet-4-20250514 as the model.

> Update the provider chain in layout.tsx. The order matters:
  ClerkProvider > ConvexProviderWithClerk > CopilotKit > DashboardContext > Page
  
  Add CopilotSidebar from @copilotkit/react-ui with:
  - Title: "MKE Neighborhood Assistant"
  - Initial message explaining what users can ask
  - Placeholder: "Ask about any Milwaukee neighborhood..."
  - defaultOpen: false
  - Instructions telling the AI it's a Milwaukee Neighborhood Data 
    Assistant helping residents and officials understand neighborhood data

> Create src/copilot/DashboardContext.tsx following the World Monitor 
  pattern (WorldMonitorCopilotProvider.tsx). This component:
  
  1. Uses useCopilotReadable for:
     - Selected neighborhood name, population, census tracts
     - All current metrics (all 4 categories)
     - Active map layers and timeframe filter
     - List of available neighborhoods
     - If authenticated: user's saved neighborhoods and preferences
     - If city_official role: additional context about data pipeline 
       health and sync status
  
  2. Registers all actions (import from actions/ files)
  
  3. Wraps children

> Create src/copilot/actions/switchNeighborhood.ts:
  - useCopilotAction with name "switchNeighborhood"
  - Parameter: neighborhood name (string)
  - Description: "Navigate the dashboard to a different Milwaukee 
    neighborhood. Available: Harambee, Lindsay Heights, Amani, 
    Bronzeville, Sherman Park, Washington Park, Walnut Hill, Metcalfe Park"
  - Handler: calls the setSelectedNeighborhood state setter

> Create src/copilot/actions/showCategory.ts:
  - Switches the active metric category tab
  - Parameter: category (community, publicSafety, qualityOfLife, wellness)

> Create src/copilot/actions/compareNeighborhoods.ts:
  - Opens a comparison view between two neighborhoods
  - Parameters: neighborhood1, neighborhood2
  - Handler: fetches both from Convex, displays side by side

> Create src/copilot/actions/showTrendChart.ts:
  - Uses CopilotKit's render prop for Generative UI
  - Renders a Recharts line chart inline in the chat
  - Parameters: metric name, time range

> Create src/copilot/actions/saveNeighborhood.ts:
  - Only available when user is authenticated
  - Saves the current neighborhood to the user's watchlist in Convex
  - Description: "Save this neighborhood to your watchlist for future 
    reference. Requires sign-in."
  - Handler: calls Convex saveNeighborhood mutation

> Create src/copilot/actions/submitFeedback.ts:
  - Only available when user is authenticated
  - Lets user submit feedback about their neighborhood via the AI chat
  - Parameters: category, message
  - Handler: calls Convex submitFeedback mutation

> Implement chat history persistence for authenticated users:
  1. When user sends/receives messages, save the last 50 to Convex 
     via saveChatHistory mutation
  2. When an authenticated user opens the chat, load their previous 
     messages from Convex getChatHistory query
  3. For non-authenticated users, chat history only persists during 
     the current session (in React state)

> Update layout.tsx to wrap everything in the correct order:
  ClerkProvider > ConvexProviderWithClerk > CopilotKit > DashboardContext > 
  Page content + CopilotSidebar
```

### Test the AI:

Try these prompts in the CopilotKit sidebar:
- "How many vacant properties are in Harambee?"
- "Switch to Sherman Park"
- "Compare Amani and Bronzeville"
- "Show me the crime trend for the last year"
- "What data sources power this dashboard?"
- "Is crime going up or down in this neighborhood?"

### Validate before moving on:
- [ ] CopilotSidebar opens/closes
- [ ] AI responds to questions with actual metric values from the data
- [ ] "Switch to Sherman Park" actually changes the neighborhood
- [ ] "Show me quality of life" switches the category tab
- [ ] AI doesn't hallucinate numbers (everything comes from useCopilotReadable context)
- [ ] Compare action works

---

## Sprint 6: Role-Based Features + Polish + Demo Prep (Day 9-12)

**Goal:** Add city official admin features, polish the auth experience, make it demo-ready.

### Claude Code session:

```
claude

> Create an admin section at src/app/admin/page.tsx that is only 
  accessible to users with the city_official role. Use Clerk's 
  auth() in a server component to check the role, redirect to 
  dashboard if not authorized. This page shows:
  - Data pipeline health: last sync time for each neighborhood, 
    success/failure status, records fetched
  - Sync logs table from Convex
  - Manual "Sync Now" button for each neighborhood
  - User feedback submissions (from the feedback table)
  - Raw data export buttons (CSV download of neighborhood metrics)

> Create an admin layout at src/app/admin/layout.tsx that adds an 
  admin navigation bar and verifies the city_official role.

> Add auth-gated features to the main dashboard:
  1. "Save Neighborhood" heart/bookmark icon — only shows when signed in.
     Grayed out with tooltip "Sign in to save" when not authenticated.
  2. "My Neighborhoods" section in the sidebar — shows saved neighborhoods
     for quick switching. Only visible when signed in.
  3. AI chat history — loads previous conversation when an authenticated 
     user opens the chat. Shows "Sign in to save chat history" for 
     anonymous users.
  4. "Submit Feedback" button — lets authenticated users report issues 
     or suggest improvements for their neighborhood. Stored in Convex.
  5. "Download Data" button on each metric category — exports the 
     current neighborhood's metrics as CSV. Available to all users, 
     but authenticated users get more detailed exports.

> Add a "Data Sources" panel accessible from the header that shows 
  every data source, its endpoint, update frequency, and status 
  (live/available/needs ETL). Use the data from the PRD's data source 
  registry.

> Add a comparison view component that shows two neighborhoods 
  side-by-side with matching metric cards. Highlight which neighborhood 
  is better/worse on each metric.

> Add map layers that can be toggled:
  - Vacant parcels (red fill) — from MPROP data cached in Convex
  - Tax-delinquent parcels (orange fill) — from MPROP
  - Crime points (red dots) — from MPD data
  - Community resources (blue markers) — from compiled resource data
  Each layer should be toggleable via the UI AND via CopilotKit action.

> Add a "How This Works" explainer section accessible from the header 
  that shows the data pipeline: ArcGIS REST → Convex sync → Dashboard → 
  CopilotKit AI. Target audience: non-technical city officials.

> Add a "Philadelphia Comparison" callout panel showing how this 
  dashboard maps to Philly's Kensington Dashboard:
  - 30 metrics (Philly) → 28 metrics (MKE)  
  - 20 agencies (Philly) → 12 live sources (MKE)
  - ArcGIS Experience Builder (Philly) → Custom React + CopilotKit (MKE)
  - Single neighborhood (Philly) → 8 neighborhoods from launch (MKE)

> Performance: Add loading skeletons, lazy load map layers, 
  memoize expensive computations, add error boundaries.

> Mobile responsiveness: Ensure single-column layout on mobile,
  collapsible sidebar, touch-friendly map controls. Clerk's 
  UserButton component is already mobile-friendly.
```

### Demo checklist:
- [ ] Dashboard loads fully without sign-in (public access works)
- [ ] Sign-in flow works (Clerk modal, Google sign-in)
- [ ] After sign-in: save neighborhood, chat history persists
- [ ] City official role: admin panel accessible, raw data export works
- [ ] Full walkthrough: select neighborhood → view metrics → switch categories → ask AI → compare
- [ ] AI chat works live in front of audience
- [ ] Data sources panel shows transparency
- [ ] Philly comparison panel makes the case
- [ ] Mobile works (alderpersons will check on phones)
- [ ] No errors in console, no broken states

---

## Claude Code Tips for This Project

### Project context file

Create a `CLAUDE.md` at the project root that Claude Code reads automatically:

```markdown
# MKE Neighborhood Dashboard

## What This Is
A neighborhood-level data dashboard for Milwaukee modeled after 
Philadelphia's Kensington Dashboard. Uses ArcGIS REST services for 
city data, Convex for backend/caching, Mapbox for maps, CopilotKit 
for AI chat, and Clerk for authentication.

## Architecture
- Next.js 14 (app router) + TypeScript + Tailwind
- **HeroUI** (React Aria + Tailwind) for all UI components — see mke-style-guide.md
- Clerk for auth (public dashboard + authenticated features + city_official admin)
- Convex for backend (real-time queries, mutations, cron jobs)
- Clerk-Convex integration via ConvexProviderWithClerk
- Mapbox GL JS via react-map-gl for map rendering
- CopilotKit for AI sidebar (useCopilotReadable + useCopilotAction)
- next-intl for multilingual (en, es, hmn, ar) with RTL support
- Framer Motion for animations (via HeroUI)
- Milwaukee ArcGIS REST at milwaukeemaps.milwaukee.gov/arcgis/rest/services

## Design System
- See mke-style-guide.md for colors, typography, spacing, component patterns
- Primary color: Lakeshore teal #1A6B52
- Background: Cream City #F8F6F1 (warm off-white, references Milwaukee brick)
- Fonts: Fraunces (display), DM Sans (body), IBM Plex Mono (data)
- HeroUI custom theme "mke-light" configured in tailwind.config.js
- All interactive elements: minimum 44x44px touch target
- Use CSS logical properties (ms-*, me-*) not directional (ml-*, mr-*) for RTL
- Never rely on color alone for meaning — always include icon + text

## Provider Order (layout.tsx)
ClerkProvider > ConvexProviderWithClerk > CopilotKit > DashboardContext > Page

## Auth Tiers
- Public: full dashboard, all metrics (no sign-in needed)
- Authenticated: saved neighborhoods, AI chat history, feedback
- city_official role: admin panel, raw data export, sync management

## Key Patterns
- All ArcGIS queries go through Convex (server-side) to avoid CORS
- Neighborhood boundaries from planning/special_districts/MapServer/4
- MPROP property data from property/parcels_mprop/MapServer/2
- Always use inSR=4326 and outSR=4326 (Milwaukee uses WKID 32054 natively)
- Always use f=geojson for GeoJSON output
- CopilotKit follows World Monitor pattern: DashboardContext.tsx 
  centralizes all readables + actions
- Clerk user synced to Convex users table on sign-in

## File Structure
src/copilot/ — All CopilotKit integration (readables, actions)
src/components/ — React components (using HeroUI)
src/lib/ — Utilities, types, ArcGIS helpers, auth helpers
src/app/admin/ — City official admin pages (role-gated)
convex/ — Backend schema, queries, sync actions, crons, user management
messages/ — next-intl translation files (en.json, es.json, hmn.json, ar.json)
mke-style-guide.md — Color system, typography, component patterns (read this first)

## Environment Variables
See .env.local.example
```

### How to prompt Claude Code effectively for this project

**Be specific about Milwaukee's data quirks:**
```
> The ArcGIS spatial query needs the geometry parameter in Esri JSON 
  format, not GeoJSON. Convert the GeoJSON polygon coordinates to 
  { rings: coordinates, spatialReference: { wkid: 4326 } } and 
  JSON.stringify it before passing as the geometry URL parameter.
```

**Reference the data dictionary when building queries:**
```
> Query MPROP for vacant properties. According to the data dictionary, 
  vacant land uses LAND_USE codes 8800-8899. Filter with: 
  WHERE LAND_USE >= '8800' AND LAND_USE < '8900'
  Return fields: TAXKEY, LAND_USE, C_A_TOTAL, OWNER_NAME_1, YR_BUILT, 
  TAX_DELQ, RAZE_STATUS
```

**Reference the CopilotKit pattern when building AI features:**
```
> Follow the World Monitor CopilotKit pattern. Create the action in its 
  own file under src/copilot/actions/. Use detailed descriptions for 
  every parameter — CopilotKit uses these descriptions to teach the AI 
  when and how to call each action. Register the action hook in 
  DashboardContext.tsx.
```

### Common issues you'll hit and how to fix them

| Issue | Symptom | Fix |
|-------|---------|-----|
| ArcGIS CORS | `Failed to fetch` in browser console | Use the Next.js API proxy route or query from Convex |
| Wrong projection | Neighborhood renders in Atlantic Ocean | Add `inSR=4326&outSR=4326` to every query |
| Pagination | Only 2000 parcels returned | Use `resultOffset` and `resultRecordCount`, loop until `exceededTransferLimit` is false |
| Esri geometry format | `400 Bad Request` on spatial queries | Convert GeoJSON to `{ rings: coords, spatialReference: { wkid: 4326 } }` |
| CopilotKit not reading state | AI doesn't know the metrics | Check that `useCopilotReadable` is inside the `CopilotKit` provider tree |
| Convex deploy fails | Type errors in convex/ directory | Run `npx convex typecheck` before deploying |
| Map layers flicker | Source updates cause re-render | Use `setData()` on existing source instead of recreating |
| Clerk + Convex auth mismatch | User signed in via Clerk but Convex says unauthorized | Check convex/auth.config.ts has correct Clerk issuer URL. Verify JWT template name matches. |
| Provider order wrong | Auth works but Convex queries fail, or AI doesn't see auth state | Must be: ClerkProvider > ConvexProviderWithClerk > CopilotKit > DashboardContext |
| Clerk middleware blocking public routes | Dashboard requires sign-in | Ensure `clerkMiddleware()` in middleware.ts makes all dashboard routes public. Only protect `/admin` and `/dashboard/settings`. |
| Clerk role not found | `isCityOfficial()` returns false even for admin users | Check that you created the `city_official` role in Clerk Dashboard → Roles, and assigned it to the test user |

---

## Timeline Summary

| Sprint | Days | What You Ship |
|--------|------|--------------|
| 1. Foundation + Auth | 1-2 | Next.js + Clerk auth + Mapbox map centered on Milwaukee |
| 2. ArcGIS Data | 2-3 | Real neighborhood boundaries + MPROP data on the map |
| 3. Convex + Clerk-Convex | 3-5 | Server-side data pipeline, user accounts, saved neighborhoods |
| 4. Dashboard UI | 5-7 | Full metric panels, category tabs, time filter, polished design |
| 5. CopilotKit AI | 7-9 | AI chat with auth-aware features, chat history persistence |
| 6. Roles + Polish | 9-12 | Admin panel for officials, comparison view, data sources, mobile |

**Total: ~12 working days from zero to demo-ready.**

If you're working full-time on this with Claude Code, you could realistically have a demo-ready prototype in 2 weeks. The ArcGIS connection (Sprint 2) is the riskiest part — if CORS blocks you and the proxy approach has issues, that could add time. Everything after that builds smoothly.

---

## What to Show City Officials

The demo flow should be:

1. **Open on Harambee (not signed in)** — show the map with the neighborhood highlighted. "This is completely public. Any resident can see this without creating an account."
2. **Walk through categories** — "here's community, here's public safety, here's quality of life, here's wellness"
3. **Point out data sources** — "every number comes from the city's own ArcGIS server and open data portal"
4. **Show the AI** — type "how many vacant properties are in this neighborhood?" and watch it answer with real data
5. **Switch neighborhoods** — tell the AI "switch to Sherman Park" and watch the whole dashboard update
6. **Compare** — "compare Harambee and Amani" side by side
7. **Sign in** — demonstrate Clerk sign-in. "Now I can save neighborhoods, my AI chat history persists, and I can submit feedback"
8. **Show admin view** — sign in with a city_official account. "Officials get data pipeline monitoring, raw data export, and community feedback review"
9. **Show the Philly comparison** — "Philadelphia built this 3 weeks ago. Milwaukee has the same infrastructure. The question is whether we commit to doing it."
10. **End with the gap** — "12 of 18 data sources are already live. The 6 that need partnership would make this transformative."
