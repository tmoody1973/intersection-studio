# MKE Neighborhood Dashboard — Style Guide & Design System

---

## Component Library: HeroUI (Recommended)

### Why HeroUI over shadcn/ui

After researching both, **HeroUI is the better fit** for a civic dashboard that needs to look polished for city officials, be accessible for all residents, and support multilingual use from day one.

| Factor | HeroUI | shadcn/ui |
|--------|--------|-----------|
| **Accessibility foundation** | React Aria (Adobe) — arguably the gold standard for web accessibility | Radix UI — excellent, but maintenance concerns raised in 2025/2026 |
| **Out-of-box polish** | Beautiful defaults, Framer Motion animations baked in | Minimal defaults, you style everything yourself |
| **i18n support** | Built-in internationalization, RTL support | No built-in i18n |
| **Dark mode** | Automatic dark mode recognition | Manual setup required |
| **Bundle size** | ~40KB gzipped per component set | Smaller per-component |
| **Customization** | Theme system via Tailwind CSS plugin | Copy-paste, full code ownership |
| **Demo impression** | Looks production-ready immediately | Looks minimal until you invest design time |
| **Learning curve** | Easier — import and use | More setup — copy, configure, style |

**The deciding factor:** You're building a prototype to show city officials. HeroUI looks finished out of the box. shadcn/ui looks unfinished until you invest significant design time. For a 12-day sprint, HeroUI gets you to "wow" faster.

### HeroUI Setup

```bash
npm install @heroui/react framer-motion
```

Tailwind config:
```js
// tailwind.config.js
const { heroui } = require("@heroui/react");

module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [heroui({
    themes: {
      "mke-civic": {
        // Our custom Milwaukee civic theme — defined below
      }
    }
  })],
};
```

---

## Color System: Milwaukee Civic Palette

### Philosophy

Not the generic blue/gray of government websites. Not the dark analyst aesthetic of World Monitor. A palette that feels **grounded, trustworthy, and distinctly Milwaukee** — referencing the city's lakefront, brick architecture, and green spaces while meeting WCAG AA contrast requirements.

### Primary Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Lakeshore** (Primary) | Deep teal | `#1A6B52` | Primary actions, selected states, map boundary fills, CopilotKit accent |
| **Cream City** (Background) | Warm off-white | `#F8F6F1` | Page background, card backgrounds (references Milwaukee's cream-colored brick) |
| **Iron** (Text) | Near-black warm | `#1C1917` | Primary text, headings |
| **Foundry** (Secondary text) | Dark warm gray | `#57534E` | Body text, descriptions |
| **Limestone** (Muted) | Medium warm gray | `#A8A29E` | Placeholder text, borders, disabled states |
| **Civic Gold** (Accent) | Warm gold | `#C4960C` | Highlights, badges, call-to-action accents, notifications |

### Semantic Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Positive** | Forest green | `#15803D` | Improving trends, positive metrics, success states |
| **Positive BG** | Soft green | `#DCFCE7` | Background for positive badges |
| **Warning** | Amber | `#D97706` | Stagnant metrics, needs attention |
| **Warning BG** | Soft amber | `#FEF3C7` | Background for warning badges |
| **Critical** | Brick red | `#B91C1C` | Worsening trends, urgent metrics |
| **Critical BG** | Soft red | `#FEE2E2` | Background for critical badges |
| **Info** | Steel blue | `#1D4ED8` | Informational, links, data sources |
| **Info BG** | Soft blue | `#DBEAFE` | Background for info badges |

### Map Layer Colors

| Layer | Color | Hex | Opacity |
|-------|-------|-----|---------|
| Neighborhood boundary fill | Lakeshore | `#1A6B52` | 8% |
| Neighborhood boundary stroke | Lakeshore dark | `#0F4A37` | 100% |
| Vacant parcels | Brick red | `#B91C1C` | 50% |
| Tax-delinquent parcels | Amber | `#D97706` | 40% |
| Foreclosed parcels | Deep red | `#7F1D1D` | 50% |
| Crime points | Brick red | `#B91C1C` | 60% |
| Community resources | Steel blue | `#1D4ED8` | 80% |
| Historical HOLC Grade D (redlined) | Red tint | `#EF4444` | 15% |
| Historical HOLC Grade C | Yellow tint | `#EAB308` | 15% |
| Historical HOLC Grade B | Blue tint | `#3B82F6` | 15% |
| Historical HOLC Grade A | Green tint | `#22C55E` | 15% |

### Dark Mode Palette

| Role | Light | Dark |
|------|-------|------|
| Background | `#F8F6F1` (Cream City) | `#1C1917` (Iron) |
| Surface/Card | `#FFFFFF` | `#292524` |
| Border | `#E7E5E4` | `#44403C` |
| Primary text | `#1C1917` | `#F5F5F4` |
| Secondary text | `#57534E` | `#A8A29E` |
| Primary action | `#1A6B52` | `#34D399` (lighter teal for dark bg) |

### Category Colors

Each dashboard category has a consistent color used for tab indicators, card borders, and metric context:

| Category | Color | Hex |
|----------|-------|-----|
| Community | Teal | `#1A6B52` |
| Public Safety | Brick | `#B84233` |
| Quality of Life | Steel | `#2563EB` |
| Wellness | Plum | `#7C3AED` |

### Contrast Compliance

All text/background combinations must meet WCAG AA minimum:

| Combination | Ratio | Pass? |
|------------|-------|-------|
| Iron on Cream City (#1C1917 on #F8F6F1) | 14.8:1 | AAA |
| Foundry on Cream City (#57534E on #F8F6F1) | 6.2:1 | AA |
| Lakeshore on Cream City (#1A6B52 on #F8F6F1) | 5.9:1 | AA |
| Limestone on Cream City (#A8A29E on #F8F6F1) | 3.0:1 | FAIL — use only for decorative/non-essential text |
| White on Lakeshore (#FFFFFF on #1A6B52) | 5.9:1 | AA |
| White on Brick (#FFFFFF on #B84233) | 4.9:1 | AA |

---

## Typography

### Font Stack

| Role | Font | Fallback | Weight | Usage |
|------|------|----------|--------|-------|
| **Display** | Fraunces | Georgia, serif | 400, 600, 700 | Dashboard title, neighborhood names, large metric values |
| **Body** | DM Sans | system-ui, sans-serif | 400, 500, 600, 700 | All UI text, labels, descriptions, buttons |
| **Data** | IBM Plex Mono | Consolas, monospace | 400, 500, 600 | Data source labels, endpoint URLs, code references, metric units |

### Why These Fonts

- **Fraunces** — A variable serif with warmth and character. It says "this is a civic institution, not a tech startup." The soft optical sizing makes large numbers readable and dignified. Free on Google Fonts.
- **DM Sans** — Clean geometric sans-serif with excellent readability at small sizes. Supports extended Latin (covers most European languages). Better personality than Inter or system fonts. Free on Google Fonts.
- **IBM Plex Mono** — Readable monospace for data labels. The "IBM" heritage adds institutional credibility. Supports Arabic script via IBM Plex Sans Arabic companion. Free on Google Fonts.

### Hmong & Arabic Font Considerations

- **Hmong (RPA):** Uses standard Latin characters with no special glyphs. DM Sans covers all needed characters (including tone-marking final consonants). No special font needed.
- **Arabic:** DM Sans does NOT support Arabic script. When locale is Arabic, swap body font to **IBM Plex Sans Arabic** (free, designed to pair with IBM Plex). Display font: **Noto Serif Arabic** pairs well with Fraunces. Both on Google Fonts.
- **Spanish:** Fully covered by DM Sans (includes ñ, accented vowels, ¿, ¡).

### Type Scale

Mobile-first, using `rem` units for accessibility (respects user font size settings):

| Level | Size (mobile) | Size (desktop) | Weight | Font | Usage |
|-------|-------------|----------------|--------|------|-------|
| Display | 1.75rem (28px) | 2.25rem (36px) | 600 | Fraunces | Dashboard title |
| H1 | 1.5rem (24px) | 1.875rem (30px) | 600 | Fraunces | Neighborhood name |
| H2 | 1.25rem (20px) | 1.5rem (24px) | 600 | DM Sans | Category headers |
| H3 | 1.125rem (18px) | 1.25rem (20px) | 600 | DM Sans | Panel titles |
| Metric Value | 2rem (32px) | 2.5rem (40px) | 700 | Fraunces | The big number on metric cards |
| Body | 0.9375rem (15px) | 1rem (16px) | 400 | DM Sans | Paragraphs, descriptions |
| Body Small | 0.8125rem (13px) | 0.875rem (14px) | 400 | DM Sans | Secondary info, timestamps |
| Label | 0.6875rem (11px) | 0.75rem (12px) | 600 | DM Sans | Uppercase labels, category tabs |
| Caption | 0.625rem (10px) | 0.6875rem (11px) | 500 | IBM Plex Mono | Data sources, endpoint references |

### Line Heights

| Context | Line Height |
|---------|------------|
| Headings | 1.2 |
| Body text | 1.6 |
| Metric values | 1.0 |
| Labels | 1.3 |
| Captions | 1.4 |

---

## Spacing System

Use Tailwind's default scale, but favor the 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (icon to label) |
| `space-2` | 8px | Between related elements |
| `space-3` | 12px | Card internal padding (mobile) |
| `space-4` | 16px | Card internal padding (desktop), between cards |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Major section breaks |
| `space-12` | 48px | Page-level spacing |

### Card Sizing

| Metric Card | Mobile | Desktop |
|------------|--------|---------|
| Min width | 100% (full column) | 200px |
| Padding | 12px 14px | 16px 18px |
| Border radius | 10px | 10px |
| Border left | 3px category color | 3px category color |

---

## Component Patterns

### Metric Card Anatomy

```
┌─────────────────────────────────┐
│ ▎ VACANT PROPERTIES     ↓ 3%  │  ← Label (uppercase, small) + Trend badge
│ ▎                              │
│ ▎ 142                          │  ← Big number (Fraunces, 2.5rem)
│ ▎ parcels                      │  ← Unit (small, muted)
│ ▎                              │
│ ▎ ████████░░░ 65% on-time      │  ← Progress bar (if applicable)
│ ▎                              │
│ ▎ src: MPROP REST              │  ← Source (caption, very muted)
└─────────────────────────────────┘
```

### Trend Badge

| Direction | Color | Icon | Background |
|-----------|-------|------|-----------|
| Improving (down for bad metrics like crime) | Forest green | `↓` | `#DCFCE7` |
| Worsening (up for bad metrics) | Brick red | `↑` | `#FEE2E2` |
| Stable (< 2% change) | Amber | `→` | `#FEF3C7` |

**Critical:** Don't rely on color alone. Always include the directional arrow icon AND the percentage number. This serves both colorblind users and screen readers.

### Category Tab Pattern

```
┌────────────┬────────────┬────────────┬────────────┐
│ ◉ Community│ ◈ Safety   │ ◆ QoL      │ ◎ Wellness │
└────────────┴────────────┴────────────┴────────────┘
```

- Icon + text label (never icon alone)
- Active tab: filled background in category color, white text
- Inactive tab: transparent background, muted text
- Min touch target: 44px height
- Keyboard: arrow keys navigate between tabs

### Neighborhood Selector

Mobile: Full-width dropdown (HeroUI Select component)
Desktop: Sidebar list with hover highlight

Each entry shows:
- Neighborhood name (DM Sans, 600)
- Population (IBM Plex Mono, muted)
- Mini sparkline of "vitality trend" (optional, future)

### AI Chat (CopilotKit Sidebar)

Customize CopilotKit's default styles to match the civic palette:

```css
/* Override CopilotKit sidebar styles */
:root {
  --copilotkit-primary: #1A6B52;           /* Lakeshore */
  --copilotkit-background: #F8F6F1;        /* Cream City */
  --copilotkit-text: #1C1917;              /* Iron */
  --copilotkit-border: #E7E5E4;
  --copilotkit-user-bubble: #1A6B52;       /* User messages */
  --copilotkit-assistant-bubble: #FFFFFF;   /* AI messages */
  --copilotkit-font-family: 'DM Sans', system-ui, sans-serif;
}
```

### Language Selector

Position: Header, right side, next to auth button.
Pattern: HeroUI Dropdown with flag emoji + language name:

```
🌐 English ▾
├── 🇺🇸 English
├── 🇲🇽 Español
├── 🇱🇦 Hmoob
├── 🇸🇦 العربية
└── ＋ Request a language
```

On mobile: Full-screen sheet (HeroUI Modal) instead of dropdown.

---

## Iconography

Use **Lucide React** (already available in Claude artifacts, 1000+ icons, MIT license):

| Context | Icon | Lucide Name |
|---------|------|-------------|
| Community category | `CircleDot` | `circle-dot` |
| Public Safety | `Shield` | `shield` |
| Quality of Life | `Building2` | `building-2` |
| Wellness | `Heart` | `heart` |
| Trend up (bad) | `TrendingUp` | `trending-up` |
| Trend down (good) | `TrendingDown` | `trending-down` |
| Map | `Map` | `map` |
| AI Chat | `MessageSquareText` | `message-square-text` |
| Data source | `Database` | `database` |
| Sign in | `LogIn` | `log-in` |
| Save neighborhood | `Bookmark` | `bookmark` |
| Compare | `ArrowLeftRight` | `arrow-left-right` |
| Language | `Globe` | `globe` |
| Download | `Download` | `download` |
| Settings | `Settings` | `settings` |
| Close | `X` | `x` |
| Menu (mobile) | `Menu` | `menu` |
| Search | `Search` | `search` |
| External link | `ExternalLink` | `external-link` |

---

## Motion & Animation

### HeroUI + Framer Motion defaults

HeroUI uses Framer Motion internally. Keep animations purposeful:

| Animation | Duration | Easing | When |
|-----------|----------|--------|------|
| Card entrance | 350ms | `ease-out` | Staggered on category switch (60ms delay per card) |
| Tab switch | 200ms | `ease-in-out` | Category tab change |
| Map fly-to | 800ms | Mapbox default | Neighborhood switch |
| Sidebar slide | 250ms | `ease-out` | AI chat open/close |
| Progress bar | 800ms | `ease-out` | On metric card mount |
| Tooltip | 150ms | `ease-in` | On hover |

### Reduced Motion

All animations wrapped in `prefers-reduced-motion` check. When reduced motion is preferred, elements appear instantly (no stagger, no slide, no fly-to).

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## HeroUI Theme Configuration

```js
// tailwind.config.js
const { heroui } = require("@heroui/react");

module.exports = {
  plugins: [heroui({
    themes: {
      "mke-light": {
        extend: "light",
        colors: {
          background: "#F8F6F1",
          foreground: "#1C1917",
          primary: {
            50: "#ECFDF5",
            100: "#D1FAE5",
            200: "#A7F3D0",
            300: "#6EE7B7",
            400: "#34D399",
            500: "#1A6B52",
            600: "#0F4A37",
            700: "#064E3B",
            800: "#022C22",
            900: "#011613",
            DEFAULT: "#1A6B52",
            foreground: "#FFFFFF",
          },
          secondary: {
            DEFAULT: "#57534E",
            foreground: "#FFFFFF",
          },
          warning: {
            DEFAULT: "#D97706",
            foreground: "#FFFFFF",
          },
          danger: {
            DEFAULT: "#B91C1C",
            foreground: "#FFFFFF",
          },
          success: {
            DEFAULT: "#15803D",
            foreground: "#FFFFFF",
          },
        },
      },
      "mke-dark": {
        extend: "dark",
        colors: {
          background: "#1C1917",
          foreground: "#F5F5F4",
          primary: {
            DEFAULT: "#34D399",
            foreground: "#022C22",
          },
        },
      },
    },
  })],
};
```

### Applying the theme

```tsx
// layout.tsx
<html lang={locale} dir={dir} className="mke-light">
  {/* or "mke-dark" based on preference */}
```

---

## Reference: Design Principles

1. **Data first, decoration second.** Every pixel should serve the data. No gradients for gradient's sake.
2. **One glance, one insight.** Each metric card should communicate its message without reading the label.
3. **Mobile is the primary device.** Design for thumbs, not mice.
4. **Accessibility is not an afterthought.** If it's not accessible, it doesn't ship.
5. **The AI is the power user's interface.** Keep the visual dashboard simple. Let CopilotKit handle complex queries.
6. **Trust through transparency.** Show your sources. Show unflattering numbers. Data provenance is a feature.
7. **Milwaukee, not generic.** The cream city brick warmth, the lakefront teal, the civic gold — this should feel like it belongs to this city.
