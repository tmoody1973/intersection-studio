/**
 * Shared coordinate conversion: Wisconsin State Plane South (WKID 32054) → WGS84.
 * Linear approximation calibrated to Milwaukee City Hall (~10m accuracy within city).
 *
 * Single source of truth — imported by csv.ts and historical.ts.
 */

const REF_X = 2530700;
const REF_Y = 393200;
const REF_LNG = -87.9065;
const REF_LAT = 43.0389;
const FT_PER_DEG_LNG = 263260;
const FT_PER_DEG_LAT = 364567;

export function stPlaneToWgs84(
  x: number,
  y: number,
): { lat: number; lng: number } {
  return {
    lng: REF_LNG + (x - REF_X) / FT_PER_DEG_LNG,
    lat: REF_LAT + (y - REF_Y) / FT_PER_DEG_LAT,
  };
}

export function isInEnvelope(
  lat: number,
  lng: number,
  env: { xmin: number; ymin: number; xmax: number; ymax: number },
): boolean {
  return (
    lng >= env.xmin && lng <= env.xmax && lat >= env.ymin && lat <= env.ymax
  );
}
