"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Map, { NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import { MAP_CENTER, MAP_ZOOM, HOLC_COLORS, HOLC_OPACITY, TARGET_NEIGHBORHOODS, ARCGIS_URLS } from "@/lib/constants";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";

interface DashboardMapProps {
  selectedSlug?: string;
  showHOLC?: boolean;
  onNeighborhoodClick?: (slug: string) => void;
}

export function DashboardMap({
  selectedSlug,
  showHOLC = false,
  onNeighborhoodClick,
}: DashboardMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: MAP_CENTER.longitude as number,
    latitude: MAP_CENTER.latitude as number,
    zoom: MAP_ZOOM as number,
  });

  const [boundaries, setBoundaries] = useState<GeoJSON.FeatureCollection | null>(null);
  const [holcData, setHolcData] = useState<GeoJSON.FeatureCollection | null>(null);

  // Load all target neighborhood boundaries from ArcGIS
  useEffect(() => {
    const dcdNames = TARGET_NEIGHBORHOODS.map((n) => n.dcdName);
    const whereClause = dcdNames.map((n) => `NEIGHBORHD = '${n}'`).join(" OR ");
    const url = `${ARCGIS_URLS.neighborhoods}/query?where=${encodeURIComponent(whereClause)}&outFields=NEIGHBORHD&outSR=4326&f=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        // Replace DCD codes with community display names
        const dcdToName = Object.fromEntries(
          TARGET_NEIGHBORHOODS.map((n) => [n.dcdName, n.name]),
        );
        for (const feature of data.features) {
          if (feature.properties) {
            const dcdName = feature.properties.NEIGHBORHD as string;
            feature.properties.DISPLAY_NAME = dcdToName[dcdName] ?? dcdName;
          }
        }
        setBoundaries(data);
      })
      .catch((err) => console.error("Failed to load boundaries:", err));
  }, []);

  // Load HOLC GeoJSON on demand
  useEffect(() => {
    if (showHOLC && !holcData) {
      fetch("/data/milwaukee_holc.geojson")
        .then((res) => res.json())
        .then((data) => setHolcData(data))
        .catch((err) => console.error("Failed to load HOLC data:", err));
    }
  }, [showHOLC, holcData]);

  // Fly to selected neighborhood
  useEffect(() => {
    if (!boundaries || !selectedSlug || !mapRef.current) return;

    const neighborhood = TARGET_NEIGHBORHOODS.find((n) => n.slug === selectedSlug);
    if (!neighborhood) return;

    const feature = boundaries.features.find(
      (f) => f.properties?.NEIGHBORHD === neighborhood.dcdName,
    );
    if (!feature) return;

    const bbox = turf.bbox(feature);
    mapRef.current.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 40, duration: 800 },
    );
  }, [selectedSlug, boundaries]);

  // Handle click on neighborhood polygon
  const handleClick = useCallback(
    (e: mapboxgl.MapLayerMouseEvent) => {
      if (!onNeighborhoodClick) return;
      const feature = e.features?.[0];
      const dcdName = feature?.properties?.NEIGHBORHD;
      if (!dcdName) return;

      const match = TARGET_NEIGHBORHOODS.find((n) => n.dcdName === dcdName);
      if (match) {
        onNeighborhoodClick(match.slug);
      }
    },
    [onNeighborhoodClick],
  );

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-limestone/10">
        <p className="text-sm text-iron">Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</p>
      </div>
    );
  }

  // Determine which neighborhood is selected for highlighting
  const selectedDcdName = TARGET_NEIGHBORHOODS.find(
    (n) => n.slug === selectedSlug,
  )?.dcdName;

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onClick={handleClick}
      interactiveLayerIds={boundaries ? ["neighborhood-fill"] : []}
      mapboxAccessToken={mapboxToken}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* Neighborhood boundaries */}
      {boundaries && (
        <Source id="neighborhoods" type="geojson" data={boundaries}>
          {/* Fill — highlight selected */}
          <Layer
            id="neighborhood-fill"
            type="fill"
            paint={{
              "fill-color": [
                "case",
                ["==", ["get", "NEIGHBORHD"], selectedDcdName ?? ""],
                "#1A6B52",
                "#1A6B52",
              ],
              "fill-opacity": [
                "case",
                ["==", ["get", "NEIGHBORHD"], selectedDcdName ?? ""],
                0.2,
                0.06,
              ],
            }}
          />
          {/* Border stroke */}
          <Layer
            id="neighborhood-stroke"
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["get", "NEIGHBORHD"], selectedDcdName ?? ""],
                "#0F4A37",
                "#1A6B52",
              ],
              "line-width": [
                "case",
                ["==", ["get", "NEIGHBORHD"], selectedDcdName ?? ""],
                3,
                1.5,
              ],
            }}
          />
          {/* Labels */}
          <Layer
            id="neighborhood-labels"
            type="symbol"
            layout={{
              "text-field": ["get", "DISPLAY_NAME"],
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
