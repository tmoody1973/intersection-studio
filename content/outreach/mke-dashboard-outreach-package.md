# MKE Dashboard Outreach Package

**Prepared:** April 6, 2026
**Dashboard:** https://mke-dashboard.vercel.app
**GitHub:** https://github.com/tmoody1973/intersection-studio

---

## 1. Philly Stat 360 — Kristin Bray

**Who:** Kristin K. Bray, Director of Philly Stat 360 and Chief Legal Counsel to Mayor Parker
**Contact:** press@phila.gov (official), or via the [Mayor's Office of Philly Stat 360](https://www.phila.gov/departments/office-of-philly-stat-360/)
**Goal:** Peer recognition, knowledge sharing, potential collaboration on replicability

**Subject:** Milwaukee resident built a Kensington-style dashboard for 8 northside neighborhoods

Kristin,

My name is Tarik Moody. I'm the Director of Strategy & Innovation at Radio Milwaukee and a product architect.

When your team launched the Kensington Dashboard on March 11, I was watching. I'd been thinking about how Milwaukee could do something similar for our northside neighborhoods, the ones most affected by decades of disinvestment.

Over the past three days, I built a working version. It covers 8 Milwaukee neighborhoods with 30+ metrics across the same four categories you use: Community, Public Safety, Quality of Life, and Wellness. Plus a fifth tab for Development that tracks TIF districts, Opportunity Zones, building permits, and property sales.

Some things it does differently from Kensington:

- An AI chat interface where residents can ask questions in plain English ("show me the building permits in Harambee") and get live data tables and charts rendered in the conversation
- Four languages: English, Spanish, Hmong, and Arabic
- Historical redlining overlay showing 1930s HOLC grades alongside present-day conditions
- 5-year trend lines so residents can see trajectories, not just snapshots
- Neighborhood comparison view with real Census citywide averages
- Mobile-first responsive design

I built this with Claude Code (AI-assisted development), Next.js, Convex, CopilotKit, and Mapbox. It pulls from Milwaukee's ArcGIS REST services, the CKAN open data portal, Census ACS, and the Master Address Index for geocoding.

The dashboard is live at mke-dashboard.vercel.app.

Your team proved that a city can build a cross-department data platform on ArcGIS infrastructure that every city already has. What I wanted to prove is that a single person with AI tools can replicate that model in days, not months, for any city willing to publish its data.

I'd welcome any feedback from your team, and I'd be glad to share what I learned about Milwaukee's data infrastructure if it's useful for your replicability efforts.

Tarik Moody
Director of Strategy & Innovation, Radio Milwaukee
Host, Rhythm Lab Radio
Howard University School of Architecture (B.Arch)

---

## 2. GovTech — Julia Edinger

**Who:** Julia Edinger, Senior Staff Writer, Government Technology
**Article:** [Philadelphia Revitalizes a Neighborhood With Tech, Data](https://www.govtech.com/analytics/philadelphia-revitalizes-a-neighborhood-with-tech-data) (March 31, 2026)
**Contact:** Via GovTech editorial (look up jedinger@govtech.com or use the contact form)
**Goal:** Press coverage as a follow-up to the Philly story

**Subject:** Follow-up to your Kensington Dashboard story: a Milwaukee resident built one in 3 days with AI

Julia,

I read your March 31 piece on Philadelphia's Kensington Dashboard with interest. You wrote about how the dashboard "puts decision-makers, residents, community advocates, and developers on the same informational footing." That line stuck with me.

I'm a product architect in Milwaukee (not a developer by trade, an actual architect, Howard University). After reading your article and the Geo Week News analysis, I spent a weekend building a Milwaukee version covering 8 northside neighborhoods. It's live now at mke-dashboard.vercel.app.

Here's what makes this story different from the Philly one: I'm one person. No government backing, no Esri consulting contract, no 20 departments feeding data. I used AI-assisted development (Claude Code) to build the entire thing in about 72 hours, pulling from the same public ArcGIS services and open data that Milwaukee's city government publishes.

Some numbers: 30+ metrics per neighborhood, 15 data sources, 47 automated regression tests, 4 languages, 5-year crime trend lines (Harambee's crime dropped 40% from 2021 to 2024), an AI chat that renders charts and data tables from live city data, and a neighborhood comparison view with real Census citywide averages.

The story I think is worth telling: Philly proved the model works when a mayor backs it. Milwaukee (or rather, one Milwaukee resident with AI tools) is proving the model is replicable without institutional backing. If every city's data is already published on ArcGIS, the bottleneck isn't technology. It's political will. And in the meantime, residents can build their own.

I'm happy to walk you through the dashboard or answer questions about the technical approach. I also have detailed developer diary entries documenting the entire build process day by day.

Tarik Moody
tmoody@radiomilwaukee.org

---

## 3. Geo Week News

**Who:** Editorial team (find via geoweeknews.com/contact)
**Article:** [How Philadelphia Is Rewriting the Urban Revitalization Playbook](https://www.geoweeknews.com/news/how-philadelphia-is-rewriting-the-urban-revitalization-playbook)
**Goal:** Coverage from the geospatial/GIS angle

**Subject:** A replicability test for the Kensington Dashboard model: Milwaukee, 8 neighborhoods, 72 hours

Your April 1 analysis of the Kensington Dashboard concluded that "the question for other cities is not whether they have the technology... the question is whether they have the political will."

I wanted to test a third option: what if residents don't wait for political will?

I'm Tarik Moody, Director of Strategy & Innovation at Radio Milwaukee. I built a Milwaukee Neighborhood Vitality Dashboard covering 8 northside neighborhoods using Milwaukee's existing ArcGIS Server 10.91 infrastructure, the same REST services the city publishes for Map Milwaukee.

The build took about 72 hours using AI-assisted development. The geospatial stack: Mapbox GL JS for rendering, ArcGIS REST queries for all property, crime, and infrastructure data (spatial envelope filtering with esriGeometryEnvelope), Census ACS 5-Year data at the tract level aggregated to DCD neighborhood boundaries, and historical HOLC redlining data from the University of Richmond Digital Scholarship Lab.

Technical details your readers might find interesting:
- Milwaukee's ArcGIS endpoints return Wisconsin State Plane coordinates (WKID 32054). I built a coordinate conversion pipeline to WGS84 for Mapbox rendering.
- The dashboard uses point-in-envelope spatial filtering for per-neighborhood metrics, not pre-aggregated data.
- 334,000 Master Address Index records geocode building permits to neighborhoods via address-to-taxkey matching.
- The HOLC redlining overlay uses the ArcGIS-hosted feature service from the University of Richmond (112 Milwaukee polygons, grades A-D).

Live at mke-dashboard.vercel.app. Open source at github.com/tmoody1973/intersection-studio.

Tarik Moody

---

## 4. Milwaukee Stakeholders

### 4a. Data You Can Use

**Who:** Data You Can Use (datayoucanuse.org), Milwaukee's NNIP partner
**Goal:** Partnership, data validation, community adoption

**Subject:** A real-time companion to your neighborhood portraits

I've built something that I think complements your MKE Indicators and Neighborhood Portraits: a real-time, interactive dashboard for 8 northside Milwaukee neighborhoods.

Your portraits provide the deep, annual analysis that nonprofits and policymakers rely on. What I've built adds real-time operational data (live ArcGIS queries, daily crime updates, 311 service requests, building permits) with an AI chat interface that lets residents ask questions in plain English.

I used your population estimates to calibrate my Census tract-to-neighborhood mappings. Your work was the ground truth.

I'd love your feedback on the data accuracy, and I'd welcome any conversation about how this could complement (not compete with) your existing tools. If community organizations are already using your data, this dashboard could serve as their real-time window between your annual updates.

Live at mke-dashboard.vercel.app.

### 4b. Alderperson (template for the 8 target neighborhoods)

**Subject:** Interactive neighborhood dashboard for [District/Neighborhood] — built for residents

Alderperson [Name],

I've built a free, public data dashboard for [Neighborhood] that puts real-time city data in the hands of residents. It shows:

- 30+ metrics: crime trends, vacant buildings, foreclosures, property values, 311 requests
- 5-year trajectories: Harambee's crime dropped 40% since 2021
- Development data: TIF districts, Opportunity Zones, $100M in building permits
- An AI chat where residents can ask "what's being built on my block?"

The data comes from the same ArcGIS services and open data portal the city publishes. It updates automatically every 24 hours.

I built this as a civic tool, not a criticism. The goal is to give block club captains, nonprofit leaders, and engaged residents the data context they need for advocacy, grant applications, and community meetings.

Available in English, Spanish, Hmong, and Arabic at mke-dashboard.vercel.app.

I'd welcome 15 minutes to walk you through it.

Tarik Moody
Director of Strategy & Innovation, Radio Milwaukee

### 4c. Community Organizations (Walnut Way, Safe & Sound, etc.)

**Subject:** Free neighborhood data tool for [Organization's neighborhood]

[Name],

I know [Organization] works in [Neighborhood]. I built a data dashboard that might be useful for your work.

It shows real-time data for your neighborhood: crime trends (with 5-year history), vacant buildings, foreclosures, 311 service requests, building permits and investment dollars, population and income data. You can compare your neighborhood to others or to the citywide average.

The AI chat lets you ask questions like "show me all the building permits" and it pulls live records from the city's database.

It's free, public, and available in four languages at mke-dashboard.vercel.app.

Would it be useful if I demoed it at one of your community meetings?

---

## 5. CopilotKit Team

**Who:** CopilotKit (copilotkit.ai) — the framework powering the AI chat
**Goal:** Case study, partnership, potential feature showcase

**Subject:** Milwaukee civic dashboard built with CopilotKit Generative UI — case study opportunity

Your framework is powering the AI layer of a civic data dashboard for Milwaukee neighborhoods. Residents can ask "show me the building permits in Harambee" and get a live data table rendered inline in the chat, pulled from the city's CKAN API in real time.

We use useFrontendTool for 8 registered tools: bar charts, line charts, pie charts, KPI cards, zone info, investment summaries, data tables, and a live permit fetcher. The AI reads dashboard state via useCopilotReadable and can switch neighborhoods and categories via useCopilotAction.

This might make a good case study for CopilotKit: a real civic tech application where Generative UI makes government data accessible to residents who don't read charts. The "show me the building permits" flow is the demo moment.

Live at mke-dashboard.vercel.app.

---

## Outreach Sequence

1. **This week:** Data You Can Use (validate data, build partnership)
2. **This week:** CopilotKit team (case study opportunity)
3. **Next week:** Alderperson for Harambee district (pilot adoption)
4. **Next week:** Julia Edinger at GovTech (press pitch)
5. **Following week:** Philly Stat 360 (peer recognition)
6. **Following week:** Geo Week News (geospatial angle)
7. **Ongoing:** Community orgs as the dashboard gets adoption
