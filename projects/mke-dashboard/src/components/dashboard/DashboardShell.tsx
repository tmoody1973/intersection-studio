"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { CategoryTabs } from "./CategoryTabs";
import { CategoryView } from "./CategoryView";
import { ComparisonView } from "./ComparisonView";
import { IndicatorRow } from "./IndicatorRow";
import { DashboardContext } from "@/copilot/DashboardContext";
import { DashboardTools } from "@/copilot/DashboardTools";
import { MKE_ECONOMIC_INSTRUCTIONS } from "@/copilot/economic-instructions";
import { useNeighborhoodData } from "@/hooks/useNeighborhoodData";
import { LayerToggles } from "@/components/map/LayerToggles";
import { TARGET_NEIGHBORHOODS, DEFAULT_CATEGORIES } from "@/lib/constants";
import type { CategoryId } from "@/types/metrics";

const DashboardMap = dynamic(
  () =>
    import("@/components/map/DashboardMap").then((mod) => mod.DashboardMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full animate-pulse rounded-lg bg-limestone/10" />
    ),
  },
);

export function DashboardShell() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("categories");
  const tChat = useTranslations("chat");

  const [selectedSlug, setSelectedSlug] = useState("harambee");
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("community");
  const [showHOLC, setShowHOLC] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Translate category labels
  const translatedCategories = useMemo(
    () =>
      DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        label: tc(cat.id),
      })),
    [tc],
  );

  const handleToggleLayer = useCallback((layerId: string) => {
    setActiveLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId],
    );
  }, []);
  const {
    metrics,
    isLoading,
    neighborhoodName,
    crimeByType,
    crimeByMonth,
    serviceRequestsByType,
    housingAge,
    investmentByYear,
    permitsByYear,
    crimeTrend,
    serviceRequestsTrend,
    raw,
  } = useNeighborhoodData(selectedSlug);

  const handleAskAI = useCallback(
    (metricId: string, label: string) => {
      console.info(
        `[CopilotKit] Ask AI about: ${label} (${metricId}) in ${selectedSlug}`,
      );
    },
    [selectedSlug],
  );

  // Look up trend data from the metrics array for a given metric id
  const trendFor = useCallback(
    (metricId: string) => {
      const metric = metrics.find((m) => m.id === metricId);
      if (!metric?.trend) return undefined;
      return {
        direction: metric.trend.direction,
        percentage: metric.trend.percentage,
      };
    },
    [metrics],
  );

  // Key indicators for the overview row (like Kensington Home tab)
  const keyIndicators = raw
    ? [
        { label: "Population", value: raw.population ?? null, unit: "residents", delta: trendFor("population") },
        { label: "Median Income", value: raw.medianIncome ? `$${raw.medianIncome.toLocaleString()}` : null, delta: trendFor("median_income") },
        { label: "Poverty Rate", value: raw.povertyRate != null ? `${raw.povertyRate}%` : null, delta: trendFor("poverty_rate") },
        { label: "Properties", value: raw.totalProperties ?? null, unit: "parcels", delta: trendFor("total_properties") },
        { label: "Owner-Occupied", value: raw.ownerOccupiedRate != null ? `${raw.ownerOccupiedRate}%` : null, delta: trendFor("owner_occupied_rate") },
      ]
    : [];

  return (
    <>
      <DashboardContext
        neighborhoodName={neighborhoodName}
        neighborhoodSlug={selectedSlug}
        activeCategory={activeCategory}
        metrics={metrics}
        raw={raw}
        onSwitchNeighborhood={setSelectedSlug}
        onSwitchCategory={setActiveCategory}
        onOpenComparison={() => setShowComparison(true)}
      />
      <DashboardTools />

      <div className="mx-auto w-full max-w-7xl">
        {/* Neighborhood selector + HOLC toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label
            htmlFor="neighborhood-select"
            className="text-sm font-medium text-iron"
          >
            Neighborhood
          </label>
          <select
            id="neighborhood-select"
            className="rounded-lg border border-limestone/30 bg-white px-3 py-2 text-sm text-iron focus:border-lakeshore focus:outline-none focus:ring-1 focus:ring-lakeshore dark:bg-[#292524]"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            {TARGET_NEIGHBORHOODS.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowComparison(true)}
            className="rounded-lg border border-limestone/30 bg-white px-3 py-2 text-sm font-medium text-iron hover:bg-limestone/10 focus:border-lakeshore focus:outline-none focus:ring-1 focus:ring-lakeshore dark:bg-[#292524]"
          >
            Compare
          </button>
        </div>

        {/* Map Layer Toggles */}
        <div className="mb-4">
          <LayerToggles
            activeLayers={activeLayers}
            onToggle={handleToggleLayer}
            showHOLC={showHOLC}
            onToggleHOLC={setShowHOLC}
          />
        </div>

        {/* Key Indicators Row (like Kensington Home tab) */}
        {keyIndicators.length > 0 && (
          <IndicatorRow
            indicators={keyIndicators}
            neighborhoodName={neighborhoodName}
          />
        )}

        {/* Main layout: Map + Category Content */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Map */}
          <div className="h-[300px] w-full overflow-hidden rounded-lg border border-limestone/20 lg:h-auto lg:min-h-[500px] lg:w-[380px] lg:flex-shrink-0">
            <DashboardMap
              selectedSlug={selectedSlug}
              showHOLC={showHOLC}
              activeLayers={activeLayers}
              onNeighborhoodClick={setSelectedSlug}
            />
          </div>

          {/* Category tabs + content */}
          <div className="min-w-0 flex-1">
            <CategoryTabs
              categories={translatedCategories}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
              showCounts
            />

            <div
              role="tabpanel"
              id={`panel-${activeCategory}`}
              aria-labelledby={`tab-${activeCategory}`}
              tabIndex={0}
              className="mt-4"
            >
              <CategoryView
                category={activeCategory}
                metrics={metrics}
                crimeByType={crimeByType}
                crimeByMonth={crimeByMonth}
                serviceRequestsByType={serviceRequestsByType}
                housingAge={housingAge}
                investmentByYear={investmentByYear}
                permitsByYear={permitsByYear}
                crimeTrend={crimeTrend}
                serviceRequestsTrend={serviceRequestsTrend}
                onAskAI={handleAskAI}
              />
            </div>
          </div>
        </div>
      </div>

      {showComparison && (
        <ComparisonView
          onClose={() => setShowComparison(false)}
          initialSlugA={selectedSlug}
        />
      )}

      <CopilotSidebar
        instructions={MKE_ECONOMIC_INSTRUCTIONS}
        labels={{
          title: tChat("title"),
          initial: tChat("initial"),
        }}
        defaultOpen={false}
      />
    </>
  );
}
