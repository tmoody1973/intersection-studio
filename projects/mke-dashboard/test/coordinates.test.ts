import { describe, it, expect } from "vitest";
import { stPlaneToWgs84, isInEnvelope } from "../convex/etl/coordinates";

/**
 * State Plane → WGS84 coordinate conversion tests.
 * Milwaukee uses Wisconsin State Plane South (WKID 32054, NAD27, US feet).
 * The linear approximation works within Milwaukee (~10m accuracy).
 */

describe("State Plane → WGS84 conversion", () => {
  it("converts City Hall reference point correctly", () => {
    const result = stPlaneToWgs84(2530700, 393200);
    expect(result.lat).toBeCloseTo(43.0389, 3);
    expect(result.lng).toBeCloseTo(-87.9065, 3);
  });

  it("produces coordinates within Milwaukee bounds", () => {
    const milwaukeeBounds = {
      xmin: -88.1,
      ymin: 42.9,
      xmax: -87.8,
      ymax: 43.2,
    };

    const testPoints = [
      { x: 2528155, y: 421578 },
      { x: 2535000, y: 400000 },
      { x: 2520000, y: 410000 },
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
    expect(result.lat).toBeLessThan(42);
    expect(result.lng).toBeLessThan(-97);
  });

  it("Harambee envelope contains converted Harambee points", () => {
    const { lat, lng } = stPlaneToWgs84(2532000, 401000);
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
    expect(isInEnvelope(43.0, -87.91, envelope)).toBe(false);
    expect(isInEnvelope(43.07, -88.0, envelope)).toBe(false);
  });

  it("returns true for point on envelope boundary", () => {
    expect(isInEnvelope(43.0602, -87.9215, envelope)).toBe(true);
  });
});
