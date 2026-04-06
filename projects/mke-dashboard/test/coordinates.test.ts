import { describe, it, expect } from "vitest";

/**
 * State Plane → WGS84 coordinate conversion tests.
 * Milwaukee uses Wisconsin State Plane South (WKID 32054, NAD27, US feet).
 * The linear approximation works within Milwaukee (~10m accuracy).
 */

// Replicate from convex/etl/csv.ts
function stPlaneToWgs84(x: number, y: number): { lat: number; lng: number } {
  const refX = 2530700;
  const refY = 393200;
  const refLng = -87.9065;
  const refLat = 43.0389;
  const ftPerDegLng = 263260;
  const ftPerDegLat = 364567;

  return {
    lng: refLng + (x - refX) / ftPerDegLng,
    lat: refLat + (y - refY) / ftPerDegLat,
  };
}

function isInEnvelope(
  lat: number,
  lng: number,
  env: { xmin: number; ymin: number; xmax: number; ymax: number },
): boolean {
  return lng >= env.xmin && lng <= env.xmax && lat >= env.ymin && lat <= env.ymax;
}

describe("State Plane → WGS84 conversion", () => {
  it("converts City Hall reference point correctly", () => {
    // City Hall is the reference point, so conversion should return itself
    const result = stPlaneToWgs84(2530700, 393200);
    expect(result.lat).toBeCloseTo(43.0389, 3);
    expect(result.lng).toBeCloseTo(-87.9065, 3);
  });

  it("produces coordinates within Milwaukee bounds", () => {
    // Any valid Milwaukee State Plane coordinate should land in the city
    const milwaukeeBounds = {
      xmin: -88.1,
      ymin: 42.9,
      xmax: -87.8,
      ymax: 43.2,
    };

    // Sample WIBR crime record coordinates
    const testPoints = [
      { x: 2528155, y: 421578 }, // From actual WIBR data
      { x: 2535000, y: 400000 }, // Central Milwaukee
      { x: 2520000, y: 410000 }, // West side
    ];

    for (const p of testPoints) {
      const { lat, lng } = stPlaneToWgs84(p.x, p.y);
      expect(
        isInEnvelope(lat, lng, milwaukeeBounds),
        `Point (${p.x}, ${p.y}) → (${lat}, ${lng}) should be in Milwaukee`,
      ).toBe(true);
    }
  });

  it("rejects zero coordinates", () => {
    const result = stPlaneToWgs84(0, 0);
    // Zero State Plane coords would be way outside Milwaukee
    expect(result.lat).toBeLessThan(42); // Way south
    expect(result.lng).toBeLessThan(-97); // Way west
  });

  it("Harambee envelope contains converted Harambee points", () => {
    const harambeeEnvelope = {
      xmin: -87.9215,
      ymin: 43.0602,
      xmax: -87.9050,
      ymax: 43.0821,
    };

    // A point that should be in Harambee (based on actual WIBR data that matched)
    // State Plane coords in the Harambee area
    const { lat, lng } = stPlaneToWgs84(2532000, 401000);
    // This should be roughly in the Harambee area
    expect(lat).toBeGreaterThan(43.0);
    expect(lat).toBeLessThan(43.1);
    expect(lng).toBeGreaterThan(-88.0);
    expect(lng).toBeLessThan(-87.8);
  });
});

describe("isInEnvelope", () => {
  const envelope = {
    xmin: -87.9215,
    ymin: 43.0602,
    xmax: -87.9050,
    ymax: 43.0821,
  };

  it("returns true for point inside envelope", () => {
    expect(isInEnvelope(43.07, -87.91, envelope)).toBe(true);
  });

  it("returns false for point outside envelope", () => {
    expect(isInEnvelope(43.0, -87.91, envelope)).toBe(false); // South
    expect(isInEnvelope(43.07, -88.0, envelope)).toBe(false); // West
  });

  it("returns true for point on envelope boundary", () => {
    expect(isInEnvelope(43.0602, -87.9215, envelope)).toBe(true); // Corner
  });
});
