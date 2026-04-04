"use client";

import { useState, useCallback, useEffect } from "react";
import Map, { NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import { MAP_CENTER, MAP_ZOOM, HOLC_COLORS, HOLC_OPACITY } from "@/lib/constants";
import "mapbox-gl/dist/mapbox-gl.css";

interface DashboardMapProps {
  showHOLC?: boolean;
  onNeighborhoodClick?: (name: string) => void;
}

export function DashboardMap({
  showHOLC = false,
  onNeighborhoodClick,
}: DashboardMapProps) {
  const [viewState, setViewState] = useState({
    longitude: MAP_CENTER.longitude as number,
    latitude: MAP_CENTER.latitude as number,
    zoom: MAP_ZOOM as number,
  });

  const [holcData, setHolcData] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );

  // Load HOLC GeoJSON from bundled static file
  useEffect(() => {
    if (showHOLC && !holcData) {
      fetch("/data/milwaukee_holc.geojson")
        .then((res) => res.json())
        .then((data) => setHolcData(data))
        .catch((err) => console.error("Failed to load HOLC data:", err));
    }
  }, [showHOLC, holcData]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-limestone/10">
        <div className="text-center">
          <p className="text-sm font-medium text-iron">
            Map requires Mapbox token
          </p>
          <p className="mt-1 text-xs text-limestone">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={mapboxToken}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* HOLC Redlining overlay */}
      {showHOLC && holcData && (
        <Source id="holc" type="geojson" data={holcData}>
          <Layer
            id="holc-fill"
            type="fill"
            paint={{
              "fill-color": [
                "match",
                ["get", "HOLC_grade"],
                "A",
                HOLC_COLORS.A,
                "B",
                HOLC_COLORS.B,
                "C",
                HOLC_COLORS.C,
                "D",
                HOLC_COLORS.D,
                "#888888",
              ],
              "fill-opacity": HOLC_OPACITY,
            }}
          />
          <Layer
            id="holc-stroke"
            type="line"
            paint={{
              "line-color": [
                "match",
                ["get", "HOLC_grade"],
                "A",
                HOLC_COLORS.A,
                "B",
                HOLC_COLORS.B,
                "C",
                HOLC_COLORS.C,
                "D",
                HOLC_COLORS.D,
                "#888888",
              ],
              "line-width": 1,
              "line-opacity": 0.4,
            }}
          />
        </Source>
      )}
    </Map>
  );
}
