# Milwaukee Neighborhood Dashboard — Data Dictionary

What's actually in each dataset, what the fields mean, and how each one maps to a dashboard metric.

---

## 1. MPROP (Master Property Record)

**The single most important dataset.** Contains a record for every property in the city (~160,000 parcels). Created in 1975, updated daily. This one dataset powers at least 8 dashboard metrics.

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/2`
**Also available:** `data.milwaukee.gov/dataset/mprop` (CSV, XML, JSON — daily updates)
**Historical:** Annual snapshots back to 2008 at `data.milwaukee.gov/dataset/historical-master-property-file`
**Documentation:** [MPROP Documentation PDF](https://data.milwaukee.gov/dataset/562ab824-48a5-42cd-b714-87e205e489ba/resource/3d94613b-a1df-4ed1-86d9-d9205925e2ab/download/mprop_fall_2024.pdf)
**Join key:** `TAXKEY` (unique 10-digit identifier per property)

### 1.1 Fields That Power Dashboard Metrics

| Field | Alias | Type | What It Contains | Dashboard Metric |
|-------|-------|------|-----------------|-----------------|
| `TAXKEY` | taxkey | A(10) | Unique property identifier. Join key for parcel polygons. | — (key field) |
| `C_A_CLASS` | caclass | A(1) | **Current assessment class.** Identifies general property type. See values below. | Vacant property count (class 2) |
| `C_A_LAND` | caland | N(9) | Current assessed land value (dollars) | Property value analysis |
| `C_A_IMPRV` | caimprv | N(9) | Current assessed improvement value (dollars) | Property value analysis |
| `C_A_TOTAL` | catotal | N(9) | **Total current assessed value** (land + improvements) | Avg assessed value per neighborhood |
| `TAX_DELQ` | taxdelq | N(5) | **Years tax delinquent.** 0 = current, 1+ = delinquent. | Tax-delinquent property count |
| `RAZE_STATUS` | razestatus | A(1) | **Raze/demolition order status.** Non-zero = active order. | Raze orders issued count |
| `LAND_USE` | landuse | A(4) | **4-digit land use code.** See land use categories below. | Land use distribution |
| `LAND_USE_GP` | landusegp | A(2) | **Land use group** (2-digit rollup of LAND_USE) | Simplified land use |
| `OWN_OCPD` | ownocpd | A(1) | **Owner occupied.** "O" = yes, null = no. | Owner-occupancy rate |
| `CONVEY_DATE` | conveydate | A(4) | Year/month of last sale (YYMM format) | Recent sales activity |
| `CONVEY_TYPE` | conveytype | A(2) | How property was conveyed (see codes below) | Foreclosure detection |
| `CONVEY_FEE` | conveyfee | N(5.2) | Transfer fee paid at sale. Divide by 0.003 to estimate sale price (post-1981). | Estimated sale prices |
| `YR_BUILT` | yrbuilt | A(4) | Year the structure was built | Housing age analysis |
| `NR_UNITS` | nrunits | N(3) | Number of dwelling units on property | Housing density |
| `BLDG_AREA` | bldgarea | N(7) | Total usable floor area (sq ft) | Building size analysis |
| `ZONING` | zoning | A(7) | Zoning code for the property | Zoning distribution |
| `BI_VIOL` | biviol | T(4) | **Total unabated building violations** | Code violation count |

### 1.2 Geographic District Fields (For Spatial Joins)

These fields let you filter properties by district WITHOUT doing a spatial query — just use a `WHERE` clause.

| Field | Alias | What It Contains |
|-------|-------|-----------------|
| `GEO_TRACT` | geotract | **Census tract** (6 digits). Links to Census/ACS demographic data. |
| `GEO_ALDER` | geoalder | **Aldermanic district** (2024 boundaries). Filter by district. |
| `GEO_POLICE` | geopolice | **Police district** number. Links to MPD crime data. |
| `GEO_FIRE` | geofire | **Fire battalion** number. Links to MFD data. |
| `GEO_ZIP_CODE` | geozipcode | ZIP code (9 digits) |
| `DPW_SANITATION` | dpwsanitat | DPW sanitation district |
| `NEIGHBORHD` | neighborhd | **Assessor's neighborhood code** (~200 neighborhoods). NOT the same as DCD neighborhoods. |

### 1.3 Assessment Class Codes (`C_A_CLASS`)

This is how you identify vacant, residential, commercial, etc. properties:

| Code | Class | What It Means | Dashboard Use |
|------|-------|--------------|--------------|
| 1 | Residential | Single family, duplex, apartments, condos | Count residential properties |
| 2 | Commercial | Commercial use (includes exempt/vacant) | **Vacant property detection** — many vacant lots are class 2 |
| 3 | Manufacturing | Manufacturing properties | Industrial tracking |
| 4 | Agricultural | Agricultural use (rare in city) | — |
| 5 | Undeveloped | Undeveloped land | **Vacant land count** |
| 5M | Manufacturing Undeveloped | Undeveloped manufacturing land | Vacant industrial land |
| 6 | Agricultural Forest | Forest land | — |
| 7 | Other | Properties not fitting above categories | — |

**Key insight:** To count "vacant properties" like Philly does, filter for `C_A_CLASS IN (2, 5)` where `C_A_IMPRV = 0` (no improvements = truly vacant land) OR use `LAND_USE` codes in the 88xx range (see below).

### 1.4 Land Use Categories (`LAND_USE`)

14 high-level categories, each with detailed sub-codes. The ones most relevant to the dashboard:

| Code Range | Category | Dashboard Relevance |
|-----------|----------|-------------------|
| 1000–1999 | Residential (single family) | Housing stock |
| 2000–2999 | Residential (duplex) | Housing stock |
| 3000–3999 | Residential (multi-family) | Housing density |
| 4000–4999 | Residential (commercial apt) | Housing + commercial mix |
| 5000–5999 | Wholesale & Retail Trade | Commercial corridors |
| 6000–6999 | Services | Business activity |
| 7000–7999 | Manufacturing | Industrial |
| 8000–8799 | Institutional & Government | Community assets (schools, churches, government) |
| **8800–8899** | **Vacant Land** | **KEY: Vacant property identification** |
| 9000–9999 | Outdoor/Recreation | Parks, open space |

**Critical sub-codes for vacant land (88xx):**

| Code | Description |
|------|------------|
| 8810 | Residential vacant land |
| 8820 | Commercial vacant land |
| 8830 | Industrial vacant land |
| 8840 | Exempt-purpose vacant land |
| 8850 | Institutional vacant land |

### 1.5 Conveyance Type Codes (`CONVEY_TYPE`)

How property changed hands — useful for detecting foreclosures and distress sales:

| Code | Type | Dashboard Use |
|------|------|--------------|
| AR | Arms-length related | Normal sale between related parties |
| AU | Arms-length unrelated | **Normal market sale** |
| LL | Land contract | — |
| IN | Inheritance/estate | — |
| QC | Quit claim | Watch for distress |
| TF | Tax foreclosure | **Tax foreclosure detection** |
| SD | Sheriff's deed | **Foreclosure sale** |
| SF | Sheriff's deed (foreclosure) | **Foreclosure sale** |
| OT | Other | — |

### 1.6 Owner Information Fields

| Field | What It Contains | Dashboard Use |
|-------|-----------------|--------------|
| `OWNER_NAME_1` | Primary owner name (28 chars) | Identify city-owned, bank-owned, corporate-owned |
| `OWNER_NAME_2` | Secondary owner / continuation | — |
| `OWNER_NAME_3` | Tertiary owner / continuation | — |
| `OWNER_MAIL_ADDR` | Owner mailing address | Absentee owner detection (compare to property address) |
| `OWNER_CITY_STATE` | Owner city/state | Out-of-state owner detection |
| `OWNER_ZIP` | Owner ZIP code | — |
| `LAST_NAME_CHG` | Date of last ownership change (MMDDYY) | Recent turnover tracking |

**Dashboard metric: Absentee ownership rate** — Compare `OWNER_MAIL_ADDR` to property address. If they don't match, the owner doesn't live there.

### 1.7 How to Query MPROP for the Dashboard

```
# Vacant properties in a neighborhood (spatial query)
WHERE: LAND_USE >= 8800 AND LAND_USE < 8900
geometry: {neighborhood polygon}
outFields: TAXKEY,LAND_USE,C_A_TOTAL,OWNER_NAME_1,YR_BUILT

# Tax-delinquent properties
WHERE: TAX_DELQ > 0
outFields: TAXKEY,TAX_DELQ,C_A_TOTAL,OWNER_NAME_1

# Properties with raze orders
WHERE: RAZE_STATUS > 0
outFields: TAXKEY,RAZE_STATUS,LAND_USE,C_A_TOTAL

# Owner-occupied rate
WHERE: OWN_OCPD = 'O'  (count this / count total = rate)

# Recently sold properties (last 12 months)
WHERE: CONVEY_DATE >= '2503'  (March 2025 in YYMM)
outFields: TAXKEY,CONVEY_DATE,CONVEY_TYPE,CONVEY_FEE
```

---

## 2. Foreclosed Properties

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/foreclosed_properties/MapServer`
**Update:** Nightly refresh
**Description:** Estimated foreclosed properties derived from MPROP, classified as city-owned or bank-owned.

| Field | What It Contains |
|-------|-----------------|
| `TAXKEY` | Property identifier (join to MPROP) |
| `FORECLOSURE_TYPE` | City-owned vs. bank-owned |
| `ADDRESS` | Property address |
| Geometry | Parcel polygon |

**Dashboard metric:** Foreclosed property count by neighborhood, split by city vs. bank ownership.

---

## 3. Government-Owned Properties

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/govt_owned/MapServer`
**Update:** Nightly refresh
**Description:** Parcels owned by city, county, state, or federal government.

**Dashboard metric:** Government-owned property count (potential for redevelopment tracking).

---

## 4. MPD Crime Data

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_Monthly/MapServer`
**Layers:** Multiple layers for different crime categories
**Update:** Monthly refresh

### Fields (from ArcGIS layer)

| Field | What It Contains | Dashboard Metric |
|-------|-----------------|-----------------|
| `ReportedDateTime` | Date/time of incident | Time filtering, trend analysis |
| `Location` | Street address | Map display |
| `Offense` | Crime type/category | Crime breakdown by type |
| `WeaponUsed` | Weapon involved (if any) | Violent crime analysis |
| Geometry | Point (lat/lng of incident) | Map dot layer, spatial aggregation |

**Dashboard metrics:**
- Part 1 crimes (violent + property) by neighborhood
- Crime trend (year-over-year change)
- Crime by type distribution
- Narcotics arrests

**Also on open data portal:**

**Police Dispatch Calls** — `data.milwaukee.gov`
- Real-time dispatched calls for service
- Includes: call type, location, date/time, disposition
- Refreshed nightly
- Dashboard metric: Call volume by neighborhood, response patterns

---

## 5. MFD Fire Data

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/MFD/First_Due_Areas/MapServer`
**Layers:** Fire station locations, first-due response area boundaries

**Also on open data portal:**

**Fire Dispatch Calls** — `data.milwaukee.gov`
- Real-time fire department dispatched calls
- Includes: incident type, location, date/time
- Refreshed nightly
- Dashboard metrics: Fire incident count, overdose/Narcan calls (derivable from call type)

---

## 6. Neighborhood Boundaries

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/4`
**Projection:** WKID 32054 (Wisconsin State Plane South NAD27)

| Field | What It Contains |
|-------|-----------------|
| `NEIGHBORHD` | Neighborhood name (e.g., "Harambee") |
| `OBJECTID` | Unique polygon ID |
| Geometry | Polygon boundary |

**Description:** Defined by DCD through the Milwaukee Neighborhood Identification Project (2000). Boundaries used subdivisions, major streets, physical barriers, housing styles, historic areas, and resident input.

**Important:** These are NOT the same as the Assessor's `NEIGHBORHD` field in MPROP (which has ~200 sub-neighborhoods). These are the broader DCD neighborhoods (~70 total).

**This polygon is the spatial filter for every other query in the dashboard.**

---

## 7. Special Districts (planning/special_districts MapServer)

One service, many layers. Key layers relevant to dashboard:

| Layer ID | Name | What It Contains |
|---------|------|-----------------|
| 0 | Architectural Review Board | ARB overlay districts |
| 1 | Area Plans | Neighborhood area plans |
| 2 | BID (Business Improvement Districts) | BID boundaries and names |
| 3 | NID (Neighborhood Improvement Districts) | NID boundaries |
| 4 | **Neighborhoods** | DCD neighborhood boundaries (primary spatial filter) |
| 5 | Redevelopment Plans | Redevelopment TIF/TID areas |
| 6 | TID (Tax Incremental Districts) | TID boundaries with financial data |
| 7 | TIN (Targeted Investment Neighborhoods) | Priority investment areas |
| 8 | Historic Sites | Individual historic landmarks |
| 9 | Historic Districts | Historic district boundaries |
| 10+ | CDGA/NRSA/NSP | Community development grant areas |

**Dashboard use:** Overlay TID boundaries, historic districts, and BIDs on the map. Show which investment districts intersect with each neighborhood.

---

## 8. DPW Services

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/MapServer`

| Layer | What It Contains | Dashboard Metric |
|-------|-----------------|-----------------|
| Forestry | Tree locations, maintenance areas | Tree canopy / green infrastructure |
| Operations | DPW operational areas | Service area coverage |
| Sanitation | Garbage/recycling routes + schedules | Service delivery tracking |
| Streetcar | Hop route and stop locations | Transit access overlay |
| Parking Meters | Meter locations | Commercial corridor activity |
| Paving Program | **Active and planned paving projects** | Infrastructure investment tracking |

---

## 9. Environmental / Green Infrastructure

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/ECO/MapServer`

| Layer | What It Contains |
|-------|-----------------|
| Basement Backups (by year) | Sewer backup incidents, year-by-year |
| Green Infrastructure | Green infrastructure projects and planning layers |
| DPW Basement Connection Areas | Areas with basement sewer connections |

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/ECO/MMSD_GI_plan/MapServer`

| Layer | What It Contains |
|-------|-----------------|
| Watersheds | Watershed boundaries |
| Sub-basins | Sub-basin boundaries |
| Combined Sewer Area | Areas with combined storm/sanitary sewers (flood risk) |
| Total Impervious Areas | Impervious surface coverage (environmental impact) |
| Depth to Bedrock | Bedrock depth (construction planning) |

---

## 10. Elections / Districts

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/elections/MapServer`

| Layer | What It Contains | Dashboard Use |
|-------|-----------------|--------------|
| Aldermanic Districts | 2024 aldermanic boundaries | Filter by district, representation |
| Voting Wards | Ward boundaries | Voter engagement overlay |
| Polling Places | Polling location points | Community resource mapping |
| County Supervisor Districts | County districts | — |
| State Senate/Assembly | State legislative districts | — |
| US Congressional | Federal districts | — |

---

## 11. Strong Neighborhoods Plan

**Source:** `milwaukeemaps.milwaukee.gov/arcgis/rest/services/StrongNeighborhood/MapServer`

Multiple layers addressing foreclosure and abandonment. This initiative already has city GIS investment.

| Layer | What It Contains |
|-------|-----------------|
| Tax Delinquency | Properties with tax delinquency (visualization) |
| Vacant Buildings | Identified vacant structures |
| City-Owned Real Estate | City-owned property inventory |

---

## 12. Open Data Portal (data.milwaukee.gov)

### 12.1 Food Inspections

**URL:** `data.milwaukee.gov` (search "Restaurant and Food Service Inspections")
**Format:** CSV with API access
**Update:** Regular

| Field | What It Contains | Dashboard Metric |
|-------|-----------------|-----------------|
| Facility name | Restaurant/food service name | — |
| Address | Location | Geocode for map |
| Inspection date | When inspected | Recency tracking |
| Result/score | Pass/fail/score | Food safety pass rate by neighborhood |
| Violations | Specific violations found | — |

### 12.2 Property Assessment Data

**URL:** `data.milwaukee.gov` (search "Property Assessment")
**Format:** CSV with API access

Supplements MPROP with additional assessment detail. Searchable via My Milwaukee Home app.

### 12.3 Opportunity Zones

**URL:** `data.milwaukee.gov/dataset/opportunity-zones`
**Also:** Layer in `planning/special_districts` MapServer
**Format:** Shapefile + ArcGIS REST

Federal Opportunity Zone boundaries — polygons where investment receives favorable capital gains treatment.

### 12.4 Tax-Delinquent Properties (DNS)

**URL:** `data.milwaukee.gov` (Housing & Property group)
**Update:** Quarterly or as needed
**Description:** Properties where owners have not paid taxes for 1+ years. Based on initial screening, these sites may be available for purchase through the city.

### 12.5 Sales History

**URL:** `data.milwaukee.gov` (Housing & Property group)
**Update:** Yearly
**Description:** Residential, condo, commercial, apartment, and vacant land sales history.

---

## 13. External Data Sources

### 13.1 Census / ACS 5-Year

**API:** `api.census.gov/data/2023/acs/acs5`
**Geography:** Census tract, block group (linkable via MPROP's `GEO_TRACT` field)
**Key variables for dashboard:**

| Variable | What It Contains |
|---------|-----------------|
| `B01003_001E` | Total population |
| `B19013_001E` | Median household income |
| `B17001_002E` | Population below poverty level |
| `B25002_003E` | Vacant housing units |
| `B25003_001E` / `002E` / `003E` | Tenure (owner vs renter) |
| `B25077_001E` | Median home value |
| `B15003_022E` | Bachelor's degree attainment |
| `B23025_005E` | Unemployment count |
| `B02001_*` | Race/ethnicity breakdown |
| `B25035_001E` | Median year structure built |

### 13.2 CDC Social Vulnerability Index

**Source:** `svi.cdc.gov`
**Geography:** Census tract
**Description:** Ranks every tract on 16 social factors across 4 themes:

| Theme | Factors Included |
|-------|-----------------|
| Socioeconomic Status | Below 150% poverty, unemployed, housing cost burden, no health insurance, no high school diploma |
| Household Characteristics | Age 65+, age 17 and under, civilian with disability, single-parent households, English language proficiency |
| Racial/Ethnic Minority Status | Racial/ethnic minority, limited English speakers |
| Housing Type/Transportation | Multi-unit structures, mobile homes, crowding, no vehicle, group quarters |

### 13.3 HOLC Redlining Maps

**Source:** University of Richmond Digital Scholarship Lab
**Format:** GeoJSON
**Description:** 1930s Home Owners' Loan Corporation neighborhood grading maps. Grades A (green/best) through D (red/hazardous). Available for Milwaukee.

**Dashboard use:** Historical overlay showing how HOLC grades correlate with present-day vacancy, disinvestment, and health outcomes. **This is the feature no other city dashboard offers.**

### 13.4 MKE FreshAir Collective

**Source:** Community sensors at neighborhood level
**Data:** Real-time air quality (PM2.5, AQI)
**Format:** Sensor data (analyzed by Data You Can Use in 2024)
**Dashboard metric:** Air quality index by neighborhood

---

## 14. Data Gaps (What Doesn't Exist Yet)

These are the sources you'd need to build or negotiate:

| Data Need | Current State | What's Required |
|-----------|--------------|----------------|
| **Consolidated community resources** | No single source for food pantries, shelters, clinics, rec programs | Manual compilation from 211, MHD, MPS, Parks Dept |
| **311 response times** | Service request data exists but resolution/response timing is inconsistent | Pipeline work with UCC to extract response rate metrics |
| **DNS code violations (real-time)** | Dept of Neighborhood Services tracks violations but doesn't publish as structured feed | Data-sharing agreement with DNS or scrape from public records |
| **Shelter bed availability** | Housing Authority tracks this internally | Partnership agreement for aggregate data (not individual-level) |
| **Behavioral health referrals** | MHD tracks referrals internally | Aggregate data sharing (HIPAA considerations) |
| **Lead abatement orders** | MHD Lead Program has data | Formal data request or API negotiation |
| **MPS school program data** | MPS publishes reports but not structured data per school per neighborhood | Partnership with MPS data team |

---

## 15. Quick Reference: Metric → Data Source Mapping

| Dashboard Metric | Primary Source | Key Field(s) | Query Strategy |
|-----------------|---------------|-------------|---------------|
| Vacant properties | MPROP | `LAND_USE` 8800-8899 or `C_A_CLASS` 2/5 + `C_A_IMPRV` = 0 | Spatial query with neighborhood polygon |
| Tax-delinquent properties | MPROP | `TAX_DELQ > 0` | Spatial query, count records |
| Raze orders | MPROP | `RAZE_STATUS > 0` | Spatial query, count records |
| Foreclosures | Foreclosed Properties service | Geometry intersection | Spatial query, split by type |
| Assessed value (avg) | MPROP | `C_A_TOTAL` | Spatial query, average value |
| Owner-occupied rate | MPROP | `OWN_OCPD = 'O'` | Count owned / count total |
| Absentee owners | MPROP | Compare `OWNER_MAIL_ADDR` to property address | Requires address matching logic |
| Housing age | MPROP | `YR_BUILT` | Distribution/median calculation |
| Part 1 crimes | MPD Monthly | All features in time range | Spatial query, count by offense type |
| Fire incidents | MFD Dispatch | Call type filter | Filter from open data portal |
| Overdose calls | MFD Dispatch | Call type = Narcan/overdose | Filter from open data portal |
| 311 requests | UCC/311 data | Category, status, resolution time | Open data portal query (needs pipeline) |
| Food inspection pass rate | Open data portal | Result field | Filter by neighborhood, calculate rate |
| Paving projects | DPW MapServer | Paving program layer | Spatial query for active projects |
| Population | Census ACS | `B01003_001E` by tract | API query, aggregate by neighborhood |
| Median income | Census ACS | `B19013_001E` by tract | API query, weighted average |
| Poverty rate | Census ACS | `B17001_002E / B01003_001E` | Calculate percentage |
| Social vulnerability | CDC SVI | Overall SVI ranking | Lookup by tract |
| Air quality | FreshAir Collective | AQI reading | Sensor data, average by neighborhood |
| Redlining grade | HOLC maps | Grade (A/B/C/D) | GeoJSON overlay |
