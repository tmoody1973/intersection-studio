# MKE Neighborhood Vitality Dashboard — Phase 1 Component Specifications

**Components:** Metric Card, Category Tabs
**Author:** Creative Director — Intersection Studio
**Date:** April 4, 2026
**Design System:** HeroUI + Tailwind CSS + Framer Motion
**Accessibility Target:** WCAG 2.1 AA

---

## Design Rationale

### What competitors taught us

Eight dashboards studied. Here is what Milwaukee takes, avoids, and improves:

| Lesson | Source | Milwaukee's Move |
|--------|--------|-----------------|
| Cross-department categories work | Philadelphia (Community / Safety / QoL / Wellness) | Adopt the same four buckets — proven mental model |
| Too many categories overwhelm | Baltimore (150 indicators, 8+ categories) | Cap at four tabs. Let the AI handle deep exploration |
| Cleanest layout wins trust | Detroit NVI (simple, resident-designed) | Metric cards with one number each. No multi-stat cramming |
| Data density fails on mobile | NYC EquityNYC (237 indicators, tiny text) | Mobile-first single column. Progressive disclosure |
| ArcGIS tab UI is clunky | Philadelphia (Experience Builder tabs) | HeroUI Tabs with React Aria keyboard nav, fluid animation |
| Static reporting lacks engagement | Denver (Power BI embed) | Interactive cards with expand-to-detail pattern |
| Show your sources | All competitors hide provenance | Every metric card shows its data source in a caption |
| No competitor has AI | All eight dashboards | CopilotKit sidebar handles complex queries — keep visual UI simple |

### Core principles applied

1. **One card, one insight.** Each metric card communicates a single number with trend context. No compound visualizations inside cards.
2. **Mobile is the primary device.** Touch targets 44px minimum. Single-column default. Thumb-reachable interactions.
3. **Never color alone.** Every trend uses icon + number + color. Colorblind users lose nothing.
4. **Progressive disclosure.** Cards show the essential metric. Click/tap to expand for sparkline, historical context, and AI prompt.
5. **Trust through transparency.** Data source visible on every card. Unflattering numbers displayed honestly.

---

## Component 1: Metric Card

### TypeScript Props Interface

```typescript
interface MetricCardProps {
  /** Unique identifier for the metric */
  id: string;

  /** Display name — pulled from next-intl translations */
  label: string;

  /** The primary numeric value (null when data unavailable) */
  value: number | null;

  /** Unit label: "parcels", "incidents", "%", "$", etc. */
  unit: string;

  /** Trend direction relative to the previous period */
  trend: {
    direction: "improving" | "worsening" | "stable";
    /** Percentage change from previous period (absolute value) */
    percentage: number;
    /** Human-readable period: "vs. last quarter", "vs. 2024" */
    comparedTo: string;
  } | null;

  /** Category this metric belongs to — drives left border color */
  category: "community" | "publicSafety" | "qualityOfLife" | "wellness";

  /** Data source attribution */
  source: {
    /** Display name: "MPROP REST", "MPD Monthly", "Census ACS" */
    name: string;
    /** Last updated timestamp (ISO 8601) */
    lastUpdated: string;
  };

  /** Optional progress bar (e.g., 311 on-time response rate) */
  progress?: {
    /** 0-100 */
    value: number;
    /** Label shown next to bar: "on-time", "abated", etc. */
    label: string;
  };

  /** Optional sparkline data for expanded view */
  sparkline?: {
    /** Array of {period, value} for last 6-12 periods */
    data: Array<{ period: string; value: number }>;
    /** Period type: "month", "quarter", "year" */
    periodType: string;
  };

  /** Current visual state */
  state?: "default" | "loading" | "error" | "empty";

  /** Error message when state is "error" */
  errorMessage?: string;

  /** Whether the card is currently expanded */
  isExpanded?: boolean;

  /** Callback when card is clicked/tapped */
  onToggleExpand?: (id: string) => void;

  /** Callback to trigger AI query about this metric */
  onAskAI?: (id: string, label: string) => void;
}
```

### Category Color Mapping

```typescript
const CATEGORY_COLORS = {
  community:    { light: "#1A6B52", dark: "#34D399" }, // Teal / Lakeshore
  publicSafety: { light: "#B84233", dark: "#F87171" }, // Brick
  qualityOfLife:{ light: "#2563EB", dark: "#60A5FA" }, // Steel blue
  wellness:     { light: "#7C3AED", dark: "#A78BFA" }, // Plum
} as const;
```

### Visual States Matrix

| State | Left Border | Value Area | Trend Badge | Progress Bar | Source | Interaction |
|-------|------------|------------|-------------|-------------|--------|-------------|
| **Default** | 3px solid category color | Fraunces 700, Iron `#1C1917` | Visible with icon + % | Filled to value | Caption, Limestone | Clickable, hover lift |
| **Loading / Skeleton** | 3px solid Limestone `#A8A29E` | Shimmer placeholder (120px wide, 40px tall) | Shimmer placeholder (60px) | Shimmer bar | Shimmer line | Not interactive |
| **Error** | 3px solid Critical `#B91C1C` | `--` in Foundry `#57534E` | Hidden | Hidden | "Data unavailable" + retry hint | Click to retry |
| **Empty / No Data** | 3px solid Limestone | `0` or `N/A` in Limestone | Hidden | Hidden | Source still shown | Clickable but nothing to expand |
| **Positive Trend** | Category color | Normal | Forest green `#15803D` bg `#DCFCE7`, `TrendingDown` icon + `% text` | Normal | Normal | Normal |
| **Negative Trend** | Category color | Normal | Brick red `#B91C1C` bg `#FEE2E2`, `TrendingUp` icon + `% text` | Normal | Normal | Normal |
| **Stable Trend** | Category color | Normal | Amber `#D97706` bg `#FEF3C7`, `ArrowRight` icon + `% text` | Normal | Normal | Normal |
| **Hover** | Category color | Normal | Normal | Normal | Normal | `translateY(-2px)`, shadow-md, cursor pointer |
| **Focus (keyboard)** | Category color | Normal | Normal | Normal | Normal | `ring-2 ring-offset-2 ring-[category-color]` |
| **Expanded** | 3px solid category color, full width | Normal | Normal | Normal | Normal | Sparkline visible, "Ask AI" button visible, shadow-lg |

**Dark mode adjustments:**
- Card background: `#292524` (Surface)
- Border color: `#44403C`
- Primary text: `#F5F5F4`
- Secondary text: `#A8A29E`
- Category border colors use the `dark` variant from `CATEGORY_COLORS`
- Trend badge backgrounds darken: positive `#052E16`, warning `#451A03`, critical `#450A0A`

### Responsive Behavior

| Breakpoint | Layout | Card Width | Padding | Value Size |
|-----------|--------|------------|---------|------------|
| **Mobile** `< 768px` | Single column, full-width | 100% | 12px 14px | 2rem (32px) Fraunces 700 |
| **Tablet** `768px - 1024px` | 2-column grid, `gap-4` | `calc(50% - 8px)` | 14px 16px | 2.25rem (36px) |
| **Desktop** `> 1024px` | 3-column grid, `gap-4` (4-col if panel is wide enough) | `minmax(200px, 1fr)` | 16px 18px | 2.5rem (40px) |

On mobile, cards stack vertically with 12px gap. The expanded state takes full width and pushes cards below it down (no overlay).

On tablet/desktop, an expanded card spans its full column width. The sparkline and "Ask AI" button appear below the main metric content.

### Accessibility Specification

**ARIA structure:**
```html
<article
  role="article"
  aria-label="Vacant Properties: 142 parcels, down 3% from last quarter, source: MPROP REST"
  tabindex="0"
  class="metric-card"
>
  <!-- Content -->
</article>
```

**Screen reader text for each state:**

| State | `aria-label` Pattern |
|-------|---------------------|
| Default with trend | `"{label}: {value} {unit}, {trend.direction} {trend.percentage}% {trend.comparedTo}, source: {source.name}"` |
| Default no trend | `"{label}: {value} {unit}, source: {source.name}"` |
| With progress | Append: `", {progress.value}% {progress.label}"` |
| Loading | `"{label}: loading data"` |
| Error | `"{label}: data unavailable"` |
| Empty | `"{label}: no data reported"` |

**Real examples:**
- `"Vacant Properties: 142 parcels, improving down 3% vs. last quarter, source: MPROP REST"`
- `"Part 1 Crimes: 847 incidents, worsening up 12% vs. last quarter, source: MPD Monthly"`
- `"311 On-Time Response: 78%, 78% on-time, source: UCC 311 Data"`

**Keyboard interaction:**
- `Tab` moves focus to next card
- `Enter` or `Space` toggles expanded state
- `Escape` collapses expanded card
- When expanded, `Tab` moves to "Ask AI" button inside the card

**Color-blind safety:**
- Trend direction communicated by: (1) directional arrow icon, (2) percentage number, (3) color
- Removing color still leaves two channels of information
- Progress bar includes numeric percentage label beside it

### Animation Specifications

| Animation | Duration | Easing | Trigger | Reduced Motion |
|-----------|----------|--------|---------|----------------|
| **Card entrance** | 350ms | `ease-out` | Mount / category switch | Instant (opacity 0 to 1, no translate) |
| **Stagger delay** | 60ms per card | — | Sequential per card index | No stagger, all appear at once |
| **Hover lift** | 150ms | `ease-in-out` | Mouse enter/leave | No transform, only shadow change |
| **Progress bar fill** | 800ms | `ease-out` | Card mount | Instant fill |
| **Skeleton shimmer** | 1500ms loop | `linear` | While `state === "loading"` | Static gray placeholder (no shimmer) |
| **Expand/collapse** | 250ms | `ease-in-out` | Click/Enter/Space | Instant height change |
| **Sparkline draw** | 600ms | `ease-out` | Card expand | Instant (fully drawn) |

Framer Motion implementation:
```typescript
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
      delay: index * 0.06,
    },
  }),
};
```

Reduced motion wrapper:
```typescript
const prefersReducedMotion = useReducedMotion();
const resolvedVariants = prefersReducedMotion
  ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0 } } }
  : cardVariants;
```

### Interaction Pattern: Expand to Detail

**Recommendation: Click-to-expand, not drill-down navigation.**

Why:
- Keeps user in context (no page change, no back-button confusion)
- Mobile-friendly (no navigation stack to manage)
- Matches progressive disclosure principle
- The AI sidebar handles deep dives — cards just need to show one more level of detail

**Expanded state shows:**
1. Sparkline chart (last 6-12 periods) using Recharts `<AreaChart>` with category color fill
2. "Compare to city average" inline stat (if available)
3. "Ask AI about this" button — triggers CopilotKit with pre-filled prompt: `"Tell me about {label} in {neighborhood}"`
4. Last updated timestamp in human-readable format

**Collapsed state shows:**
1. Label + trend badge (top row)
2. Big number + unit
3. Progress bar (if applicable)
4. Source caption

### Real Data Examples

Using actual Milwaukee metrics from the data dictionary:

> **Data freshness labels:** Research validated that not all sources are live APIs. Each metric card's source caption MUST include a freshness indicator. The `source.lastUpdated` field in the props drives this. Display format: "src: MPROP REST -- Updated Mar 2026" in IBM Plex Mono. For monthly-refresh sources like crime data, show "Data through [month]".

**Community category (Teal `#1A6B52`) — 4 metrics, all live API:**

| Metric | Example Value | Unit | Trend | Source | Data Freshness |
|--------|--------------|------|-------|--------|---------------|
| Total Properties | 4,218 | parcels | stable, 0% vs. Q4 2025 | MPROP REST | Live (daily refresh) |
| Owner-Occupied Rate | 61% | of residential | stable, 0% vs. 2024 | MPROP REST | Live (daily refresh) |
| Median Assessed Value | $67,400 | per parcel | improving, up 4% vs. 2024 | MPROP REST | Live (daily refresh) |
| Schools | 7 | schools | — | Community Resources | Static (manual) |

> **Note on Owner-Occupancy:** Research validated 97,227 owner-occupied properties out of ~160K total parcels (~61% citywide). Per-neighborhood rates will vary. Source is MPROP `OWN_OCPD = 'O'` field.

**Public Safety category (Brick `#B84233`) — 3 metrics, monthly refresh:**

| Metric | Example Value | Unit | Trend | Source | Data Freshness |
|--------|--------------|------|-------|--------|---------------|
| Part 1 Crimes | 847 | incidents | worsening, up 12% vs. 2024 | MPD Monthly MapServer | Monthly ("Data through Mar 2026") |
| Fire Incidents | 19 | incidents | stable, 1% vs. Q1 2025 | MFD Dispatch | Nightly refresh |
| Overdose Calls | 7 | calls | worsening, up 40% vs. Q1 2025 | MFD Dispatch (data.milwaukee.gov) | Nightly refresh (needs pipeline) |

> **Note on Part 1 Crimes card:** This is the richest card in the dashboard. The `crimeYoYChange` percentage feeds directly into the trend badge (not a separate card — it IS the trend for this metric). The `breakdown` field populates the expanded view with a horizontal bar chart of crime types (Assault, Burglary, Theft, etc.) — research confirmed 10 separate crime type layers are available. Collapsed: one number + trend. Expanded: type breakdown + sparkline + "Ask AI."
>
> **Overdose Calls — requires pipeline work:** This metric is NOT a direct API call. MFD dispatch data lives on data.milwaukee.gov (not ArcGIS), and overdose/Narcan calls must be filtered from raw dispatch call types. Feasible for prototype if the team builds a call-type filter, but should be treated as a stretch goal. If not ready at launch, this card uses the `state: "empty"` pattern with "Coming soon" messaging. Public Safety still has 2 solid cards (Part 1 Crimes, Fire Incidents) without it.
>
> **Crime data freshness is critical.** MPD data is monthly refresh, not real-time. The source caption MUST show "Data through [month]" to avoid the impression that residents are seeing live crime data. This is a trust issue — overstating data freshness erodes credibility.

**Quality of Life category (Steel `#2563EB`) — 5 metrics confirmed, 1 deferred:**

| Metric | Example Value | Unit | Trend | Source | Data Freshness |
|--------|--------------|------|-------|--------|---------------|
| Vacant Buildings | 1,552 | buildings (citywide) | improving, down 3% vs. 2024 | Strong Neighborhoods MapServer | Live |
| Tax-Delinquent Properties | 89 | parcels | worsening, up 7% vs. Q4 2025 | Monthly XLSX upload | Monthly ("Updated: Mar 2026") |
| Foreclosures (City-Owned) | 928 | parcels (citywide) | improving, down 20% vs. 2024 | Foreclosed Properties MapServer | Nightly refresh |
| Foreclosures (Bank-Owned) | 228 | parcels (citywide) | stable, 0% vs. 2024 | Foreclosed Properties MapServer | Nightly refresh |
| Avg Assessed Value | $67,400 | per parcel | improving, up 4% vs. 2024 | MPROP REST | Live (daily refresh) |

> **Vacant Properties — source change:** Research found that the MPROP land use query (8800-8899) returns ~150K results, which is clearly wrong (it includes all sorts of parcels). The Strong Neighborhoods MapServer has 1,552 confirmed vacant buildings — use this as the v1 source. Per-neighborhood counts derived by spatial query against neighborhood polygons.
>
> **Tax Delinquency — not a live API:** Data comes as monthly XLSX, not from ArcGIS REST. The architecture team needs to handle this as a periodic file import into Convex, not a real-time sync. The card source caption must show "Updated: [month year]" to be honest about freshness.
>
> **Raze Orders — DEFERRED to Phase 2:** Research confirmed no public API exists for raze orders or building violations (`BI_VIOL` in MPROP is not reliably queryable). Removed from v1 metric list. This drops Quality of Life from 6 to 5 cards.
>
> **Foreclosures — real numbers:** Research found 928 city-owned + 228 bank-owned = 1,156 total citywide. These are real validated counts from the live API, not estimates. Per-neighborhood breakdowns via spatial query.

**Wellness category (Plum `#7C3AED`) — 1 confirmed, weakest category:**

| Metric | Example Value | Unit | Trend | Source | Data Freshness |
|--------|--------------|------|-------|--------|---------------|
| Food Inspection Pass Rate | 91% | of inspections | stable, 1% vs. 2024 | Open Data Portal | Regular updates |

> **Phase 1 reality:** Wellness has only 1 confirmed data source, flagged as optional by the architecture team. If Food Inspection Pass Rate is not available at launch, this tab shows an honest empty state: "Wellness data for this neighborhood is coming soon. More metrics require city data partnerships." This is better than hiding the tab — it signals intent and invites community feedback on what data matters most.
>
> **Phase 2+ candidates** (require city partnerships): Social Vulnerability Index (CDC SVI), lead abatement orders (MHD), shelter bed availability (Housing Authority), behavioral health referrals (MHD), air quality from MKE FreshAir Collective. These are documented in the data dictionary's "Data Gaps" section.

### Trend Direction Logic

"Improving" and "worsening" are semantic, not directional. The same arrow direction means different things for different metrics:

| Metric Type | Number Goes Down | Number Goes Up |
|-------------|-----------------|---------------|
| Vacant buildings, tax-delinquent, foreclosures, crime, fire incidents, overdose calls | **Improving** (green, down arrow) | **Worsening** (red, up arrow) |
| Assessed value, owner-occupancy rate, food inspection pass rate, total properties | **Worsening** (red, down arrow) | **Improving** (green, up arrow) |

This mapping is configured per metric in the data layer, not in the component. The component receives `trend.direction` as a semantic value.

---

## Component 2: Category Tabs

### TypeScript Props Interface

```typescript
interface CategoryTab {
  /** Unique identifier: "community", "publicSafety", etc. */
  id: string;

  /** Display label — pulled from next-intl translations */
  label: string;

  /** Lucide icon component name */
  icon: "CircleDot" | "Shield" | "Building2" | "Heart";

  /** Category color (light mode hex) */
  color: string;

  /** Category color (dark mode hex) */
  colorDark: string;

  /** Number of metrics in this category (shown as badge, optional) */
  metricCount?: number;

  /** Whether this tab is disabled (e.g., data not yet loaded) */
  disabled?: boolean;
}

interface CategoryTabsProps {
  /** Array of exactly four category definitions */
  categories: CategoryTab[];

  /** Currently active category ID */
  activeCategory: string;

  /** Callback when user selects a different category */
  onChange: (categoryId: string) => void;

  /** Optional: show metric count badge on each tab */
  showCounts?: boolean;
}
```

### Default Categories Configuration

```typescript
const DEFAULT_CATEGORIES: CategoryTab[] = [
  {
    id: "community",
    label: "Community",       // from t("categories.community")
    icon: "CircleDot",
    color: "#1A6B52",
    colorDark: "#34D399",
    metricCount: 4,
  },
  {
    id: "publicSafety",
    label: "Public Safety",   // from t("categories.publicSafety")
    icon: "Shield",
    color: "#B84233",
    colorDark: "#F87171",
    metricCount: 3,
  },
  {
    id: "qualityOfLife",
    label: "Quality of Life",  // from t("categories.qualityOfLife")
    icon: "Building2",
    color: "#2563EB",
    colorDark: "#60A5FA",
    metricCount: 5,
  },
  {
    id: "wellness",
    label: "Wellness",        // from t("categories.wellness")
    icon: "Heart",
    color: "#7C3AED",
    colorDark: "#A78BFA",
    metricCount: 1,
  },
];
```

### Visual States

| State | Background | Text | Border/Indicator | Icon |
|-------|-----------|------|-----------------|------|
| **Active** | Category color (solid fill) | White `#FFFFFF` | 2px bottom indicator in category color (redundant with fill for accessibility) | White, filled variant |
| **Inactive** | Transparent | Foundry `#57534E` | None | Foundry, outline variant |
| **Hover (inactive)** | Category color at 8% opacity | Iron `#1C1917` | None | Iron |
| **Focus (keyboard)** | Current bg state | Current text state | `ring-2 ring-offset-2 ring-[category-color]` outside the tab | Current icon state |
| **Disabled** | Transparent | Limestone `#A8A29E` | None | Limestone |

**Dark mode adjustments:**
- Active: dark category color as background, `#022C22` (or appropriate dark foreground) text
- Inactive text: `#A8A29E`
- Hover: category dark color at 12% opacity
- Focus ring: dark category color

### Touch Targets and Sizing

| Property | Mobile `< 768px` | Tablet `768-1024px` | Desktop `> 1024px` |
|----------|-----------------|--------------------|--------------------|
| Min height | 48px (exceeds 44px WCAG minimum) | 44px | 40px |
| Min width | Equal flex (25% each) | Auto, min 100px | Auto, min 120px |
| Padding | 10px 12px | 10px 16px | 8px 20px |
| Font size | 11px / 0.6875rem, uppercase, 600 weight | 11px / 0.6875rem | 12px / 0.75rem |
| Icon size | 16px | 16px | 18px |
| Gap (icon to label) | 4px | 6px | 6px |
| Border radius | 8px (top only if using underline pattern) | 8px | 8px |

### Mobile Behavior: Horizontal Scroll with Fade

**Recommendation: Horizontal scroll, not vertical stack.**

Why:
- Four tabs fit comfortably on most phone screens (minimum 360px width)
- Vertical stacking wastes precious vertical space on mobile
- Horizontal scroll is a familiar mobile pattern (see iOS tabs, Material tabs)
- At 360px minimum viewport, each tab gets 90px — enough for icon + short label

**Overflow handling (only if labels are long in translation, e.g., Arabic):**
- Container: `overflow-x: auto`, `scroll-snap-type: x mandatory`
- Each tab: `scroll-snap-align: start`, `flex-shrink: 0`
- Fade indicators: 24px gradient fade on the scroll edge (direction-aware for RTL)
- Fade uses `pointer-events: none` so it does not block touch
- Fade is only visible when content overflows (check with `ResizeObserver`)

### Keyboard Navigation

Follows the WAI-ARIA Tabs pattern:

| Key | Behavior |
|-----|----------|
| `Tab` | Moves focus INTO the tablist (focuses the active tab). Next `Tab` moves OUT of tablist to the tab panel content. |
| `ArrowRight` | Moves focus to next tab. Wraps from last to first. In RTL, direction reverses. |
| `ArrowLeft` | Moves focus to previous tab. Wraps from first to last. In RTL, direction reverses. |
| `Home` | Moves focus to first tab. |
| `End` | Moves focus to last tab. |
| `Enter` / `Space` | Activates the focused tab. |

**HeroUI's Tabs component handles all of this via React Aria.** No custom keyboard logic needed.

ARIA structure:
```html
<div role="tablist" aria-label="Metric categories">
  <button
    role="tab"
    id="tab-community"
    aria-selected="true"
    aria-controls="panel-community"
    tabindex="0"
  >
    <CircleDot size={16} aria-hidden="true" />
    <span>Community</span>
  </button>
  <button
    role="tab"
    id="tab-publicSafety"
    aria-selected="false"
    aria-controls="panel-publicSafety"
    tabindex="-1"
  >
    <Shield size={16} aria-hidden="true" />
    <span>Public Safety</span>
  </button>
  <!-- ... -->
</div>
<div
  role="tabpanel"
  id="panel-community"
  aria-labelledby="tab-community"
  tabindex="0"
>
  <!-- Metric cards grid -->
</div>
```

### Animation Specifications

| Animation | Duration | Easing | Trigger | Reduced Motion |
|-----------|----------|--------|---------|----------------|
| **Active background morph** | 200ms | `ease-in-out` | Tab selection change | Instant color swap |
| **Tab content crossfade** | 200ms | `ease-in-out` | Active tab changes | Instant swap |
| **Metric card stagger** | 350ms + 60ms/card | `ease-out` | New category selected | Instant appear |
| **Focus ring appear** | 100ms | `ease-in` | Keyboard focus | Instant ring |

**Recommendation: Background morph, not underline slide.**

Why:
- Underline slide requires calculating pixel positions across tabs of varying width (especially across languages — Arabic labels are different widths than English)
- Background morph with `layoutId` in Framer Motion handles variable-width tabs automatically
- Filled background is a stronger visual signal than a thin underline (better for users with low vision)
- Matches HeroUI's built-in Tabs variant `"solid"`

Framer Motion implementation:
```typescript
// Active indicator as a shared layout animation
{isActive && (
  <motion.div
    layoutId="activeTabIndicator"
    className="absolute inset-0 rounded-lg"
    style={{ backgroundColor: tab.color }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
  />
)}
```

### RTL Support

- Tab order reverses visually (CSS `direction: rtl` on the tablist)
- Arrow key behavior reverses (handled by React Aria)
- Scroll fade indicators swap sides
- Icon remains before (inline-start of) label in reading order
- Use `ms-*` / `me-*` Tailwind utilities, not `ml-*` / `mr-*`

---

## Accessibility Checklist

### Metric Card

- [ ] `aria-label` includes: metric name, value, unit, trend direction, trend percentage, period, source
- [ ] Screen reader announces trend semantically ("improving, down 3%") not just the arrow character
- [ ] Focus ring visible on keyboard navigation (`focus-visible:ring-2`)
- [ ] Touch target minimum 44x44px on mobile
- [ ] Color is never the sole indicator of trend direction (icon + number always present)
- [ ] Skeleton loading state has `aria-busy="true"` and `aria-label="{label}: loading data"`
- [ ] Error state has descriptive text, not just a red color
- [ ] Progress bar has `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label`
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Text uses `rem` units (scales with user font size preference)
- [ ] Card works at 200% browser zoom without layout breakage
- [ ] Expanded state content is reachable via keyboard (Tab into sparkline, Ask AI button)

### Category Tabs

- [ ] `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on content
- [ ] `aria-selected` correctly reflects active state
- [ ] `aria-controls` links each tab to its panel
- [ ] Only the active tab has `tabindex="0"`; inactive tabs have `tabindex="-1"`
- [ ] Arrow keys navigate between tabs (HeroUI/React Aria handles this)
- [ ] `Home` and `End` keys work
- [ ] Icon has `aria-hidden="true"` (decorative — label provides the text)
- [ ] Touch target minimum 44px height on all breakpoints
- [ ] Focus ring clearly visible against all background colors
- [ ] Tab labels come from `next-intl` translations (not hardcoded English)
- [ ] RTL layout works correctly for Arabic locale
- [ ] Disabled tabs have `aria-disabled="true"` and are skipped by arrow key navigation

---

## Data Shape Contract (for Architecture Team)

The Metric Card component expects data in this shape from the API/state layer:

```typescript
interface NeighborhoodMetric {
  id: string;                        // "vacant_properties"
  category: CategoryId;              // "community"
  label: string;                     // i18n key: "metrics.vacantProperties"
  value: number | null;
  unit: string;                      // i18n key: "units.parcels"
  trendDirection: "improving" | "worsening" | "stable" | null;
  trendPercentage: number | null;
  trendComparedTo: string;           // i18n key: "periods.vsLastQuarter"
  sourceName: string;
  sourceLastUpdated: string;         // ISO 8601
  progressValue?: number;            // 0-100
  progressLabel?: string;            // i18n key
  sparklineData?: Array<{ period: string; value: number }>;
  sparklinePeriodType?: string;
}

type CategoryId = "community" | "publicSafety" | "qualityOfLife" | "wellness";
```

**Key constraint for the data layer:** Trend direction must be computed server-side (or in the data pipeline) as a semantic value — "improving" or "worsening" — not a raw "up" or "down". The component does not know whether "down" is good or bad for a given metric. That logic belongs in the data layer per metric configuration.

---

## Implementation Notes

### HeroUI Components Used

| Component | From | Purpose |
|-----------|------|---------|
| `Card`, `CardBody` | `@heroui/react` | Metric card container |
| `Chip` | `@heroui/react` | Trend badge |
| `Progress` | `@heroui/react` | Optional progress bar |
| `Skeleton` | `@heroui/react` | Loading state |
| `Tabs`, `Tab` | `@heroui/react` | Category tab navigation |
| `Tooltip` | `@heroui/react` | Source info hover detail |

### Lucide Icons Used

| Icon | Import | Context |
|------|--------|---------|
| `CircleDot` | `lucide-react` | Community tab |
| `Shield` | `lucide-react` | Public Safety tab |
| `Building2` | `lucide-react` | Quality of Life tab |
| `Heart` | `lucide-react` | Wellness tab |
| `TrendingDown` | `lucide-react` | Improving trend (for "bad" metrics going down) |
| `TrendingUp` | `lucide-react` | Worsening trend (for "bad" metrics going up) |
| `ArrowRight` | `lucide-react` | Stable trend |
| `MessageSquareText` | `lucide-react` | "Ask AI" button in expanded card |
| `RefreshCw` | `lucide-react` | Retry button on error state |

### File Structure Recommendation

```
src/
  components/
    metrics/
      MetricCard.tsx          # Main card component
      MetricCardSkeleton.tsx  # Loading state (extracted for reuse)
      TrendBadge.tsx          # Trend chip (used inside MetricCard)
      MetricGrid.tsx          # Responsive grid wrapper
    navigation/
      CategoryTabs.tsx        # Tab navigation component
  types/
    metrics.ts               # Shared TypeScript interfaces
  constants/
    categories.ts            # Category definitions, colors, icons
```
