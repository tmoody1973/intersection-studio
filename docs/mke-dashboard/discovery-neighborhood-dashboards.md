# Discovery Brief: Neighborhood-Level Data Dashboards

**Project:** Milwaukee Neighborhood Vitality Dashboard
**Date:** April 4, 2026
**Author:** Product Discovery — Intersection Studio

---

## Problem

City residents, community organizations, and local officials have no single place to understand what is actually happening in a specific neighborhood across housing, safety, health, and economic conditions simultaneously. Data exists — buried across department silos, open data portals, and academic reports — but it requires technical skill to access and synthesize. The result: disinvestment persists in part because the communities experiencing it cannot easily document, track, or make the case for change. Milwaukee's northside neighborhoods are a direct example of this gap.

---

## Existing Solutions

The landscape breaks into four categories: city-run performance dashboards, health-focused national platforms, community data intermediaries, and open-source civic data infrastructure.

### 1. Philadelphia Kensington Dashboard — PhillyStat 360 (March 2026)
**URL:** [philly-stat-360.phila.gov](https://philly-stat-360.phila.gov/pages/kensington-revitalization)
**What it is:** A cross-department dashboard launched March 11, 2026 specifically for the Kensington neighborhood, one of Philadelphia's most distressed. Tracks 30 metrics in four buckets: Community (interactive map of facilities/resources), Public Safety, Quality of Life, and Wellness (shelter bed usage, service engagements, wellness center visits).
**Tech:** ArcGIS-based hub. Users filter by last month, last 6 months, or last year. Interactive maps let users click/hover on community provider locations.
**Why it matters:** The closest analog to what Milwaukee is building. Built by the Mayor's Office of PhillyStat 360. Acknowledged that policing alone won't fix a complex neighborhood — hence the cross-sector data approach.
**What it lacks:** No AI layer. No historical context showing how the neighborhood got this way. No redlining overlay. Single-neighborhood scope.

### 2. Baltimore Vital Signs — BNIA (Ongoing, annual updates)
**URL:** [vital-signs-bniajfi.hub.arcgis.com](https://vital-signs-bniajfi.hub.arcgis.com/)
**What it is:** The Baltimore Neighborhood Indicators Alliance (BNIA-JFI) publishes Vital Signs, covering 55 Community Statistical Areas across all of Baltimore. Tracks roughly 150 indicators across housing, community development, health, public safety, workforce, education, sustainability, and arts/culture.
**Tech:** ArcGIS Hub. Open data portal integrated with city and county data sources.
**Why it matters:** One of the most comprehensive neighborhood indicator systems in the US. Has been running long enough to show change over time across multiple indicator domains.
**What it lacks:** No AI or conversational interface. Data is rich but requires analytical literacy to use. No narrative layer helping residents interpret what the numbers mean. No historical redlining context.

### 3. NYC EquityNYC — NYC Office of Opportunity (Active)
**URL:** [equity.nyc.gov](https://equity.nyc.gov/)
**What it is:** New York City's interactive equity dashboard with 237 indicators across 130 neighborhood maps, sourced from 59 city agencies. Covers health outcomes, social and economic factors, housing, and more. Data disaggregated by race/ethnicity, gender, income, and sexual orientation.
**Tech:** Custom web platform integrated with NYC Open Data.
**Why it matters:** Largest dataset footprint of any city dashboard. Demonstrates what is possible when multiple agencies commit to a shared platform.
**What it lacks:** Scale works against usability — 237 indicators is overwhelming for a resident. No conversational AI to help people navigate. No cross-temporal narrative showing historical disinvestment.

### 4. Denver Neighborhood Data Dashboard — City of Denver (Active)
**URL:** [denvergov.org Neighborhood Planning](https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development/Planning/Neighborhood-Planning/Neighborhood-Data-Dashboard)
**What it is:** Covers all 78 Denver statistical neighborhoods. Data categories: housing, employment, affordability, income. Integrated with the city's neighborhood planning strategy and NEST (Neighborhood Equity and Stabilization) program (updated March 2025).
**Tech:** Power BI embedded on city website. ArcGIS for geospatial equity index separately.
**Why it matters:** Explicitly tied to resource allocation and planning decisions, not just transparency. The Equity Index 2020 layer identifies where city investment is most needed.
**What it lacks:** Power BI is a static reporting tool, not an interactive civic experience. No AI layer. No historical context overlay.

### 5. Detroit Neighborhood Vitality Index — Data Driven Detroit (Launched citywide August 2024)
**URL:** [nvidetroit.org](https://nvidetroit.org/background)
**What it is:** A resident-designed, survey-driven vitality index. Completed Phase 3 pilot and launched citywide in 2024. Over 4,000 Detroit residents surveyed. Data goes to the neighborhood zone level — combining resident perception with public data sources. Tracks issues residents actually care about.
**Tech:** Custom web platform built by Data Driven Detroit, the city's NNIP partner.
**Why it matters:** The only model that explicitly centers resident voice alongside institutional data. Community-designed metrics, not just government-defined ones. Bridges perception data with property, crime, and health data.
**What it lacks:** No AI conversational interface. Still primarily consumed by planners and nonprofits, not general public. No redlining historical layer.

### 6. Minneapolis DataSource — City of Minneapolis (Active)
**URL:** [minneapolismn.gov/datasource](https://www.minneapolismn.gov/government/government-data/datasource/)
**What it is:** Suite of neighborhood dashboards covering demographics, income/housing, market values, demographic change over time (2000-2020), and neighborhood/community relations performance. Includes a 2040 Comprehensive Plan tracker with 39 indicators disaggregated by geography and race.
**Tech:** Multiple tools — some Power BI, some custom. ArcGIS Hub for geospatial data.
**Why it matters:** Shows how a single city can deploy multiple specialized dashboards serving different user needs, coordinated under one umbrella.
**What it lacks:** Fragmented — no single unified view. No AI layer. No historical redlining context.

### 7. City Health Dashboard — NYU Langone (Active, 1,100+ US cities)
**URL:** [cityhealthdashboard.com](https://www.cityhealthdashboard.com/)
**What it is:** Census tract-level data on 40+ health metrics for 1,100+ US cities with populations over 50,000. Metrics span health outcomes, social/economic factors, health behaviors, physical environment, and clinical care. Includes a redlining map overlay feature for 364 cities — shows historic HOLC grades alongside present health outcomes.
**Tech:** Custom web platform from NYU Grossman School of Medicine. ACS data backbone.
**Why it matters:** The redlining overlay feature is directly relevant — it already establishes the "past disinvestment → present conditions" connection visually. Milwaukee is in their dataset.
**What it lacks:** Health-only lens. Not actionable at the neighborhood level for city departments. No AI layer. National scope means shallow local specificity.

### 8. Pittsburgh Neighborhood Snapshots — Engage PGH / WPRDC (Active)
**URL:** [engage.pittsburghpa.gov/neighborhood-snapshots](https://engage.pittsburghpa.gov/neighborhood-snapshots)
**What it is:** Data snapshots on demographics, mobility, and recreation for all 90 Pittsburgh neighborhoods. Powered by the Western Pennsylvania Regional Data Center (WPRDC), a University of Pittsburgh NNIP partner with ArcGIS Hub infrastructure and CKAN open data backbone.
**Tech:** WPRDC uses CKAN + ArcGIS Hub. The city published 2024 neighborhood comparison data (2008-2012 vs 2018-2022 ACS).
**Why it matters:** Strong model of a university-city-county data partnership (Pitt + City of Pittsburgh + Allegheny County). Shows how an academic anchor institution can sustain a civic data platform.
**What it lacks:** No unified dashboard experience — data-literate users only. No AI layer.

---

## National Context: Community Data Organizations (NNIP)

The **National Neighborhood Indicators Partnership (NNIP)**, coordinated by the Urban Institute, is a 30+ city network of local data intermediaries. Each city has an NNIP partner:

| City | NNIP Partner |
|------|-------------|
| Milwaukee | **Data You Can Use** (datayoucanuse.org) — 27 neighborhood portrait reports, MKE Indicators (Housing, Equity & Access, Population, Health, Market Value), updated annually in collaboration with Community Development Alliance |
| Detroit | Data Driven Detroit |
| Baltimore | BNIA-JFI |
| Pittsburgh | WPRDC / University of Pittsburgh UCSUR |
| Washington DC | NeighborhoodInfo DC |
| Houston | Houston Community Data Connections |

Milwaukee's Data You Can Use is already doing meaningful work — neighborhood portraits, MKE Indicators, annual updates. But the tool is static reports and indicator maps. It is not an interactive experience, not real-time, and not AI-assisted.

---

## AI-Powered Civic Dashboards: The Current State

No major US city has launched a production conversational AI layer on a neighborhood data dashboard as of April 2026.

What does exist:
- **Phoenix myPHX311** — conversational AI for service requests and 311 (not data exploration)
- **CivicPlus Chatbot** — AI-assisted resident FAQ on city websites
- **Civic AI Navigator** (Promet Source, January 2025) — AI chatbot for government websites, natural language queries
- **MIT Civic Data Design Lab "People-Powered Gen AI"** — research project exploring GenAI for civic participation including data visualization and scenario planning

The gap is clear: AI tools deployed in civic contexts are answering simple service questions, not helping residents understand complex neighborhood data. No city has connected an LLM to a multi-source neighborhood data platform and given residents the ability to ask plain-English questions like "why is asthma so much higher in this zip code than the one next to it?"

---

## Open Source Civic Data Tools

Key tools worth knowing for Milwaukee's build:

| Tool | What It Is | Relevance |
|------|-----------|-----------|
| **CKAN** | Open-source data catalog software. Powers hundreds of municipal open data portals globally. | Milwaukee could layer a CKAN catalog over ArcGIS REST services |
| **ArcGIS Hub** | Esri's civic engagement platform. Builds on ArcGIS infrastructure cities already have. | Milwaukee already has ArcGIS Server 10.91 — Hub is a direct upgrade path |
| **PolicyMap** | Commercial data aggregator with neighborhood-level data (ACS, health, real estate). | Pre-built data source for gaps in Milwaukee's coverage |
| **Mapping Inequality / University of Richmond** | 225-city interactive HOLC redlining map. Now in ArcGIS Living Atlas as a ready-to-use layer. | The redlining overlay Milwaukee wants already exists in ArcGIS Living Atlas — no need to rebuild |
| **CopilotKit** | React/Angular frontend stack for building AI copilots and generative UI. Open source. | Milwaukee's chosen AI layer — no other city dashboard has used it yet |

The ArcGIS Living Atlas redlining layer is a particularly important discovery: 143 cities, 7,148 neighborhoods, directly available as an Esri layer. Milwaukee does not need to source or digitize historical HOLC maps — they can pull this directly.

---

## Gap Analysis

What every existing dashboard is missing — and what Milwaukee can do first:

| Gap | What Exists | What Milwaukee Can Do |
|-----|------------|----------------------|
| **Conversational AI** | None in production on neighborhood data | CopilotKit layer — ask "show me properties with code violations near Metcalfe Park" |
| **Historical redlining context** | City Health Dashboard shows redlining + health; Mapping Inequality is research-focused | Integrate ArcGIS Living Atlas redlining layer with present-day conditions across ALL data categories, not just health |
| **Cross-department unified view** | Philly is closest but still siloed by department | One interface: property + public safety + quality of life + wellness + redlining history |
| **Plain-language access** | All dashboards require data literacy | AI translates data queries into plain English; serves residents who are not analysts |
| **Local data depth** | National platforms (City Health) are shallow on local specifics | MPROP's 160K+ properties since 1975 is a depth no national platform can match |
| **Real-time + historical** | Most show snapshots; some show trends | Milwaukee's ArcGIS REST services enable near-real-time data with historical MPROP going back to 1975 |

---

## Domain Fit

This project sits at the intersection of Tarik's deepest expertise:

**Radio Milwaukee / community trust** — The northside Milwaukee neighborhoods in scope are Radio Milwaukee's core audience and community. There is existing trust and relationship. Other cities building these dashboards are government contractors or universities with no community relationship. Milwaukee can build this WITH the community, not for them.

**REDLINED (prior portfolio project)** — Tarik has already shipped a 3D redlining visualization. The intellectual frame — past disinvestment driving present conditions — is proven work. This dashboard scales that frame into a functional civic tool.

**Architecture / systems thinking** — Neighborhood vitality dashboards are fundamentally system design problems: multiple data sources, multiple stakeholders, multiple use cases that need to cohere into a single experience. This is architectural work before it is engineering work.

**Howard-trained perspective** — Understanding how redlining, disinvestment, and municipal neglect compound over decades is not academic for this team. It is lived context that informs what questions the AI layer should be able to answer.

---

## Recommendation

**Build.** This is the right project.

The competitive landscape confirms the gap is real and unoccupied. No city has combined:
1. Cross-department neighborhood data
2. Historical redlining context
3. Conversational AI interface

Philadelphia's Kensington Dashboard (March 2026) is the closest thing and it launched three weeks ago without AI. Milwaukee has the infrastructure (ArcGIS already deployed), the data (MPROP 160K+ properties), the domain expertise (community trust, REDLINED precedent), and the differentiator (CopilotKit AI layer) to build something that beats it.

**Modified approach based on research:**
- Do not rebuild the redlining layer. Pull from ArcGIS Living Atlas directly (already available for Milwaukee).
- Check in with Data You Can Use early. They are Milwaukee's NNIP partner, already have the community relationships, and their MKE Indicators data will be directly relevant. Partnership, not duplication.
- Study Detroit's NVI model for resident voice. The gap in every existing platform is that metrics are defined by governments and universities, not residents. Building a feedback mechanism into the Milwaukee dashboard (resident ratings, 311-linked data) closes that gap.
- Scope the AI layer carefully. The value is not summarization — it is query translation. A resident should be able to type "what's happening with abandoned properties on 35th and North" and get a meaningful answer.

---

## Target Users

**Primary:**
- Northside Milwaukee residents (Sherman Park, Metcalfe Park, Lindsay Heights, Harambee, Riverwest — initial 8 neighborhoods) — people who want to understand their own block without needing to be data analysts
- Community organizations and nonprofits doing hyperlocal advocacy and grant applications
- Journalists covering Milwaukee housing, public safety, and disinvestment

**Secondary:**
- City of Milwaukee department staff (DCD, MPD, DPW, Health Department) using it as a coordination tool
- Elected officials and aides tracking ward-level conditions
- Researchers and urban planners (UWM, Marquette, Data You Can Use)

**Tertiary:**
- Funders and philanthropies evaluating neighborhood investment (Greater Milwaukee Foundation, LISC Milwaukee)
- National audience watching Milwaukee build the first AI-native neighborhood vitality platform

---

## Sources

- [Philadelphia Kensington Dashboard Launch — City of Philadelphia](https://www.phila.gov/2026-03-11-city-of-philadelphia-launches-kensington-dashboard-to-track-services-resources-and-progress-in-the-community/)
- [Philly Stat 360 Hub](https://philly-stat-360.phila.gov/)
- [Kensington Dashboard FAQ — PhillyStat 360](https://www.phila.gov/2025-03-07-your-questions-about-the-citys-new-kensington-dashboard-answered/)
- [BNIA Vital Signs Open Data Portal](https://vital-signs-bniajfi.hub.arcgis.com/)
- [EquityNYC](https://equity.nyc.gov/)
- [Denver Neighborhood Data Dashboard](https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development/Planning/Neighborhood-Planning/Neighborhood-Data-Dashboard)
- [Detroit Neighborhood Vitality Index](https://nvidetroit.org/background)
- [Data Driven Detroit](https://datadrivendetroit.org/)
- [Minneapolis DataSource](https://www.minneapolismn.gov/government/government-data/datasource/)
- [Pittsburgh Neighborhood Snapshots — Engage PGH](https://engage.pittsburghpa.gov/neighborhood-snapshots)
- [WPRDC Civic Vitality Data](https://data.wprdc.org/group/civic-vitality-governance)
- [City Health Dashboard — NYU Langone](https://www.cityhealthdashboard.com/)
- [City Health Dashboard Redlining Feature](https://www.cityhealthdashboard.com/blog-media/new-map-feature-redlining)
- [National Neighborhood Indicators Partnership](https://www.neighborhoodindicators.org/)
- [Data You Can Use — Milwaukee](https://www.datayoucanuse.org/)
- [MKE Indicators — Data You Can Use](https://www.datayoucanuse.org/mke-indicators/)
- [Mapping Inequality Project](https://cpcrs.upenn.edu/resource/mapping-inequality-redlining-new-deal-america)
- [ArcGIS Living Atlas Redlining Layer](https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/announcements/redlining-data-now-in-arcgis-living-atlas)
- [ArcGIS Living Atlas Redlining Data Item](https://www.arcgis.com/home/item.html?id=d77c640241d84b6889ab290cd4cb755b)
- [CopilotKit GitHub](https://github.com/CopilotKit/CopilotKit)
- [MIT Civic Data Design Lab — People-Powered Gen AI](https://civicdatadesignlab.mit.edu/People-Powered-Gen-AI)
- [National League of Cities — Data Tools](https://www.nlc.org/article/2024/11/25/data-tools-for-cities/)
- [Urban Institute Data Tools](https://www.urban.org/data-tools)
- [LouieStat — Louisville, KY](https://louiestat.louisvilleky.gov/)
- [Chicago Violence Reduction Dashboard](https://www.chicago.gov/city/en/sites/vrd/home.html)
- [Chicago Inspector General Socioeconomic Dashboard](https://igchicago.org/information-portal/data-dashboards/socioeconomic-and-city-data-comparison-dashboard/)
- [Seattle Racial and Social Equity Index — ArcGIS](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::racial-and-social-equity-composite-index-current/about)
- [Civic AI Navigator](https://www.civicnavigator.ai/)
- [Milwaukee Indicators Project — RVPHTC](https://www.rvphtc.org/2022/07/27/milwaukee-indicators-project-sharing-data-for-equity/)
