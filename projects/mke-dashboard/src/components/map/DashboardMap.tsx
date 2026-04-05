"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Map, { NavigationControl, Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import {
  MAP_CENTER,
  MAP_ZOOM,
  HOLC_COLORS,
  HOLC_OPACITY,
  TARGET_NEIGHBORHOODS,
  ARCGIS_URLS,
} from "@/lib/constants";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";

// --- Data Layer Config ---

interface DataLayerConfig {
  id: string;
  label: string;
  url: string;
  color: string;
  radius: number;
  opacity: number;
  layerType: "point" | "polygon";
}

const DATA_LAYERS: DataLayerConfig[] = [
  {
    id: "crime",
    label: "Crime Incidents",
    url: `${ARCGIS_URLS.crimeMonthly}/4/query`,
    color: "#B91C1C",
    radius: 4,
    opacity: 0.7,
    layerType: "point",
  },
  {
    id: "foreclosures",
    label: "Foreclosures",
    url: `${ARCGIS_URLS.foreclosedCityOwned}/query`,
    color: "#7F1D1D",
    radius: 5,
    opacity: 0.6,
    layerType: "point",
  },
  {
    id: "vacant",
    label: "Vacant Buildings",
    url: `${ARCGIS_URLS.strongNeighborhoods}/query`,
    color: "#D97706",
    radius: 5,
    opacity: 0.6,
    layerType: "point",
  },
  {
    id: "schools",
    label: "Schools",
    url: `${ARCGIS_URLS.schools}/query`,
    color: "#1D4ED8",
    radius: 6,
    opacity: 0.8,
    layerType: "point",
  },
  {
    id: "libraries",
    label: "Libraries",
    url: `${ARCGIS_URLS.libraries}/query`,
    color: "#7C3AED",
    radius: 7,
    opacity: 0.9,
    layerType: "point",
  },
  {
    id: "parks",
    label: "Parks",
    url: `${ARCGIS_URLS.parks}/query`,
    color: "#15803D",
    radius: 5,
    opacity: 0.6,
    layerType: "point",
  },
  // Zone polygon layers
  {
    id: "tid",
    label: "TID Zones",
    url: `${ARCGIS_URLS.tidDistricts}/query`,
    color: "#C4960C",
    radius: 0,
    opacity: 0.15,
    layerType: "polygon",
  },
  {
    id: "bid",
    label: "BID Zones",
    url: `${ARCGIS_URLS.bidDistricts}/query`,
    color: "#1D4ED8",
    radius: 0,
    opacity: 0.15,
    layerType: "polygon",
  },
  {
    id: "opportunity",
    label: "Opportunity Zones",
    url: `${ARCGIS_URLS.opportunityZones}/query`,
    color: "#7C3AED",
    radius: 0,
    opacity: 0.15,
    layerType: "polygon",
  },
];

function buildSpatialGeoJsonUrl(
  baseQueryUrl: string,
  envelope: { xmin: number; ymin: number; xmax: number; ymax: number },
): string {
  const geom = JSON.stringify({ ...envelope, spatialReference: { wkid: 4326 } });
  const params = new URLSearchParams({
    where: "1=1",
    geometry: geom,
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    inSR: "4326",
    outSR: "4326",
    outFields: "*",
    f: "geojson",
    resultRecordCount: "500",
  });
  return `${baseQueryUrl}?${params.toString()}`;
}

// --- Component Props ---

interface DashboardMapProps {
  selectedSlug?: string;
  showHOLC?: boolean;
  activeLayers?: string[];
  onNeighborhoodClick?: (slug: string) => void;
}

export function DashboardMap({
  selectedSlug,
  showHOLC = false,
  activeLayers = [],
  onNeighborhoodClick,
}: DashboardMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: MAP_CENTER.longitude as number,
    latitude: MAP_CENTER.latitude as number,
    zoom: MAP_ZOOM as number,
  });

  const [boundaries, setBoundaries] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [holcData, setHolcData] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [layerData, setLayerData] = useState<
    Record<string, GeoJSON.FeatureCollection>
  >({});
  const [popupInfo, setPopupInfo] = useState<{
    lng: number;
    lat: number;
    properties: Record<string, unknown>;
  } | null>(null);

  // Current neighborhood envelope (for data layer queries)
  const [currentEnvelope, setCurrentEnvelope] = useState<{
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  } | null>(null);

  // Load neighborhood boundaries
  useEffect(() => {
    const dcdNames = TARGET_NEIGHBORHOODS.map((n) => n.dcdName);
    const whereClause = dcdNames
      .map((n) => `NEIGHBORHD = '${n}'`)
      .join(" OR ");
    const url = `${ARCGIS_URLS.neighborhoods}/query?where=${encodeURIComponent(whereClause)}&outFields=NEIGHBORHD&outSR=4326&f=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
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

  // Load HOLC on demand
  useEffect(() => {
    if (showHOLC && !holcData) {
      fetch("/data/milwaukee_holc.geojson")
        .then((res) => res.json())
        .then(setHolcData)
        .catch((err) => console.error("HOLC load failed:", err));
    }
  }, [showHOLC, holcData]);

  // Fly to selected neighborhood + compute envelope
  useEffect(() => {
    if (!boundaries || !selectedSlug || !mapRef.current) return;

    const neighborhood = TARGET_NEIGHBORHOODS.find(
      (n) => n.slug === selectedSlug,
    );
    if (!neighborhood) return;

    const feature = boundaries.features.find(
      (f) => f.properties?.NEIGHBORHD === neighborhood.dcdName,
    );
    if (!feature) return;

    const bbox = turf.bbox(feature);
    setCurrentEnvelope({
      xmin: bbox[0],
      ymin: bbox[1],
      xmax: bbox[2],
      ymax: bbox[3],
    });

    mapRef.current.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 40, duration: 800 },
    );

    // Clear existing layer data when neighborhood changes
    setLayerData({});
    setPopupInfo(null);
  }, [selectedSlug, boundaries]);

  // Fetch data layers when toggled or neighborhood changes
  useEffect(() => {
    if (!currentEnvelope) return;

    for (const layerId of activeLayers) {
      if (layerData[layerId]) continue; // Already loaded

      const config = DATA_LAYERS.find((l) => l.id === layerId);
      if (!config) continue;

      // Polygon layers fetch full extent; point layers use spatial envelope
      const url =
        config.layerType === "polygon"
          ? `${config.url}?where=1%3D1&outFields=*&outSR=4326&f=geojson&resultRecordCount=500`
          : buildSpatialGeoJsonUrl(config.url, currentEnvelope);

      fetch(url)
        .then((res) => res.json())
        .then((data: GeoJSON.FeatureCollection) => {
          setLayerData((prev) => ({ ...prev, [layerId]: data }));
        })
        .catch((err) =>
          console.error(`Failed to load ${layerId} layer:`, err),
        );
    }
  }, [activeLayers, currentEnvelope, layerData]);

  // Click handler for data points
  const handleClick = useCallback(
    (e: mapboxgl.MapLayerMouseEvent) => {
      // Check point data layers first (skip polygon zones)
      for (const layer of DATA_LAYERS) {
        if (layer.layerType === "polygon") continue;
        const features = e.target.queryRenderedFeatures(e.point, {
          layers: [`${layer.id}-points`],
        });
        if (features.length > 0) {
          const feature = features[0];
          const coords = (feature.geometry as GeoJSON.Point).coordinates;
          setPopupInfo({
            lng: coords[0],
            lat: coords[1],
            properties: feature.properties ?? {},
          });
          return;
        }
      }

      // Otherwise check neighborhood polygons
      if (!onNeighborhoodClick) return;
      const feature = e.features?.[0];
      const dcdName = feature?.properties?.NEIGHBORHD;
      if (!dcdName) return;
      const match = TARGET_NEIGHBORHOODS.find((n) => n.dcdName === dcdName);
      if (match) onNeighborhoodClick(match.slug);
    },
    [onNeighborhoodClick],
  );

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center bg-limestone/10">
        <p className="text-sm text-iron">
          Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
        </p>
      </div>
    );
  }

  const selectedDcdName = TARGET_NEIGHBORHOODS.find(
    (n) => n.slug === selectedSlug,
  )?.dcdName;

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onClick={handleClick}
      interactiveLayerIds={
        boundaries
          ? [
              "neighborhood-fill",
              ...activeLayers
                .filter((id) => {
                  const cfg = DATA_LAYERS.find((l) => l.id === id);
                  return cfg?.layerType === "point";
                })
                .map((id) => `${id}-points`),
            ]
          : []
      }
      mapboxAccessToken={mapboxToken}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* Neighborhood boundaries */}
      {boundaries && (
        <Source id="neighborhoods" type="geojson" data={boundaries}>
          <Layer
            id="neighborhood-fill"
            type="fill"
            paint={{
              "fill-color": "#1A6B52",
              "fill-opacity": [
                "case",
                ["==", ["get", "NEIGHBORHD"], selectedDcdName ?? ""],
                0.2,
                0.06,
              ],
            }}
          />
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

      {/* Dynamic data layers (points + polygons) */}
      {DATA_LAYERS.map((config) => {
        const data = layerData[config.id];
        if (!data || !activeLayers.includes(config.id)) return null;

        if (config.layerType === "polygon") {
          return (
            <Source key={config.id} id={config.id} type="geojson" data={data}>
              <Layer
                id={`${config.id}-fill`}
                type="fill"
                paint={{
                  "fill-color": config.color,
                  "fill-opacity": config.opacity,
                }}
              />
              <Layer
                id={`${config.id}-stroke`}
                type="line"
                paint={{
                  "line-color": config.color,
                  "line-width": 1.5,
                  "line-opacity": 0.5,
                }}
              />
            </Source>
          );
        }

        return (
          <Source key={config.id} id={config.id} type="geojson" data={data}>
            <Layer
              id={`${config.id}-points`}
              type="circle"
              paint={{
                "circle-color": config.color,
                "circle-radius": config.radius,
                "circle-opacity": config.opacity,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1,
              }}
            />
          </Source>
        );
      })}

      {/* Popup for clicked points */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.lng}
          latitude={popupInfo.lat}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          maxWidth="280px"
        >
          <div className="max-h-40 overflow-y-auto text-xs">
            {Object.entries(popupInfo.properties)
              .filter(
                ([k]) =>
                  !k.startsWith("OBJECTID") &&
                  !k.startsWith("Shape") &&
                  !k.startsWith("ESRI"),
              )
              .slice(0, 8)
              .map(([key, value]) => (
                <div key={key} className="mb-1">
                  <span className="font-semibold text-foundry">
                    {key.replace(/_/g, " ")}:
                  </span>{" "}
                  <span className="text-iron">{String(value ?? "—")}</span>
                </div>
              ))}
          </div>
        </Popup>
      )}
    </Map>
  );
}

// Export layer config for the toggle UI
export { DATA_LAYERS };
export type { DataLayerConfig };
