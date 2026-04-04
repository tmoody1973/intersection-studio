**PRODUCT REQUIREMENTS DOCUMENT**

**Milwaukee Neighborhood Vitality Dashboard**

A Cross-Department Data Platform for Transparency, Accountability, and
Community-Driven Revitalization

Modeled after Philadelphia's Kensington Dashboard (Philly Stat 360)

Leveraging Milwaukee's existing ArcGIS infrastructure and open data

**Prepared by: Tarik Moody**

Director of Strategy & Innovation, Radio Milwaukee

Date: April 2026

Version: 1.0 --- Draft for City Officials Review

1\. Executive Summary

On March 11, 2026, Philadelphia launched the Kensington Dashboard---a
public, real-time, neighborhood-level data tool that consolidates 30
metrics from over 20 city agencies into a single interactive experience.
Within weeks, national publications covered the initiative as a
blueprint for how cities can use existing technology to drive
transparency, accountability, and community-led revitalization.

Milwaukee has the data infrastructure to build something even better.
The city already operates ArcGIS Server 10.91 with dozens of published
REST services, maintains the MPROP Master Property Record covering
160,000+ properties (updated weekly, with records dating back to 1975),
publishes live police and fire dispatch data, and operates a mature open
data portal. What Milwaukee lacks is the public-facing integration layer
that connects these sources into a unified, neighborhood-level view that
any resident can understand.

This PRD proposes the Milwaukee Neighborhood Vitality Dashboard: a
cross-department data platform that provides transparency,
accountability, and actionable intelligence at the neighborhood level.
Unlike Philadelphia's approach, Milwaukee's dashboard would incorporate
an AI-powered conversational interface (via CopilotKit) that lets
residents ask questions about their neighborhood in plain English, and
would layer historical redlining maps to show how past disinvestment
connects to present conditions---a feature no other city dashboard
offers.

The initial launch would target 8 northside neighborhoods with the
highest need and strongest existing civic infrastructure, with the
architecture designed to scale citywide.

2\. The Inspiration: Philadelphia's Kensington Dashboard

Kensington is a neighborhood in northeast Philadelphia that has faced
intersecting challenges around vacancy, public safety, substance use
disorders, and economic disinvestment for decades. When Mayor Cherelle
Parker took office, she declared a public safety emergency and made
Kensington's revitalization a day-one priority.

Rather than approaching the problem with siloed department-by-department
interventions, the Mayor's Office of Philly Stat 360 built a data
platform that consolidates information from across city government into
a single, publicly accessible dashboard. The tool was developed using
Esri's ArcGIS Experience Builder and launched on March 11, 2026.

2.1 What the Kensington Dashboard Includes

The dashboard features 30 metrics organized into four categories:

- **Community:** Interactive map of city facilities, Parks & Recreation
  PlayStreets sites, school crossing guards, behavioral health services
  in schools, free meal sites, public Wi-Fi locations.

- **Public Safety:** Historical crime data, narcotics arrests, fire
  incidents. Data showing who is perpetrating crimes in
  Kensington---revealing that residents are not the primary offenders,
  using data to "beat back against myths."

- **Quality of Life:** Code violations, demolitions, city service
  requests with on-time response rates (33% in February---a number the
  city published transparently, even though it's unflattering),
  neighborhood cleaning efforts, vacant lot tracking.

- **Wellness:** Shelter bed usage, service-connected engagements, visits
  to the Kensington Wellness Support Center (a free rehab facility),
  Office of Homeless Services coordination data.

2.2 What Made It Work

Geo Week News, a leading geospatial industry publication, published an
analysis of the Kensington Dashboard on April 1, 2026, calling it a
model for how cities can rewrite the urban revitalization playbook.
Their analysis identified several critical success factors:

- **Breaking the fundamental problem of incomplete information:** As Geo
  Week News noted, "for decades, urban revitalization has been plagued
  by a fundamental problem: decisions are often made with incomplete
  information by people far removed from the communities they affect."
  The dashboard directly addresses this by putting every stakeholder on
  the same informational footing.

- **Political will:** The dashboard was a mayoral priority, which meant
  departments participated. Data from the Police Department and Licenses
  & Inspections flows in via API. Agencies with less mature data
  infrastructure received support to "put their data into more conformed
  systems."

- **From reporting tool to planning tool:** Geo Week News identified the
  critical distinction: ground-level data collection, fused with
  community feedback and layered into ArcGIS, is what transforms this
  from a reporting tool into a planning tool. It is the difference
  between a map that describes a neighborhood and one that actively
  guides investment in it.

- **Ground-truth survey:** The city didn't just digitize existing
  records. It conducted a comprehensive citywide land survey to surface
  previously unknown conditions---vacant lots suitable for multi-family
  housing, properties used for illegal dumping, gaps in services, and
  community assets that could anchor recovery.

- **Breaking down data silos at the platform level:** Geo Week News
  framed the architecture as significant for the GIS community: public
  safety metrics live in one department while housing vacancy data in
  another, and code violations somewhere else entirely. The result is
  that no individual person has a complete picture. The dashboard breaks
  this pattern at the platform level rather than the project level.

- **Community engagement:** Philly Stat 360 director Kristin Bray
  emphasized that community feedback changed what the dashboard
  measured: "We learned a lot from that community feedback about what we
  thought was important versus what the community thought was
  important."

- **Radical transparency:** The city published unflattering data (33%
  on-time 311 response rate) alongside wins (zero shootings in
  February). This builds trust---residents can see the government isn't
  cherry-picking.

2.3 The Replicability Argument

Geo Week News explicitly framed the Kensington Dashboard as a replicable
model, noting that ArcGIS is already widely deployed across municipal
governments---including Milwaukee. Their conclusion is worth quoting
directly to city officials: the question for other cities is not whether
they have the technology, because most already do. The question is
whether they have the political will and the data governance to deploy
it in a similar way.

Philadelphia's goal extends beyond Kensington: the city aims to guide
the development of 30,000 affordable housing units using the
intelligence the platform generates. Milwaukee's Strong Neighborhoods
Plan, which already has ArcGIS layers addressing foreclosure and
abandonment, represents a similar citywide ambition that could benefit
from the same data integration approach.

A dashboard is only as powerful as the institutional commitment behind
it. This PRD proposes that Milwaukee make that commitment---starting
with a prototype that proves the concept and builds toward a citywide
platform.

2.3 The AI Innovation: World Monitor + CopilotKit

Philadelphia's dashboard is powerful but static---it shows data, but
users must interpret it themselves. The World Monitor project
(github.com/GeneralJerel/world-monitor-copilotkit) demonstrates how
CopilotKit, an open-source AI framework for React applications, can add
a conversational intelligence layer on top of dashboard data.

World Monitor uses CopilotKit's hooks to let an AI assistant read the
dashboard state in real time (useCopilotReadable), take actions like
navigating the map and adding panels (useCopilotAction), and generate
dynamic UI components in the chat (Generative UI). Their implementation
uses an event bridge between their vanilla TypeScript app and a React
"micro-island" that hosts the CopilotKit sidebar.

Milwaukee's dashboard would adopt this AI layer but in a simpler
architecture---since we're building in React from day one, we skip the
bridge entirely. A resident could type "how many vacant properties are
in Harambee?" and the AI would answer with exact numbers from the MPROP
data, then offer to show the trend or switch the map to highlight those
parcels. This makes the dashboard accessible to people who don't read
charts.

3\. The Current Milwaukee Data Landscape

Milwaukee is not starting from zero. The city has significant data
infrastructure---but it's fragmented, technically inaccessible, and not
designed for public consumption. Understanding what exists is essential
to understanding what's missing.

9.1 What Milwaukee Already Has

- **ArcGIS Server 10.91:** The city operates a full ArcGIS installation
  with 30+ published REST services covering property data, crime, fire,
  DPW operations, planning districts, elections, environmental layers,
  and more. These are queryable via HTTP and support GeoJSON
  output---the same technical foundation Philadelphia's dashboard uses.

- **MPROP (Master Property Record):** Milwaukee's computerized property
  inventory, maintained since 1975, contains 90+ data fields for
  approximately 160,000 properties. It includes ownership, assessment,
  structural characteristics, land use, zoning, tax delinquency status,
  raze orders, and geographic district codes. MPROP is updated weekly
  and is one of the most comprehensive municipal property databases in
  the country.

- **Open Data Portal (data.milwaukee.gov):** A CKAN-based portal
  publishing datasets across housing, property, public safety, city
  services, elections, and external datasets. Includes live police and
  fire dispatch calls (refreshed nightly), food inspection results,
  property assessment data, and service request comparisons.

- **Map Milwaukee:** The city's public-facing GIS portal, providing
  access to ArcGIS REST services, geocoding, and map applications.
  Includes documentation for accessing services via ArcGIS Desktop and
  web mapping applications.

- **Milwaukee County Land Information Office:** Comprehensive basemap
  data for the county, including topo-planimetric features,
  cadastral/property data, and aerial imagery. Available as shapefiles
  and through ArcGIS REST endpoints.

9.2 Community Data Ecosystem

Several organizations are doing data work at the neighborhood level, but
none provide the real-time, multi-department integration that a
Kensington-style dashboard requires:

- **Data You Can Use:** A nonprofit that has produced neighborhood-level
  data reports for over nine years. They publish neighborhood portraits
  for 27 neighborhoods (16 tables of Census-derived data),
  change-over-time reports examining 10-year trends, MKE Indicators
  across equitable housing, population, market value, equity/access, and
  health. They also created specialized tools like a liquor license map,
  COVID health digests, and an air quality analysis with the MKE
  FreshAir Collective. Their work is highly valued but is
  static---snapshots, not real-time operations.

- **Milwaukee Health Department (MHD):** Released the 2025 Community
  Health Assessment in January 2026---the city's most comprehensive
  health snapshot, now on a 3-year cycle aligned with hospital CHNAs.
  Examines how housing, education, safety, mental health, and economic
  stability impact health outcomes. Key finding: nearly 1 in 5 adults
  experiences frequent mental distress. MHD also runs MKE Elevate, a
  community-driven health improvement plan with three priority action
  areas.

- **Health Compass Milwaukee:** Sponsored by health systems (Aurora,
  Ascension, Children's Wisconsin, Froedtert), provides a one-stop
  resource for health-related data, demographics, and determinants at
  the county level. Includes the CDC Social Vulnerability Index by
  census tract.

- **MKE FreshAir Collective:** Community-driven air quality monitoring
  using consumer-accessible sensors at the neighborhood level. Data You
  Can Use analyzed their 2024 data. This is a rare example of
  community-sourced, real-time environmental data---a resource
  Philadelphia's dashboard doesn't have.

- **LISC Milwaukee:** Uses the Loveland property data tool to inform
  land use decisions at the neighborhood level and shapes priorities
  within commercial corridor revitalization strategy. Oversees Amani
  Safety Initiative (Byrne Criminal Justice Innovation grant,
  2016--2020) with MPD, Dominican Center, Safe & Sound.

- **UWM Center for Economic Development:** Provides GIS analysis, market
  analysis, and socioeconomic assessments for community partners.
  Faculty expertise in urban redevelopment, transit connectivity, and
  affordable housing.

3.3 What's Missing

Despite this rich ecosystem, Milwaukee has no equivalent to
Philadelphia's Kensington Dashboard. The gaps are specific:

1.  **No unified, public-facing neighborhood dashboard.** Data exists
    across dozens of endpoints, portals, and PDF reports. No tool
    consolidates it into a single view that a resident can use without
    technical expertise.

2.  **No real-time service delivery tracking.** There is no public tool
    that shows 311 response rates, code violation resolution times, or
    DPW service completion by neighborhood. Residents have no way to
    know if their area is getting equitable service.

3.  **No cross-department data integration.** Property data (MPROP),
    crime data (MPD), health data (MHD), code violations (DNS), and
    service requests (UCC) live in separate systems with no shared
    neighborhood-level view.

4.  **No consolidated community resource map.** There is no single
    source listing food pantries, shelters, health clinics, rec
    programs, and community centers by neighborhood. Each organization
    maintains its own lists.

5.  **No historical context overlay.** The connection between historical
    redlining, racial covenants, and present-day neighborhood conditions
    is well documented in academic research but not visible in any
    public data tool.

4\. Pain Points This Dashboard Solves

The following pain points emerged from conversations with community
organizations, the existing data landscape analysis, and parallels to
what Philadelphia's dashboard addressed:

4.1 For Residents

- **"I called 311 three weeks ago and nothing happened."** Residents
  have no way to know if their service request is being handled, how it
  compares to response times in other neighborhoods, or whether the
  issue is systemic. The dashboard would show 311 request volumes,
  resolution rates, and on-time percentages by neighborhood---the same
  transparency Philly provides.

- **"There are so many vacant houses on my block but I don't know who
  owns them."** MPROP already has this data (ownership, tax delinquency,
  raze status) but accessing it requires querying an ArcGIS endpoint or
  downloading a massive CSV. The dashboard would surface vacancy,
  foreclosure, and tax delinquency data in a map view residents can
  explore by address.

- **"Is crime really getting worse here or does it just feel that
  way?"** Without accessible trend data, perception drives the
  narrative. The dashboard would show actual crime trends with
  year-over-year comparisons---and, like Philly, could reveal insights
  like whether incidents are driven by neighborhood residents or by
  people from outside the area.

- **"Where is the nearest food pantry / health clinic / shelter?"** No
  consolidated, maintained directory exists at the neighborhood level.
  The dashboard's community category would map these resources, similar
  to Philly's free meal sites and public Wi-Fi overlays.

4.2 For Alderpersons and City Staff

- **"I need to justify this budget request but I only have anecdotes."**
  Alderpersons currently lack a data tool that lets them compare service
  delivery across districts. The dashboard would enable data-driven
  budget advocacy by showing exactly where services are lagging.

- **"Our department's work is invisible to the public."** DPW paving
  projects, DNS code enforcement, and MHD lead abatement efforts happen
  daily but aren't visible to residents. The dashboard would make this
  work tangible and trackable.

- **"We don't know what other departments are doing in this
  neighborhood."** The cross-department integration solves the
  coordination problem that Philadelphia identified as their core
  challenge. As Philly Stat 360 director Kristin Bray said: "If we work
  together, we're incredibly powerful---and we can make real change in
  the communities."

4.3 For Community Organizations and Developers

- **"Every grant application requires a needs assessment and we start
  from scratch."** Organizations like LISC, Dominican Center, and Safe &
  Sound spend significant time compiling neighborhood data for funding
  proposals. A dashboard with downloadable metrics would cut this work
  dramatically.

- **"We want to invest but we can't see the trajectory."** Philadelphia
  envisioned developers and business owners using the Kensington
  Dashboard to identify areas that are prime for investment. Milwaukee's
  dashboard would serve the same function, showing Opportunity Zone
  data, vacancy trends, and property value trajectories in context.

- **"The hospital needs to understand the lived environment of our
  patients."** As noted in the 2025 Community Health Assessment: "In
  hospitals, when you're dealing with patients and prescribing a
  recommended plan of care, it's hard to understand their lived
  environment. You don't know what food is in the cabinet, the condition
  of the home, the condition of the neighborhood." The dashboard's
  wellness metrics would provide this context.

5\. Problem Statement

Milwaukee residents, community organizations, alderpersons, and city
staff currently face three interconnected problems:

- **Data silos:** Crime data lives in MPD systems, property data in
  MPROP, health data at MHD, code violations at DNS, and service
  requests in the UCC/311 system. No single person has a complete
  picture of any neighborhood.

- **Inaccessibility:** Much of the city's data is technically public but
  practically inaccessible. Using the ArcGIS REST endpoint or CKAN API
  requires technical expertise. Residents cannot easily answer questions
  like "how many vacant properties are in my neighborhood?" or "are 311
  requests being resolved on time?"

- **No accountability mechanism:** Without consolidated, public-facing
  data, there is no systematic way for residents or officials to track
  whether city services are being deployed equitably and effectively
  across neighborhoods.

Organizations like Data You Can Use produce valuable neighborhood
portraits and reports, but these are static, Census-derived
snapshots---not real-time operational dashboards. The proposed platform
would complement their work by providing the continuously updated
service delivery data layer that currently does not exist.

6\. Vision and Goals

9.1 Vision

A Milwaukee where every resident, alderperson, community organization,
and city department has access to the same real-time, neighborhood-level
data about the conditions and services in their community---enabling
informed advocacy, equitable resource allocation, and transparent
accountability.

9.2 Goals

6.  **Transparency:** Make cross-department neighborhood data publicly
    accessible in a format any resident can understand without technical
    expertise.

7.  **Accountability:** Track and display city service delivery metrics
    (311 response times, code violation resolution rates, paving
    completion) so residents and officials can see what's working and
    what isn't.

8.  **Equity:** Enable side-by-side neighborhood comparisons so
    disparities in service delivery, investment, and outcomes become
    visible and actionable.

9.  **Investment intelligence:** Give developers, business owners, and
    community development organizations data to identify opportunities
    and track revitalization progress.

10. **Interoperability:** Build on Milwaukee's existing ArcGIS
    infrastructure so the platform can integrate with Map Milwaukee,
    MPROP, and other city systems without requiring new data collection.

7\. Target Users

  ----------------------------------------------------------------------------------
  **User**                   **Needs**                   **Key Metrics**
  -------------------------- --------------------------- ---------------------------
  **Residents**              Understand conditions in    311 response rates, crime
                             their neighborhood; hold    trends, vacant property
                             city accountable; advocate  counts, community resources
                             for resources               

  **Alderpersons**           Data-driven constituent     Cross-neighborhood
                             communication; budget       comparisons, service
                             justification; service      delivery rates, investment
                             equity comparisons          tracking

  **City Departments**       Coordinated operations;     Departmental KPIs by
                             identify gaps; measure      geography, workload
                             impact of interventions     distribution, trend
                                                         analysis

  **Community Orgs**         Grant applications, program Health indicators, vacancy
                             planning, needs             rates, demographic trends,
                             assessments, advocacy with  asset mapping
                             data                        

  **Developers/Investors**   Identify opportunity areas; Property values, vacancy
                             understand market           trends, Opportunity Zone
                             conditions; track           data, permit activity
                             neighborhood trajectory     

  **Mayor's Office**         Transparent performance     Composite neighborhood
                             reporting; strategic        vitality scores,
                             investment decisions;       year-over-year trends
                             public communication        
  ----------------------------------------------------------------------------------

8\. Available Data Sources

The following table catalogs every identified data source relevant to
the dashboard, its current endpoint, format, integration readiness, and
notes on data quality and update frequency. Sources are categorized by
integration effort: LIVE (queryable today via API/REST), AVAILABLE (data
exists and is accessible but needs pipeline work), and NEEDS ETL (data
exists but requires extraction, transformation, or negotiated access).

8.1 Property & Land Use

  -------------------------------------------------------------------------------------------------------------------------------------
  **Source**        **Endpoint**                                       **Format**        **Status**  **Category**   **Notes**
  ----------------- -------------------------------------------------- ---------------- ------------ -------------- -------------------
  **MPROP Master    milwaukeemaps\.../property/parcels_mprop           ArcGIS REST        **LIVE**   Property       160K+ properties.
  Property**                                                                                                        Updated weekly. 90+
                                                                                                                    fields incl.
                                                                                                                    ownership,
                                                                                                                    assessment, land
                                                                                                                    use, zoning, tax
                                                                                                                    delinquency, raze
                                                                                                                    status, vacancy.
                                                                                                                    Join via TAXKEY.

  **Foreclosed      milwaukeemaps\.../property/foreclosed_properties   ArcGIS REST        **LIVE**   Property       City-owned and
  Properties**                                                                                                      bank-owned
                                                                                                                    foreclosures.
                                                                                                                    Derived from MPROP
                                                                                                                    values. Updated
                                                                                                                    nightly.

  **Gov-Owned       milwaukeemaps\.../property/govt_owned              ArcGIS REST        **LIVE**   Property       Government-owned
  Properties**                                                                                                      parcels. City,
                                                                                                                    county, state,
                                                                                                                    federal. Updated
                                                                                                                    nightly.

  **Parcel          data.milwaukee.gov/dataset/parcel-outlines         Shapefile/REST     **LIVE**   Boundaries     Spatial boundaries
  Polygons**                                                                                                        for all parcels.
                                                                                                                    Historical versions
                                                                                                                    back to 2001.
                                                                                                                    Supports condo
                                                                                                                    taxkeys since 2009.

  **Property        data.milwaukee.gov                                 CSV/API            **LIVE**   Property       Assessed values by
  Assessment**                                                                                                      property.
                                                                                                                    Searchable via My
                                                                                                                    Milwaukee Home app.

  **Opportunity     milwaukeemaps\.../planning/special_districts       ArcGIS REST        **LIVE**   Development    Federal program
  Zones**                                                                                                           boundaries. Layer
                                                                                                                    ID within
                                                                                                                    special_districts
                                                                                                                    service.

  **Strong          milwaukeemaps\.../StrongNeighborhood               ArcGIS REST        **LIVE**   Development    Layers addressing
  Neighborhoods**                                                                                                   foreclosure and
                                                                                                                    abandonment.
                                                                                                                    Multiple
                                                                                                                    sub-layers.

  **Market Value    milwaukeemaps\.../planning                         ArcGIS REST        **LIVE**   Property       2013 Reinvestment
  Analysis**                                                                                                        Fund analysis.
                                                                                                                    Block-group level
                                                                                                                    market
                                                                                                                    characterization.

  **BID             milwaukeemaps\.../planning/special_districts       ArcGIS REST        **LIVE**   Development    Business
  Boundaries**                                                                                                      Improvement
                                                                                                                    District polygons.
  -------------------------------------------------------------------------------------------------------------------------------------

8.2 Public Safety

  ------------------------------------------------------------------------------------------------------------------------
  **Source**           **Endpoint**                            **Format**    **Status**  **Category**   **Notes**
  -------------------- --------------------------------------- ------------ ------------ -------------- ------------------
  **MPD Crime Data**   milwaukeemaps\.../MPD/MPD_Monthly       ArcGIS REST    **LIVE**   Safety         Monthly crime
                                                                                                        data. Multiple
                                                                                                        layers for
                                                                                                        different crime
                                                                                                        categories.
                                                                                                        Queryable by
                                                                                                        geometry for
                                                                                                        neighborhood
                                                                                                        filtering.

  **Police Dispatch    data.milwaukee.gov                      CSV/API        **LIVE**   Safety         Real-time
  Calls**                                                                                               dispatched calls
                                                                                                        for service.
                                                                                                        Includes call
                                                                                                        type, location,
                                                                                                        time. Refreshed
                                                                                                        nightly.

  **Fire Dispatch      data.milwaukee.gov                      CSV/API        **LIVE**   Safety         Real-time fire
  Calls**                                                                                               department
                                                                                                        dispatched calls.
                                                                                                        Includes incident
                                                                                                        type, location,
                                                                                                        response.
                                                                                                        Refreshed nightly.

  **MPD                milwaukeemaps\.../MPD_geography         ArcGIS REST    **LIVE**   Boundaries     Police district
  Districts/Squads**                                                                                    and squad area
                                                                                                        polygons for
                                                                                                        spatial joins.

  **MFD First Due      milwaukeemaps\.../MFD/First_Due_Areas   ArcGIS REST    **LIVE**   Boundaries     Fire department
  Areas**                                                                                               response area
                                                                                                        boundaries.
                                                                                                        Station locations.

  **MPD Tritech        milwaukeemaps\.../MPDTritech            ArcGIS REST    **LIVE**   Safety         Newer system with
  System**                                                                                              schema changes
                                                                                                        matching MPD's
                                                                                                        tri-tech
                                                                                                        requirements.
  ------------------------------------------------------------------------------------------------------------------------

8.3 Quality of Life & Infrastructure

  ---------------------------------------------------------------------------------------------------------------------
  **Source**      **Endpoint**                         **Format**     **Status**    **Category**     **Notes**
  --------------- ------------------------------------ ------------ --------------- ---------------- ------------------
  **311 Service   data.milwaukee.gov (UCC)             CSV/API       **AVAILABLE**  QoL              Unified Call
  Requests**                                                                                         Center requests.
                                                                                                     Historical data
                                                                                                     available. Needs
                                                                                                     pipeline to
                                                                                                     current feed.
                                                                                                     Categories incl.
                                                                                                     graffiti,
                                                                                                     potholes, parking,
                                                                                                     code enforcement.

  **DPW           milwaukeemaps\.../DPW                ArcGIS REST     **LIVE**     Infrastructure   Forestry,
  Operations**                                                                                       operations,
                                                                                                     sanitation routes,
                                                                                                     paving projects,
                                                                                                     parking meters.

  **DPW           milwaukeemaps\.../DPW/Streetcar      ArcGIS REST     **LIVE**     Transit          Streetcar routes
  Streetcar**                                                                                        and stops.

  **ECO Green     milwaukeemaps\.../ECO                ArcGIS REST     **LIVE**     Environment      Basement backups
  Infra.**                                                                                           by year, green
                                                                                                     infrastructure
                                                                                                     planning layers.

  **MMSD          milwaukeemaps\.../ECO/MMSD_GI_plan   ArcGIS REST     **LIVE**     Environment      Watersheds,
  Sewerage**                                                                                         sub-basins,
                                                                                                     combined sewer
                                                                                                     areas, impervious
                                                                                                     surface analysis.

  **Building      data.milwaukee.gov                   CSV/API       **AVAILABLE**  Development      Permit issuance
  Permits**                                                                                          data. Needs
                                                                                                     pipeline for
                                                                                                     real-time feed.

  **DNS Code      city.milwaukee.gov/DNS               Web/Manual    **NEEDS ETL**  QoL              Dept. of
  Violations**                                                                                       Neighborhood
                                                                                                     Services
                                                                                                     violations. Not
                                                                                                     currently in open
                                                                                                     data portal as
                                                                                                     structured feed.

  **Legistar      milwaukee.legistar.com/api/v1        REST API      **AVAILABLE**  Governance       Council files,
  Council Data**                                                                                     ordinances,
                                                                                                     licenses
                                                                                                     (restaurant,
                                                                                                     liquor, new
                                                                                                     business). Already
                                                                                                     building pipeline
                                                                                                     for civic data
                                                                                                     app.

  **Food          data.milwaukee.gov                   CSV/API         **LIVE**     Health           Restaurant and
  Inspections**                                                                                      food service
                                                                                                     inspection
                                                                                                     results. Includes
                                                                                                     scores,
                                                                                                     violations,
                                                                                                     locations.
  ---------------------------------------------------------------------------------------------------------------------

8.4 Community & Demographics

  -----------------------------------------------------------------------------------------------------------------------------------------
  **Source**            **Endpoint**                                     **Format**      **Status**  **Category**    **Notes**
  --------------------- ------------------------------------------------ -------------- ------------ --------------- ----------------------
  **DCD Neighborhoods** milwaukeemaps\.../planning/special_districts/4   ArcGIS REST      **LIVE**   Boundaries      Official neighborhood
                                                                                                                     polygons from
                                                                                                                     Neighborhood
                                                                                                                     Identification
                                                                                                                     Project. WKID 32054
                                                                                                                     projection.

  **MPS Schools**       milwaukeemaps\.../schools                        ArcGIS REST      **LIVE**   Community       School locations and
                                                                                                                     school board district
                                                                                                                     boundaries.

  **Census / ACS        api.census.gov/data/acs5                         Federal API      **LIVE**   Demographics    Population, income,
  5-Year**                                                                                                           poverty, housing,
                                                                                                                     education,
                                                                                                                     race/ethnicity by
                                                                                                                     tract and block group.

  **CDC Social Vuln.    svi.cdc.gov                                      Federal Data     **LIVE**   Vulnerability   15 social factors
  Index**                                                                                                            across 4 themes by
                                                                                                                     census tract. Poverty,
                                                                                                                     vehicle access,
                                                                                                                     crowded housing, etc.

  **Elections/Wards**   milwaukeemaps\.../elections                      ArcGIS REST      **LIVE**   Governance      Aldermanic districts,
                                                                                                                     voting wards, polling
                                                                                                                     places,
                                                                                                                     county/state/federal
                                                                                                                     district boundaries.

  **HOLC Redlining      University of Richmond DSL                       GeoJSON          **LIVE**   Historical      Historical Home Owners
  Maps**                                                                                                             Loan Corporation maps.
                                                                                                                     Already integrated in
                                                                                                                     REDLINED project.

  **Data You Can Use**  datayoucanuse.org                                Reports/PDFs     **NEEDS    Community       27 neighborhood
                                                                                           ETL**                     portraits, MKE
                                                                                                                     Indicators,
                                                                                                                     change-over-time
                                                                                                                     reports.
                                                                                                                     Census-derived.

  **Community Orgs      Various / manual                                 Manual           **NEEDS    Community       Food pantries,
  Map**                                                                                    ETL**                     shelters, clinics, rec
                                                                                                                     programs. No
                                                                                                                     consolidated city
                                                                                                                     source exists. Would
                                                                                                                     need to compile.
  -----------------------------------------------------------------------------------------------------------------------------------------

8.5 Health & Wellness

  ---------------------------------------------------------------------------------------------------------------------------
  **Source**          **Endpoint**                            **Format**      **Status**    **Category**   **Notes**
  ------------------- --------------------------------------- ------------- --------------- -------------- ------------------
  **Community Health  city.milwaukee.gov/Health               PDF/Report     **NEEDS ETL**  Health         2025 CHA released
  Assessment**                                                                                             Jan 2026. Most
                                                                                                           comprehensive
                                                                                                           city-specific
                                                                                                           health snapshot.
                                                                                                           Now on 3-year
                                                                                                           cycle.

  **Health Compass    healthymke.com/data-sources             Web Portal     **NEEDS ETL**  Health         Milwaukee
  MKE**                                                                                                    Healthcare
                                                                                                           Partnership data.
                                                                                                           Demographics,
                                                                                                           health
                                                                                                           determinants, CHNA
                                                                                                           data. Interactive
                                                                                                           but not API.

  **MKE Elevate       city.milwaukee.gov/Health/MKE-Elevate   Reports        **NEEDS ETL**  Health         Community Health
  (CHIP)**                                                                                                 Improvement Plan.
                                                                                                           3 priority action
                                                                                                           areas. Survey data
                                                                                                           from 2,000+
                                                                                                           residents.

  **Lead Abatement    city.milwaukee.gov/Health               Requestable    **NEEDS ETL**  Health         MHD publishes
  Data**                                                                                                   lead-related data.
                                                                                                           Would need formal
                                                                                                           data-sharing
                                                                                                           agreement.

  **MKE FreshAir      mkefreshaircollective.org               Sensor Data    **AVAILABLE**  Environment    Real-time air
  Collective**                                                                                             quality sensors at
                                                                                                           neighborhood
                                                                                                           level. Data You
                                                                                                           Can Use analyzed
                                                                                                           2024 data.

  **Overdose/Narcan   MFD Dispatch + MHD                      Mixed          **AVAILABLE**  Health         Can be derived
  Data**                                                                                                   from fire dispatch
                                                                                                           call types. MHD
                                                                                                           also publishes
                                                                                                           substance use
                                                                                                           briefs.

  **WI DHS Health     dhs.wi.gov                              State Data     **AVAILABLE**  Health         State-level health
  Data**                                                                                                   statistics.
                                                                                                           Community living
                                                                                                           arrangements. Can
                                                                                                           filter to
                                                                                                           Milwaukee County.
  ---------------------------------------------------------------------------------------------------------------------------

9\. Metric Mapping: Philly vs. Milwaukee

The following table maps each metric category from the Kensington
Dashboard to equivalent Milwaukee data sources, indicating whether the
data is currently available for a prototype.

9.1 Community Metrics

  ------------------------------------------------------------------------------
  **Milwaukee Metric**  **MKE Data Source** **Philly             **Available?**
                                            Equivalent**        
  --------------------- ------------------- ------------------- ----------------
  Parks & Rec           DPW/Parks GIS       *Parks & Rec            **Yes**
  facilities            layers              PlayStreets*        

  School program        MPS schools ArcGIS  *School crossing        **Yes**
  locations             layer               guards*             

  Community centers     Manual compilation  *City facilities      **Partial**
                        needed              map*                

  Food pantry/meal      Manual + MHD data   *Free meal sites*     **Partial**
  sites                                                         

  Public Wi-Fi          ITMD (if published) *Public Wi-Fi map*    **Partial**
  locations                                                     

  Youth employment      DCD/Employ          *Community            **Partial**
  sites                 Milwaukee           services*           

  Behavioral health     MHD referral data   *DBHIDS services*     **Partial**
  services                                                      
  ------------------------------------------------------------------------------

9.2 Public Safety Metrics

  ------------------------------------------------------------------------------
  **Milwaukee Metric**  **MKE Data Source** **Philly             **Available?**
                                            Equivalent**        
  --------------------- ------------------- ------------------- ----------------
  Part 1 crimes         MPD Monthly ArcGIS  *Historical crime       **Yes**
  (violent + property)                      data*               

  Narcotics arrests     MPD Crime layers    *Narcotics arrests*     **Yes**

  Shots fired /         MPD dispatch +      *N/A (not in Philly     **Yes**
  ShotSpotter           ShotSpotter         dash)*              

  Fire incidents        MFD dispatch data   *Fire incidents*        **Yes**

  Traffic stops         MPD dispatch        *N/A*                   **Yes**

  Community outreach    MPD/MFD community   *N/A*                 **Partial**
  events                layers                                  
  ------------------------------------------------------------------------------

9.3 Quality of Life Metrics

  ----------------------------------------------------------------------------------
  **Milwaukee Metric**  **MKE Data Source**     **Philly             **Available?**
                                                Equivalent**        
  --------------------- ----------------------- ------------------- ----------------
  311 service requests  UCC /                   *City service           **Yes**
                        data.milwaukee.gov      requests*           

  311 on-time response  UCC resolution data     *33% on-time (Feb     **Partial**
  rate                                          Philly)*            

  Code violations       DNS (needs pipeline)    *Investigations*      **Partial**

  Vacant properties     MPROP vacancy fields    *Vacant lots*           **Yes**

  Foreclosed properties Foreclosed_properties   *N/A*                   **Yes**
                        REST                                        

  Tax-delinquent        MPROP TAX_DELQ field    *N/A*                   **Yes**
  properties                                                        

  Demolitions completed DCD / MPROP RAZE_STATUS *Demolitions*           **Yes**

  Raze orders issued    MPROP RAZE_STATUS       *N/A*                   **Yes**

  Street cleaning       DPW sanitation routes   *Neighborhood           **Yes**
                                                cleaning*           

  Paving projects       DPW paving program      *N/A*                   **Yes**
                        layer                                       
  ----------------------------------------------------------------------------------

9.4 Wellness Metrics

  --------------------------------------------------------------------------------
  **Milwaukee Metric**  **MKE Data Source**  **Philly              **Available?**
                                             Equivalent**         
  --------------------- -------------------- -------------------- ----------------
  Behavioral health     MHD data (request    *Service-connected     **Partial**
  referrals             needed)              engagements*         

  Substance use         MHD AODA data        *Kensington Wellness   **Partial**
  contacts                                   Center visits*       

  Shelter bed           Housing Authority    *Shelter bed usage*    **Partial**
  availability          data                                      

  Lead abatement orders MHD Lead Program     *N/A (MKE-specific)*   **Partial**

  Overdose incidents    MFD dispatch (Narcan *N/A*                    **Yes**
                        calls)                                    

  Health clinic visits  MHD + FQHC data      *Wellness support         **No**
                                             center*              

  Air quality           MKE FreshAir         *N/A*                    **Yes**
                        Collective sensors                        

  Food inspection       data.milwaukee.gov   *N/A*                    **Yes**
  scores                                                          
  --------------------------------------------------------------------------------

10\. Technical Architecture

10.1 Platform Options

Two viable paths exist, each with tradeoffs:

Option A: ArcGIS Experience Builder (Philly's Approach)

- **Pros:** Native integration with Milwaukee's existing ArcGIS Server
  10.91; no custom backend needed; Esri support and hosting; familiar to
  city GIS staff; proven by Philly's Kensington Dashboard.

- **Cons:** Requires ArcGIS Online organizational account or Enterprise
  portal; limited customization compared to custom code; licensing
  costs; less flexibility for non-GIS data sources.

- **Cost:** Likely covered under existing city Esri license. Additional
  ArcGIS Online credits may be needed for heavy public usage.

Option B: Custom React/Convex Application

- **Pros:** Full design control; can integrate non-ArcGIS data sources
  natively; modern PWA with mobile support; open-source potential;
  AI-powered insights via Anthropic SDK; faster iteration.

- **Cons:** Requires hosting and maintenance; custom spatial query layer
  needed for ArcGIS REST consumption; more development effort upfront.

- **Stack:** React frontend, Convex backend (real-time sync), ArcGIS
  REST API consumption, Anthropic SDK for AI analysis, Vercel/Cloudflare
  hosting.

Recommendation

Option A is the fastest path to city adoption because it operates within
the infrastructure city staff already know and trust. Option B is the
better long-term platform if the goal is to extend beyond what ArcGIS
Experience Builder can do---particularly for AI-powered neighborhood
narratives, real-time alerting, and community engagement features. A
hybrid approach (Option A for initial launch, Option B for extended
features) is also viable.

10.2 Data Pipeline Architecture

Regardless of platform choice, the data pipeline follows the same
pattern:

1.  **Ingest:** ArcGIS REST services queried via spatial intersection
    with neighborhood boundary polygons. Open Data API (CKAN) queried by
    geographic coordinates. Federal APIs (Census, CDC SVI) queried by
    tract/block group FIPS codes.

2.  **Transform:** Reproject from WKID 32054 (WI State Plane South
    NAD27) to WGS84 for web display. Aggregate point data (crime,
    dispatch, permits) to neighborhood polygons. Compute derived metrics
    (vacancy rate, response time percentiles, year-over-year trends).

3.  **Store:** Cache aggregated metrics with configurable refresh
    intervals (nightly for most sources, weekly for MPROP, monthly for
    Census/health data). Store historical snapshots for trend analysis.

4.  **Serve:** REST API or ArcGIS feature layer exposing
    neighborhood-level metrics. Time-series endpoints for trend
    visualization. Geospatial endpoints for map rendering.

11\. Phased Rollout Plan

Phase 1: Prototype (Weeks 1--4)

- Single neighborhood (Harambee or Lindsay Heights) with Tier 1 data
  only

- MPROP property data (vacancy, foreclosures, tax delinquency, raze
  status)

- MPD crime data and dispatch calls

- MFD fire incident data

- Static community resource overlay

- Demo to city officials for feedback and buy-in

- **Deliverable:** Working dashboard with live data for one neighborhood

Phase 2: Northside Expansion (Weeks 5--10)

- Expand to 8 northside neighborhoods (Harambee, Lindsay Heights, Amani,
  Bronzeville, Sherman Park, Washington Park, Walnut Hill, Metcalfe
  Park)

- Add 311 service request pipeline and response rate tracking

- Add DPW infrastructure data (paving, sanitation, forestry)

- Integrate Census/ACS demographics and CDC SVI vulnerability index

- Community engagement sessions to validate metric priorities

- **Deliverable:** Public beta for 8 neighborhoods with 20+ metrics

Phase 3: Full Platform (Weeks 11--20)

- Scale to all DCD-defined neighborhoods citywide

- Negotiate data-sharing agreements for health/wellness data with MHD

- Integrate Legistar council data for governance transparency

- Add HOLC redlining overlay for historical context (from REDLINED
  project)

- Neighborhood comparison mode for equity analysis

- AI-generated neighborhood narrative summaries

- **Deliverable:** Production-ready citywide platform

12\. Key Risks and Mitigations

  ---------------------------------------------------------------------------------------
  **Risk**                         **Impact**           **Likelihood**   **Mitigation**
  -------------------------------- ------------------ ------------------ ----------------
  **City data access               Cannot query live      **Medium**     Start with open
  restrictions**                   ArcGIS services                       data portal
                                   for public                            sources only;
                                   dashboard                             negotiate REST
                                                                         access
                                                                         separately

  **Health data privacy concerns** Wellness metrics        **High**      Use
                                   unavailable at                        aggregate-only
                                   neighborhood level                    data; follow
                                                                         HIPAA
                                                                         guidelines;
                                                                         start with
                                                                         publicly
                                                                         reported metrics

  **Low community engagement**     Dashboard metrics      **Medium**     Partner with
                                   don't reflect                         Data You Can
                                   resident                              Use, LISC,
                                   priorities                            Dominican Center
                                                                         for community
                                                                         input sessions

  **Sustainability/maintenance**   Dashboard falls        **Medium**     Design automated
                                   out of date                           pipelines; seek
                                   without ongoing                       institutional
                                   support                               home (city IT,
                                                                         UWM, or
                                                                         nonprofit
                                                                         partner)

  **ArcGIS licensing constraints** Cannot build            **Low**       Verify with city
                                   public-facing app                     ITMD; Option B
                                   on city's Esri                        (custom app)
                                   license                               avoids this
                                                                         entirely
  ---------------------------------------------------------------------------------------

13\. Strategic Alignment

This project aligns with multiple existing Milwaukee initiatives:

- **MKE Elevate (CHIP):** The Community Health Improvement Plan
  explicitly calls for data-driven approaches to neighborhood health.
  This dashboard would operationalize that vision.

- **Strong Neighborhoods Plan:** The city's existing initiative
  addressing foreclosure and abandonment already has ArcGIS layers. The
  dashboard would make that data accessible to residents.

- **2025 Community Health Assessment:** MHD's most comprehensive health
  snapshot, released January 2026, provides the baseline data for the
  wellness category.

- **Data You Can Use:** This nonprofit already produces
  neighborhood-level analysis for 27 neighborhoods. The dashboard would
  complement their static reports with real-time operational data.

- **Mayor Johnson's transparency goals:** A public-facing dashboard
  directly supports the mayor's stated commitment to using data to guide
  programs and policies.

14\. What Makes Milwaukee's Version Unique

While modeled after Philadelphia's approach, Milwaukee's dashboard would
include capabilities Philly's does not:

- **Historical redlining overlay:** Integration with HOLC maps (via
  REDLINED project) to show how historical disinvestment patterns
  correlate with current conditions---a feature no other city dashboard
  offers.

- **Multi-neighborhood from launch:** Philly started with one
  neighborhood. Milwaukee's prototype would cover 8 from Phase 2, with
  architecture for citywide scale.

- **Air quality data:** MKE FreshAir Collective provides real-time,
  neighborhood-level air quality sensor data---a community-driven data
  source Philly lacks.

- **AI-powered narratives:** Using the Anthropic SDK to generate
  plain-language neighborhood summaries from the data, making the
  dashboard accessible to residents who don't read charts.

- **MPROP depth:** Milwaukee's Master Property Record, maintained since
  1975 with 90+ fields per property, provides richer parcel-level data
  than most comparable city systems.

Appendix A: Key Milwaukee Data Endpoints

The following are the primary ArcGIS REST endpoints for the Milwaukee
dashboard. All services are projected in Wisconsin State Plane South
NAD27 (WKID 32054) and hosted on ArcGIS Server 10.91.

  --------------------------------------------------------------------------------------
  **Service**               **Endpoint URL**
  ------------------------- ------------------------------------------------------------
  **Root Services Catalog** milwaukeemaps.milwaukee.gov/arcgis/rest/services

  **MPROP Parcels**         milwaukeemaps\.../property/parcels_mprop/MapServer

  **Foreclosed Properties** milwaukeemaps\.../property/foreclosed_properties/MapServer

  **Government Owned**      milwaukeemaps\.../property/govt_owned/MapServer

  **MPD Monthly Crime**     milwaukeemaps\.../MPD/MPD_Monthly/MapServer

  **MPD Geography**         milwaukeemaps\.../MPD_geography/MapServer

  **MFD First Due Areas**   milwaukeemaps\.../MFD/First_Due_Areas/MapServer

  **DPW Services**          milwaukeemaps\.../DPW/MapServer

  **Special Districts       milwaukeemaps\.../planning/special_districts/MapServer
  (Neighborhoods)**         

  **ECO/MMSD Green          milwaukeemaps\.../ECO/MMSD_GI_plan/MapServer
  Infrastructure**          

  **Elections/Districts**   milwaukeemaps\.../elections/MapServer

  **StrongNeighborhood      milwaukeemaps\.../StrongNeighborhood/MapServer
  Layers**                  

  **Open Data Portal**      data.milwaukee.gov

  **Legistar API**          milwaukee.legistar.com/v1

  **Census ACS API**        api.census.gov/data/2023/acs/acs5
  --------------------------------------------------------------------------------------

Appendix B: Reference

- Philadelphia Kensington Dashboard:
  experience.arcgis.com/experience/0e59ffc62b32428d8014b80e17ae3475

- Philly Stat 360 FAQ:
  phila.gov/2025-03-07-your-questions-about-the-citys-new-kensington-dashboard-answered

- Milwaukee Open Data Portal: data.milwaukee.gov

- Milwaukee GIS Web Services: city.milwaukee.gov/mapmilwaukee/services

- MPROP Documentation: guides.library.uwm.edu/c.php?g=567847&p=4033938

- Data You Can Use: datayoucanuse.org/reports

- Health Compass Milwaukee: healthymke.com/data-sources

- 2025 Community Health Assessment:
  city.milwaukee.gov/Health/Reports-and-Publications

- MKE FreshAir Collective: mkefreshaircollective.org
