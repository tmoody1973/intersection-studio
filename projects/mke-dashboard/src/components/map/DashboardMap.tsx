"use client";

import { useState, useCallback } from "react";
import Map, { NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "react-map-gl/mapbox";
import { MAP_CENTER, MAP_ZOOM, HOLC_COLORS, HOLC_OPACITY } from "@/lib/constants";
import "mapbox-gl/dist/mapbox-gl.css";

interface DashboardMapProps {
  neighborhoodBoundaries?: GeoJSON.FeatureCollection;
  holcData?: GeoJSON.FeatureCollection;
  showHOLC?: boolean;
  onNeighborhoodClick?: (name: string) => void;
}

export function DashboardMap({
  neighborhoodBoundaries,
  holcData,
  showHOLC = false,
  onNeighborhoodClick,
}: DashboardMapProps) {
  const [viewState, setViewState] = useState({
    longitude: MAP_CENTER.longitude as number,
    latitude: MAP_CENTER.latitude as number,
    zoom: MAP_ZOOM as number,
  });

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (!onNeighborhoodClick) return;
      const feature = e.features?.[0];
      if (feature?.properties?.NEIGHBORHD) {
        onNeighborhoodClick(feature.properties.NEIGHBORHD as string);
      }
    },
    [onNeighborhoodClick],
  );

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-limestone/20 bg-cream-city">
        <div className="text-center">
          <p className="text-sm font-medium text-iron">Map requires Mapbox token</p>
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
      onClick={handleClick}
      interactiveLayerIds={neighborhoodBoundaries ? ["neighborhood-fill"] : []}
      mapboxAccessToken={mapboxToken}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* Neighborhood boundaries */}
      {neighborhoodBoundaries && (
        <Source id="neighborhoods" type="geojson" data={neighborhoodBoundaries}>
          <Layer
            id="neighborhood-fill"
            type="fill"
            paint={{
              "fill-color": "#1A6B52",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.15,
                0.08,
              ],
            }}
          />
          <Layer
            id="neighborhood-stroke"
            type="line"
            paint={{
              "line-color": "#0F4A37",
              "line-width": 1.5,
            }}
          />
          <Layer
            id="neighborhood-labels"
            type="symbol"
            layout={{
              "text-field": ["get", "NEIGHBORHD"],
              "text-size": 11,
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-anchor": "center",
            }}
            paint={{
              "text-color": "#1C1917",
              "text-halo-color": "#F8F6F1",
              "text-halo-width": 1.5,
            }}
          />
        </Source>
      )}

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
                "A", HOLC_COLORS.A,
                "B", HOLC_COLORS.B,
                "C", HOLC_COLORS.C,
                "D", HOLC_COLORS.D,
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
                "A", HOLC_COLORS.A,
                "B", HOLC_COLORS.B,
                "C", HOLC_COLORS.C,
                "D", HOLC_COLORS.D,
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
