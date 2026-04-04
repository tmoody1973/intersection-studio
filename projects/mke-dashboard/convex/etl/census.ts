/**
 * Census ACS 5-Year data helpers.
 * Fetches demographic data at the tract level for Milwaukee County.
 */

const CENSUS_BASE = "https://api.census.gov/data/2023/acs/acs5";
const STATE_FIPS = "55"; // Wisconsin
const COUNTY_FIPS = "079"; // Milwaukee County

// ACS variables we need
const VARIABLES = {
  population: "B01003_001E",
  medianIncome: "B19013_001E",
  povertyCount: "B17001_002E",
  medianHomeValue: "B25077_001E",
  unemployed: "B23025_005E",
  laborForce: "B23025_002E",
} as const;

interface TractData {
  tract: string;
  population: number;
  medianIncome: number | null;
  povertyCount: number;
  medianHomeValue: number | null;
  unemployed: number;
  laborForce: number;
}

/**
 * Fetch ACS data for all tracts in Milwaukee County.
 * Returns a map of tract FIPS code → data.
 */
export async function fetchAllTracts(): Promise<Map<string, TractData>> {
  const vars = Object.values(VARIABLES).join(",");
  const url = `${CENSUS_BASE}?get=${vars}&for=tract:*&in=state:${STATE_FIPS}+county:${COUNTY_FIPS}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census API failed: ${res.status}`);

  const data: string[][] = await res.json();
  const headers = data[0];
  const rows = data.slice(1);

  const tractMap = new Map<string, TractData>();

  for (const row of rows) {
    const tractFips = row[headers.indexOf("tract")];
    const pop = parseInt(row[headers.indexOf(VARIABLES.population)], 10);
    const income = parseInt(row[headers.indexOf(VARIABLES.medianIncome)], 10);
    const poverty = parseInt(row[headers.indexOf(VARIABLES.povertyCount)], 10);
    const homeValue = parseInt(row[headers.indexOf(VARIABLES.medianHomeValue)], 10);
    const unemployed = parseInt(row[headers.indexOf(VARIABLES.unemployed)], 10);
    const laborForce = parseInt(row[headers.indexOf(VARIABLES.laborForce)], 10);

    tractMap.set(tractFips, {
      tract: tractFips,
      population: isNaN(pop) ? 0 : pop,
      medianIncome: isNaN(income) || income < 0 ? null : income,
      povertyCount: isNaN(poverty) ? 0 : poverty,
      medianHomeValue: isNaN(homeValue) || homeValue < 0 ? null : homeValue,
      unemployed: isNaN(unemployed) ? 0 : unemployed,
      laborForce: isNaN(laborForce) ? 0 : laborForce,
    });
  }

  return tractMap;
}

export interface NeighborhoodDemographics {
  population: number;
  medianIncome: number | null;
  povertyRate: number | null;
  unemploymentRate: number | null;
  medianHomeValue: number | null;
}

/**
 * Aggregate Census data for a neighborhood's tracts.
 * Takes the census tract codes from the Convex neighborhood record
 * and computes weighted averages / sums.
 */
export function aggregateForNeighborhood(
  tractCodes: string[],
  allTracts: Map<string, TractData>,
): NeighborhoodDemographics {
  // Census tract codes in MPROP are short (e.g., "4500")
  // Census API uses full FIPS (e.g., "004500")
  // Try both formats
  const matchingTracts: TractData[] = [];

  for (const code of tractCodes) {
    // Pad to 6 digits for Census FIPS
    const padded = code.padStart(6, "0");
    const tract = allTracts.get(padded) ?? allTracts.get(code);
    if (tract) matchingTracts.push(tract);
  }

  if (matchingTracts.length === 0) {
    return {
      population: 0,
      medianIncome: null,
      povertyRate: null,
      unemploymentRate: null,
      medianHomeValue: null,
    };
  }

  const totalPop = matchingTracts.reduce((s, t) => s + t.population, 0);
  const totalPoverty = matchingTracts.reduce((s, t) => s + t.povertyCount, 0);
  const totalUnemployed = matchingTracts.reduce((s, t) => s + t.unemployed, 0);
  const totalLaborForce = matchingTracts.reduce((s, t) => s + t.laborForce, 0);

  // Weighted average for median income and home value
  const incomeTracts = matchingTracts.filter((t) => t.medianIncome !== null);
  const weightedIncome =
    incomeTracts.length > 0
      ? Math.round(
          incomeTracts.reduce(
            (s, t) => s + (t.medianIncome ?? 0) * t.population,
            0,
          ) / incomeTracts.reduce((s, t) => s + t.population, 0),
        )
      : null;

  const homeValueTracts = matchingTracts.filter(
    (t) => t.medianHomeValue !== null,
  );
  const weightedHomeValue =
    homeValueTracts.length > 0
      ? Math.round(
          homeValueTracts.reduce(
            (s, t) => s + (t.medianHomeValue ?? 0) * t.population,
            0,
          ) / homeValueTracts.reduce((s, t) => s + t.population, 0),
        )
      : null;

  return {
    population: totalPop,
    medianIncome: weightedIncome,
    povertyRate:
      totalPop > 0 ? Math.round((totalPoverty / totalPop) * 100) : null,
    unemploymentRate:
      totalLaborForce > 0
        ? Math.round((totalUnemployed / totalLaborForce) * 100)
        : null,
    medianHomeValue: weightedHomeValue,
  };
}
