# MKE Dashboard — UX, Accessibility & Multilingual Strategy

## The Design Problem

Philadelphia's Kensington Dashboard (ArcGIS Experience Builder) is:
- Desktop-only (they literally say "we recommend viewing on a computer")
- Dense in a way that's confusing, not informative
- No mobile responsive design
- No accessibility considerations visible
- English only
- No AI assistance for interpreting the data

World Monitor (the CopilotKit reference project) is:
- Beautiful, Palantir-style data density
- But designed for analysts, not residents
- Dark theme, small text, information overload
- Not accessible for general public use

**Our dashboard needs to be neither.** It needs to be a civic tool that a Hmong-speaking grandmother, a Spanish-speaking small business owner, an alderperson on their phone, and a city official reviewing data on a laptop can all use effectively.

---

## Design Direction: Civic Minimalism

Not Palantir dark-mode density. Not ArcGIS clunk. Think:

- **Mobile-first** — most residents will access this on phones
- **Progressive disclosure** — show the essential numbers first, let people drill in
- **Large touch targets** — buttons and tabs at least 44x44px (WCAG minimum)
- **High contrast** — readable in sunlight on a phone screen
- **Light theme default** — with dark mode as an option
- **One metric, one card** — no cramming multiple numbers into a single visual
- **The AI is the primary interface for complex questions** — the dashboard shows the overview, CopilotKit handles the deep dives

### Component Library: HeroUI

Use **HeroUI** (formerly NextUI). Why:

- Built on **React Aria** (Adobe) — the gold standard for web accessibility (keyboard navigation, screen reader support, focus management, ARIA attributes all baked in)
- Tailwind CSS styling — fully customizable via theme plugin
- Built-in internationalization and RTL support
- Framer Motion animations included — polished out of the box
- Components you'll use: Tabs, Card, Button, Select, Modal (mobile sidebar), Dropdown, Tooltip, Skeleton, Chip, Progress, Navbar, Listbox, Table, Accordion, ButtonGroup
- Looks production-ready immediately (critical for city official demos)

### Layout: Mobile-First

```
Mobile (< 768px):
┌─────────────────────┐
│ Header + Lang Select│
├─────────────────────┤
│ Neighborhood Select │
├─────────────────────┤
│ Map (collapsed,     │
│ expandable)         │
├─────────────────────┤
│ Category Tabs       │
├─────────────────────┤
│ Metric Cards        │
│ (single column)     │
├─────────────────────┤
│ AI Chat Button (FAB)│
└─────────────────────┘

Tablet (768px - 1024px):
┌──────────┬──────────┐
│ Map      │ Metrics  │
│          │ (tabs +  │
│          │  cards)  │
├──────────┴──────────┤
│ AI Chat (bottom)    │
└─────────────────────┘

Desktop (> 1024px):
┌────────┬─────────────┬────────┐
│ Map &  │ Metrics     │ AI     │
│ Nav    │ Panel       │ Chat   │
│ (300px)│ (flex)      │ (350px)│
└────────┴─────────────┴────────┘
```

---

## Accessibility (WCAG 2.1 AA Minimum)

### Tools & Frameworks

| Tool | Purpose | How to Use |
|------|---------|-----------|
| **React Aria** (via HeroUI) | Accessible component primitives | Keyboard nav, focus traps, ARIA built in |
| **@radix-ui/react-visually-hidden** | Screen reader-only content | Hide visual decorations from screen readers |
| **tailwind-merge + clsx** | Conditional styles | Apply focus-visible rings, high contrast styles |
| **axe-core** (`@axe-core/react`) | Automated accessibility testing | Runs in dev mode, flags violations in console |
| **eslint-plugin-jsx-a11y** | Lint-time accessibility checks | Catches missing alt text, invalid ARIA, etc. |
| **Lighthouse CI** | Automated accessibility scoring | Run in CI/CD, block deploys below 90 score |

### Requirements Checklist

| Requirement | Implementation |
|------------|---------------|
| **Color contrast** | All text meets 4.5:1 ratio (AA). Use Tailwind's slate/zinc palette, not light grays. Test with Colour Contrast Analyser. |
| **Focus indicators** | Visible focus rings on all interactive elements. Tailwind: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500` |
| **Keyboard navigation** | All functionality accessible via keyboard. Tab order logical. Escape closes modals/sheets. Radix handles this. |
| **Screen reader support** | All metric cards have `aria-label` with full context: "Vacant properties: 142 parcels, down 3% from last period, source: MPROP" |
| **Reduced motion** | Respect `prefers-reduced-motion`. Wrap animations in `@media (prefers-reduced-motion: no-preference)` |
| **Text resizing** | Layout doesn't break at 200% zoom. Use rem units, not px for text. |
| **Touch targets** | Minimum 44x44px for all buttons, tabs, selectors. Extra padding on mobile. |
| **Alt text for map** | Map has aria-label describing what it shows. Data layers described in text outside the map. |
| **Skip navigation** | "Skip to main content" link as first focusable element |
| **Error states** | Clear error messages with suggestions. Don't rely on color alone (add icons). |
| **Language attribute** | `<html lang={locale}>` updates when language changes. `dir="rtl"` for Arabic. |

### Map Accessibility

Mapbox/MapLibre maps are inherently not screen-reader accessible (they're WebGL canvases). Mitigate:

- Provide a text-based **data table alternative** for every map view (toggle: "View as table")
- Add `aria-label` to the map container describing what's shown
- Ensure all map data is ALSO available in the metric cards (which are accessible)
- Keyboard users can navigate metric cards without needing the map

---

## Multilingual Strategy

### Milwaukee's Languages

Milwaukee's population includes significant communities speaking:

| Language | Community | MKE Context |
|---------|-----------|-------------|
| **English** | Default | — |
| **Spanish** | Largest non-English group (~17% of city) | South side, Walker's Point, Clarke Square |
| **Hmong** | One of largest Hmong populations in US | North side, especially around 53206, 53218 |
| **Arabic** | Growing Middle Eastern community | — |
| **Burmese/Karen** | Refugee community | — |
| **Somali** | East African community | — |

The Milwaukee Health Department already publishes materials in English, Spanish, Hmong, and Arabic. The dashboard should support at minimum these four, with architecture to add more.

### Three Layers of Translation

#### Layer 1: Static UI (next-intl)

All buttons, labels, headers, category names, metric labels, navigation — translated via JSON message files.

**Package:** `next-intl` (best for Next.js App Router)

```
messages/
├── en.json    # English (default)
├── es.json    # Spanish
├── hmn.json   # Hmong
├── ar.json    # Arabic
├── my.json    # Burmese (future)
└── so.json    # Somali (future)
```

Example message structure:
```json
{
  "dashboard": {
    "title": "Milwaukee Neighborhood Dashboard",
    "subtitle": "Cross-department data for transparency and accountability"
  },
  "categories": {
    "community": "Community",
    "publicSafety": "Public Safety",
    "qualityOfLife": "Quality of Life",
    "wellness": "Wellness"
  },
  "metrics": {
    "vacantProperties": "Vacant Properties",
    "taxDelinquent": "Tax-Delinquent Properties",
    "crimeIncidents": "Crime Incidents",
    "razeOrders": "Raze Orders",
    "311requests": "311 Service Requests",
    "onTimeResponse": "On-Time Response Rate"
  },
  "actions": {
    "signIn": "Sign In",
    "save": "Save Neighborhood",
    "compare": "Compare",
    "askAI": "Ask About This Neighborhood",
    "viewAsList": "View as Table"
  }
}
```

**RTL support for Arabic:**
- `next-intl` handles RTL direction automatically
- Use CSS logical properties throughout: `margin-inline-start` not `margin-left`, `padding-inline-end` not `padding-right`
- Tailwind CSS supports logical properties via `ms-*` (margin-start), `me-*` (margin-end), `ps-*` (padding-start), `pe-*` (padding-end)
- The layout flips automatically when `dir="rtl"` is set on `<html>`

**How to generate initial translations:**
1. Write all English messages first
2. Use Claude to translate to Spanish, Hmong, Arabic in one batch
3. Have community members review translations (especially Hmong — it has dialectal variation, and the Romanized Popular Alphabet vs. other systems matters)
4. Store reviewed translations in the JSON files

#### Layer 2: AI Chat (Claude is Natively Multilingual)

This is where AI-powered multilingual gets powerful. **Claude speaks all of Milwaukee's languages natively.** You don't need a translation API for the chat — you just need to tell CopilotKit to respond in the user's language.

**Implementation:**

```tsx
// In DashboardContext.tsx or CopilotSidebar config
const locale = useLocale(); // from next-intl

// Update CopilotKit instructions based on locale
const instructions = {
  en: "You are the Milwaukee Neighborhood Data Assistant. Respond in English.",
  es: "Eres el Asistente de Datos de Vecindarios de Milwaukee. Responde en español.",
  hmn: "Koj yog Milwaukee Neighborhood Data Assistant. Teb ua lus Hmoob.",
  ar: "أنت مساعد بيانات أحياء ميلووكي. أجب باللغة العربية.",
};

<CopilotSidebar
  instructions={instructions[locale] + " " + baseInstructions}
  labels={{
    title: t('ai.title'),        // translated via next-intl
    placeholder: t('ai.placeholder'),
  }}
/>
```

**Key insight:** When a Hmong-speaking resident types a question in Hmong, Claude understands it, looks at the neighborhood metrics (in the readable context), and responds in Hmong with specific data values. No translation API needed. The AI IS the translator.

**Auto-detect language:** Alternatively, add an instruction that tells Claude to detect the language of the user's message and respond in the same language, regardless of the UI locale setting.

#### Layer 3: Dynamic Data Labels (Hybrid Approach)

Metric values are numbers (universal), but their labels and descriptions need translation. Two approaches:

**Option A: Pre-translated via next-intl (recommended for Phase 1)**
- All metric names, units, data source labels are in the JSON message files
- Fastest to implement, most reliable
- Community reviewable

**Option B: AI-translated on the fly (future enhancement)**
- For dynamic content like AI-generated neighborhood narratives, trend descriptions, or insight summaries
- Claude generates the narrative in the user's language
- No separate translation API needed

### Translation Workflow

| Phase | What Gets Translated | How |
|-------|---------------------|-----|
| Phase 1 | UI labels, buttons, headers, metric names, category names | Claude generates initial translations → community review → JSON files |
| Phase 2 | AI chat instructions, suggested questions, error messages | Same process |
| Phase 3 | AI-generated narratives, neighborhood summaries | Claude responds in user's detected/selected language |
| Phase 4 | Data source descriptions, help text, onboarding tour | Same as Phase 1 |

### Hmong-Specific Considerations

Hmong language support is rare in tech products and gets it wrong frequently. Key considerations:

- **Romanized Popular Alphabet (RPA)** is the standard written form — use this, not Pahawh Hmong script
- **Tone markers** matter — Hmong is tonal with 7-8 tones indicated by final consonants (b, j, v, s, g, m, d + unmarked)
- **Dialectal variation** — Green Mong (Moob Leeg) vs. White Hmong (Hmoob Dawb). Milwaukee's community is primarily White Hmong. Claude handles both.
- **Community review is essential** — don't ship Hmong translations without review by Hmong speakers. Partner with Hmong American Women's Association (HAWA), Hmong American Friendship Association, or 18 Rabbits community media.
- **Claude's Hmong capability** — Claude can read and write Hmong (White Hmong dialect) competently. It's not perfect for all specialized vocabulary, but for civic data terms it works well. Community review catches edge cases.

### Packages for Multilingual

| Package | Purpose | Notes |
|---------|---------|-------|
| `next-intl` | Static UI translations, locale routing, RTL | Best for Next.js App Router. Handles plurals, dates, numbers per locale. |
| `@formatjs/intl-numberformat` | Number formatting per locale | Formats "1,234" vs "1.234" vs "١٬٢٣٤" automatically |
| `@formatjs/intl-datetimeformat` | Date formatting per locale | Formats dates in locale-appropriate style |
| Tailwind CSS logical properties | RTL layout support | `ms-*`, `me-*`, `ps-*`, `pe-*` replace `ml-*`, `mr-*` etc. |
| Claude (via CopilotKit) | AI chat in any language | No additional package — Claude is natively multilingual |

### Language Selector Component

Place in the header, accessible at all times:

```
🌐 English ▾
   ├── English
   ├── Español
   ├── Hmoob (Hmong)
   ├── العربية (Arabic)
   └── + Request a language
```

The "Request a language" option opens a feedback form — lets the community tell you what languages to add next.

---

## Updated Sprint 4 Prompt for Claude Code

Use this instead of the generic Sprint 4 prompt:

```
claude

> Read the MKE Style Guide (mke-style-guide.md) before building any UI.
  Follow its color system, typography, spacing, and component patterns.

> Install and configure next-intl for multilingual support. Set up 
  locale routing with these locales: en (default), es, hmn, ar.
  Create the messages/ directory with en.json containing all UI strings.
  Use Claude to generate es.json, hmn.json, and ar.json translations.

> Use HeroUI components throughout. Install with:
  npm install @heroui/react framer-motion
  Configure the heroui plugin in tailwind.config.js with the 
  custom "mke-light" theme from the style guide.

> Build the dashboard layout MOBILE-FIRST:
  - Mobile: single column, collapsible map (HeroUI Accordion), 
    bottom FAB for AI chat, full-screen Modal for chat
  - Tablet: two-column (map + metrics)
  - Desktop: three-column (nav + metrics + AI chat sidebar)
  
  Use CSS logical properties (ms-*, me-*, ps-*, pe-*) instead of 
  directional properties (ml-*, mr-*) so RTL works automatically.

> Create MetricCard using HeroUI Card component:
  - Large readable value (Fraunces font, text-4xl)
  - Clear label above (DM Sans, text-xs, uppercase, tracking-wide)
  - Trend badge using HeroUI Chip (green for improving, red for 
    worsening — with BOTH arrow icon AND percentage, never color alone)
  - Progress bar for response rate metrics using HeroUI Progress
  - Source text in IBM Plex Mono, very muted
  - Full aria-label: "{label}: {value} {unit}, {trend}, source: {source}"
  - Minimum touch target 44x44px

> Create accessible category tabs using HeroUI Tabs:
  - Four tabs with Lucide icon AND text label on each
  - Keyboard navigable (arrow keys switch tabs — HeroUI handles this)
  - Large touch targets on mobile
  - Labels come from next-intl translations

> Add language selector in the header using HeroUI Dropdown:
  - Options: English, Español, Hmoob, العربية
  - Changing language updates all UI text immediately
  - Sets html lang attribute and dir="rtl" for Arabic
  - Persists preference in localStorage (and Convex if authenticated)

> Add "View as Table" toggle for the map section:
  - When toggled, shows the same data in HeroUI Table component
  - Table has proper th scope, caption, and is keyboard navigable
  - This is the primary accessibility alternative to the WebGL map

> Install axe-core for development accessibility testing:
  npm install -D @axe-core/react
  Import in layout.tsx (dev only) to flag issues in console.

> Ensure all interactive elements have visible focus indicators.
  
> Add prefers-reduced-motion support using Framer Motion's 
  useReducedMotion() hook — set all animation durations to 0.

> Add skip navigation link as the first element in the body:
  "Skip to main content" — visually hidden until focused.
```

---

## NPM Packages (Updated)

### Core
- `next-intl` — Multilingual UI, locale routing, RTL support
- `react-map-gl` + `mapbox-gl` — Map rendering
- `convex` — Backend
- `@clerk/nextjs` — Auth
- `@copilotkit/react-core` + `@copilotkit/react-ui` + `@copilotkit/runtime` — AI
- `recharts` — Charts

### UI & Accessibility
- `@heroui/react` + `framer-motion` — Accessible component library (React Aria foundation)
- `lucide-react` — Icon library
- `tailwind-merge` + `clsx` — Conditional class merging
- `@axe-core/react` (dev only) — Automated accessibility testing
- `eslint-plugin-jsx-a11y` — Accessibility linting

### Internationalization
- `next-intl` — Translations, plurals, dates, numbers, RTL
- `@formatjs/intl-numberformat` — Locale-aware number formatting
- `@formatjs/intl-datetimeformat` — Locale-aware date formatting

### No Translation API Needed
Claude (via CopilotKit) handles all AI chat translation natively. No Google Translate, no DeepL, no Amazon Translate API needed for the chat layer. For static UI strings, translations are pre-generated and community-reviewed.
