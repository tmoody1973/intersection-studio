# Intersection Studio — Design System

## Color System

```css
/* App background and surfaces */
--color-bg:            #0a0a0a;
--color-surface:       #141414;
--color-surface-hover: #1a1a1a;
--color-border:        #2a2a2a;

/* Text */
--color-text:          #fafafa;
--color-text-muted:    #888888;
--color-text-dim:      #555555;

/* Semantic */
--color-primary:       #f59e0b;  /* Amber — CTAs, active states */
--color-success:       #10b981;  /* Green — completion, success */
--color-error:         #ef4444;  /* Red — errors, failures */
--color-warning:       #eab308;  /* Yellow — warnings, banners */

/* Agent accent colors */
--color-agent-ceo:        #3b82f6;  /* Blue */
--color-agent-researcher: #10b981;  /* Green */
--color-agent-writer:     #f59e0b;  /* Amber */
--color-agent-social:     #8b5cf6;  /* Purple */
--color-agent-data:       #14b8a6;  /* Teal */
```

## Typography

```css
--font-mono: "Berkeley Mono", "JetBrains Mono", "Fira Code", monospace;
--font-sans: "Inter", "SF Pro", system-ui, sans-serif;

--text-xs:   12px / 1.5;  /* Timestamps, badges */
--text-sm:   14px / 1.5;  /* Secondary UI, labels */
--text-base: 16px / 1.6;  /* Body text, chat messages */
--text-lg:   18px / 1.5;  /* Section headers */
--text-xl:   24px / 1.3;  /* Page titles */
--text-2xl:  32px / 1.2;  /* Document title (capped) */
```

## Spacing Scale

```css
--space-1:  4px;   --space-2:  8px;   --space-3:  12px;
--space-4:  16px;  --space-5:  20px;  --space-6:  24px;
--space-8:  32px;  --space-10: 40px;  --space-12: 48px;
```

## Component Patterns

- Icons: lucide-react throughout
- Inline styles with CSS custom properties (not Tailwind, not CSS modules)
- Agent output: monospace font
- UI chrome: sans-serif font
- Buttons: 44px minimum touch target, amber accent for primary CTAs
- Cards: subtle background tint, no colored left borders
- Empty states: warmth + primary action + context (never just "No items found")

## Co-Work Mode Layout

- Desktop (>1024px): 40% chat / 60% artifact split, timeline bottom bar
- Tablet (768-1024px): 45% / 55%, timeline collapsed to icon bar
- Mobile (<768px): tab navigation (Chat | Document | Timeline), one panel at a time

## Accessibility

- All body text ≥4.5:1 contrast ratio on dark bg
- Touch targets: 44px minimum
- Keyboard: Tab through interactive elements, focus ring visible
- Motion: respect prefers-reduced-motion
- Screen readers: ARIA labels on agent avatars, brain cards, timeline events
