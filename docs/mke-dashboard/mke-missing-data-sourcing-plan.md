# Milwaukee Neighborhood Dashboard — Missing Data & Sourcing Plan

What we don't have, where to get it, and how hard it is to get.

---

## Summary

Of the ~30 metrics needed for a Philly-equivalent dashboard, **about 15 can be built today** from existing live ArcGIS and open data sources. The remaining **15 require sourcing** — ranging from easy (compile from public websites) to hard (negotiate data-sharing agreements with city departments).

| Difficulty | Count | Description |
|-----------|-------|------------|
| **Build it ourselves** | 5 | Compile from public sources, no partnership needed |
| **API pipeline work** | 3 | Data exists in open data portal but needs cleaning/structuring |
| **City department partnership** | 5 | Data exists internally, need formal data-sharing agreement |
| **State/federal data** | 2 | Available but need to wrangle into neighborhood-level format |
| **Doesn't exist yet** | 2 | Would require new data collection |

---

## Category 1: Community Resources (Philly's "Community" Tab)

### What Philly Has That We Don't

Philadelphia's community tab shows an interactive map of city facilities, PlayStreets sites, school crossing guards, behavioral health services in schools, free meal sites, and public Wi-Fi locations — all in one layer. Milwaukee has **none of this consolidated into a single feed.**

### Missing Data

#### 1. Consolidated Community Resource Map
- **What:** Food pantries, homeless shelters, health clinics, mental health services, substance use treatment, community centers, rec programs, legal aid, workforce development, after-school programs
- **Current state:** No single source. Resources are scattered across 211 Wisconsin, MHD website, United Way, individual org websites, Google Maps
- **How to source:**
  - **Easiest:** Query the 211 Wisconsin API (211wisconsin.communityos.org) — they maintain the most comprehensive directory of community services in the state, searchable by ZIP/city
  - **Supplement with:** MHD published service locations, Milwaukee County DHHS provider lists
  - **Manual work:** Verify locations, geocode addresses, categorize by service type
  - **Maintenance:** Partner with 211 Wisconsin for quarterly refresh, or build a community submission form
- **Difficulty:** Build it ourselves (medium effort, ~2 weeks of data compilation)
- **Who to talk to:** 211 Wisconsin, United Way of Greater Milwaukee, MHD Community Health division

#### 2. Free Meal Sites / Food Access Points
- **What:** Locations offering free or low-cost meals (soup kitchens, community meals, school meal programs, summer feeding sites)
- **Current state:** Feeding America Eastern Wisconsin publishes locations seasonally. MPS publishes summer feeding sites. No consolidated year-round map.
- **How to source:**
  - USDA Summer Feeding Site finder API (for seasonal)
  - Feeding America partner data
  - MPS meal program locations
  - Compile manually from org websites
- **Difficulty:** Build it ourselves (light effort)

#### 3. Public Wi-Fi Locations
- **What:** Free public internet access points — libraries, community centers, city buildings
- **Current state:** Milwaukee Public Library publishes branch locations. ConnectED Milwaukee may have data. No consolidated feed.
- **How to source:** MPL locations (public), community center directories, city building list
- **Difficulty:** Build it ourselves (light effort)

#### 4. MPS School-Level Program Data
- **What:** What programs/services are available AT each school — after-school, behavioral health, family support, community schools initiative
- **Current state:** MPS publishes school locations (available in ArcGIS) but NOT what programs run at each school
- **How to source:** Partnership with MPS data team. Their Research, Assessment, and Data division has internal program data.
- **Difficulty:** City/institutional partnership needed
- **Who to talk to:** MPS Office of Academics, MPS Research & Assessment

#### 5. Behavioral Health Service Locations
- **What:** Where residents can access mental health services, counseling, crisis intervention, AODA treatment
- **Current state:** MHD's Department of Behavioral Health and Intellectual disAbilities (BHD) maintains provider lists internally. SAMHSA has a national treatment locator.
- **How to source:**
  - SAMHSA treatment locator API (free, national): `findtreatment.gov`
  - BHD provider directory (would need MHD partnership)
  - 211 Wisconsin behavioral health category
- **Difficulty:** Mix — SAMHSA is free, BHD data needs partnership

---

## Category 2: Public Safety (Philly's "Public Safety" Tab)

### What We Have
Crime data (MPD Monthly ArcGIS), police dispatch calls (open data), fire dispatch calls (open data), police/fire boundaries. **This is our strongest category.**

### Missing Data

#### 6. Community Policing / Outreach Events
- **What:** MPD community engagement events, neighborhood walks, Safe & Sound activities, block watches
- **Current state:** MPD publishes some community outreach through their ArcGIS layer (`MFD/community_outreach`), but it's unclear how current it is. Safe & Sound tracks their own activities.
- **How to source:** MPD Community Liaison Unit, Safe & Sound program data, Dominican Center (Amani), COA Youth & Family Centers
- **Difficulty:** City department + community org partnership
- **Who to talk to:** MPD Community Liaison, Safe & Sound executive director

#### 7. ShotSpotter / Gunshot Detection Data
- **What:** Acoustic gunshot detection alerts with location and time
- **Current state:** Milwaukee has ShotSpotter technology deployed but data is not publicly published. Can partially derive from MPD dispatch calls with "shots fired" call types.
- **How to source:** MPD data request. Some cities (e.g., Chicago) publish ShotSpotter data. Milwaukee hasn't.
- **Workaround:** Filter MPD dispatch calls for "shots fired" call type — not as precise but publicly available today.
- **Difficulty:** City department partnership (politically sensitive)

---

## Category 3: Quality of Life (Philly's "Quality of Life" Tab)

### What We Have
Vacant properties (MPROP), foreclosures, tax delinquency, raze orders, DPW paving/sanitation, Opportunity Zones, BIDs. **Solid foundation.**

### Missing Data

#### 8. 311 Service Request Response Times
- **What:** Not just the count of 311 requests, but how long it takes the city to resolve them — the metric Philly publishes (33% on-time in Kensington). This is the accountability metric.
- **Current state:** The city's Unified Call Center (UCC) data exists on the open data portal, but the resolution time / closed date fields are **inconsistently populated.** Historical data shows request counts but not on-time rates.
- **How to source:**
  - Start with existing open data portal data — filter for requests with both open and close dates
  - For production: need partnership with UCC to get cleaner resolution timestamps
  - Could also file public records request for aggregate response time data by type and district
- **Difficulty:** API pipeline work + city partnership for clean data
- **Who to talk to:** Department of Administration (runs UCC), ITMD

#### 9. DNS Code Violations (Real-Time)
- **What:** Building code violations issued by the Department of Neighborhood Services — boarded-up buildings, unsafe structures, garbage/debris, graffiti, property maintenance violations
- **Current state:** DNS processes violations but does **not publish structured data** to the open data portal or as an ArcGIS service. MPROP has a `BI_VIOL` field (total unabated violations) but it's a summary count, not individual violation records.
- **How to source:**
  - MPROP `BI_VIOL` field gives a count (available today, partial)
  - Full violation detail would need DNS partnership or API access
  - Some violation data may be in Legistar (nuisance property hearings, orders)
- **Difficulty:** City department partnership
- **Who to talk to:** DNS Commissioner's office, City Attorney (for nuisance property data)

#### 10. Illegal Dumping Locations
- **What:** Where illegal dumping is occurring — a major quality of life issue in neighborhoods with high vacancy
- **Current state:** Reported through 311 but not separately tracked/mapped. DPW Clean & Green may have internal data.
- **How to source:** Filter 311 data for dumping-related request types. Partner with DPW Clean & Green initiatives.
- **Difficulty:** API pipeline work (derive from 311 categories)

#### 11. Street Light Outages
- **What:** Non-functioning street lights by neighborhood — directly impacts safety perception and crime
- **Current state:** Reported through 311. We Energies may track outages. No public dashboard.
- **How to source:** Filter 311 data for street light request types
- **Difficulty:** API pipeline work (derive from 311)

---

## Category 4: Wellness (Philly's "Wellness" Tab)

### What We Have
Food inspection data (open data portal), overdose data (derivable from MFD dispatch), air quality (FreshAir Collective), 2025 CHA report data (static). **This is our weakest category.**

### Missing Data

#### 12. Shelter Bed Availability / Homeless Services
- **What:** How many shelter beds are available in/near the neighborhood, how many people contacted for services, outreach events
- **Current state:** Milwaukee's Housing Authority and the Continuum of Care (CoC) track this internally. The Homeless Management Information System (HMIS) has the data but is restricted access.
- **How to source:**
  - Aggregate data (not individual-level) from Housing Division
  - Milwaukee Continuum of Care annual reports have some numbers
  - Guest House, Rescue Mission, and other providers may share aggregate counts
- **Difficulty:** City department + nonprofit partnership
- **Who to talk to:** Milwaukee Housing Authority, Milwaukee County Housing Division, Community Advocates

#### 13. Lead Testing & Abatement Data
- **What:** Properties tested for lead, results, abatement orders issued, abatements completed
- **Current state:** MHD runs the Childhood Lead Poisoning Prevention Program. They publish reports but not structured data feeds. This is a major Milwaukee issue — the city has one of the highest rates of childhood lead poisoning in the country.
- **How to source:**
  - MHD publishes annual lead data in reports (would need to digitize/ETL)
  - Wisconsin DHS has lead testing data by municipality
  - Formal data request to MHD for geocoded lead order data
- **Difficulty:** City department partnership + state data
- **Who to talk to:** MHD Lead Program Manager, Wisconsin DHS Lead and Asbestos Section

#### 14. Substance Use / Behavioral Health Metrics
- **What:** Treatment referrals, AODA contacts, naloxone distribution, substance use-related ER visits
- **Current state:** MHD and BHD track this internally. The 2025 CHA reports aggregate city-level numbers (1 in 5 adults with frequent mental distress) but not by neighborhood. MKE Elevate tracks priority areas.
- **How to source:**
  - Partial: derive overdose calls from MFD dispatch data (available today)
  - Aggregate referral counts from BHD (need partnership)
  - WISHIN (Wisconsin Statewide Health Information Network) has some data
  - Milwaukee County medical examiner drug-related death data (public records)
- **Difficulty:** City department partnership (HIPAA sensitivity)
- **Who to talk to:** BHD Director, MHD MKE Elevate team, Medical College of Wisconsin (research partner)

---

## Category 5: Data We Should Add That Philly Doesn't Have

These aren't gaps relative to Philly — they're opportunities to make Milwaukee's dashboard BETTER.

#### 15. Broadband Access / Digital Divide
- **What:** Internet access rates, broadband availability, digital equity metrics by neighborhood
- **Current state:** FCC broadband maps have data at the census block level. MHD's CHA identified digital access as a health determinant. Connected MKE may have program data.
- **How to source:** FCC Broadband Data Collection (api.broadbandmap.fcc.gov), ACS variable B28002 (internet subscription type)
- **Difficulty:** Federal data (available, needs formatting)

#### 16. Transit Access / Walkability
- **What:** MCTS bus route coverage, stop-level ridership, transit access scores
- **Current state:** MCTS publishes GTFS feeds (General Transit Feed Specification). Walk Score has neighborhood-level scores. The Hop Streetcar has ridership data.
- **How to source:** MCTS GTFS feed (free, standard format), Walk Score API, Hop ridership reports
- **Difficulty:** Build it ourselves (GTFS is a standard format)

#### 17. Lead Pipe Inventory
- **What:** Which properties have lead service lines connecting them to the water main
- **Current state:** Milwaukee Water Works has been building an inventory as required by federal regulations. Some data may be published or available through records requests.
- **How to source:** Milwaukee Water Works, EPA Lead and Copper Rule compliance data
- **Difficulty:** City utility partnership
- **Who to talk to:** Milwaukee Water Works

---

## Sourcing Priority Matrix

### Phase 1 (Build for Prototype — No Partnerships Needed)

| Data | Source | Effort |
|------|--------|--------|
| Community resources (basic) | 211 Wisconsin API + manual compilation | 2 weeks |
| Free meal sites | USDA API + MPS + Feeding America | 1 week |
| Public Wi-Fi | MPL + city buildings list | 2 days |
| Illegal dumping | Derive from 311 categories | 1 day |
| Street light outages | Derive from 311 categories | 1 day |
| Overdose calls | Derive from MFD dispatch call types | 1 day |
| Broadband access | FCC API + ACS data | 3 days |
| Transit access | MCTS GTFS feed | 3 days |

### Phase 2 (Need City Partnerships)

| Data | Who to Approach | Leverage |
|------|----------------|---------|
| 311 response times (clean) | Dept of Administration / UCC | "Philly publishes this — residents deserve the same transparency" |
| DNS code violations | DNS Commissioner | MPROP already has summary count; we need detail |
| Lead testing/abatement | MHD Lead Program | This is a national-spotlight issue for Milwaukee |
| Shelter bed data | Housing Authority / CoC | Aggregate only, no individual data |
| School program data | MPS Research & Assessment | Complements existing school location layer |
| Community policing events | MPD Community Liaison | Shows positive policing investment |

### Phase 3 (Harder — Institutional Relationships)

| Data | Who to Approach | Challenge |
|------|----------------|----------|
| Behavioral health metrics | BHD + MHD | HIPAA — need aggregate, de-identified data only |
| ShotSpotter data | MPD | Politically sensitive, contract restrictions possible |
| Lead pipe inventory | Milwaukee Water Works | May be incomplete, federal compliance timeline |
| Substance use treatment | BHD + AODA providers | Privacy, stigma concerns |

---

## The 311 Question (Most Important Gap)

The single most impactful missing metric is **311 service request response times by neighborhood.** This is what Philadelphia published at 33% on-time for Kensington — and publishing it, even when unflattering, was what built public trust.

Milwaukee's 311/UCC data is partially available on the open data portal, but the resolution timestamps are inconsistent. To replicate Philly's transparency:

1. **Short-term:** Use existing open data to calculate response times where close dates exist. Report with a disclaimer about data completeness.
2. **Medium-term:** Work with the Dept of Administration to improve close date capture in UCC workflows.
3. **Long-term:** Advocate for a citywide policy (like Philly Stat 360) that requires departments to track and report service response metrics.

This is also where the CopilotKit AI layer adds the most value. A resident asks "how long does it take the city to fix a pothole in Harambee?" and gets an honest, data-grounded answer — or a transparent "this data isn't reliably tracked yet, which is one of the things this dashboard is designed to change."

---

## Who to Approach First

If you're going to make one phone call, make it to **ITMD/GIS (gis@milwaukee.gov, 414-286-8710)**. They maintain the ArcGIS server and MPROP. They would know which departments have data feeds that could be published as services. They're also the team that would need to be involved in any expansion of what's available via the REST endpoint.

Second call: **Data You Can Use** (datayoucanuse.org). They've spent 9 years building relationships with city departments and community orgs around neighborhood data. They would know which data-sharing agreements already exist and who the right contacts are for each department.

Third call: **MHD MKE Elevate team**. The Community Health Improvement Plan already calls for data-driven approaches. Your dashboard operationalizes their vision. They're a natural institutional champion.
