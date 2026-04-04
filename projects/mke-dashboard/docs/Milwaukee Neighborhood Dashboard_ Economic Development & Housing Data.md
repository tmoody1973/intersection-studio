# Milwaukee Neighborhood Dashboard: Economic Development & Housing Data
**Author:** Manus AI

**Purpose:** This document provides a comprehensive data architecture guide specifically for building an **Economic Development & Housing** tab within a Milwaukee neighborhood dashboard application. It details the data sources, API endpoints, and geographic layers needed to track neighborhood investment, business growth, new construction, and housing affordability.

---

## 1. Key Economic Indicators & Data Sources

Milwaukee provides several high-quality datasets through its Open Data Portal [1] that can be aggregated to the neighborhood level to measure economic vitality.

### 1.1 Building Permits & New Construction
The **Residential and Commercial Permit Work Data** dataset [2] is updated monthly and contains all construction permits issued by the Department of Neighborhood Services (DNS).

*   **Data Endpoint:** `https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=828e9630-d7cb-42e4-960e-964eae916397`
*   **Key Fields:** 
    *   `Permit Type` (e.g., "New Construction", "Commercial Alteration")
    *   `Construction Total Cost` (dollar value of investment)
    *   `Dwelling units impact` (net new housing units)
    *   `Status`
*   **Usage:** Calculate total private investment dollars per neighborhood and track the pipeline of new housing units.

### 1.2 Property Sales & Real Estate Market
The **Property Sales Data** dataset [3] provides annual records of all arm's-length real estate transactions from 2002 to the present.

*   **Data Endpoint (2024):** `https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=01651dab-2be7-40c6-a9d6-31254fe02e29`
*   **Key Fields:** 
    *   `PropType` (Commercial, Residential, Condominium)
    *   `Sale_price`
    *   `Year_Built`
    *   `nbhd` (Neighborhood ID)
*   **Usage:** Track median sale prices, sales volume, and commercial real estate turnover by neighborhood.

### 1.3 Master Property File (MPROP)
The **Master Property File (MPROP)** [4] is a comprehensive table containing an assessment record for each of the approximately 160,000 properties in the city. It is updated daily.

*   **Data Endpoint:** `https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=0a2c7f31-cd15-4151-8222-09dd57d5f16d`
*   **Key Fields:** 93 fields including `C_A_TOTAL` (Current Assessed Total Value), `LAND_USE`, `OWNER_NAME_1`, and `ZONING`.
*   **Usage:** Determine the total assessed value of a neighborhood, identify major property owners, and analyze land use distribution.

### 1.4 Commercial Activity Proxies
While Milwaukee does not offer a single bulk API for all general business licenses, commercial activity can be tracked using proxy datasets:

*   **Liquor Licenses:** A daily-updated dataset of active retail, tavern, and restaurant licenses (`resource_id=45c027b5-fa66-4de2-aa7e-d9314292093d`) [5].
*   **Vacant Buildings:** A weekly-updated dataset from Accela tracking commercial and residential vacancies (`resource_id=46dca88b-fec0-48f1-bda6-7296249ea61f`) [6].
*   **Usage:** Map active commercial corridors and track the reduction of vacant storefronts over time.

---

## 2. Economic Development Zones (ArcGIS Layers)

The Department of City Development (DCD) maintains a comprehensive `planning/special_districts` MapServer that defines where public investment and incentives are targeted. These boundaries should be overlaid on the dashboard map to provide context for economic data.

| District Type | ArcGIS Layer ID | Description |
| :--- | :--- | :--- |
| **Tax Incremental Districts (TID)** | `MapServer/8` | Areas where property tax revenue growth is reinvested into local infrastructure [7]. |
| **Business Improvement Districts (BID)** | `MapServer/3` | Commercial corridors where businesses pay an assessment for shared services and marketing [8]. |
| **Targeted Investment Neighborhoods (TIN)** | `MapServer/13` | Neighborhoods targeted for intensive city housing and development resources. |
| **Opportunity Zones** | `MapServer/9` | Federal designation providing tax incentives for private investment in distressed communities [9]. |
| **Neighborhood Improvement Districts (NID)** | `MapServer/5` | Residential areas with special assessments for neighborhood improvements. |

*Base URL for all layers:* `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/{ID}`

### 2.1 TID Value History
To track the performance of Tax Incremental Districts, the **Tax Incremental District (TID) Value History** dataset [10] provides annual property value growth within each TIF district over time.

*   **Data Endpoint:** `https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=bbbcfd24-44c6-449a-8630-3de749110ba8`

---

## 3. Housing Affordability Context

When discussing economic development, housing affordability is a critical counter-metric. The dashboard should incorporate data from the **City of Milwaukee Housing Affordability Report 2024** [11]. 

This includes tracking the net increase in housing units against the loss of affordable units, ensuring that neighborhood investment does not lead to unmitigated displacement. The report is available as an ArcGIS Experience (ID: `486a3474247a4cfd8d3b2ed524fc0771`), and its underlying data layers can be integrated into the dashboard.

Additionally, the **MKE Indicators** dashboard [12] provides neighborhood-level data on:
*   Median Household Income
*   Poverty Rate
*   Unemployment Rate
*   Total Originations (mortgage lending)

---

## 4. Recommended CopilotKit Tools for Economic Data

To make this data conversational via CopilotKit [13], register the following frontend tools in your application:

```typescript
useFrontendTool({
  name: "analyze_neighborhood_investment",
  description: "Calculate total construction permit value and new housing units for a specific neighborhood over a time period.",
  parameters: [
    { name: "neighborhood_name", type: "string", description: "Name of the Milwaukee neighborhood" },
    { name: "year", type: "number", description: "Year to analyze (e.g., 2024)" }
  ],
  handler: async ({ neighborhood_name, year }) => {
    // 1. Fetch building permits from CKAN API
    // 2. Filter by neighborhood and year
    // 3. Sum 'Construction Total Cost' and 'Dwelling units impact'
    // 4. Render a summary card or bar chart
  }
});

useFrontendTool({
  name: "map_development_zones",
  description: "Display economic development zones (TID, BID, Opportunity Zones) on the map.",
  parameters: [
    { name: "zone_type", type: "string", description: "Type of zone: 'TID', 'BID', or 'OpportunityZone'" }
  ],
  handler: async ({ zone_type }) => {
    // Toggle the visibility of the corresponding ArcGIS MapServer layer
  }
});
```

---

## References

[1] City of Milwaukee Open Data Portal. https://data.milwaukee.gov/

[2] City of Milwaukee Open Data Portal. "Residential and Commercial Permit Work Data." https://data.milwaukee.gov/dataset/buildingpermits

[3] City of Milwaukee Open Data Portal. "Property Sales Data." https://data.milwaukee.gov/dataset/property-sales-data

[4] City of Milwaukee Open Data Portal. "Master Property File (MPROP)." https://data.milwaukee.gov/dataset/mprop

[5] City of Milwaukee Open Data Portal. "Liquor Licenses." https://data.milwaukee.gov/dataset/liquorlicenses

[6] City of Milwaukee Open Data Portal. "Vacant Buildings." https://data.milwaukee.gov/dataset/accelavacantbuilding

[7] City of Milwaukee. "Tax Incremental Financing." https://city.milwaukee.gov/DCD/BusinessToolbox/bids/TaxIncrementalFinancing

[8] City of Milwaukee Open Data Portal. "Business Improvement Districts (BID)." https://data.milwaukee.gov/dataset/business-improvement-districts-bid

[9] City of Milwaukee Open Data Portal. "Opportunity Zones." https://data.milwaukee.gov/dataset/opportunity-zones

[10] City of Milwaukee Open Data Portal. "Tax Incremental District (TID) Value History." https://data.milwaukee.gov/dataset/tax-incremental-district-value-history

[11] City of Milwaukee. "Housing Affordability Report 2024." https://experience.arcgis.com/experience/486a3474247a4cfd8d3b2ed524fc0771

[12] City of Milwaukee Department of City Development. "MKE Indicators." https://experience.arcgis.com/experience/3577f024bc50474f808cb7b62d8b765a

[13] CopilotKit. "The Agentic Framework for In-App AI Copilots." https://www.copilotkit.ai/
