# Milwaukee Neighborhood Dashboard — Data Source Validation Report

**Date:** 2026-04-04
**Researcher:** Product Discovery Agent
**Purpose:** Validate ArcGIS endpoints, test MPROP queries, document available data sources

---

## Executive Summary

### What Works
- **MPROP ArcGIS** layer is fully accessible with 159,983 parcels, 103 fields, and supports both JSON and GeoJSON output
- **CORS is wide open** (`Access-Control-Allow-Origin: *`) on all Milwaukee ArcGIS endpoints — client-side fetching works
- **Neighborhood boundaries** (190 polygons), **foreclosed properties** (1,156 total), **MPD crime data** (10 crime type layers), and **government-owned properties** (4 layers by jurisdiction) are all live and queryable
- **data.milwaukee.gov** has 253 datasets including dedicated tax delinquent, crime, and property files
- **GeoJSON output** is supported natively via `f=geojson` parameter (returns WGS84/EPSG:4326)

### What Doesn't Work
- **MPROP sentinel values are a blocker:** TAX_DELQ, RAZE_STATUS, and BI_VIOL fields in the ArcGIS layer use sentinel values (99999, 9, "XXXX") meaning "not applicable" — these fields are NOT populated with real data in the ArcGIS service
- **DPW/MapServer** and **StrongNeighborhood/MapServer** (original URLs from docs) return 404 — the actual service paths are different (see corrected URLs below)
- **Paving program data** is stale (2019-2021 only)
- **HOLC Redlining data** from both ArcGIS Living Atlas and University of Richmond need alternative sourcing — the ArcGIS `Redlining_Grade` service returns "Invalid URL" and Richmond DSL is now a SPA that blocks direct GeoJSON downloads

### Surprises
1. **MPROP on ArcGIS has 200,000 maxRecordCount** — generous, but spatial queries with geometry will still need pagination
2. **Spatial reference is WKID 32054** (Wisconsin State Plane South NAD27) — NOT WGS84. Must use `f=geojson` to get auto-reprojected coordinates, or reproject on the server side
3. **Vacant property count = 150,267** using `LAND_USE >= 8800 AND LAND_USE < 8900` — this seems extremely high and needs investigation (may include all parcels without land use assigned)
4. **Tax delinquent data exists as a separate dataset** on data.milwaukee.gov (monthly XLSX from City Treasurer) — this is the authoritative source, not MPROP

---

## Endpoint-by-Endpoint Results

| # | Endpoint | Status | Format | GeoJSON | CORS | Max Records | Notes |
|---|----------|--------|--------|---------|------|-------------|-------|
| 1 | **MPROP** (`property/parcels_mprop/MapServer/2`) | LIVE | JSON, GeoJSON, PBF | Yes | `*` | 200,000 | 159,983 parcels, 103 fields, esriGeometryPolygon |
| 2 | **Foreclosed Properties** (`property/foreclosed_properties/MapServer`) | LIVE | JSON, GeoJSON, PBF | Yes | `*` | 2,000 | Layer 13: city-owned (928), Layer 23: bank-owned (228) |
| 3 | **MPD Crime** (`MPD/MPD_Monthly/MapServer`) | LIVE | JSON | Yes | `*` | — | 10 layers: Homicide(4), Arson, Sex Offense, Criminal Damage, Robbery, Burglary, Theft, Vehicle Theft, Locked Vehicle, Assault |
| 4 | **Neighborhoods** (`planning/special_districts/MapServer/4`) | LIVE | JSON, GeoJSON | Yes | `*` | — | 190 neighborhood polygons, fields: OBJECTID, NEIGHBORHD, SHAPE |
| 5 | **DPW/MapServer** (original URL) | **404** | — | — | — | — | Service moved; see corrected paths below |
| 5a | **DPW Forestry** (`DPW/DPW_forestry/MapServer`) | LIVE | JSON | Yes | `*` | — | Tree/forestry data |
| 5b | **DPW Operations** (`DPW/DPW_Operations/MapServer`) | LIVE | JSON | Yes | `*` | — | Operational areas |
| 5c | **DPW Sanitation** (`DPW/DPW_Sanitation/MapServer`) | LIVE | JSON | Yes | `*` | — | Garbage/recycling routes |
| 5d | **DPW Streetcar** (`DPW/DPW_streetcar/MapServer`) | LIVE | JSON | Yes | `*` | — | Hop route and stops |
| 5e | **Parking Meters** (`DPW/ParkingMeters/MapServer`) | LIVE | JSON | Yes | `*` | — | Meter locations |
| 5f | **Paving Program** (`DPW/paving_program/MapServer`) | LIVE | JSON, GeoJSON, PBF | Yes | `*` | 2,000 | **STALE:** Only 2019-2021 data |
| 6 | **StrongNeighborhood/MapServer** (original URL) | **404** | — | — | — | — | Corrected path below |
| 6a | **Strong Neighborhoods** (`StrongNeighborhood/StrongNeighborhood/MapServer`) | LIVE | JSON, GeoJSON, PBF | Yes | `*` | — | Layer 0: Vacant Buildings (1,552), Layer 1: City-owned RE inventory |
| 7 | **Government-Owned** (`property/govt_owned/MapServer`) | LIVE | JSON | Yes | `*` | — | 4 layers: Municipal(5), County(6), State(7), Federal(8) |
| 8 | **Redlining (ArcGIS Living Atlas)** | **FAILED** | — | — | — | — | `Redlining_Grade/FeatureServer` returns "Invalid URL" |
| 8a | **Redlining (Richmond DSL)** | **BLOCKED** | — | — | — | — | SPA intercepts all requests; no direct GeoJSON download |
| 9 | **data.milwaukee.gov** | LIVE | CKAN API | — | — | — | 253 datasets, CKAN v3 API |

---

## MPROP Query Test Results

### Queries That Work

| Query | WHERE Clause | Count | Notes |
|-------|-------------|-------|-------|
| Total parcels | `1=1` | 159,983 | Full dataset |
| Vacant land (by land use) | `LAND_USE >= 8800 AND LAND_USE < 8900` | 150,267 | **Suspiciously high** — needs investigation |
| Owner-occupied | `OWN_OCPD = 'O'` | 97,227 | ~60.8% of all parcels |
| Sample features | `LAND_USE >= 8800 AND LAND_USE < 8900` (3 records) | 3 | Returns TAXKEY, LAND_USE, C_A_TOTAL, OWNER_NAME_1 correctly |

### Queries That Return Misleading Results

| Query | WHERE Clause | Count | Issue |
|-------|-------------|-------|-------|
| Tax delinquent | `TAX_DELQ > 0` | 159,983 | **All records** — sentinel value 99999 means "not applicable" |
| Raze orders | `RAZE_STATUS > 0` | 159,983 | **All records** — sentinel value 9 means "not applicable" |
| Tax current | `TAX_DELQ = 0` | 0 | Zero records have TAX_DELQ = 0 |
| No raze order | `RAZE_STATUS = 0` | 0 | Zero records have RAZE_STATUS = 0 |

### Queries That Error

| Query | WHERE Clause | Error |
|-------|-------------|-------|
| Raze (string comparison) | `RAZE_STATUS = '1'` | 400: Unable to complete operation |
| BI_VIOL | `BI_VIOL > 0` | 400: Unable to complete operation (field is String type) |
| RAZE_STATUS (NOT IN) | `RAZE_STATUS NOT IN ('0', '')` | 400: Unable to complete operation |

### Field Type Discovery

| Field | Documented Type | Actual Type | Sentinel Value | Real Data? |
|-------|----------------|-------------|----------------|------------|
| `TAX_DELQ` | N(5) | esriFieldTypeInteger | 99999 | **NO** — all 159,983 records = 99999 |
| `RAZE_STATUS` | A(1) | esriFieldTypeInteger | 9 | **NO** — all 159,983 records = 9 |
| `BI_VIOL` | T(4) | esriFieldTypeString | "XXXX" | **NO** — all records = "XXXX" |

**Critical finding:** TAX_DELQ, RAZE_STATUS, and BI_VIOL are populated with sentinel/placeholder values in the ArcGIS MPROP layer. The real data for these metrics must come from alternative sources (see recommendations).

---

## CORS / Auth / Rate Limiting Findings

| Property | Value | Impact |
|----------|-------|--------|
| **CORS** | `Access-Control-Allow-Origin: *` on ALL tested endpoints | Client-side fetching works — no proxy needed |
| **Authentication** | None required | Public access, no API keys |
| **Rate Limiting** | None observed | No `X-RateLimit` headers; test judiciously in production |
| **Content-Type** | `application/json; charset=UTF-8` | Standard JSON responses |
| **HTTPS** | Yes, all endpoints | TLS required |
| **Max Record Count** | 200,000 (MPROP), 2,000 (others) | MPROP is generous; others need pagination for large queries |
| **Spatial Reference** | WKID 32054 (Wisconsin State Plane) | Use `f=geojson` for auto-reprojection to WGS84, or `outSR=4326` |
| **GeoJSON Support** | Native via `f=geojson` parameter | Returns valid GeoJSON FeatureCollection in WGS84 |
| **ExceededTransferLimit** | `true` when result count > requested | Must check this flag and paginate with `resultOffset` |

---

## Data Freshness Observations

| Source | Freshness | Evidence |
|--------|-----------|---------|
| **MPROP (ArcGIS)** | Current (2025 assessment year) | `YR_ASSMT = 2025` in sample records |
| **MPROP (CSV)** | Daily updates | data.milwaukee.gov description |
| **Foreclosed Properties** | Nightly refresh | Per service metadata |
| **MPD Crime** | Monthly | "MPD_Monthly" — sample records from March/April 2026 |
| **Neighborhoods** | Stable | DCD boundaries, rarely change |
| **Paving Program** | **STALE** | Only 2019-2021 layers — 5+ years old |
| **Strong Neighborhoods** | Unknown | 1,552 vacant buildings — unclear update frequency |
| **Tax Delinquent (Treasurer)** | Monthly | Last updated March 5, 2026 |

---

## Alternative Data Sources for Missing Metrics

### Tax Delinquency (NOT in ArcGIS MPROP)
- **Source:** `data.milwaukee.gov` — "Delinquent Real Estate Tax Accounts"
- **Format:** XLSX, monthly updates from City Treasurer
- **Join key:** Tax account number (map to TAXKEY)
- **URL:** https://data.milwaukee.gov/dataset/f376a61a-b279-4ff5-b6da-776a3df14ca0

### Raze Orders / Building Violations (NOT in ArcGIS MPROP)
- **Strong Neighborhoods service** has Vacant Buildings (1,552) — partial coverage
- DNS code violations require partnership (not publicly available as structured data)
- MPROP CSV from data.milwaukee.gov may have different values than ArcGIS — worth downloading and checking

### HOLC Redlining Data (ArcGIS source failed)
Options:
1. **University of Richmond API** — the SPA may have an internal API; inspect network requests on the live site
2. **Pre-downloaded GeoJSON** — many projects bundle the Richmond DSL data as static files
3. **ArcGIS Hub search** — search for "HOLC" or "redlining" datasets uploaded by other organizations
4. **Direct contact** — Richmond DSL team may provide bulk download access

### Crime Data (Current Year)
- **ArcGIS MPD_Monthly** — live, 10 crime layers, current month
- **data.milwaukee.gov** — "WIBR Crime Data (Current)" CSV for year-to-date
- **data.milwaukee.gov** — "WIBR Crime Data (Historical)" CSV for prior years

---

## Corrected Service URLs

The following URLs should be used instead of what was documented:

| Service | Documented URL | Corrected URL |
|---------|---------------|---------------|
| DPW | `DPW/MapServer` | Individual services: `DPW/DPW_forestry/MapServer`, `DPW/DPW_Operations/MapServer`, `DPW/DPW_Sanitation/MapServer`, `DPW/DPW_streetcar/MapServer`, `DPW/ParkingMeters/MapServer`, `DPW/paving_program/MapServer` |
| Strong Neighborhoods | `StrongNeighborhood/MapServer` | `StrongNeighborhood/StrongNeighborhood/MapServer` |

Base URL for all: `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/`

ArcGIS REST root has 21 folders: Accela, AGO, assessor, BikeMap, cadastral, census, DPW, ECO, election, Locator, LocatorV11, MFD, Miscellaneous, MPD, MPDTritech, NG911, planning, property, reference, regulation, StrongNeighborhood, Utilities

---

## Recommendations for Architecture

1. **Use `f=geojson` for all map rendering** — eliminates the need to reproject from WKID 32054. MapLibre expects WGS84.

2. **Build a data pipeline for tax delinquency** — the ArcGIS MPROP layer does NOT have this data. Download the Treasurer's XLSX monthly and join by TAXKEY. This is a server-side ETL task.

3. **MPROP vacant land query needs refinement** — 150,267 "vacant" properties is almost all parcels. The correct approach is likely `C_A_CLASS IN ('2','5') AND C_A_IMPRV = 0` (no improvements = truly vacant land), not the LAND_USE range.

4. **Cache neighborhood boundaries** — 190 polygons that rarely change. Fetch once, store in the app.

5. **Implement pagination** — check `exceededTransferLimit` flag in responses and use `resultOffset` for large queries.

6. **No proxy needed** — CORS `*` means direct browser-to-ArcGIS requests work. But consider a thin API layer anyway for: caching, rate limiting protection, joining MPROP with Treasurer data, and aggregation.

7. **Crime data is point-based** — use spatial intersection with neighborhood polygons to aggregate by neighborhood. The MPD layers include ALD, TRACT, WARD, ZIP fields for non-spatial filtering.

8. **Redlining data needs a workaround** — bundle a static GeoJSON file for Milwaukee HOLC zones rather than depending on a live API. This data is historical and never changes.

9. **data.milwaukee.gov uses CKAN API v3** — standard REST API for programmatic access to all 253 datasets. Good for supplementary data.

10. **Strong Neighborhoods has the best vacancy data** — 1,552 vacant buildings as point features, likely more accurate than MPROP land use filtering.
