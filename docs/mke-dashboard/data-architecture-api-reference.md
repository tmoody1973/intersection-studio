# Milwaukee Neighborhood Dashboard: Data Architecture & API Reference

**Purpose:** This document is a comprehensive data architecture guide for building a Milwaukee neighborhood dashboard application, modeled after Philadelphia's Kensington Dashboard [1]. It maps every Kensington Dashboard category to its Milwaukee equivalent, provides all necessary API endpoints, data sources, and geographic boundaries, and includes implementation guidance for Claude Code.

---

## 1. Kensington-to-Milwaukee Parallel Mapping

The Philadelphia Kensington Dashboard is organized into five tabs: Key Indicators, Community, Public Safety, Quality of Life, and Wellness. The table below maps each Kensington data category to its Milwaukee equivalent.

| Kensington Dashboard Category | Philadelphia Data Source | Milwaukee Equivalent | Milwaukee Source |
| :--- | :--- | :--- | :--- |
| Crime Incidents | Philadelphia Police Dept. | WIBR Crime Data (Current & Historical) | City of Milwaukee Open Data |
| Calls for Service | Philly Police CAD | MPD & MFD Dispatched Calls for Service | City of Milwaukee Open Data |
| Traffic Crashes | PennDOT Crash Data | Traffic Crash Data | City of Milwaukee Open Data |
| EMS Incidents | Philadelphia Fire Dept. | MFD EMS Calls for Service Detail | City of Milwaukee Open Data |
| Fire Incidents | Philadelphia Fire Dept. | MFD Fire Calls for Service Detail | City of Milwaukee Open Data |
| 311 / Service Requests | Philly 311 | Call Center Data (Current & Historical) | City of Milwaukee Open Data |
| Vacant Properties | L&I Vacant Properties | Accela Vacant Buildings | City of Milwaukee Open Data |
| Property Data | OPA Property Assessments | Master Property File (MPROP) | City of Milwaukee Open Data |
| Building Permits | L&I Permits | Residential & Commercial Permit Work | City of Milwaukee Open Data |
| Neighborhood Boundaries | Philly Neighborhoods | Milwaukee Neighborhoods (190) | ArcGIS REST / Shapefile |
| Libraries | Free Library of Philadelphia | Milwaukee Public Libraries | ArcGIS REST / CSV |
| Parks | Philadelphia Parks & Rec | Parks and Parkways | ArcGIS REST |
| Schools | School District of Phila. | Milwaukee Public Schools | ArcGIS REST |
| Transit | SEPTA | MCTS GTFS / Bublr Bikes GBFS | MCTS / Bublr |
| Overdose / Substance Abuse | PDPH Overdose Data | Medical Examiner Public Data & Overdose Dashboard | Milwaukee County |
| Health Indicators | Philly Community Health | MKE Indicators (37 maps) & Health Compass Milwaukee | City of MKE / MCLIO |
| Demographics | ACS Census Data | ACS Census via MKE Indicators | Census Bureau / City of MKE |
| Zoning | Philly Zoning | Milwaukee Zoning | ArcGIS REST / Shapefile |
| Liquor Licenses | Philly Liquor Control | Liquor Licenses | ArcGIS REST / CSV |

---

## 2. Geographic Foundation: Milwaukee Neighborhoods

The City of Milwaukee defines **190 distinct neighborhoods** [2]. These boundaries serve as the primary geographic unit for aggregating all dashboard metrics.

**Neighborhood Boundaries Feature Service:**

| Property | Value |
| :--- | :--- |
| Service Type | Esri REST Feature Layer |
| Endpoint | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/4` |
| Geometry Type | `esriGeometryPolygon` |
| Key Field | `NEIGHBORHD` (String) — neighborhood name |
| Spatial Reference | Wisconsin State Plane South (WKID 32054); use `outSR=4326` for WGS84 |
| Max Record Count | 2000 (sufficient for all 190 neighborhoods in one request) |

**GeoJSON Query (all neighborhoods):**

```
https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/4/query?where=1%3D1&outFields=NEIGHBORHD&outSR=4326&f=geojson
```

**Additional Geographic Layers:**

| Layer | Endpoint |
| :--- | :--- |
| Corporate Boundary | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/reference/reference_map/MapServer/7` |
| Police Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_geography/MapServer/2` |
| Police Squad Areas | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_geography/MapServer/1` |
| Neighborhood Strategic Planning Areas (NSP) | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/21` |
| Zoning Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11` |
| Aldermanic Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/election/election_boundaries/MapServer` |

---

## 3. Data Access Methods

Milwaukee data is accessible through three primary channels. All are free and require no API key.

### 3.1 CKAN REST API (City of Milwaukee Open Data Portal)

The City of Milwaukee Open Data Portal runs on CKAN and hosts **196 datasets** [3].

| Property | Value |
| :--- | :--- |
| Base URL | `https://data.milwaukee.gov/api/3/` |
| List All Datasets | `https://data.milwaukee.gov/api/3/action/package_list` |
| Get Dataset Details | `https://data.milwaukee.gov/api/3/action/package_show?id={dataset_slug}` |
| Search Datasets | `https://data.milwaukee.gov/api/3/action/package_search?q={query}` |
| Datastore SQL Query | `https://data.milwaukee.gov/api/3/action/datastore_search_sql?sql={SQL}` |

The CKAN Datastore API allows SQL-like queries against tabular resources. For example, to query the first 100 crime records:

```
https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=87843297-a6fa-46d4-ba5d-cb342fb2d3bb&limit=100
```

### 3.2 ArcGIS REST Services (City of Milwaukee Map Services)

The City of Milwaukee hosts ArcGIS Server map and feature services at `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/`. The following service folders are available:

| Folder | Description | Key Services |
| :--- | :--- | :--- |
| `AGO` | ArcGIS Online hosted layers | Library Services |
| `DPW` | Department of Public Works | Forestry, Operations, Parking, Sanitation |
| `election` | Election boundaries | Election Boundaries, Polling Places |
| `MFD` | Milwaukee Fire Department | Risk Reduction (firehouses) |
| `MPD` | Milwaukee Police Department | Geography, Monthly Crime, Stations |
| `planning` | City Planning | Special Districts (neighborhoods), Zoning |
| `property` | Property data | Parcels/MPROP (includes parks, schools) |
| `reference` | Base reference layers | Reference Map (corporate boundary) |
| `regulation` | Licensing & regulation | License (liquor licenses) |

To query any service as GeoJSON, append `/query?where=1%3D1&outFields=*&outSR=4326&f=geojson` to the layer endpoint.

### 3.3 Milwaukee County Open Data

Milwaukee County maintains a separate open data portal at `https://data.county.milwaukee.gov/` [4], which includes county-level datasets such as the Medical Examiner Public Data and census block groups.

---

## 4. Public Safety Data Sources

Public safety is the backbone of the dashboard. Milwaukee provides daily-updated crime, crash, and dispatch data.

### 4.1 Crime Data

| Dataset | CKAN Slug | Format | Update Frequency | Download URL |
| :--- | :--- | :--- | :--- | :--- |
| WIBR Crime Data (Current) | `wibr` | CSV | Daily | [Download](https://data.milwaukee.gov/dataset/e5feaad3-ee73-418c-b65d-ef810c199390/resource/87843297-a6fa-46d4-ba5d-cb342fb2d3bb/download/wibr.csv) |
| WIBR Crime Data (Historical) | `wibrarchive` | CSV | Annual | [Download](https://data.milwaukee.gov/dataset/5a537f5c-10d7-40a2-9b93-3527a4c89fbd/resource/395db729-a30a-4e53-ab66-faeb5e1899c8/download/wibrarchive.csv) |

The WIBR (Wisconsin Incident Based Reporting) dataset contains incident-level records with fields including incident number, date/time, location (latitude/longitude), crime type, weapon used, and disposition. This enables spatial joins with neighborhood polygons for per-neighborhood crime aggregation.

**Monthly Crime Map Service (10 layers):**

The ArcGIS REST service at `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_Monthly/MapServer` provides pre-aggregated monthly crime data across 10 layers (layers 0 through 9), each representing a different crime category or time period.

### 4.2 Dispatch & Emergency Response

| Dataset | CKAN Slug | Format | Download URL |
| :--- | :--- | :--- | :--- |
| Police Dispatched Calls (Current) | `current-milwaukee-police-dispatched-calls-for-service` | CSV | Via CKAN API |
| Fire Dispatched Calls (Current) | `current-milwaukee-fire-dispatched-calls-for-service` | CSV | Via CKAN API |
| EMS Calls for Service Detail | `mfdopendataems` | CSV | [Download](https://data.milwaukee.gov/dataset/1a8bef50-1253-45f0-8a4e-86f7bf515240/resource/06fd2a64-4348-461a-bda4-5e09b2500615/download/mfdopendataems.csv) |
| MFD Fire Calls for Service Detail | `mfdopendatafire` | CSV | [Download](https://data.milwaukee.gov/dataset/8735b4c2-4298-44d0-84c2-b734be52e30d/resource/cdf51c45-5fe3-415e-a08c-14ed134dcb64/download/mfdopendatafire.csv) |

### 4.3 Traffic Crashes

| Dataset | CKAN Slug | Format | Download URL |
| :--- | :--- | :--- | :--- |
| Traffic Crash Data | `traffic_crash` | CSV | [Download](https://data.milwaukee.gov/dataset/5fafe01d-dc55-4a41-8760-8ae52f7855f1/resource/8fffaa3a-b500-4561-8898-78a424bdacee/download/trafficaccident.csv) |

### 4.4 Public Safety Facilities (Map Layers)

| Facility | Esri REST Endpoint |
| :--- | :--- |
| Police Stations | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_stations/MapServer/0` |
| Police Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_geography/MapServer/2` |
| Police Squad Areas | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_geography/MapServer/1` |
| Firehouses | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MFD/MFD_RiskReduction/MapServer/0` |

---

## 5. Quality of Life & City Services

These datasets measure the physical environment, infrastructure maintenance, and city responsiveness.

| Dataset | CKAN Slug | Format | Update Freq. | Download URL |
| :--- | :--- | :--- | :--- | :--- |
| 311 Service Requests (Current) | `callcenterdatacurrent` | CSV | Daily | [Download](https://data.milwaukee.gov/dataset/a418ffb4-ce90-4a11-a489-d256a3e68a8b/resource/bf2b508a-5bfa-49da-8846-d87ffeee020a/download/callcenterdatacurrent.csv) |
| 311 Service Requests (Historical) | `callcenterdatahistorical` | CSV | Annual | [Download](https://data.milwaukee.gov/dataset/16174983-470a-46c1-a925-d4b7ed28cff9/resource/abdfe983-e856-40cd-bee2-85e78454344a/download/callcenterdatahistorical.csv) |
| Vacant Buildings | `accelavacantbuilding` | CSV | Weekly | [Download](https://data.milwaukee.gov/dataset/a9d52246-c06e-4ec2-a58e-a53ea0a72ded/resource/46dca88b-fec0-48f1-bda6-7296249ea61f/download/accelavacantbuilding.csv) |
| Restaurant & Food Inspections | `restaurant-and-food-service-inspections` | CSV | Monthly | Via CKAN API |
| Liquor Licenses | `liquorlicenses` | CSV | Daily | [Download](https://data.milwaukee.gov/dataset/1aba8821-f5f6-4031-b469-5c39c90e99c7/resource/45c027b5-fa66-4de2-aa7e-d9314292093d/download/liquorlicenses.csv) |
| DPW Forestry | N/A | Esri REST | As Needed | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_forestry/MapServer` |
| DPW Operations | N/A | Esri REST | As Needed | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Operations/MapServer` |
| DPW Sanitation | N/A | Esri REST | As Needed | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Sanitation/MapServer` |

The Call Center Data is the Milwaukee equivalent of Philadelphia's 311 system. It includes request types (potholes, graffiti, illegal dumping, rodent complaints, etc.) with geographic coordinates, enabling per-neighborhood service request analysis.

---

## 6. Housing & Property Data

Housing indicators are essential for understanding neighborhood investment and decline.

| Dataset | CKAN Slug | Format | Update Freq. | Download URL |
| :--- | :--- | :--- | :--- | :--- |
| Master Property File (MPROP) | `mprop` | CSV | Daily | [Download](https://data.milwaukee.gov/dataset/562ab824-48a5-42cd-b714-87e205e489ba/resource/0a2c7f31-cd15-4151-8222-09dd57d5f16d/download/mprop.csv) |
| Master Address Index (MAI) | `mai` | CSV | Daily | [Download](https://data.milwaukee.gov/dataset/566af1a6-0499-4766-a89e-2f2a4b4d6e2d/resource/9f905487-720e-4f30-ae70-b5ec8a2a65a1/download/mai.csv) |
| Building Permits | `buildingpermits` | CSV | Daily | [Download](https://data.milwaukee.gov/dataset/9bada2e0-fad5-4545-8674-1b2c8c4e9f2f/resource/828e9630-d7cb-42e4-960e-964eae916397/download/buildingpermits.csv) |
| Property Sales Data | `property-sales-data` | CSV (multi-year) | Annual | Via CKAN API (multiple resources by year) |
| Tax Delinquent Brownfields | `environmentaldcd` | CSV | Quarterly | [Download](https://data.milwaukee.gov/dataset/c9e9e5e1-eee6-4889-a0a4-94673bef1287/resource/ce5cfcb9-0263-4f32-966b-765cf861f5ad/download/environmentaldcd.csv) |
| Delinquent Real Estate Tax | `delinquent-real-estate-tax-accounts` | CSV | Quarterly | Via CKAN API |

The **MPROP** dataset is the most comprehensive property dataset, containing assessed values, land use codes, building characteristics, and owner information for every parcel in Milwaukee. The ArcGIS REST service for parcels is at `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer`.

---

## 7. Community Resources & Infrastructure

Community assets provide context for neighborhood resilience, access to services, and livability.

| Resource Type | Source | Format | Endpoint / URL |
| :--- | :--- | :--- | :--- |
| Public Libraries | Library Services | Esri REST + CSV | [REST](https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/AGO/LibraryServices/MapServer/0) / [CSV](https://data.milwaukee.gov/dataset/1b984aba-5cc1-47e3-8c64-999b6d26ceb6/resource/0590052a-6dd5-4cc1-a473-fd60eb00402b/download/librarylocations.csv) |
| Parks and Parkways | Parcels MPROP Layer 16 | Esri REST | [REST](https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/16) |
| Public Schools | Parcels MPROP Layer 18 | Esri REST | [REST](https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/18) |
| Bublr Bike Share Stations | Bublr Bikes GBFS | JSON | [GBFS Feed](http://www.bcycle.com/gbfs) |
| Medication Drop Boxes | Drug Drop-off Sites | CSV | [Download](https://data.milwaukee.gov/dataset/67fe8a8a-6c1e-4ee2-acb4-254ad5a791c8/resource/737fc626-f1bd-4c8c-b5d5-3d449a47f602/download/countywide-dropboxes-envelops.csv) |
| MCTS Transit (Bus) | MCTS GTFS | GTFS | [GTFS Feed](https://www.ridemcts.com/policies/developer-terms) |
| Streetcar Route | Streetcar Route | SHP/REST | Via CKAN (`streetcar-route`) |
| Streetcar Stops | Streetcar Stops | SHP/REST | Via CKAN (`street-car-stops`) |

---

## 8. Wellness & Health Indicators

Health data is typically aggregated at the census tract or ZIP code level. Milwaukee has several complementary sources.

### 8.1 MKE Indicators (City of Milwaukee Department of City Development)

The MKE Indicators project [5] provides **37 pre-built web maps** covering neighborhood-level indicators across five domains. Each web map can be queried via the ArcGIS REST API to extract the underlying feature service data.

**Demographics:**

| Indicator | Web Map ID |
| :--- | :--- |
| Black Population (2022) | `d2b31408e4914d61af5b8314f436cbe1` |
| Asian Population (2022) | `46d5eb52d0c24142b89f70a8302bce67` |
| Latinx Population (2022) | `f4beef3140fc45e4ae568ae18252ed45` |
| White Population (2022) | `49747ddcd92843fdb16f18aa5a8c8bd0` |
| Population Change 2010-2020 | `d4a76f57f75b45d99b88f8e6f8dc74ca` |
| Child Population Change 2010-2020 | `cacb2fe87475430294d606c2604bb2b3` |
| Diversity Index (2022) | `8b2f0445a2d04f8c8c64bc56c7a653b7` |

**Health:**

| Indicator | Web Map ID |
| :--- | :--- |
| Asthma Prevalence (2021) | `a16313a0ddcc4a8ca9bbd6fa0116cecf` |
| Obesity Prevalence (2021) | `8f022c85485b49bf9b4936e4fc49ed76` |
| Mental Health (2021) | `aec820be540b43c286b7ad59d7054394` |
| Dental Visits (2021) | `db4238014d0d48e7b0b4dcd07e232a05` |

**Housing:**

| Indicator | Web Map ID |
| :--- | :--- |
| Housing Built Before 1950 (2022) | `638dcb4e17ee4f38b71d753931398ec9` |
| Homeownership (2022) | `28e7f6f76d754efda35d696e5a9afe3a` |
| Black Homeownership (2022) | `014ffa1ddfa9448bb1c0c1a00e7a20d2` |
| Latinx Homeownership (2022) | `2c24e7f64e4242e597651b7cc8eab8f2` |
| Rent Burden (2022) | `a5b0dfb9e1e84270a0e90e932f2f8487` |
| Vacancy (2022) | `9cef33ede2664ca0bc985421dbb1a577` |
| Residential Sales 2019-2023 | `40851a42c2134963bc45cf490e284f23` |
| New Construction (2017) | `489e51a890dc450181c44705ea062bfb` |
| Foreclosures (2024) | `1aaafdbd05124b6a947b10bac19086d0` |

**Socioeconomic:**

| Indicator | Web Map ID |
| :--- | :--- |
| Poverty (2022) | `784916357c48464e8dbe85c66d53bae4` |
| School Proficiency (2015) | `4d203443f0b44a1a8d9593a7a898ed42` |
| Commute Time (2022) | `0ef6b79906ed44af86a8f3195c0b0921` |
| Voter Turnout (2020) | `7a8db3b72a2a46fa9645d350c03a1ded` |
| Broadband Access (2022) | `66d2b541a83946249b1edbcf436cc151` |
| Food Access (2019) | `ad9c4411dec54c8a85e0c903a809a319` |
| Park Access (2018) | `e7e7f59265004a3a971c54555fdc19fa` |
| Historic Disadvantage | `47c252e1ef854995b436dd1ffd3ab4f2` |

**Mortgage/Lending (HMDA):**

| Indicator | Web Map ID |
| :--- | :--- |
| Total Originations | `cad239faba914ae3ae3b494d3bab1620` |
| Black Originations | `79d35a76a7de46c28920c3001601494a` |
| Latinx Originations | `38e7d304b9ec46dbaf1d5f653b2d793c` |
| AAPI Originations | `53ca4f04424d4679aa3561f20c647fdf` |
| White Originations | `2e7f5428556d4bbf88f309496453c690` |
| Denial Rate | `4319d77dfe9f47ec95f9a46c0a4b5e94` |
| Fallout Rate | `0aa7c57c12944ad78738aa3f6c6155a9` |
| Origination Rate | `21e95686d6af40faba7a662e0751c44d` |

To extract the underlying feature service URL from any web map, query:
```
https://www.arcgis.com/sharing/rest/content/items/{WEB_MAP_ID}/data?f=json
```
Parse the JSON response to find `operationalLayers[].url` for the feature service endpoint.

### 8.2 Milwaukee County Medical Examiner Public Data

The Medical Examiner's office publishes real-time death investigation data [6], which is the primary source for overdose fatality tracking.

| Property | Value |
| :--- | :--- |
| ArcGIS Dashboard | `https://www.arcgis.com/apps/dashboards/d38daec26a3b4acb8c63867bb1e05cfc` |
| Map Service | `https://lio.milwaukeecountywi.gov/arcgis/rest/services/MedicalExaminer/PublicDataAccess/MapServer` |
| County Open Data | `https://data.county.milwaukee.gov/datasets/medical-examiner-public-access` |

### 8.3 Milwaukee County Overdose Dashboard

Milwaukee County launched a comprehensive Overdose Dashboard in 2025 [7], tracking both fatal (Medical Examiner) and nonfatal (EMS) overdose events with geographic distribution, time trends, and demographics.

| Property | Value |
| :--- | :--- |
| Power BI Dashboard | `https://app.powerbi.com/view?r=eyJrIjoiN2RhYjQ1ZTItNzA2NC00OTliLWI0NDItNDI4NmU1YTE3M2YzIiwidCI6ImJiMWI0YjU2LTQ4N2EtNGIyMy04YTI0LWEzYWVmNjVlMTFmZiIsImMiOjF9` |
| Source Page | `https://county.milwaukee.gov/EN/Office-of-Emergency-Management/EMS/Data-Analytics/Overdose` |

### 8.4 Health Compass Milwaukee

Health Compass Milwaukee [8] provides downloadable health indicator data at the ZIP code and neighborhood level, covering topics such as lead poisoning, infant mortality, chronic disease prevalence, and social determinants of health.

| Property | Value |
| :--- | :--- |
| Data Download | `https://healthcompassmilwaukee.org/download` |
| Formats | Excel, CSV |
| Topics | Asthma, obesity, mental health, lead poisoning, infant mortality, chronic disease, etc. |

### 8.5 City Health Dashboard (National)

The City Health Dashboard [9] provides 35+ standardized health metrics for Milwaukee at the city and census tract level, enabling comparison with other U.S. cities.

| Property | Value |
| :--- | :--- |
| Milwaukee Overview | `https://www.cityhealthdashboard.com/WI/Milwaukee/city-overview` |
| Metrics | Frequent mental distress, physical distress, high blood pressure, diabetes, firearm homicides, opioid deaths, etc. |

---

## 9. Suggested Dashboard Architecture

### 9.1 Recommended Tab Structure

Based on the Kensington Dashboard model, the Milwaukee dashboard should have the following tabs:

| Tab | Primary Data Sources | Key Charts |
| :--- | :--- | :--- |
| **Overview** | Neighborhoods GeoJSON, MPROP, Census | Interactive neighborhood map with summary indicators |
| **Public Safety** | WIBR, Traffic Crashes, Dispatch Calls | Crime trend line chart, crime type bar chart, heat map |
| **Quality of Life** | 311 Calls, Vacant Buildings, Liquor Licenses | Service request category breakdown, vacancy map |
| **Community** | Libraries, Parks, Schools, Transit | Community asset map, accessibility analysis |
| **Wellness** | MKE Indicators, Medical Examiner, Health Compass | Health indicator choropleth maps, overdose trends |
| **Housing** | MPROP, Building Permits, Property Sales, Foreclosures | Assessed value trends, permit activity, sales volume |

### 9.2 Technical Stack Recommendations

The application should use the following approach for data integration:

**Data Ingestion:** Implement a scheduled job to fetch daily CSV updates for WIBR crime data and 311 service requests. Store records in a spatial database (PostGIS or SQLite with SpatiaLite) to enable efficient neighborhood-level aggregation via point-in-polygon spatial joins against the neighborhood boundaries.

**Esri REST Integration:** For map layers (neighborhoods, police districts, parks, schools), query the ArcGIS REST endpoints with `f=geojson` and `outSR=4326` parameters. Cache responses locally since these layers change infrequently.

**Frontend Mapping:** Use Mapbox GL JS, Leaflet, or deck.gl for rendering the interactive maps. The neighborhood GeoJSON can be used as the base choropleth layer, with data-driven styling based on aggregated metrics.

**Data Normalization:** When comparing neighborhoods, normalize metrics per capita (using population from MKE Indicators) or per square mile to ensure fair comparisons between neighborhoods of different sizes and populations.

---

## 10. Complete API Quick Reference

### CSV Data Endpoints (Direct Download)

| Dataset | URL |
| :--- | :--- |
| WIBR Crime (Current) | `https://data.milwaukee.gov/dataset/e5feaad3-ee73-418c-b65d-ef810c199390/resource/87843297-a6fa-46d4-ba5d-cb342fb2d3bb/download/wibr.csv` |
| WIBR Crime (Historical) | `https://data.milwaukee.gov/dataset/5a537f5c-10d7-40a2-9b93-3527a4c89fbd/resource/395db729-a30a-4e53-ab66-faeb5e1899c8/download/wibrarchive.csv` |
| Traffic Crashes | `https://data.milwaukee.gov/dataset/5fafe01d-dc55-4a41-8760-8ae52f7855f1/resource/8fffaa3a-b500-4561-8898-78a424bdacee/download/trafficaccident.csv` |
| 311 Calls (Current) | `https://data.milwaukee.gov/dataset/a418ffb4-ce90-4a11-a489-d256a3e68a8b/resource/bf2b508a-5bfa-49da-8846-d87ffeee020a/download/callcenterdatacurrent.csv` |
| 311 Calls (Historical) | `https://data.milwaukee.gov/dataset/16174983-470a-46c1-a925-d4b7ed28cff9/resource/abdfe983-e856-40cd-bee2-85e78454344a/download/callcenterdatahistorical.csv` |
| Vacant Buildings | `https://data.milwaukee.gov/dataset/a9d52246-c06e-4ec2-a58e-a53ea0a72ded/resource/46dca88b-fec0-48f1-bda6-7296249ea61f/download/accelavacantbuilding.csv` |
| MPROP | `https://data.milwaukee.gov/dataset/562ab824-48a5-42cd-b714-87e205e489ba/resource/0a2c7f31-cd15-4151-8222-09dd57d5f16d/download/mprop.csv` |
| MAI | `https://data.milwaukee.gov/dataset/566af1a6-0499-4766-a89e-2f2a4b4d6e2d/resource/9f905487-720e-4f30-ae70-b5ec8a2a65a1/download/mai.csv` |
| Building Permits | `https://data.milwaukee.gov/dataset/9bada2e0-fad5-4545-8674-1b2c8c4e9f2f/resource/828e9630-d7cb-42e4-960e-964eae916397/download/buildingpermits.csv` |
| EMS Calls | `https://data.milwaukee.gov/dataset/1a8bef50-1253-45f0-8a4e-86f7bf515240/resource/06fd2a64-4348-461a-bda4-5e09b2500615/download/mfdopendataems.csv` |
| MFD Fire Calls | `https://data.milwaukee.gov/dataset/8735b4c2-4298-44d0-84c2-b734be52e30d/resource/cdf51c45-5fe3-415e-a08c-14ed134dcb64/download/mfdopendatafire.csv` |
| Liquor Licenses | `https://data.milwaukee.gov/dataset/1aba8821-f5f6-4031-b469-5c39c90e99c7/resource/45c027b5-fa66-4de2-aa7e-d9314292093d/download/liquorlicenses.csv` |
| Libraries | `https://data.milwaukee.gov/dataset/1b984aba-5cc1-47e3-8c64-999b6d26ceb6/resource/0590052a-6dd5-4cc1-a473-fd60eb00402b/download/librarylocations.csv` |
| Medication Drop Boxes | `https://data.milwaukee.gov/dataset/67fe8a8a-6c1e-4ee2-acb4-254ad5a791c8/resource/737fc626-f1bd-4c8c-b5d5-3d449a47f602/download/countywide-dropboxes-envelops.csv` |
| Brownfields | `https://data.milwaukee.gov/dataset/c9e9e5e1-eee6-4889-a0a4-94673bef1287/resource/ce5cfcb9-0263-4f32-966b-765cf861f5ad/download/environmentaldcd.csv` |

### Esri REST Feature Service Endpoints

| Layer | Endpoint |
| :--- | :--- |
| Neighborhoods | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/4` |
| NSP Areas | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/21` |
| Corporate Boundary | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/reference/reference_map/MapServer/7` |
| Police Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_geography/MapServer/2` |
| Police Squad Areas | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_geography/MapServer/1` |
| Police Stations | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_stations/MapServer/0` |
| Firehouses | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MFD/MFD_RiskReduction/MapServer/0` |
| Monthly Crime | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/MPD/MPD_Monthly/MapServer` |
| Libraries | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/AGO/LibraryServices/MapServer/0` |
| Parks | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/16` |
| Schools | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/18` |
| Parcels/MPROP | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer` |
| Zoning | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11` |
| Liquor Licenses | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/regulation/license/MapServer/0` |
| Election Boundaries | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/election/election_boundaries/MapServer` |
| DPW Forestry | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_forestry/MapServer` |
| DPW Operations | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Operations/MapServer` |
| DPW Sanitation | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Sanitation/MapServer` |
| Medical Examiner | `https://lio.milwaukeecountywi.gov/arcgis/rest/services/MedicalExaminer/PublicDataAccess/MapServer` |

---

## References

[1] Philadelphia Kensington Dashboard. https://experience.arcgis.com/experience/0e59ffc62b32428d8014b80e17ae3475

[2] City of Milwaukee Open Data Portal. "Neighborhoods." https://data.milwaukee.gov/dataset/neighborhoods

[3] City of Milwaukee Open Data Portal. https://data.milwaukee.gov/

[4] Milwaukee County Open Data Portal. https://data.county.milwaukee.gov/

[5] City of Milwaukee Department of City Development. "MKE Indicators." https://experience.arcgis.com/experience/3577f024bc50474f808cb7b62d8b765a

[6] Milwaukee County Medical Examiner. "Public Data." https://county.milwaukee.gov/EN/Medical-Examiner/Public-Data

[7] Milwaukee County Office of Emergency Management. "Overdose Dashboard." https://county.milwaukee.gov/EN/Office-of-Emergency-Management/EMS/Data-Analytics/Overdose

[8] Health Compass Milwaukee. https://healthcompassmilwaukee.org/

[9] City Health Dashboard. "Milwaukee, WI." https://www.cityhealthdashboard.com/WI/Milwaukee/city-overview
