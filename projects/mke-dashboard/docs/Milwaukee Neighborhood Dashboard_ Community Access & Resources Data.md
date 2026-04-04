# Milwaukee Neighborhood Dashboard: Community Access & Resources Data
**Author:** Manus AI

**Purpose:** This document provides a comprehensive data architecture guide for building a **Community Access & Resources** tab within a Milwaukee neighborhood dashboard application. It details the data sources, API endpoints, and geographic layers needed to track food deserts, food banks, libraries, public WiFi, and digital equity.

---

## 1. Food Access & Food Deserts

Understanding where residents have access to fresh, healthy food is a critical component of neighborhood wellness. Milwaukee has several datasets that map food deserts and food insecurity.

### 1.1 USDA Food Access Research Atlas
The USDA Economic Research Service provides the definitive national dataset on food access, identifying census tracts that are both low-income and low-access (LILA) [1].

*   **Data Format:** Downloadable Excel spreadsheet (updated periodically, latest is 2019).
*   **Key Metrics:** Population beyond 0.5 miles and 1 mile from a supermarket.
*   **Milwaukee Context:** Filter the national dataset by State FIPS `55` (Wisconsin) and County FIPS `079` (Milwaukee County).
*   **ArcGIS Layer:** The City of Milwaukee has published this data as a feature service: `https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/FoodAccess_2019/FeatureServer` [2].

### 1.2 Milwaukee Fresh Food Access Report
The City of Milwaukee Department of City Development (DCD) tracks grocery store openings and closings to update the local food access map [3].
*   **Key Finding (2023):** 79% of Milwaukee's population lives within 1 mile of a grocery store, leaving 21% (approx. 118,900 people) in areas with limited access.
*   **Usage:** The dashboard should track the net gain/loss of grocery stores and the resulting impact on neighborhood service areas.

### 1.3 Food Insecurity Prevalence
Milwaukee County tracks food insecurity rates through survey data, mapping the percentage of residents who report that their food "always/usually/sometimes did not last, and they didn't have money to get more."
*   **ArcGIS Layer (2023):** `https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/2023_Milwaukee_Food_Insecurity_Prevalence/FeatureServer` [4].

---

## 2. Emergency Food Resources (Food Banks & Pantries)

For residents facing food insecurity, mapping emergency food resources is essential.

### 2.1 Hunger Task Force
The Hunger Task Force is Milwaukee's Free & Local food bank, supplying a network of pantries, meal sites, and shelters [5].
*   **Emergency Food Map:** They maintain a daily-updated map of confirmed, trusted sites that provide food safely and reliably.
*   **Data Types:** Public senior Stockbox sites, school meal sites, and emergency food pantries.
*   **Mobile Market:** A grocery store on wheels that travels to neighborhoods with limited access to fresh foods.

### 2.2 Feeding America Eastern Wisconsin
Feeding America operates a major campus in Milwaukee (1700 W. Fond du Lac Ave) and provides a pantry locator tool for the region [6].

### 2.3 2-1-1 Wisconsin
The most reliable real-time API for social services, including food pantries, is the 2-1-1 system (often powered by platforms like findhelp.org). The dashboard can integrate this to show currently open pantries near a specific neighborhood.

---

## 3. Libraries, Public WiFi, & Digital Equity

Access to information and the internet is a key social determinant of health and economic opportunity.

### 3.1 Milwaukee Public Libraries (MPL)
The Milwaukee Public Library system operates 13 branch libraries and a Central Library, all providing free public WiFi and computer access [7].

*   **Data Endpoint (CKAN):** `https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=0590052a-6dd5-4cc1-a473-fd60eb00402b` [8]
*   **Key Fields:** `Branch Name`, `Address`, `Latitude`, `Longitude`, and daily hours of operation.
*   **ArcGIS Layer:** `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/AGO/LibraryServices/MapServer/0`

### 3.2 Digital Equity & Broadband Access
Digital redlining and broadband deserts disproportionately affect central city neighborhoods.

*   **Households with Broadband Internet (2024):** ArcGIS Feature Service tracking internet adoption by census tract.
    *   `https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/2024_Milwaukee_County_Households_with_Broadband_Internet/FeatureServer` [9]
*   **Households without a Vehicle (2024):** A critical metric for understanding the impact of food deserts, as lack of transit compounds lack of nearby grocery stores.
    *   `https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/2024_Milwaukee_County_Households_without_Vehicle/FeatureServer` [10]
*   **Public Park WiFi:** The City of Milwaukee provides open-access wireless internet in 10 parks located in underserved communities (5 am – 9 pm) [11].

---

## 4. Community Centers & Recreation

Physical spaces for community gathering and recreation are vital neighborhood assets.

### 4.1 Milwaukee County Parks
Milwaukee County owns and operates over 15,000 acres of parkland, including parks, parkways, golf courses, and community centers [12].
*   **ArcGIS Layer (City MPROP):** `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/16` (Parcels identified as parks/parkways based on land use codes 8870, 8871, 8860).

### 4.2 Public Schools & Daycares
Schools often serve as community hubs and emergency meal sites.
*   **Schools (Elementary/Secondary):** `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/18`
*   **Child Day Care Centers:** `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/19`

---

## 5. Recommended CopilotKit Tools for Community Access

To make this data conversational via CopilotKit, register the following frontend tools:

```typescript
useFrontendTool({
  name: "find_nearest_food_pantry",
  description: "Locate the nearest emergency food pantry or Hunger Task Force site for a given neighborhood.",
  parameters: [
    { name: "neighborhood_name", type: "string", description: "Name of the Milwaukee neighborhood" }
  ],
  handler: async ({ neighborhood_name }) => {
    // 1. Geocode neighborhood center
    // 2. Query 2-1-1 API or local pantry database
    // 3. Render a map marker and details card
  }
});

useFrontendTool({
  name: "analyze_digital_equity",
  description: "Compare broadband access rates and public WiFi availability (libraries/parks) for a neighborhood.",
  parameters: [
    { name: "neighborhood_name", type: "string", description: "Name of the Milwaukee neighborhood" }
  ],
  handler: async ({ neighborhood_name }) => {
    // 1. Query the Broadband Internet ArcGIS Feature Service
    // 2. Query the MPL Library locations API
    // 3. Render a Bento-style summary card with charts
  }
});
```

---

## References

[1] USDA Economic Research Service. "Food Access Research Atlas." https://www.ers.usda.gov/data-products/food-access-research-atlas/

[2] ArcGIS Online. "2019 Milwaukee Access to Grocery Stores." https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/FoodAccess_2019/FeatureServer

[3] City of Milwaukee. "Milwaukee Fresh Food Access 2023 Map Updates." https://city.milwaukee.gov/City-Forms/2023FreshFoodAccessUpdate_FINAL.pdf

[4] ArcGIS Online. "2023 Milwaukee County Food Insecurity Prevalence." https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/2023_Milwaukee_Food_Insecurity_Prevalence/FeatureServer

[5] Hunger Task Force. "Emergency Food." https://www.hungertaskforce.org/get-help/emergency-food/

[6] Feeding America Eastern Wisconsin. "Find a Pantry." https://feedingamericawi.org/find-a-pantry/

[7] Milwaukee Public Library. "Computers & Internet." https://www.mpl.org/library/computers_internet/

[8] City of Milwaukee Open Data Portal. "Libraries." https://data.milwaukee.gov/dataset/libraries

[9] ArcGIS Online. "2024 Milwaukee County Households with Broadband Internet." https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/2024_Milwaukee_County_Households_with_Broadband_Internet/FeatureServer

[10] ArcGIS Online. "2024 Milwaukee County Households without Vehicle." https://services5.arcgis.com/3kr3fkJcIf6EOY6g/arcgis/rest/services/2024_Milwaukee_County_Households_without_Vehicle/FeatureServer

[11] City of Milwaukee. "City Unveils Open-Access Wireless Internet in Ten Milwaukee Parks." https://city.milwaukee.gov/mayorbarrett/News/2021-News/City-Unveils-Open-Access-Wireless-Internet-in-Ten-Milwaukee-Parks

[12] Milwaukee County Parks. "GIS Data Downloads." https://data-mclio.hub.arcgis.com/datasets/MCLIO::milwaukee-county-parks-
