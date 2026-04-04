"use client";

import { DATA_LAYERS } from "./DashboardMap";

interface LayerTogglesProps {
  activeLayers: string[];
  onToggle: (layerId: string) => void;
  showHOLC: boolean;
  onToggleHOLC: (show: boolean) => void;
}

export function LayerToggles({
  activeLayers,
  onToggle,
  showHOLC,
  onToggleHOLC,
}: LayerTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* HOLC toggle */}
      <button
        type="button"
        onClick={() => onToggleHOLC(!showHOLC)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
          showHOLC
            ? "bg-critical/10 text-critical ring-1 ring-critical/30"
            : "bg-limestone/10 text-foundry hover:bg-limestone/20"
        }`}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: showHOLC ? "#EF4444" : "#A8A29E" }}
        />
        Redlining
      </button>

      {/* Data layers */}
      {DATA_LAYERS.map((layer) => {
        const isActive = activeLayers.includes(layer.id);
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => onToggle(layer.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              isActive
                ? "ring-1 ring-opacity-30"
                : "bg-limestone/10 text-foundry hover:bg-limestone/20"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: `${layer.color}15`,
                    color: layer.color,
                    // @ts-expect-error ring color
                    "--tw-ring-color": `${layer.color}50`,
                  }
                : undefined
            }
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: isActive ? layer.color : "#A8A29E" }}
            />
            {layer.label}
          </button>
        );
      })}
    </div>
  );
}
