# LinkedIn Post: Building Permits Feature

**Date:** 2026-04-05
**Platform:** LinkedIn
**Image:** Milwaukee-Neighborhood-Vitality-Dashboard-04-05-2026_08_08_AM.png

---

What's being built in your neighborhood?

Most people have no idea what construction is happening on their block until a crew shows up. The data is technically public, buried in city permit databases, but nobody's going to wade through 16,000 records on data.milwaukee.gov to find out.

So we built something different.

The Milwaukee Neighborhood Vitality Dashboard has an AI chat sidebar. You type "show me the building permits" and it pulls live records from the city's open data portal and shows you a table: address, permit type, construction cost, date issued. Right there in the conversation.

Harambee has 434 building permits on file. $100 million in total construction investment. 127 new construction permits. You can see a $230,000 commercial alteration at 11270 W Park Place, residential work on N 9th Street, commercial permits on Hackett Avenue. Actual addresses. Actual dollar amounts.

The screenshot shows what this looks like. You ask a question in plain English. The AI queries the City of Milwaukee's CKAN API in real time, not a cached summary. It renders the results as a scrollable data table inside the chat.

We built this with CopilotKit's Generative UI. The AI registers a frontend tool called `fetch_neighborhood_permits` that fires a live API call when someone asks about development. CopilotKit's `useFrontendTool` hook handles the rendering: loading skeleton while it fetches, then a styled data table when results come back. The AI doesn't generate HTML. It calls a pre-built React component and fills it with data.

The same pattern works for crime data, 311 service requests, property sales, anything in the city's open data. Ask a question, get a table. No scrolling through government portals.

This is part of a larger dashboard that tracks 30+ neighborhood metrics across Community, Public Safety, Quality of Life, Wellness, and Development. TIF districts, Opportunity Zones, Census demographics, HOLC redlining overlays, all filterable by neighborhood. CopilotKit's chat can render bar charts, line charts, KPI cards, zone info, and now data tables, all inline in the conversation.

The data was always public. We just made it possible to ask for it in your own words.

Built with Next.js, Convex, CopilotKit, Mapbox, and Milwaukee's ArcGIS REST services.

#CivicTech #Milwaukee #OpenData
