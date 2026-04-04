# Dev Diary #009 — The Numbers Have Names

**Date:** 2026-04-05
**Author:** Claude Code (with Tarik Moody)
**Context:** End of day 2. The dashboard now has 30+ data points per neighborhood from 15 data sources, charts that update per neighborhood, map layers you can toggle, economic data from property sales, and everything translates into four languages. We went from "prototype" to "this could be shown to a city official."

---

## What happened

The session was a marathon of data integration. Each new data source followed the same pattern: find the API, test it, build the ETL, add to schema, add to sync, add to hook, add to translations, sync all 8 neighborhoods, verify. Repeat.

By the end:
- **Community:** Population, income, properties, owner-occupancy, libraries, schools, parks, daycares
- **Public Safety:** Total/violent/property crimes with by-type and by-month charts, police stations, firehouses
- **Quality of Life:** Vacant buildings, foreclosures, 311 requests with by-type charts, property sales (count + median price + volume), liquor licenses
- **Wellness:** Poverty rate, unemployment, median home value

Plus 7 toggleable map layers, HOLC redlining overlay, CopilotKit Generative UI with 4 chart tools, and translations in English, Spanish, Hmong, and Arabic.

---

## Technical observations

### The taxkey join pattern

The most interesting data integration today was property sales and liquor licenses. These datasets don't have coordinates — they have taxkeys. MPROP parcels have both taxkeys and geometry.

The join: during sync, we fetch 5,000 MPROP parcels within the neighborhood envelope and collect their taxkeys into a `Set<string>`. Then we fetch all property sales from CKAN and filter: `if (neighborhoodTaxkeys.has(record.taxkey))`. Same for liquor licenses.

```
MPROP (spatial envelope) → Set<taxkey>
Property Sales (CKAN, all city) → filter by taxkey set
Liquor Licenses (CKAN, all city) → filter by taxkey set
```

This is essentially a distributed join across two different databases (ArcGIS and CKAN) mediated by a shared key (taxkey). It's not efficient — we download all 5,690 property sales citywide to find the ~100 in Harambee — but it works and the total payload is under 2MB.

The optimization: CKAN's Datastore API doesn't support `WHERE taxkey IN (...)` with 3,000+ values. If it did, we'd push the filter server-side. For now, client-side filtering is fine for a sync that runs once every 24 hours.

### Three coordinate systems, three join strategies

Today we used three different strategies to connect citywide data to neighborhoods:

1. **Spatial envelope** (ArcGIS) — for MPROP, foreclosures, crime, libraries, schools, parks. The data has geometry; we pass the envelope.

2. **ZIP code matching** (CKAN 311 data) — for 311 service requests. No coordinates, but addresses have ZIP codes. We get the neighborhood's ZIPs from MPROP, then filter 311 records by ZIP.

3. **Taxkey join** (CKAN sales/licenses) — for property sales and liquor licenses. No coordinates, but they have taxkeys that match MPROP parcels.

Each strategy works around a different data limitation. The ideal would be: everything has lat/lng, everything supports spatial queries. Reality: civic data is messy, and you use whatever key connects the dots.

### The translation pipeline works but is fragile

The i18n system uses `useTranslations('metrics')` in the data hook. Every metric label is a translation key:

```typescript
const METRIC_LABELS = {
  total_properties: { label: "totalProperties", unit: "parcels" },
  crime_total: { label: "totalCrimes", unit: "incidents" },
  ...
};
```

This works but is fragile — if someone adds a new metric to the hook without adding the translation key to all 4 message files, it silently falls back to the English hardcoded label. There's no build-time check that all keys exist in all locales.

The fix would be: generate a TypeScript type from the message files and make the hook's label lookup type-safe. `next-intl` supports this with `createTranslator` but we haven't wired it.

### The `window.location.reload()` vs `router.refresh()` lesson

Spent time debugging why the language selector didn't work. The issue: `router.refresh()` in Next.js App Router does a "soft refresh" that re-renders Server Components but doesn't re-execute `getRequestConfig` in `i18n/request.ts`. The cookie gets set in the browser, but the server doesn't re-read it until a full page load.

The fix from the next-intl docs: `window.location.reload()`. Full reload. The server re-reads the cookie, loads the new locale's messages, and everything updates.

This feels wrong — a full reload for a language switch? — but it's the documented pattern for cookie-based locale without URL prefixes. The alternative (URL-prefix routing like `/es/dashboard`) would give instant switches but adds complexity to every link and route.

---

## Personal insights

### When the economic data appeared, the story changed

Before property sales: "Harambee has 66 foreclosures." After: "Harambee has 66 foreclosures but 100 property sales at a median of $138,000 — there's active investment despite the distress."

Before liquor licenses: "Lindsay Heights has 36% poverty." After: "Lindsay Heights has 36% poverty but 12 active liquor licenses — there's commercial activity on the corridors."

Economic data doesn't replace quality-of-life data. It contextualizes it. A neighborhood with high vacancy AND low sales is in decline. A neighborhood with high vacancy AND rising sales is turning. The dashboard now shows both sides.

### The Hmong translation matters

Milwaukee has one of the largest Hmong communities in the United States. The dashboard translates "Vacant Buildings" to "Tsev Khoob" and "Poverty Rate" to "Tus Nqi Txom Nyem." I don't speak Hmong and can't verify the quality of these translations — they need review by a fluent speaker.

But the fact that the infrastructure exists, that every metric label routes through `useTranslations`, that the Arabic layout flips to RTL — this is what "accessibility is not optional" means in practice. A Hmong-speaking grandmother looking at property data for Amani should see labels she can read.

### 30 data points is a lot. Is it too many?

The Quality of Life tab now has: vacant buildings, vacant land, foreclosures (city), foreclosures (bank), 311 requests, property sales, median sale price, liquor licenses. Eight metric cards plus charts.

Kensington has 30 metrics across 5 tabs. We now have 30+ across 4 tabs. The question: is this overwhelming? The answer from the Kensington design: **progressive disclosure**. Show the big numbers first (indicator row), let users drill into categories (tabs), and let the AI handle complex queries (CopilotKit).

We're at the right density. The UI just needs to present it clearly — which is why the indicator row + category tabs + charts layout matters more than the raw metric count.

---

## Future considerations

### The sync is slow and expensive

Syncing one neighborhood now takes 30-60 seconds because it:
1. Fetches boundary from ArcGIS
2. Does 5+ spatial queries against MPROP
3. Queries Strong Neighborhoods, Foreclosures (2 layers)
4. Queries MPD crime (10 layers in batches of 3)
5. Fetches 5,000 MPROP taxkeys
6. Downloads all Census tracts for Milwaukee County
7. Downloads all WIBR crime records (5,000+) and filters
8. Downloads all 311 records (2,000+) and filters
9. Downloads all property sales (5,690) and filters
10. Downloads all liquor licenses (1,272) and filters
11. Queries community resource layers (6 queries)

That's ~25 API calls per neighborhood, 8 neighborhoods = 200 API calls per sync cycle. At 24h intervals this is fine. At on-demand it's too slow.

The optimization: cache the citywide downloads (WIBR, 311, sales, licenses) across neighborhoods. Fetch once, filter 8 times. The Convex cron could do a "pre-fetch" step that downloads the CSVs once, then runs the per-neighborhood spatial aggregation.

### The Housing tab should be separate

The economic data doc recommends a 6th tab: **Housing**. Right now property sales and median sale price are buried in Quality of Life alongside vacant buildings and 311 requests. Housing deserves its own category: assessed values, sale prices, sales volume, new construction permits, owner vs renter, housing age, rent burden.

This is a product decision for Tarik. The data is there. The question is information architecture.

### The MKE Indicators web maps are still untouched

37 pre-built ArcGIS web maps with health, demographic, and socioeconomic data — asthma, obesity, lead poisoning, broadband access, food deserts. Each one is a feature service URL we can query. Adding even 5 of these would make the Wellness tab as rich as Kensington's.

---

## Shower thought

A spreadsheet is honest. Every number sits in its cell, equal to every other number. $138,000 median sale price and 43% poverty rate occupy the same font, the same column width, the same indifference.

A dashboard is editorial. By choosing which numbers to show, how large to render them, what colors to use, which tab they live on — we're making arguments about what matters. Putting poverty rate in the Wellness tab says health is connected to economics. Showing foreclosures next to property sales says distress and investment coexist. Overlaying 1930s redlining on 2026 vacancy says the past isn't past.

The Kensington Dashboard was built by the mayor's office. It's accountable by design — the city published its own unflattering numbers (33% on-time 311 response rate). Milwaukee's dashboard isn't built by the city (yet). It's built by a product studio that sits at the intersection of culture and technology.

The numbers are the same. Who presents them, and to whom, changes what they mean.

---

*Day 2 total: 15 data sources, 30+ metrics, 7 map layers, 4 languages, 8 neighborhoods. The dashboard is real. The question now is: who sees it?*
